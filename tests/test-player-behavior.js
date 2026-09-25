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
function makePlayer(dvr = false) {
  const gate = element();
  const message = element();
  const button = element();
  const holder = element();
  const progress = element();
  progress.querySelector = () => holder;
  const nodes = { 'lc-player-shell': element(), 'lc-playback-gate': gate, 'lc-playback-gate-message': message, 'lc-playback-gate-button': button };
  const document = { getElementById: id => nodes[id], createElement: element, createDocumentFragment: element };
  const callbacks = {};
  let resets = 0;
  const player = {
    el: () => element(), controlBar: { progressControl: { el: () => progress } },
    on(name, fn) { (callbacks[name] ||= []).push(fn); },
    emit(name) { for (const fn of callbacks[name] || []) fn(); },
    ready(fn) { fn(); }, license() {}, addClass() {},
    pause() {}, reset() { resets++; }, poster() {}, error() {}, src() {},
    play() { return Promise.resolve(); },
    seekable: () => ({ length: 1, start: () => 0, end: () => 7200 }),
    tech: () => ({ vhs: { playlists: { media: () => ({ segments: [{dateTimeString: '2026-09-25T14:59:58Z', duration: 2}] }) } } }),
  };
  const localStorage = { getItem: () => 'abcdefghijklmnop', setItem() {} };
  const window = {
    location: { search: '', origin: 'https://example.org' },
    navigator: { language: 'de' }, localStorage, BroadcastChannel: broadcast,
    crypto: { randomUUID: () => `token-${++nextClaim}` },
    addEventListener() {}, removeEventListener() {}, setTimeout: () => 0, clearTimeout() {},
  };
  const config = { channelid: `channel-${nextClaim}`, autoplay: false, mute: false, statistics: false, color: {buttons:'#ffffff'}, source:'test.m3u8', poster:'poster.jpg', overlay: {enabled:false}, dvr: {enabled:dvr, segmentDuration: 2}, playback: {singleActiveStream:true} };
  const context = {window, document, playerConfig: config, videojs: () => player, URL, Date, Math, Number, String, RegExp, Intl, BroadcastChannel: broadcast, fetch: () => { throw Error('VHS dateTime should be used'); }};
  vm.runInNewContext(script, context);
  return {player, gate, message, holder, button, get resets() {return resets;}};
}
const first = makePlayer();
const untouched = makePlayer();
first.player.emit('playing');
assert.equal(untouched.gate.classList.contains('is-visible'), false, 'untouched poster must remain visible');
assert.equal(untouched.resets, 0);
const third = makePlayer();
third.player.emit('playing');
assert.equal(first.gate.classList.contains('is-visible'), true, 'previously playing stream must display gate');
assert.equal(first.message.textContent, 'Ein anderer Stream wurde aktiviert.');
assert.equal(untouched.gate.classList.contains('is-visible'), false);
assert.equal(untouched.resets, 0);

const dvr = makePlayer(true);
const marks = dvr.holder.children.find(child => child.className === 'lc-dvr-markers');
const labels = marks.children.map(tick => tick.children[0]?.textContent).filter(Boolean);
assert.ok(labels.includes('14:30'), `missing 30-minute wall-clock tick: ${labels}`);
assert.ok(labels.includes('14:00'));
const tooltip = dvr.holder.children.find(child => child.className === 'lc-dvr-clock-tooltip');
dvr.holder.events.pointermove({clientX: 410});
assert.equal(tooltip.textContent, '14:00', 'drag/hover must display clock time rather than -1:00');
console.log('Player behavior: untouched poster, active gate, DVR ticks and clock tooltip OK');
