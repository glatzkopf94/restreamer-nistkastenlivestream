// Exercise the actual generated public player script with small Video.js/DOM stubs.
process.env.TZ = 'UTC';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('ui/public/_player/videojs/player.html', 'utf8');
const script = html.match(/<script>\s*function getQueryParam\(key, defaultValue\) \{[\s\S]*?<\/script>/)[0].replace(/^<script>/, '').replace(/<\/script>$/, '');
let nextClaim = 0;
const channels = [];
const broadcast = class {
  constructor() { this.onmessage = null; channels.push(this); }
  postMessage(data) { for (const channel of channels) if (channel !== this && channel.onmessage) channel.onmessage({data}); }
  close() { channels.splice(channels.indexOf(this), 1); }
};
function element() {
  return {
    className: '', style: { setProperty() {} }, textContent: '', children: [], disabled: false,
    classList: { add(name) { this[name] = true; }, remove(name) { delete this[name]; }, contains(name) { return !!this[name]; } },
    appendChild(child) { this.children.push(child); },
    replaceChildren(child) { this.children = child.children; },
    setAttribute() {}, addEventListener(name, callback) { (this.events ||= {})[name] = callback; },
    getBoundingClientRect() { return { left: 10, width: 800 }; },
    clientWidth: 800,
  };
}
function makePlayer(dvr = false, legacyPage = false) {
  const gate = element();
  const message = element();
  const button = element();
  const hint = element();
  const bigPlayButton = {handleClick() { player.play(); }};
  const holder = element();
  const progress = element();
  progress.querySelector = () => holder;
  const nodes = { 'lc-player-shell': element(), 'lc-playback-gate': gate, 'lc-playback-gate-message': message, 'lc-playback-gate-button': button };
  if (!legacyPage) nodes['lc-activation-hint'] = hint;
  const document = {
    getElementById: id => nodes[id],
    createElement: () => {
      if (!nodes['lc-activation-hint']) {
        nodes['lc-activation-hint'] = hint;
        return hint;
      }
      return element();
    },
    createDocumentFragment: element,
  };
  const callbacks = {};
  let resets = 0;
  let poster = '';
  let sources = null;
  const timers = new Map();
  let timerId = 0;
  const player = {
    el: () => element(), bigPlayButton, controlBar: { progressControl: { el: () => progress } },
    on(name, fn) { (callbacks[name] ||= []).push(fn); },
    one(name, fn) { const once = () => {callbacks[name] = callbacks[name].filter(f => f !== once); fn();}; this.on(name, once); },
    autoplay() {}, preload() {}, hasStarted(value) {this.started = value;},
    emit(name) { for (const fn of callbacks[name] || []) fn(); },
    ready(fn) { fn(); }, license() {}, addClass() {},
    pause() {}, reset() { resets++; sources = null; this.emit('playerreset'); }, poster(value) { poster = value; }, error() {}, src(value) { sources = value; },
    play() { assert.ok(sources, 'native Play requires an attached source'); this.started = true; this.emit('playing'); return Promise.resolve(); },
    seekable: () => ({ length: 1, start: () => 0, end: () => 7200 }),
    tech: () => ({ vhs: { playlists: { media: () => ({ segments: [{dateTimeString: '2026-09-25T14:59:58Z', duration: 2}] }) } } }),
  };
  const localStorage = { getItem: () => 'abcdefghijklmnop', setItem() {} };
  const window = {
    location: { search: '', origin: 'https://example.org' },
    navigator: { language: 'de' }, localStorage, BroadcastChannel: broadcast,
    crypto: { randomUUID: () => `token-${++nextClaim}` },
    addEventListener() {}, removeEventListener() {}, setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id),
  };
  const config = { channelid: `channel-${nextClaim}`, autoplay: false, mute: false, statistics: false, color: {buttons:'#ffffff'}, source:'test.m3u8', poster:'poster.jpg', overlay: {enabled:false}, dvr: {enabled:dvr, segmentDuration: 2}, playback: {singleActiveStream:true, sessionLimitEnabled:true} };
  const context = {window, document, playerConfig: config, videojs: () => player, URL, Date, Math, Number, String, RegExp, Intl, BroadcastChannel: broadcast, fetch: () => { throw Error('VHS dateTime should be used'); }};
  vm.runInNewContext(script, context);
  return {player, gate, hint, message, holder, button, timers, get poster() {return poster;}, get sources() {return sources;}, get resets() {return resets;}};
}
const first = makePlayer(false, true); // Existing published page has no hint markup/CSS.
const untouched = makePlayer();
first.player.emit('playing');
assert.equal(untouched.gate.classList.contains('is-visible'), false, 'untouched poster must remain visible');
assert.equal(untouched.resets, 0);
const third = makePlayer();
third.player.emit('playing');
assert.equal(first.gate.classList.contains('is-visible'), false, 'single-player stop must not darken the poster');
assert.equal(first.player.started, false);
assert.ok(first.poster.includes('t='), 'poster must be loaded with a fresh URL');
assert.equal(first.button.textContent, '', 'single-player stop must not offer another button');
assert.equal(untouched.gate.classList.contains('is-visible'), false);
assert.equal(untouched.resets, 0);
first.player.bigPlayButton.handleClick();
assert.equal(first.player.started, true);
assert.equal(third.player.started, false);
assert.ok(first.sources && first.sources.length, 'poster Play must restore the HLS source');

const session = makePlayer();
session.player.emit('playing');
for (const callback of [...session.timers.values()]) callback();
assert.equal(session.gate.classList.contains('is-visible'), true, '15-minute session must retain its gate');
assert.equal(session.button.textContent, '▶ Weiter ansehen');
assert.equal(session.message.textContent, '15 Minuten erreicht. Zum Weiterschauen erneut Play drücken.');

const dvr = makePlayer(true);
const marks = dvr.holder.children.find(child => child.className === 'lc-dvr-markers');
const labels = marks.children.map(tick => tick.children[0]?.textContent).filter(Boolean);
assert.ok(labels.includes('14:30'), `missing 30-minute wall-clock tick: ${labels}`);
assert.ok(labels.includes('14:00'));
const tooltip = dvr.holder.children.find(child => child.className === 'lc-dvr-clock-tooltip');
dvr.holder.events.pointermove({clientX: 410});
assert.equal(tooltip.textContent, '14:00', 'drag/hover must display clock time rather than -1:00');
console.log('Player behavior: normal poster reset, native Play, session gate, DVR ticks and clock tooltip OK');
