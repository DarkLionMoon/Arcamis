/* Tema stagionale condiviso da Arcamis e Mestieri: decorazioni statiche, nessun audio. */
(function (global) {
  'use strict';
  var clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  function parts(date) {
    var result = {};
    clock.formatToParts(date).forEach(function (part) {
      if (part.type !== 'literal') result[part.type] = Number(part.value);
    });
    return result;
  }
  function isSeason(date) {
    var p = parts(date);
    return p.month === 12 || (p.month === 1 && p.day <= 6);
  }
  function nextMidnightDelay(date) {
    var p = parts(date);
    var midnight = Date.UTC(p.year, p.month - 1, p.day + 1);
    var target = midnight;
    // Resolve the Italian UTC offset at the target, including DST transitions.
    for (var i = 0; i < 2; i++) {
      var t = parts(new Date(target));
      var offset = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second) - target;
      target = midnight - offset;
    }
    return Math.max(1, target - date.getTime());
  }
  global.ArcWinter = { isSeason: isSeason, nextMidnightDelay: nextMidnightDelay };
  var doc = global.document;
  if (!doc) return;
  var timer = null;
  var style = null;
  var preview = new URLSearchParams(global.location.search).get('natale') === 'anteprima';
  var css = [
    '.arc-winter #topbar{border-bottom-color:#917545;background:#0a100f}',
    '.arc-winter-lights{position:absolute;left:0;right:0;bottom:-28px;height:30px;pointer-events:none;overflow:hidden;z-index:4}',
    '.arc-winter-lights svg{display:block;width:100%;height:30px}',
    '.arc-winter-snow{position:absolute;bottom:-3px;left:0;right:0;height:7px;pointer-events:none;background:radial-gradient(ellipse at 50% 0,#e1e7df 0 55%,transparent 61%) 0 0/83px 9px repeat-x;opacity:.8;z-index:4}',
    '.arc-winter-sprig{position:absolute;top:0;width:150px;height:94px;pointer-events:none;z-index:3;opacity:.9}',
    '.arc-winter-sprig.right{right:0;transform:scaleX(-1)}.arc-winter-sprig.left{left:0}',
    '.arc-winter #carousel-wrap{position:relative}',
    '.arc-winter-stars{position:absolute;inset:35px 0 auto;height:185px;pointer-events:none;z-index:3;opacity:.65}',
    '.arc-winter-stars svg{height:100%;width:100%}',
    '.arc-winter .slide .scnt::before{content:"✧  Buone feste, avventurieri";display:block;margin-bottom:22px;font-family:Cinzel,Georgia,serif;font-size:12px;letter-spacing:.17em;color:#e2c68d;text-transform:uppercase}',
    '.arc-winter .slide.active .stit{color:#f2dfb6}.arc-winter .slide.active .sbtn:first-child{background:#17362c;border:1px solid #ad8c52;color:#f1deb8}',
    '.arc-winter #hero-particles{display:none}',
    '.arc-winter header>.arc-winter-sprig{width:110px;height:68px;opacity:.65}',
    '.arc-winter header>.arc-winter-stars{inset:0;height:100%;opacity:.5}',
    '@media(max-width:600px){.arc-winter-sprig{width:92px;height:64px}.arc-winter .slide .scnt::before{font-size:10px;letter-spacing:.10em;margin-bottom:15px;gap:7px}.arc-winter header>.arc-winter-sprig{width:58px;height:40px;opacity:.5}}'
  ].join('\n');
  function add(parent, className, html) {
    var node = doc.createElement('div');
    node.className = className;
    node.setAttribute('data-arc-winter', '');
    node.setAttribute('aria-hidden', 'true');
    node.innerHTML = html;
    parent.appendChild(node);
    return node;
  }
  function decorate() {
    if (doc.querySelector('[data-arc-winter]')) return;
    var header = doc.querySelector('#topbar') || doc.querySelector('header');
    if (!header) return;
    style = doc.createElement('style');
    style.textContent = css;
    doc.head.appendChild(style);
    var svg = 'http://www.w3.org/2000/svg';
    var bulbs = '';
    for (var i = 0; i < 24; i++) {
      var x = 30 + i * 60;
      var y = 10 + Math.sin(i * Math.PI / 4) * 4;
      bulbs += '<path d="M' + x + ' 0v' + y + '" stroke="#5e6148"/><ellipse cx="' + x + '" cy="' + (y + 4) + '" rx="3" ry="4" fill="' + (i % 4 === 0 ? '#bb705b' : '#f4d696') + '"/><ellipse cx="' + x + '" cy="' + (y + 4) + '" rx="7" ry="8" fill="#e9bd71" opacity=".10"/>';
    }
    add(header, 'arc-winter-lights', '<svg xmlns="' + svg + '" viewBox="0 0 1440 30" preserveAspectRatio="xMidYMin slice"><path d="M0 1 Q180 14 360 1 T720 1 T1080 1 T1440 1" fill="none" stroke="#48523c"/>' + bulbs + '</svg>');
    add(header, 'arc-winter-snow', '');
    var needles = '';
    for (var j = 0; j < 12; j++) needles += '<path d="M' + (8 + j * 10) + ' ' + (8 + j * 4) + 'l3 19m0 -18l18 -3"/>';
    var sprig = '<svg xmlns="' + svg + '" viewBox="0 0 150 94" fill="none"><path d="M0 4L132 61" stroke="#7f7549" stroke-width="2"/><g stroke="#365a43" stroke-width="2">' + needles + '</g><g fill="#954b3f" stroke="#c18464" stroke-width=".5"><circle cx="41" cy="24" r="4"/><circle cx="48" cy="30" r="3.5"/><circle cx="40" cy="33" r="3"/></g><path d="M87 42l-7 10 11-3 5 9 1-14" stroke="#ba9760" stroke-width="1.5"/></svg>';
    var surface = doc.querySelector('#carousel-wrap') || header;
    add(surface, 'arc-winter-sprig left', sprig);
    add(surface, 'arc-winter-sprig right', sprig);
    add(surface, 'arc-winter-stars', '<svg xmlns="' + svg + '" viewBox="0 0 1440 185" preserveAspectRatio="xMidYMin slice"><g fill="#ead9b4"><path d="M132 34l2 7 7 2-7 2-2 7-2-7-7-2 7-2zM1273 48l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM1010 110l1 4 4 1-4 1-1 4-1-4-4-1 4-1z"/></g><g fill="#e3e9e3" opacity=".6"><circle cx="65" cy="92" r="1.5"/><circle cx="386" cy="32" r="1.5"/><circle cx="874" cy="70" r="1"/><circle cx="1181" cy="23" r="1.5"/><circle cx="1374" cy="125" r="1"/></g></svg>');
  }
  function refresh() {
    if (timer !== null) global.clearTimeout(timer);
    timer = null;
    var now = new Date();
    var active = preview || isSeason(now);
    doc.body.classList.toggle('arc-winter', active);
    if (active) decorate();
    else {
      doc.querySelectorAll('[data-arc-winter]').forEach(function (node) { node.remove(); });
      if (style) { style.remove(); style = null; }
    }
    if (!doc.hidden && !preview) timer = global.setTimeout(refresh, nextMidnightDelay(now));
  }
  global.ArcWinter.refresh = refresh;
  function init() {
    refresh();
    doc.addEventListener('visibilitychange', refresh);
    global.addEventListener('pageshow', refresh);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})(window);
