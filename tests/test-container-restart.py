#!/usr/bin/env python3
"""CI-only restart regression: always creates its own disposable volumes/container."""
import json
import subprocess
import sys
import time
import uuid

image = sys.argv[1]
name = 'nkl-restart-test-' + uuid.uuid4().hex[:10]
config_volume, data_volume = name + '-config', name + '-data'
channel = '0e652a1b-3ac8-4211-99a0-1f171d362f57'
process_id = 'restreamer-ui:ingest:' + channel

def docker(*args, input=None):
    return subprocess.check_output(['docker', *args], input=input, text=True)

def execute(code):
    return docker('exec', '-i', name, 'python3', '-', input=code)

def ready():
    for _ in range(60):
        try:
            execute("from urllib.request import urlopen; assert urlopen('http://127.0.0.1:8080/', timeout=2).status == 200")
            return
        except subprocess.CalledProcessError:
            time.sleep(2)
    raise RuntimeError('Restreamer did not become ready')

try:
    for volume in (config_volume, data_volume):
        docker('volume', 'create', volume)
    # Emulate an upgraded installation whose old Core deleted the HTML at stop.
    seed = '''import json
from pathlib import Path
channel = CHANNEL
pid = 'restreamer-ui:ingest:' + channel
config = {'id': pid, 'ffversion': '', 'autostart': False,
          'input': [{'id': 'input_0', 'address': 'testsrc=size=64x64:rate=1', 'options': ['-f', 'lavfi']}],
          'output': [{'id': 'output_0', 'address': '{diskfs}/' + channel + '_output_0.m3u8', 'options': ['-f', 'hls'],
                      'cleanup': [{'pattern': 'diskfs:/' + channel + '**', 'purge_on_delete': True}]}]}
db = {'version': 4, 'process': {pid: {'id': pid, 'order': 'stop', 'config': config}},
      'metadata': {'system': {}, 'process': {pid: {'restreamer-ui': {
          'meta': {'name': 'Restart test'}, 'player': {}, 'control': {'hls': {'storage': 'diskfs', 'dvr': None}}}}}}}
Path('/core/config/db.json').write_text(json.dumps(db))
p = Path('/core/data/channels') / channel
p.mkdir(parents=True)
(p / 'config.js').write_text('var playerConfig = ' + json.dumps({'source': channel + '.m3u8', 'poster': 'keep.jpg'}) + ';')
Path('/core/data/' + channel + '_output_0.m3u8').write_text('#EXTM3U\\n')
p = Path('/core/data') / channel / 'output_0'
p.mkdir(parents=True)
(p / 'recording.ts').write_bytes(b'persisted DVR segment')
'''.replace('CHANNEL', repr(channel))
    docker('run', '--rm', '-i', '-v', config_volume + ':/core/config', '-v', data_volume + ':/core/data', '--entrypoint', 'python3', image, '-', input=seed)
    docker('run', '-d', '--name', name, '-v', config_volume + ':/core/config', '-v', data_volume + ':/core/data', image)
    ready()
    verify = f'''import json
from pathlib import Path
from urllib.request import urlopen
channel = {channel!r}
p = Path('/core/data') / (channel + '.html')
assert urlopen('http://127.0.0.1:8080/' + channel + '.html').status == 200
assert 'Restart test' in p.read_text()
assert (Path('/core/data') / channel / 'output_0/recording.ts').read_bytes() == b'persisted DVR segment'
db = json.loads(Path('/core/config/db.json').read_text())
rules = db['process'][{process_id!r}]['config']['output'][0]['cleanup']
assert len(rules) == 7 and all(r['pattern'] != 'diskfs:/' + channel + '**' for r in rules)
'''
    execute(verify)
    # A sentinel proves shutdown retains the page, rather than recreating it.
    execute(f"from pathlib import Path; p = Path('/core/data/{channel}.html'); p.write_text(p.read_text() + '\\n<!-- restart sentinel -->')")
    verify += "assert '<!-- restart sentinel -->' in p.read_text()\n"
    for _ in range(2):
        docker('restart', '--time', '30', name)
        ready()
        execute(verify)
    # Confirm Core actually registered the process and purge rules: explicit
    # deletion removes media, but its generated player must remain available.
    execute(f"from urllib.request import Request, urlopen; assert urlopen(Request('http://127.0.0.1:8080/api/v3/process/{process_id}', method='DELETE')).status == 200")
    execute(f"from pathlib import Path; assert Path('/core/data/{channel}.html').is_file(); assert not Path('/core/data/{channel}/output_0/recording.ts').exists()")
    print('Restart regression passed: legacy recovery, migrated rules, two real restarts, explicit media purge.')
except Exception:
    subprocess.run(['docker', 'logs', '--tail', '100', name], check=False)
    raise
finally:
    subprocess.run(['docker', 'rm', '-f', name], check=False, stdout=subprocess.DEVNULL)
    for volume in (config_volume, data_volume):
        subprocess.run(['docker', 'volume', 'rm', volume], check=False, stdout=subprocess.DEVNULL)
