package main

import (
	"testing"

	"github.com/datarhei/core/v16/log"
	"github.com/datarhei/core/v16/restream/app"
	"github.com/stretchr/testify/require"
)

func TestMigrateProcessConfigToFFmpeg9(t *testing.T) {
	config := &app.Config{FFVersion: "^6.1.1"}

	migrated, err := migrateProcessConfig(log.New("test"), config, "9.0.1")

	require.NoError(t, err)
	require.True(t, migrated)
	require.Equal(t, "^9.0.1", config.FFVersion)
}

func TestMigrateExistingFFmpeg9Process(t *testing.T) {
	config := &app.Config{FFVersion: "^9.0.1"}

	migrated, err := migrateProcessConfig(log.New("test"), config, "9.0.1")

	require.NoError(t, err)
	require.False(t, migrated)
	require.Equal(t, "^9.0.1", config.FFVersion)
}
