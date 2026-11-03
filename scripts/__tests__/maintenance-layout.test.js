import fs from 'node:fs';
import vm from 'node:vm';
import { expect, it } from 'vitest';

it('reserves the measured banner height after first-visit acceptance and clears it on close', async () => {
  const classes = new Set();
  const properties = {};
  const timers = [];
  const listeners = {};
  const banner = { style: { display: 'none' }, offsetHeight: 74, removeAttribute() { this.style = {}; }, querySelector: () => ({}) };
  const overlay = { style: {}, addEventListener() {} };
  const button = { addEventListener: (event, callback) => { listeners[event] = callback; } };
  const nodes = { 'maint-banner': banner, 'disclaimer-overlay': overlay, 'disclaimer-btn': button, 'disclaimer-text': {} };
  const sandbox = {
    document: {
      getElementById: id => nodes[id],
      documentElement: { style: { setProperty: (key, value) => { properties[key] = value; } } },
      body: { classList: {
        add: name => classes.add(name), remove: name => classes.delete(name),
        toggle: (name, on) => on ? classes.add(name) : classes.delete(name),
      } },
    },
    window: { addEventListener() {} },
    localStorage: { getItem: () => null, setItem() {} },
    fetch: async () => ({ json: async () => ({ settings: { banner_enabled: true, disclaimer_enabled: true } }) }),
    setTimeout: callback => timers.push(callback),
  };
  const source = fs.readFileSync('scripts/js/app-ui.js', 'utf8').split('/* ════════ SITE SETTINGS')[1];
  vm.runInNewContext('/* ════════ SITE SETTINGS' + source, sandbox);
  for (let n = 0; n < 8; n++) await Promise.resolve();
  listeners.click();
  expect(classes.has('maint-shift')).toBe(true);
  expect(properties['--maint-banner-h']).toBe('74px');
  sandbox.dismissMaintBanner();
  timers.forEach(callback => callback());
  expect(banner.style.display).toBe('none');
  expect(classes.has('maint-shift')).toBe(false);
  expect(properties['--maint-banner-h']).toBe('0px');
});
