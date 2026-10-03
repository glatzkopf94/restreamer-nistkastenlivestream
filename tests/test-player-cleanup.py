#!/usr/bin/env python3
"""Regression coverage for legacy rule migration and upgrade page recovery."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
CHANNEL = '0e652a1b-3ac8-4211-99a0-1f171d362f57'
ID = 'restreamer-ui:ingest:' + CHANNEL

def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

CLEANUP = load('cleanup_migration', 'migrate-player-cleanup.py')
PLAYER = load('player_migration', 'migrate-player-1.4.py')

class PlayerCleanupTests(unittest.TestCase):
    def test_rules_migrate_all_channels_and_preserve_custom_rules(self):
        process = {'config': {'output': [{'cleanup': [
            {'pattern': 'diskfs:/' + CHANNEL + '**', 'purge_on_delete': True},
            {'pattern': 'diskfs:/' + CHANNEL + '/**.ts', 'max_files': 5406},
            {'pattern': 'diskfs:/custom/**', 'purge_on_delete': False}]}]}}
        db = {'process': {ID: process, 'unrelated': copy.deepcopy(process)}}
        untouched = copy.deepcopy(db['process']['unrelated'])
        self.assertEqual(CLEANUP.migrate_data(db), 1)
        rules = process['config']['output'][0]['cleanup']
        self.assertEqual(len(rules), 9)
        self.assertTrue(all(rule['purge_on_delete'] for rule in rules[:7]))
        self.assertEqual(rules[-2]['max_files'], 5406)
        self.assertEqual(db['process']['unrelated'], untouched)
        self.assertEqual(CLEANUP.migrate_data(db), 0)
        self.assertNotIn('diskfs:/' + CHANNEL + '**', [r['pattern'] for r in rules])

    def test_backup_and_legacy_list_format(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'db.json'
            original = {'process': [{'id': ID, 'output': [{'cleanup': [{'pattern': 'memfs:/' + CHANNEL + '**', 'purge_on_delete': True}]}]}]}
            path.write_text(json.dumps(original))
            self.assertEqual(CLEANUP.migrate_file(path), 1)
            backups = list(path.parent.glob('db.pre-dev21-cleanup-*.json'))
            self.assertEqual(len(backups), 1)
            self.assertEqual(json.loads(backups[0].read_text()), original)
            self.assertEqual(CLEANUP.migrate_file(path), 0)

    def test_missing_page_recovered_with_escaped_metadata_and_saved_settings(self):
        with tempfile.TemporaryDirectory() as directory:
            data = Path(directory)
            config = data / 'channels' / CHANNEL / 'config.js'
            config.parent.mkdir(parents=True)
            config.write_text('var playerConfig = ' + json.dumps({'source': CHANNEL + '.m3u8', 'poster': 'my-poster.jpg', 'dvr': {'enabled': True}}) + ';')
            original = config.read_bytes()
            db = data / 'db.json'
            db.write_text(json.dumps({'metadata': {'process': {ID: {'restreamer-ui': {'meta': {'name': '<Camera & "name">'}, 'player': {'airplay': True, 'chromecast': False}}}, ID + '_snapshot': None}}}))
            ui = ROOT / 'ui/public'
            self.assertEqual(PLAYER.recover_missing_players(data, ui, db), 1)
            page = data / (CHANNEL + '.html')
            result = page.read_text()
            self.assertIn('&lt;Camera &amp; &quot;name&quot;&gt;', result)
            self.assertNotIn('{{', result)
            self.assertIn('videojs-airplay.min.js', result)
            self.assertNotIn('videojs-chromecast.min.js', result)
            self.assertEqual(config.read_bytes(), original)
            self.assertTrue((data / 'player/videojs/dist/video.min.js').is_file())
            page.write_text('custom existing page')
            self.assertEqual(PLAYER.recover_missing_players(data, ui, db), 0)
            self.assertEqual(page.read_text(), 'custom existing page')

    def test_invalid_config_and_null_metadata_are_skipped(self):
        with tempfile.TemporaryDirectory() as directory:
            data = Path(directory)
            config = data / 'channels' / CHANNEL / 'config.js'
            config.parent.mkdir(parents=True)
            config.write_text('custom javascript;')
            db = data / 'db.json'
            db.write_text(json.dumps({'metadata': {'process': {ID: None}}}))
            PLAYER.synchronize_player_configs(data, db)
            self.assertEqual(PLAYER.recover_missing_players(data, ROOT / 'ui/public', db), 0)
            self.assertFalse((data / (CHANNEL + '.html')).exists())

if __name__ == '__main__':
    unittest.main()
