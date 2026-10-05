package fs

import (
	"strings"
	"testing"
	"time"

	"github.com/datarhei/core/v16/io/fs"
	"github.com/stretchr/testify/require"
)

func TestMaxFiles(t *testing.T) {
	memfs, _ := fs.NewMemFilesystem(fs.MemConfig{})

	cleanfs := New(Config{
		FS: memfs,
	})

	cleanfs.Start()

	cleanfs.SetCleanup("foobar", []Pattern{
		{
			Pattern:    "/*.ts",
			MaxFiles:   3,
			MaxFileAge: 0,
		},
	})

	cleanfs.WriteFileReader("/chunk_0.ts", strings.NewReader("chunk_0"))
	cleanfs.WriteFileReader("/chunk_1.ts", strings.NewReader("chunk_1"))
	cleanfs.WriteFileReader("/chunk_2.ts", strings.NewReader("chunk_2"))

	require.Eventually(t, func() bool {
		return cleanfs.Files() == 3
	}, 3*time.Second, time.Second)

	cleanfs.WriteFileReader("/chunk_3.ts", strings.NewReader("chunk_3"))

	require.Eventually(t, func() bool {
		if cleanfs.Files() != 3 {
			return false
		}

		names := []string{}

		for _, f := range cleanfs.List("/", "/*.ts") {
			names = append(names, f.Name())
		}

		require.ElementsMatch(t, []string{"/chunk_1.ts", "/chunk_2.ts", "/chunk_3.ts"}, names)

		return true
	}, 3*time.Second, time.Second)

	cleanfs.Stop()
}

func TestMaxAge(t *testing.T) {
	memfs, _ := fs.NewMemFilesystem(fs.MemConfig{})

	cleanfs := New(Config{
		FS: memfs,
	})

	cleanfs.Start()

	cleanfs.SetCleanup("foobar", []Pattern{
		{
			Pattern:    "/*.ts",
			MaxFiles:   0,
			MaxFileAge: 3 * time.Second,
		},
	})

	cleanfs.WriteFileReader("/chunk_0.ts", strings.NewReader("chunk_0"))
	cleanfs.WriteFileReader("/chunk_1.ts", strings.NewReader("chunk_1"))
	cleanfs.WriteFileReader("/chunk_2.ts", strings.NewReader("chunk_2"))

	require.Eventually(t, func() bool {
		return cleanfs.Files() == 0
	}, 10*time.Second, time.Second)

	cleanfs.WriteFileReader("/chunk_3.ts", strings.NewReader("chunk_3"))

	require.Eventually(t, func() bool {
		if cleanfs.Files() != 1 {
			return false
		}

		names := []string{}

		for _, f := range cleanfs.List("/", "/*.ts") {
			names = append(names, f.Name())
		}

		require.ElementsMatch(t, []string{"/chunk_3.ts"}, names)

		return true
	}, 5*time.Second, time.Second)

	cleanfs.Stop()
}

func TestUnsetCleanup(t *testing.T) {
	memfs, _ := fs.NewMemFilesystem(fs.MemConfig{})

	cleanfs := New(Config{
		FS: memfs,
	})

	cleanfs.Start()

	cleanfs.SetCleanup("foobar", []Pattern{
		{
			Pattern:    "/*.ts",
			MaxFiles:   3,
			MaxFileAge: 0,
		},
	})

	cleanfs.WriteFileReader("/chunk_0.ts", strings.NewReader("chunk_0"))
	cleanfs.WriteFileReader("/chunk_1.ts", strings.NewReader("chunk_1"))
	cleanfs.WriteFileReader("/chunk_2.ts", strings.NewReader("chunk_2"))

	require.Eventually(t, func() bool {
		return cleanfs.Files() == 3
	}, 3*time.Second, time.Second)

	cleanfs.WriteFileReader("/chunk_3.ts", strings.NewReader("chunk_3"))

	require.Eventually(t, func() bool {
		if cleanfs.Files() != 3 {
			return false
		}

		names := []string{}

		for _, f := range cleanfs.List("/", "/*.ts") {
			names = append(names, f.Name())
		}

		require.ElementsMatch(t, []string{"/chunk_1.ts", "/chunk_2.ts", "/chunk_3.ts"}, names)

		return true
	}, 3*time.Second, time.Second)

	cleanfs.UnsetCleanup("foobar")

	cleanfs.WriteFileReader("/chunk_4.ts", strings.NewReader("chunk_4"))

	require.Eventually(t, func() bool {
		if cleanfs.Files() != 4 {
			return false
		}

		names := []string{}

		for _, f := range cleanfs.List("/", "/*.ts") {
			names = append(names, f.Name())
		}

		require.ElementsMatch(t, []string{"/chunk_1.ts", "/chunk_2.ts", "/chunk_3.ts", "/chunk_4.ts"}, names)

		return true
	}, 3*time.Second, time.Second)

	cleanfs.Stop()
}

// Detaching shutdown rules must preserve persistent player and DVR files.
func TestClearCleanupPreservesFiles(t *testing.T) {
	memfs, _ := fs.NewMemFilesystem(fs.MemConfig{})
	cleanfs := New(Config{FS: memfs})
	patterns := []Pattern{{Pattern: "/channel**", PurgeOnDelete: true}}
	cleanfs.SetCleanup("ingest", patterns)
	cleanfs.WriteFileReader("/channel.html", strings.NewReader("player"))
	cleanfs.WriteFileReader("/channel_output_0.m3u8", strings.NewReader("playlist"))
	cleanfs.WriteFileReader("/channel/output_0/segment.ts", strings.NewReader("segment"))
	cleanfs.ClearCleanup("ingest")
	require.Equal(t, int64(3), cleanfs.Files())
	// Cleared rules must not accumulate across Start/Stop cycles.
	cleanfs.UnsetCleanup("ingest")
	require.Equal(t, int64(3), cleanfs.Files())
	// Explicit process deletion still purges its media, never the public page.
	cleanfs.SetCleanup("ingest", []Pattern{
		{Pattern: "/channel_*.m3u8", PurgeOnDelete: true},
		{Pattern: "/channel/**.ts", PurgeOnDelete: true},
	})
	cleanfs.UnsetCleanup("ingest")
	require.Equal(t, int64(1), cleanfs.Files())
	require.Equal(t, "/channel.html", cleanfs.List("/", "/*.html")[0].Name())
}

// Large DVR archives must be traversed once per pass, not once per rule.
type countedFilesystem struct {
	fs.Filesystem
	lists    int
	removals map[string]int
}

func (f *countedFilesystem) List(path, pattern string) []fs.FileInfo {
	f.lists++
	return f.Filesystem.List(path, pattern)
}
func (f *countedFilesystem) Remove(path string) int64 {
	f.removals[path]++
	return f.Filesystem.Remove(path)
}
func TestCleanupSharesSnapshotAndSkipsPurgeOnly(t *testing.T) {
	mem, _ := fs.NewMemFilesystem(fs.MemConfig{})
	counted := &countedFilesystem{Filesystem: mem, removals: make(map[string]int)}
	clean := New(Config{FS: counted}).(*filesystem)
	clean.SetCleanup("player", []Pattern{{Pattern: "/a**.m3u8", PurgeOnDelete: true}})
	clean.cleanup()
	require.Zero(t, counted.lists)
	for _, name := range []string{"/a/1.ts", "/a/2.ts", "/b/1.ts", "/b/2.ts", "/a.html", "/a.m3u8"} {
		_, _, err := mem.WriteFileReader(name, strings.NewReader("data"))
		require.NoError(t, err)
	}
	clean.SetCleanup("a", []Pattern{{Pattern: "/a/**.ts", MaxFiles: 1, PurgeOnDelete: true}})
	clean.SetCleanup("b", []Pattern{{Pattern: "/b/**.ts", MaxFiles: 1, PurgeOnDelete: true}})
	clean.cleanup()
	require.Equal(t, 1, counted.lists)
	require.Len(t, mem.List("/", "/a/**.ts"), 1)
	require.Len(t, mem.List("/", "/b/**.ts"), 1)
	require.Len(t, mem.List("/", "/*.html"), 1)
	require.Len(t, mem.List("/", "/*.m3u8"), 1)
	clean.SetCleanup("a", []Pattern{{Pattern: "/a/**", PurgeOnDelete: true}})
	counted.lists = 0
	counted.removals = make(map[string]int)
	clean.UnsetCleanup("a")
	require.Equal(t, 1, counted.lists)
	for _, count := range counted.removals {
		require.Equal(t, 1, count)
	}
	require.Empty(t, mem.List("/", "/a/**.ts"))
	require.Len(t, mem.List("/", "/b/**.ts"), 1)
	require.Len(t, mem.List("/", "/*.html"), 1)
}
