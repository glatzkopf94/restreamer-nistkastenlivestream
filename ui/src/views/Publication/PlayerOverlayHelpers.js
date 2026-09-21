const sourceNamePattern = /^[A-Za-z][A-Za-z0-9_-]*$/;
const templateToken = /{{\s*([A-Za-z][A-Za-z0-9_-]*)\.([A-Za-z0-9_.-]+)(?:\s*\|\s*number\s*:\s*([0-3]))?\s*}}/g;

function parseSources(value = '') {
	return String(value)
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith('#') && line.includes('='))
		.map((line) => {
			const separator = line.indexOf('=');
			return {
				name: line.slice(0, separator).trim(),
				url: line.slice(separator + 1).trim(),
			};
		})
		.filter((source) => validSourceName(source.name) && /^https?:\/\//i.test(source.url));
}

function upsertSource(value, name, url) {
	let replaced = false;
	const lines = String(value)
		.split(/\r?\n/)
		.filter((line) => {
			const match = line.trim().match(/^([A-Za-z][A-Za-z0-9_-]*)\s*=/);
			if (!match || match[1] !== name) return true;
			if (replaced) return false;
			replaced = true;
			return true;
		})
		.map((line) => {
			const match = line.trim().match(/^([A-Za-z][A-Za-z0-9_-]*)\s*=/);
			return match && match[1] === name ? `${name}=${url}` : line;
		});
	if (!replaced) lines.push(`${name}=${url}`);
	return lines.join('\n').trim();
}

function removeSource(value, name) {
	return String(value)
		.split(/\r?\n/)
		.filter((line) => {
			const match = line.trim().match(/^([A-Za-z][A-Za-z0-9_-]*)\s*=/);
			return !match || match[1] !== name;
		})
		.join('\n')
		.trim();
}

function validSourceName(name) {
	return sourceNamePattern.test(name);
}

function validSource(name, url) {
	if (!validSourceName(name)) return false;
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch (error) {
		return false;
	}
}

function flattenJSON(value, prefix = '', result = [], depth = 0) {
	if (result.length >= 200 || depth > 8) return result;
	if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
		if (prefix) result.push({ path: prefix, value });
		return result;
	}
	if (Array.isArray(value)) {
		value.slice(0, 20).forEach((item, index) => flattenJSON(item, prefix ? `${prefix}.${index}` : String(index), result, depth + 1));
		return result;
	}
	if (typeof value === 'object') {
		Object.entries(value)
			.slice(0, 200)
			.forEach(([key, item]) => flattenJSON(item, prefix ? `${prefix}.${key}` : key, result, depth + 1));
	}
	return result;
}

function lookup(value, path) {
	return path.split('.').reduce((current, part) => {
		if (current === null || current === undefined) return undefined;
		if (Array.isArray(current) && /^\d+$/.test(part)) return current[Number(part)];
		if (typeof current === 'object') return current[part];
		return undefined;
	}, value);
}

function renderPreview(template, payloads = {}) {
	return String(template).replace(templateToken, (token, source, path, decimals) => {
		const value = lookup(payloads[source], path);
		if (value === undefined || value === null || typeof value === 'object' || typeof value === 'boolean') return '--';
		if (decimals !== undefined) {
			const numeric = Number(value);
			return Number.isFinite(numeric) ? numeric.toFixed(Number(decimals)) : '--';
		}
		return String(value);
	});
}

export { flattenJSON, lookup, parseSources, removeSource, renderPreview, upsertSource, validSource, validSourceName };
