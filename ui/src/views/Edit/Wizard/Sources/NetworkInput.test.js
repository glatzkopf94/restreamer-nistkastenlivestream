import React from 'react';

import userEvent from '@testing-library/user-event';

import { render, screen } from '../../../../utils/testing';
import * as FullNetwork from '../../Sources/Network';
import * as Network from './Network';

const skills = {
	ffmpeg: {
		version: '9.0.1',
		version_major: 9,
		version_minor: 0,
	},
	formats: {
		demuxers: ['rtsp'],
	},
	protocols: {
		input: ['http', 'https', 'rtmp', 'rtmps', 'rtsp', 'srt'],
	},
	codecs: {
		audio: {},
		video: {},
	},
};

function StatefulNetworkSource() {
	const [settings, setSettings] = React.useState({});
	const Component = Network.component;

	return <Component settings={settings} skills={skills} config={{ channelid: 'input-test' }} onChange={(type, nextSettings) => setSettings(nextSettings)} />;
}

test('URL, username and password remain independently editable', async () => {
	const user = userEvent.setup();
	render(<StatefulNetworkSource />);

	const address = screen.getByLabelText('Address');
	const username = screen.getByLabelText('Username');
	const password = screen.getByLabelText('Password');

	await user.click(address);
	await user.paste('rtsp://192.0.2.10:554/stream');
	await user.type(username, 'camera-admin');
	await user.type(password, 'camera-password');

	expect(address).toHaveValue('rtsp://192.0.2.10:554/stream');
	expect(username).toHaveValue('camera-admin');
	expect(password).toHaveValue('camera-password');
});

test('keeps accepting input while the parent has not echoed the new state yet', async () => {
	const user = userEvent.setup();
	const Component = Network.component;

	render(<Component settings={{}} skills={skills} config={{ channelid: 'delayed-parent-test' }} onChange={() => {}} />);

	const address = screen.getByLabelText('Address');
	const username = screen.getByLabelText('Username');
	const password = screen.getByLabelText('Password');

	await user.type(address, 'rtsp://192.0.2.20:554/live');
	await user.type(username, 'second-camera');
	await user.type(password, 'second-password');

	expect(address).toHaveValue('rtsp://192.0.2.20:554/live');
	expect(username).toHaveValue('second-camera');
	expect(password).toHaveValue('second-password');
});

test('keeps the advanced network editor editable with a delayed parent', async () => {
	const user = userEvent.setup();
	const Component = FullNetwork.component;

	render(<Component settings={{}} skills={skills} config={{ channelid: 'advanced-input-test' }} onChange={() => {}} />);

	const address = screen.getByLabelText('Address');
	await user.type(address, 'rtsp://192.0.2.30:554/main');

	const username = screen.getByLabelText('Username');
	const password = screen.getByLabelText('Password');
	await user.type(username, 'advanced-camera');
	await user.type(password, 'advanced-password');

	expect(address).toHaveValue('rtsp://192.0.2.30:554/main');
	expect(username).toHaveValue('advanced-camera');
	expect(password).toHaveValue('advanced-password');
});
