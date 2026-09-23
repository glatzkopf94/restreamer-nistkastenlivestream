import React from 'react';

import { Trans } from '@lingui/macro';
import Grid from '@mui/material/Grid';

import Checkbox from '../../Checkbox';
import { control as Framerate } from './Framerate';

// Normalize a source to a stable CFR without replacing its real clock with a
// frame counter. The fps filter keeps the input PTS as the reference and only
// duplicates or drops frames at the requested output instants.

const legacyGraphPattern = /setpts=N\/\(([0-9]+(?:\.[0-9]+)?)\*TB\)/g;

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

	return `fps=fps=${fps}:start_time=0:round=near`;
}

function migrateGraph(graph, settings) {
	if (typeof graph !== 'string' || !legacyGraphPattern.test(graph)) {
		legacyGraphPattern.lastIndex = 0;
		return graph;
	}

	legacyGraphPattern.lastIndex = 0;
	const replacement = createGraph(settings);
	if (replacement.length === 0) {
		return graph;
	}

	return graph.replace(legacyGraphPattern, replacement);
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
					label={<Trans>Repair video timestamps (time-based CFR)</Trans>}
					checked={settings.enabled}
					onChange={update('enabled')}
				/>
			</Grid>
			{settings.enabled && (
				<Grid item xs={12}>
					<Framerate
						label={<Trans>Output framerate for timestamp repair</Trans>}
						customLabel={<Trans>Custom output framerate</Trans>}
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

export { name, filter, type, hwaccel, summarize, defaults, createGraph, migrateGraph, Filter as component };
