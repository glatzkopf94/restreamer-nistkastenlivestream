import API from './api';
import { fetch } from './fetch';

jest.mock('./fetch', () => ({
	fetch: jest.fn(),
}));

test('HEAD accepts a JSON content type without trying to parse an empty body', async () => {
	const json = jest.fn(() => {
		throw new SyntaxError('Unexpected end of JSON input');
	});
	const text = jest.fn(() => '');
	fetch.mockResolvedValueOnce({
		ok: true,
		status: 200,
		statusText: 'OK',
		headers: { get: () => 'application/json' },
		json,
		text,
	});

	const api = new API('http://restreamer.test');
	const result = await api.DataHasFile('/livechasing-control/responses/request.json');

	expect(result).toEqual({ err: null, val: null });
	expect(json).not.toHaveBeenCalled();
	expect(text).not.toHaveBeenCalled();
});

test('HEAD reports a missing JSON file without trying to parse an empty error body', async () => {
	const json = jest.fn(() => {
		throw new SyntaxError('Unexpected end of JSON input');
	});
	const text = jest.fn(() => '');
	fetch.mockResolvedValueOnce({
		ok: false,
		status: 404,
		statusText: 'Not Found',
		headers: { get: () => 'application/json' },
		json,
		text,
	});

	const api = new API('http://restreamer.test');
	const result = await api.DataHasFile('/livechasing-control/responses/request.json');

	expect(result).toEqual({ err: { code: 404, message: 'Not Found' }, val: null });
	expect(json).not.toHaveBeenCalled();
	expect(text).not.toHaveBeenCalled();
});
