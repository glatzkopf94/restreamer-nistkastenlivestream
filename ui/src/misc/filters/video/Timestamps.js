import React from 'react';

import { Trans } from '@lingui/macro';
import Grid from '@mui/material/Grid';

import Checkbox from '../../Checkbox';
import { control as Framerate } from './Framerate';

// Rebuild presentation timestamps for sources that deliver non-monotonic or
// otherwise broken timestamps. This is intentionally separate from the
// interpolation filter: no intermediate frames are generated.

function init(initialState) {
	return {
		enabled: false,
		fps: '15',
		...initialState,
	};
}

function createGraph(settings) {
	settings = init(settings);
	const fps = String(settings.fps).trim();

	if (!settings.enabled || !/^\d+(\.\d+)?$/.test(fps) || Number(fps) <= 0 || Number(fps) > 240) {
		return '';
	}

	return `setpts=N/(${fps}*TB)`;
}

function Filter({ settings = {}, onChange = function (settings, graph) {} }) {
	settings = init(settings);

	const handleChange = (newSettings) => {
		let automatic = false;
		if (!newSettings) {
			newSettings = settings;
			automatic = true;
		}

		onChange(newSettings, createGraph(newSettings), automatic);
	};

	const update = (what) => (event) => {
		const newSettings = { ...settings };
		newSettings[what] = what === 'enabled' ? !settings.enabled : event.target.value;
		handleChange(newSettings);
	};

	React.useEffect(() => {
		handleChange(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<React.Fragment>
			<Grid item xs={12}>
				<Checkbox
					label={<Trans>Repair broken video timestamps (SetPTS)</Trans>}
					checked={settings.enabled}
					onChange={update('enabled')}
				/>
			</Grid>
			{settings.enabled && (
				<Grid item xs={12}>
					<Framerate
						label={<Trans>Source framerate for timestamp repair</Trans>}
						customLabel={<Trans>Custom source framerate</Trans>}
						value={settings.fps}
						onChange={update('fps')}
					/>
				</Grid>
			)}
		</React.Fragment>
	);
}

const filter = 'setpts';
const name = 'Timestamp Repair';
const type = 'video';
const hwaccel = false;

function summarize(settings) {
	return `${name} (${settings.fps}fps)`;
}

function defaults() {
	const settings = init({});
	return { settings, graph: createGraph(settings) };
}

export { name, filter, type, hwaccel, summarize, defaults, createGraph, Filter as component };
