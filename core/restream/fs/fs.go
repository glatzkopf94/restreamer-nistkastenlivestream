package fs

import (
	"context"
	"sort"
	"sync"
	"time"

	"github.com/datarhei/core/v16/glob"
	"github.com/datarhei/core/v16/io/fs"
	"github.com/datarhei/core/v16/log"
)

type Config struct {
	FS     fs.Filesystem
	Logger log.Logger
}

type Pattern struct {
	Pattern       string
	MaxFiles      uint
	MaxFileAge    time.Duration
	PurgeOnDelete bool
}

type Filesystem interface {
	fs.Filesystem

	// SetCleanup
	SetCleanup(id string, patterns []Pattern)

	// ClearCleanup detaches rules without deleting persisted files (shutdown).
	ClearCleanup(id string)

	// UnsetCleanup
	UnsetCleanup(id string)

	// Start
	Start()

	// Stop()
	Stop()
}

type filesystem struct {
	fs.Filesystem

	cleanupPatterns map[string][]Pattern
	cleanupLock     sync.RWMutex

	stopTicker context.CancelFunc

	startOnce sync.Once
	stopOnce  sync.Once

	logger log.Logger
}

func New(config Config) Filesystem {
	rfs := &filesystem{
		Filesystem: config.FS,
		logger:     config.Logger,
	}

	if rfs.logger == nil {
		rfs.logger = log.New("")
	}

	rfs.logger = rfs.logger.WithFields(log.Fields{
		"name": config.FS.Name(),
		"type": config.FS.Type(),
	})

	rfs.cleanupPatterns = make(map[string][]Pattern)

	// already drain the stop
	rfs.stopOnce.Do(func() {})

	return rfs
}

func (rfs *filesystem) Start() {
	rfs.startOnce.Do(func() {
		ctx, cancel := context.WithCancel(context.Background())
		rfs.stopTicker = cancel
		go rfs.cleanupTicker(ctx, time.Second)

		rfs.stopOnce = sync.Once{}

		rfs.logger.Debug().Log("Starting cleanup")
	})
}

func (rfs *filesystem) Stop() {
	rfs.stopOnce.Do(func() {
		rfs.stopTicker()

		rfs.startOnce = sync.Once{}

		rfs.logger.Debug().Log("Stopping cleanup")
	})
}

func (rfs *filesystem) SetCleanup(id string, patterns []Pattern) {
	if len(patterns) == 0 {
		return
	}

	for _, p := range patterns {
		rfs.logger.Debug().WithFields(log.Fields{
			"id":           id,
			"pattern":      p.Pattern,
			"max_files":    p.MaxFiles,
			"max_file_age": p.MaxFileAge.Seconds(),
		}).Log("Add pattern")
	}

	rfs.cleanupLock.Lock()
	defer rfs.cleanupLock.Unlock()

	rfs.cleanupPatterns[id] = append(rfs.cleanupPatterns[id], patterns...)
}

func (rfs *filesystem) ClearCleanup(id string) {
	rfs.cleanupLock.Lock()
	defer rfs.cleanupLock.Unlock()
	delete(rfs.cleanupPatterns, id)
}

func (rfs *filesystem) UnsetCleanup(id string) {
	rfs.logger.Debug().WithField("id", id).Log("Remove pattern group")

	rfs.cleanupLock.Lock()
	defer rfs.cleanupLock.Unlock()

	patterns := rfs.cleanupPatterns[id]
	delete(rfs.cleanupPatterns, id)

	rfs.purge(patterns)
}

func (rfs *filesystem) cleanup() {
	rfs.cleanupLock.RLock()
	defer rfs.cleanupLock.RUnlock()

	// Reuse one directory snapshot across retention rules. Purge-only rules
	// have no periodic work and must not trigger a filesystem traversal.
	var snapshot []fs.FileInfo
	listed := false
	for _, patterns := range rfs.cleanupPatterns {
		for _, pattern := range patterns {
			if pattern.MaxFiles == 0 && pattern.MaxFileAge <= 0 {
				continue
			}
			if !listed {
				snapshot = rfs.Filesystem.List("/", "")
				listed = true
			}
			filesAndDirs := matchingFiles(snapshot, pattern.Pattern)

			files := []fs.FileInfo{}
			for _, f := range filesAndDirs {
				if f.IsDir() {
					continue
				}

				files = append(files, f)
			}

			sort.Slice(files, func(i, j int) bool { return files[i].ModTime().Before(files[j].ModTime()) })

			if pattern.MaxFiles > 0 && uint(len(files)) > pattern.MaxFiles {
				for i := uint(0); i < uint(len(files))-pattern.MaxFiles; i++ {
					rfs.logger.Debug().WithField("path", files[i].Name()).Log("Remove file because MaxFiles is exceeded")
					rfs.Filesystem.Remove(files[i].Name())
				}
			}

			if pattern.MaxFileAge > 0 {
				bestBefore := time.Now().Add(-pattern.MaxFileAge)

				for _, f := range files {
					if f.ModTime().Before(bestBefore) {
						rfs.logger.Debug().WithField("path", f.Name()).Log("Remove file because MaxFileAge is exceeded")
						rfs.Filesystem.Remove(f.Name())
					}
				}
			}
		}
	}
}

func matchingFiles(snapshot []fs.FileInfo, pattern string) []fs.FileInfo {
	// Compile once per rule, not once per archived segment.
	if pattern == "" {
		return append([]fs.FileInfo(nil), snapshot...)
	}
	matcher, err := glob.Compile(pattern, '/')
	if err != nil {
		return nil
	}
	matches := []fs.FileInfo{}
	for _, file := range snapshot {
		if matcher.Match(file.Name()) {
			matches = append(matches, file)
		}
	}
	return matches
}

func (rfs *filesystem) purge(patterns []Pattern) (nfiles uint64) {
	var snapshot []fs.FileInfo
	listed := false
	removed := make(map[string]bool)
	for _, pattern := range patterns {
		if !pattern.PurgeOnDelete {
			continue
		}

		if !listed {
			snapshot = rfs.Filesystem.List("/", "")
			listed = true
		}
		files := matchingFiles(snapshot, pattern.Pattern)
		sort.Slice(files, func(i, j int) bool { return len(files[i].Name()) > len(files[j].Name()) })
		for _, f := range files {
			if removed[f.Name()] {
				continue
			}
			removed[f.Name()] = true
			rfs.logger.Debug().WithField("path", f.Name()).Log("Purging file")
			rfs.Filesystem.Remove(f.Name())
			nfiles++
		}
	}

	return
}

func (rfs *filesystem) cleanupTicker(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			rfs.cleanup()
		}
	}
}
