import * as TextOverlay from './TextOverlay';
import * as Timestamps from './Timestamps';
import { initProfile } from '../../../utils/metadata';

test('timestamp repair creates time-based CFR at the selected rate', () => {
	expect(Timestamps.createGraph({ enabled: true, fps: '15' })).toBe('fps=fps=15:start_time=0:round=near');
	expect(Timestamps.createGraph({ enabled: true, fps: '14.985' })).toBe('fps=fps=14.985:start_time=0:round=near');
	expect(Timestamps.createGraph({ enabled: true, fps: '0' })).toBe('');
	expect(Timestamps.createGraph({ enabled: true, fps: '241' })).toBe('');
	expect(Timestamps.createGraph({ enabled: true, fps: '15;movie=/tmp/unsafe' })).toBe('');
	expect(Timestamps.createGraph({ enabled: false, fps: '15' })).toBe('');
});

test('dev12 timestamp graphs are migrated without changing surrounding filters', () => {
	const legacy = '[in]setpts=N/(15*TB)[lc_base0];[lc_base0]scale=1280:720[out]';
	const migrated = Timestamps.migrateGraph(legacy, { enabled: true, fps: '25' });

	expect(migrated).toBe('[in]fps=fps=25:start_time=0:round=near[lc_base0];[lc_base0]scale=1280:720[out]');
	expect(migrated).not.toContain('setpts=N/');
});

test('loading a dev12 profile rebuilds stored timestamp repair graphs', () => {
	const profile = initProfile({
		video: {
			filter: {
				graph: 'setpts=N/(15*TB),scale=3840:2160',
				settings: {
					setpts: {
						graph: 'setpts=N/(15*TB)',
						settings: { enabled: true, fps: '15' },
					},
				},
			},
		},
	});

	expect(profile.video.filter.settings.setpts.graph).toBe('fps=fps=15:start_time=0:round=near');
	expect(profile.video.filter.graph).toBe('fps=fps=15:start_time=0:round=near,scale=3840:2160');
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
		['fps=fps=15:start_time=0:round=near'],
	);

	expect(graph).toContain('[in]fps=fps=15:start_time=0:round=near[lc_base0]');
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
