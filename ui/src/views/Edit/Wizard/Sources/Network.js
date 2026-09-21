import React from 'react';

import { Trans } from '@lingui/macro';
import Grid from '@mui/material/Grid';
import Icon from '@mui/icons-material/SettingsEthernet';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import * as S from '../../Sources/Network';
import Checkbox from '../../../../misc/Checkbox';
import Password from '../../../../misc/Password';

const initSettings = (initialSettings, config) => {
	const settings = {
		...S.func.initSettings(initialSettings, config),
		mode: 'pull',
	};

	return settings;
};

function Source({
	settings: externalSettings = {},
	knownDevices = [],
	config = null,
	skills = null,
	onChange = function (type, settings, inputs, ready) {},
	onRefresh = function () {},
}) {
	config = S.func.initConfig(config);
	skills = S.func.initSkills(skills);

	const [$settings, setSettings] = React.useState(() => initSettings(externalSettings, config));
	const settingsRef = React.useRef($settings);
	const emittedSettingsRef = React.useRef(null);

	React.useEffect(() => {
		// The parent normally returns the exact object emitted below. Keep the
		// local draft in that case so that a delayed parent render can never
		// reset the character that has just been entered.
		if (externalSettings === emittedSettingsRef.current) {
			emittedSettingsRef.current = null;
			return;
		}

		const nextSettings = initSettings(externalSettings, config);
		settingsRef.current = nextSettings;
		setSettings(nextSettings);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [externalSettings]);

	const handleChange = (newSettings) => {
		newSettings = newSettings || settingsRef.current;
		emittedSettingsRef.current = newSettings;

		onChange(S.id, newSettings, S.func.createInputs(newSettings, config, skills), S.func.isValidURL(newSettings.address));
	};

	const update = (protocol, what) => (event) => {
		const value = event.target.value;
		const currentSettings = settingsRef.current;
		let newSettings = {
			...currentSettings,
		};

		if (protocol === 'rtsp') {
			newSettings.rtsp = {
				...currentSettings.rtsp,
				[what]: ['udp'].includes(what) ? !currentSettings.rtsp[what] : value,
			};
		} else {
			newSettings = {
				...newSettings,
				[what]: value,
			};
		}

		settingsRef.current = newSettings;
		setSettings(newSettings);
		handleChange(newSettings);
	};

	React.useEffect(() => {
		handleChange();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const protocol = S.func.getProtocolClass($settings.address);

	return (
		<React.Fragment>
			<Grid item xs={12}>
				<Typography>
					<Trans>Enter the address of your network source:</Trans>
				</Typography>
			</Grid>
			<Grid item xs={12}>
				<TextField
					variant="outlined"
					fullWidth
					label={<Trans>Address</Trans>}
					placeholder="rtsp://ip:port/path"
					value={$settings.address}
					onChange={update('', 'address')}
					name="network-source-address"
					autoComplete="off"
					spellCheck={false}
					inputProps={{
						'data-livechasing-input-state': 'local-draft-v2',
						'data-form-type': 'other',
						'data-lpignore': 'true',
						'data-1p-ignore': 'true',
					}}
				/>
				<Typography variant="caption">
					<Trans>Supports HTTP (HLS, DASH), RTP, RTSP, RTMP, SRT and more.</Trans>
				</Typography>
			</Grid>
			{protocol === 'rtsp' && (
				<Grid item xs={12}>
					<Checkbox label={<Trans>UDP transport</Trans>} checked={$settings.rtsp.udp} onChange={update('rtsp', 'udp')} />
				</Grid>
			)}
			<Grid item md={6} xs={12}>
				<TextField
					variant="outlined"
					fullWidth
					label={<Trans>Username</Trans>}
					value={$settings.username}
					onChange={update('', 'username')}
					disabled={protocol === 'srt'}
					name="network-source-username"
					autoComplete="off"
					inputProps={{
						'data-livechasing-input-state': 'local-draft-v2',
						'data-form-type': 'other',
						'data-lpignore': 'true',
						'data-1p-ignore': 'true',
					}}
				/>
				<Typography variant="caption">
					<Trans>Username for the device.</Trans>
				</Typography>
			</Grid>
			<Grid item md={6} xs={12}>
				<Password
					variant="outlined"
					fullWidth
					label={<Trans>Password</Trans>}
					value={$settings.password}
					onChange={update('', 'password')}
					disabled={protocol === 'srt'}
					id="network-source-password"
					name="network-source-password"
					autoComplete="new-password"
					inputProps={{
						'data-livechasing-input-state': 'local-draft-v2',
						'data-form-type': 'other',
						'data-lpignore': 'true',
						'data-1p-ignore': 'true',
					}}
				/>
				<Typography variant="caption">
					<Trans>Password for the device.</Trans>
				</Typography>
			</Grid>
		</React.Fragment>
	);
}

function SourceIcon(props) {
	return <Icon style={{ color: '#FFF' }} {...props} />;
}

const id = 'network';
const type = 'network';
const name = <Trans>Network source</Trans>;
const capabilities = ['audio', 'video'];

export { id, type, name, capabilities, SourceIcon as icon, Source as component };
