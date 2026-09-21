import React from 'react';

import { Trans } from '@lingui/macro';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import EnableCheckbox from '../../Checkbox';
import Select from '../../Select';
import UploadButton from '../../UploadButton';
import PlayerOverlay from '../../../views/Publication/PlayerOverlay';

const POSITIONS = {
	top_left: ['24', '24'],
	top_center: ['(w-tw)/2', '24'],
	top_right: ['w-tw-24', '24'],
	bottom_left: ['24', 'h-th-24'],
	bottom_center: ['(w-tw)/2', 'h-th-24'],
	bottom_right: ['w-tw-24', 'h-th-24'],
};

const LOGO_POSITIONS = {
	top_left: ['24', '24'],
	top_center: ['(W-w)/2', '24'],
	top_right: ['W-w-24', '24'],
	bottom_left: ['24', 'H-h-24'],
	bottom_center: ['(W-w)/2', 'H-h-24'],
	bottom_right: ['W-w-24', 'H-h-24'],
};

const FONTS = {
	sans: '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
	sans_bold: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
	serif: '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
	mono: '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
};

const LOGO_TYPES = [
	{ extension: 'png', mimetype: 'image/png', maxSize: 5 * 1024 * 1024 },
	{ extension: 'jpg', mimetype: 'image/jpeg', maxSize: 5 * 1024 * 1024 },
	{ extension: 'webp', mimetype: 'image/webp', maxSize: 5 * 1024 * 1024 },
];

const defaultLogo = (initialState = {}) => ({
	enabled: false,
	path: '',
	position: 'top_right',
	width: '320',
	opacity: '1',
	...initialState,
});

function init(initialState = {}, channelid = '') {
	return {
		enabled: false,
		textfile: channelid ? `/core/data/overlays/${channelid}.txt` : '/core/data/overlays/environment.txt',
		position: 'bottom_left',
		fontsize: '48',
		font: 'sans',
		fontcolor: '#ffffff',
		box: true,
		boxcolor: '#000000',
		boxopacity: '0.55',
		sources: '',
		interval: '60',
		template: '',
		...initialState,
		logo1: defaultLogo(initialState.logo1),
		logo2: defaultLogo({ position: 'top_left', ...(initialState.logo2 || {}) }),
	};
}

const validateLogoPath = (path) => /^\/channels\/[A-Za-z0-9-]+\/overlaylogo[12]\.(png|jpg|jpeg|webp)$/.test(path);

function createTextGraph(settings) {
	const path = String(settings.textfile).trim();
	const fontsize = Math.min(200, Math.max(8, parseInt(settings.fontsize, 10) || 48));
	const position = POSITIONS[settings.position] || POSITIONS.bottom_left;
	const fontfile = FONTS[settings.font] || FONTS.sans;
	const color = /^#[0-9a-fA-F]{6}$/.test(settings.fontcolor) ? settings.fontcolor : '#ffffff';
	const boxcolor = /^#[0-9a-fA-F]{6}$/.test(settings.boxcolor) ? settings.boxcolor : '#000000';
	const boxopacity = Math.min(1, Math.max(0, parseFloat(settings.boxopacity) || 0));

	if (!settings.enabled || !/^\/core\/data\/overlays\/[A-Za-z0-9_.-]+\.txt$/.test(path)) {
		return '';
	}

	const options = [
		`textfile='${path}'`,
		'reload=15',
		'expansion=none',
		`fontfile='${fontfile}'`,
		`fontcolor=0x${color.slice(1).toUpperCase()}`,
		`fontsize=${fontsize}`,
		`x=${position[0]}`,
		`y=${position[1]}`,
	];

	if (settings.box) {
		options.push('box=1', `boxcolor=0x${boxcolor.slice(1).toUpperCase()}@${boxopacity.toFixed(2)}`, 'boxborderw=16');
	}

	return `drawtext=${options.join(':')}`;
}

function createGraph(initialSettings) {
	return createTextGraph(init(initialSettings));
}

// Image layers need a labelled graph. All ordinary video filters remain in
// the main branch, so timestamp stabilisation and scaling keep their order.
function composeGraph(initialSettings, ordinaryGraphs = []) {
	const settings = init(initialSettings);
	const textGraph = createTextGraph(settings);
	const logos = [settings.logo1, settings.logo2].filter((logo) => logo.enabled && validateLogoPath(logo.path));

	if (logos.length === 0) {
		return [...ordinaryGraphs, textGraph].filter((graph) => graph.length !== 0).join(',');
	}

	const parts = [];
	let baseLabel = 'lc_base0';
	parts.push(`[in]${ordinaryGraphs.length ? ordinaryGraphs.join(',') : 'null'}[${baseLabel}]`);

	logos.forEach((logo, index) => {
		const diskPath = `/core/data${logo.path}`;
		const width = Math.min(2000, Math.max(16, parseInt(logo.width, 10) || 320));
		const opacity = Math.min(1, Math.max(0.05, parseFloat(logo.opacity) || 1));
		const position = LOGO_POSITIONS[logo.position] || LOGO_POSITIONS.top_right;
		const logoLabel = `lc_logo${index}`;
		const nextBase = `lc_base${index + 1}`;

		parts.push(`movie=filename='${diskPath}',scale=${width}:-1,format=rgba,colorchannelmixer=aa=${opacity.toFixed(2)}[${logoLabel}]`);
		parts.push(`[${baseLabel}][${logoLabel}]overlay=x=${position[0]}:y=${position[1]}:eof_action=repeat[${nextBase}]`);
		baseLabel = nextBase;
	});

	parts.push(textGraph.length !== 0 ? `[${baseLabel}]${textGraph}[out]` : `[${baseLabel}]null[out]`);
	return parts.join(';');
}

function Position({ value, onChange, label = <Trans>Overlay position</Trans> }) {
	return (
		<Select label={label} value={value} onChange={onChange}>
			<MenuItem value="top_left">
				<Trans>Top left</Trans>
			</MenuItem>
			<MenuItem value="top_center">
				<Trans>Top center</Trans>
			</MenuItem>
			<MenuItem value="top_right">
				<Trans>Top right</Trans>
			</MenuItem>
			<MenuItem value="bottom_left">
				<Trans>Bottom left</Trans>
			</MenuItem>
			<MenuItem value="bottom_center">
				<Trans>Bottom center</Trans>
			</MenuItem>
			<MenuItem value="bottom_right">
				<Trans>Bottom right</Trans>
			</MenuItem>
		</Select>
	);
}

function Font({ value, onChange }) {
	return (
		<Select label={<Trans>Font family</Trans>} value={value} onChange={onChange}>
			<MenuItem value="sans">DejaVu Sans</MenuItem>
			<MenuItem value="sans_bold">DejaVu Sans Bold</MenuItem>
			<MenuItem value="serif">DejaVu Serif</MenuItem>
			<MenuItem value="mono">DejaVu Sans Mono</MenuItem>
		</Select>
	);
}

function Logo({ number, settings, onChange, onStore }) {
	const update = (what) => (event) => onChange({ ...settings, [what]: what === 'enabled' ? !settings.enabled : event.target.value });
	const handleUpload = async (data, extension) => {
		const path = await onStore(`overlaylogo${number}.${extension}`, data);
		if (path) onChange({ ...settings, enabled: true, path });
	};

	return (
		<React.Fragment>
			<Grid item xs={12}>
				<FormControlLabel
					control={<Checkbox checked={settings.enabled} onChange={update('enabled')} />}
					label={<Trans>Burn logo {number} into video</Trans>}
				/>
			</Grid>
			{settings.enabled && (
				<React.Fragment>
					<Grid item xs={12}>
						<UploadButton label={<Trans>Upload logo</Trans>} acceptTypes={LOGO_TYPES} onUpload={handleUpload} />
						{settings.path && (
							<Typography variant="caption" sx={{ ml: 2 }}>
								{settings.path}
							</Typography>
						)}
					</Grid>
					<Grid item xs={6}>
						<Position label={<Trans>Logo position</Trans>} value={settings.position} onChange={update('position')} />
					</Grid>
					<Grid item xs={3}>
						<TextField fullWidth type="number" label={<Trans>Logo width</Trans>} value={settings.width} onChange={update('width')} />
					</Grid>
					<Grid item xs={3}>
						<TextField
							fullWidth
							type="number"
							inputProps={{ min: 0.05, max: 1, step: 0.05 }}
							label={<Trans>Opacity</Trans>}
							value={settings.opacity}
							onChange={update('opacity')}
						/>
					</Grid>
				</React.Fragment>
			)}
		</React.Fragment>
	);
}

function Filter({ settings = {}, channelid = '', onStore = async () => '', onChange = function (settings, graph) {} }) {
	settings = init(settings, channelid);
	if (channelid && settings.textfile === '/core/data/overlays/environment.txt' && settings.template) {
		settings.textfile = `/core/data/overlays/${channelid}.txt`;
	}

	const handleChange = (newSettings, automatic = false) => onChange(newSettings, createGraph(newSettings), automatic);
	const handleAssistantChange = (assistantSettings) =>
		handleChange({
			...settings,
			sources: assistantSettings.sources,
			interval: assistantSettings.interval,
			template: assistantSettings.template,
			textfile: channelid ? `/core/data/overlays/${channelid}.txt` : settings.textfile,
		});
	const update = (what) => (event) => {
		const newSettings = { ...settings };
		newSettings[what] = ['enabled', 'box'].includes(what) ? !settings[what] : event.target.value;
		if (what === 'template' && channelid) newSettings.textfile = `/core/data/overlays/${channelid}.txt`;
		handleChange(newSettings);
	};

	React.useEffect(() => {
		handleChange(settings, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<React.Fragment>
			<Grid item xs={12}>
				<EnableCheckbox label={<Trans>Burn dynamic text overlay into video</Trans>} checked={settings.enabled} onChange={update('enabled')} />
			</Grid>
			{settings.enabled && (
				<React.Fragment>
					<Grid item xs={12}>
						<PlayerOverlay
							settings={{
								enabled: true,
								sources: settings.sources,
								interval: settings.interval,
								template: settings.template,
								fontColor: settings.fontcolor,
								box: settings.box,
								boxColor: settings.boxcolor,
								boxOpacity: settings.boxopacity,
							}}
							onChange={handleAssistantChange}
							showToggle={false}
							showAppearance={false}
							showLogos={false}
							assistantType="burnin"
						/>
					</Grid>
					<Grid item xs={8}>
						<Position value={settings.position} onChange={update('position')} />
					</Grid>
					<Grid item xs={4}>
						<TextField fullWidth type="number" label={<Trans>Font size</Trans>} value={settings.fontsize} onChange={update('fontsize')} />
					</Grid>
					<Grid item xs={8}>
						<Font value={settings.font} onChange={update('font')} />
					</Grid>
					<Grid item xs={4}>
						<TextField
							fullWidth
							type="color"
							label={<Trans>Text color</Trans>}
							value={settings.fontcolor}
							onChange={update('fontcolor')}
							InputLabelProps={{ shrink: true }}
						/>
					</Grid>
					<Grid item xs={12}>
						<FormControlLabel
							control={<Checkbox checked={settings.box} onChange={update('box')} />}
							label={<Trans>Draw translucent background box</Trans>}
						/>
					</Grid>
					{settings.box && (
						<React.Fragment>
							<Grid item xs={6}>
								<TextField
									fullWidth
									type="color"
									label={<Trans>Background color</Trans>}
									value={settings.boxcolor}
									onChange={update('boxcolor')}
									InputLabelProps={{ shrink: true }}
								/>
							</Grid>
							<Grid item xs={6}>
								<TextField
									fullWidth
									type="number"
									inputProps={{ min: 0, max: 1, step: 0.05 }}
									label={<Trans>Background opacity</Trans>}
									value={settings.boxopacity}
									onChange={update('boxopacity')}
								/>
							</Grid>
						</React.Fragment>
					)}
					<Grid item xs={12}>
						<Typography variant="h4">
							<Trans>Logos</Trans>
						</Typography>
					</Grid>
					<Logo number={1} settings={settings.logo1} onStore={onStore} onChange={(logo1) => handleChange({ ...settings, logo1 })} />
					<Logo number={2} settings={settings.logo2} onStore={onStore} onChange={(logo2) => handleChange({ ...settings, logo2 })} />
					{!settings.template && (
						<Grid item xs={12}>
							<Typography variant="caption">
								<Trans>Compatibility mode: the existing overlay text file remains active until a template is entered.</Trans>
							</Typography>
						</Grid>
					)}
				</React.Fragment>
			)}
		</React.Fragment>
	);
}

const filter = 'drawtext';
const name = 'Dynamic Text Overlay';
const type = 'video';
const hwaccel = false;

function summarize() {
	return name;
}

function defaults() {
	const settings = init({});
	return { settings, graph: createGraph(settings) };
}

export { name, filter, type, hwaccel, summarize, defaults, createGraph, composeGraph, Filter as component };
