import { flattenJSON, parseSources, removeSource, renderPreview, upsertSource, validSource } from './PlayerOverlayHelpers';

test('parses named HTTP JSON sources and ignores comments', () => {
	expect(parseSources('# weather\nwetter=https://example.test/environment.json\ninvalid\ninnen=http://example.test/inside.json')).toEqual([
		{ name: 'wetter', url: 'https://example.test/environment.json' },
		{ name: 'innen', url: 'http://example.test/inside.json' },
	]);
});

test('adds and replaces a source without losing expert comments', () => {
	const initial = '# public data\nwetter=https://old.example.test/data.json\ninside=https://example.test/inside.json';
	expect(upsertSource(initial, 'wetter', 'https://new.example.test/data.json')).toBe(
		'# public data\nwetter=https://new.example.test/data.json\ninside=https://example.test/inside.json',
	);
	expect(upsertSource(initial, 'roof', 'https://example.test/roof.json')).toContain('roof=https://example.test/roof.json');
});

test('removes only the selected source', () => {
	const value = '# keep\nwetter=https://example.test/weather.json\ninside=https://example.test/inside.json';
	expect(removeSource(value, 'wetter')).toBe('# keep\ninside=https://example.test/inside.json');
});

test('finds scalar fields in nested JSON objects and arrays', () => {
	expect(flattenJSON({ temperature_c: 14.5, current: { humidity: 84 }, values: [1, 2] })).toEqual([
		{ path: 'temperature_c', value: 14.5 },
		{ path: 'current.humidity', value: 84 },
		{ path: 'values.0', value: 1 },
		{ path: 'values.1', value: 2 },
	]);
});

test('renders the same numeric placeholders as the runtime manager', () => {
	const template = 'Temp: {{ wetter.temperature_c | number:1 }} °C   F: {{ wetter.humidity_pct | number:0 }} %';
	expect(renderPreview(template, { wetter: { temperature_c: 14.56, humidity_pct: 84 } })).toBe('Temp: 14.6 °C   F: 84 %');
	expect(renderPreview('{{ wetter.missing }}', { wetter: {} })).toBe('--');
});

test('accepts only a safe source name and an HTTP(S) URL', () => {
	expect(validSource('wetter', 'https://example.test/environment.json')).toBe(true);
	expect(validSource('2bad', 'https://example.test/environment.json')).toBe(false);
	expect(validSource('wetter', 'file:///etc/passwd')).toBe(false);
});
