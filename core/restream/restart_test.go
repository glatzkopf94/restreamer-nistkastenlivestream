package restream

import (
	"strings"
	"testing"

	"github.com/datarhei/core/v16/io/fs"
	rfs "github.com/datarhei/core/v16/restream/fs"
	"github.com/stretchr/testify/require"
)

func TestShutdownDoesNotPurgePersistentFiles(t *testing.T) {
	memfs, err := fs.NewMemFilesystem(fs.MemConfig{})
	require.NoError(t, err)
	filesystem := rfs.New(rfs.Config{FS: memfs})
	filesystem.SetCleanup("channel", []rfs.Pattern{{Pattern: "/channel**", PurgeOnDelete: true}})
	filesystem.WriteFileReader("/channel.html", strings.NewReader("player"))
	filesystem.WriteFileReader("/channel/output/recording.ts", strings.NewReader("DVR"))
	r := &restream{tasks: map[string]*task{"channel": {}}}
	r.fs.list = []rfs.Filesystem{filesystem}
	r.fs.stopObserver = func() {}
	r.Stop()
	require.Equal(t, int64(2), filesystem.Files())
	// Shutdown removed the old rules, so a second detach cannot purge files.
	filesystem.UnsetCleanup("channel")
	require.Equal(t, int64(2), filesystem.Files())
}
