import * as TextOverlay from './TextOverlay';
import * as Timestamps from './Timestamps';

test('timestamp repair creates deterministic PTS at the selected rate', () => {
	expect(Timestamps.createGraph({ enabled: true, fps: '15' })).toBe('setpts=N/(15*TB)');
	expect(Timestamps.createGraph({ enabled: true, fps: '0' })).toBe('');
	expect(Timestamps.createGraph({ enabled: false, fps: '15' })).toBe('');
});

test('text overlay only permits persistent plain text files', () => {
	const graph = TextOverlay.createGraph({
		enabled: true,
		textfile: '/core/data/overlays/environment.txt',
		position: 'bottom_left',
		fontsize: '48',
		font: 'serif',
		fontcolor: '#32aaff',
		box: true,
	});

	expect(graph).toContain("drawtext=textfile='/core/data/overlays/environment.txt'");
	expect(graph).toContain('reload=15:expansion=none');
	expect(graph).toContain("fontfile='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'");
	expect(graph).toContain('fontcolor=0x32AAFF');
	expect(graph).toContain('x=24:y=h-th-24');
	expect(graph).toContain('box=1:boxcolor=0x000000@0.55:boxborderw=16');
	expect(TextOverlay.createGraph({ enabled: true, textfile: '/etc/passwd' })).toBe('');
});

test('text overlay rejects unsupported font and color values', () => {
	const graph = TextOverlay.createGraph({
		enabled: true,
		textfile: '/core/data/overlays/environment.txt',
		font: "bad':text=unsafe",
		fontcolor: "red:fontfile='/tmp/unsafe'",
	});

	expect(graph).toContain("fontfile='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'");
	expect(graph).toContain('fontcolor=0xFFFFFF');
	expect(graph).not.toContain('/tmp/unsafe');
});

test('text and logo overlays support centered positions', () => {
	const text = TextOverlay.createGraph({
		enabled: true,
		textfile: '/core/data/overlays/environment.txt',
		position: 'bottom_center',
	});
	expect(text).toContain('x=(w-tw)/2:y=h-th-24');

	const logo = TextOverlay.composeGraph({
		enabled: false,
		logo1: {
			enabled: true,
			path: '/channels/channel-1/overlaylogo1.png',
			position: 'top_center',
		},
	});
	expect(logo).toContain('overlay=x=(W-w)/2:y=24');
});

test('logo overlay is composed with ordinary filters and dynamic text', () => {
	const graph = TextOverlay.composeGraph(
		{
			enabled: true,
			textfile: '/core/data/overlays/channel-1.txt',
			logo1: {
				enabled: true,
				path: '/channels/channel-1/overlaylogo1.png',
				position: 'top_right',
				width: '240',
				opacity: '0.8',
			},
		},
		['setpts=N/(15*TB)'],
	);

	expect(graph).toContain('[in]setpts=N/(15*TB)[lc_base0]');
	expect(graph).toContain("movie=filename='/core/data/channels/channel-1/overlaylogo1.png'");
	expect(graph).toContain('overlay=x=W-w-24:y=24');
	expect(graph).toContain("drawtext=textfile='/core/data/overlays/channel-1.txt'");
	expect(graph).toContain('[out]');
});

test('logo overlay rejects arbitrary server paths', () => {
	const graph = TextOverlay.composeGraph({
		enabled: false,
		logo1: { enabled: true, path: '/etc/passwd' },
	});

	expect(graph).toBe('');
});
