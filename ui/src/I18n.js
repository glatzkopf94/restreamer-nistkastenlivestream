import React from 'react';

import { I18nProvider } from '@lingui/react';
import { i18n } from '@lingui/core';

import { messages as EN } from './locales/en/messages.js';
import { messages as DA } from './locales/da/messages.js';
import { messages as DE } from './locales/de/messages.js';
import { messages as EL } from './locales/el/messages.js';
import { messages as ES } from './locales/es/messages.js';
import { messages as FR } from './locales/fr/messages.js';
import { messages as IT } from './locales/it/messages.js';
import { messages as KO } from './locales/ko/messages.js';
import { messages as PL } from './locales/pl/messages.js';
import { messages as PT } from './locales/pt-br/messages.js';
import { messages as RU } from './locales/ru/messages.js';
import { messages as SL } from './locales/sl/messages.js';
import { messages as TR } from './locales/tr/messages.js';
import { messages as UK } from './locales/uk/messages.js';
import { messages as ZH } from './locales/zh-hans/messages.js';
import * as Storage from './utils/storage';

// Timestamp repair was introduced after these catalogs were last extracted.
// Lingui strips source text from production builds, so missing messages would
// otherwise appear as their six-character IDs. Catalogs override these fallbacks.
const timestampLabels = {
	CGkMER: 'Repair video timestamps (time-based CFR)',
	Bj8pBv: 'Output framerate for timestamp repair',
	lp0qt6: 'Custom output framerate',
};
const germanTimestampLabels = {
	CGkMER: 'Video-Zeitstempel reparieren (zeitbasierte CFR)',
	Bj8pBv: 'Ausgabe-Bildrate für die Zeitstempelreparatur',
	lp0qt6: 'Benutzerdefinierte Ausgabe-Bildrate',
};
const withTimestampLabels = (catalog, fallbacks = timestampLabels) => ({ ...timestampLabels, ...fallbacks, ...catalog });

i18n.load({
	en: withTimestampLabels(EN),
	da: withTimestampLabels(DA),
	de: withTimestampLabels(DE, germanTimestampLabels),
	el: withTimestampLabels(EL),
	es: withTimestampLabels(ES),
	fr: withTimestampLabels(FR),
	it: withTimestampLabels(IT),
	ko: withTimestampLabels(KO),
	pl: withTimestampLabels(PL),
	ru: withTimestampLabels(RU),
	sl: withTimestampLabels(SL),
	tr: withTimestampLabels(TR),
	uk: withTimestampLabels(UK),
	'zh-hans': withTimestampLabels(ZH),
});

const aliases = {
	pt: 'pt-br',
	'zh-cn': 'zh-hans',
};

const getAlias = (lang) => {
	if (lang in aliases) {
		return aliases[lang];
	}

	return lang;
};

const getLanguage = (defaultLanguage, supportedLanguages) => {
	let lang = getAlias(Storage.Get('language'));
	if (supportedLanguages.indexOf(lang) === -1) {
		lang = getAlias(getBrowserLanguage(defaultLanguage));

		if (supportedLanguages.indexOf(lang) === -1) {
			lang = defaultLanguage;
		}
	}

	Storage.Set('language', lang);

	return lang;
};

const getBrowserLanguage = (defaultLanguage) => {
	let lang = window.navigator.language;

	const match = lang.match(/^[a-z]+(-[a-z]+)?/i);
	if (!match) {
		return defaultLanguage;
	}

	return match[0].toLowerCase();
};

i18n.activate(getLanguage('en', ['en', 'da', 'de', 'el', 'es', 'fr', 'it', 'ko', 'pl', 'pt-br', 'ru', 'sl', 'tr', 'uk', 'zh-hans']));

export default function Provider(props) {
	return <I18nProvider i18n={i18n}>{props.children}</I18nProvider>;
}
