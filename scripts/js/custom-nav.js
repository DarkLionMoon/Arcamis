/* ════════════════════════════════════
   custom-nav.js
   Inietta nel menu del sito le pagine
   custom create dall'admin (entries di
   data.js con campo "sec") e crea i
   dropdown della top bar per le sezioni
   definite in data.js (var SECTIONS).
   ════════════════════════════════════ */
(function () {
  var SEC = {
    regole: { dd: 'dd-regole', mn: 'mn-sec-regole' },
    personaggio: { dd: 'dd-pg', mn: 'mn-sec-pg' },
    lavori: { dd: 'dd-lavori', mn: null },
    imprese: { dd: 'dd-imprese', mn: 'mn-sec-imprese' },
    lore: { dd: 'dd-lore', mn: 'mn-sec-lore' },
  };
  var DEF_SECTIONS = [
    { v: 'regole', l: 'Regole' },
    { v: 'personaggio', l: 'Personaggio' },
    { v: 'lavori', l: 'Lavori' },
    { v: 'imprese', l: 'Imprese' },
    { v: 'lore', l: 'Lore' },
  ];

  function _sections() {
    return typeof SECTIONS !== 'undefined' && Array.isArray(SECTIONS) && SECTIONS.length
      ? SECTIONS.filter(function (s) {
          return s && s.v;
        })
      : DEF_SECTIONS;
  }

  /* Icona dal registro: sprite se c'è la corrispondenza, emoji se no. */
  function _icon(value) {
    if (typeof window.arcIconFor === 'function') return window.arcIconFor(value) || value || '📄';
    return value || '📄';
  }

  function _customPages() {
    return typeof pages !== 'undefined'
      ? pages.filter(function (p) {
          return p.sec && p.id;
        })
      : [];
  }

  function _makeDesktop(menu, p) {
    if (menu.querySelector('.tn-item[data-cp="' + p.k + '"]')) return;
    var el = document.createElement('div');
    el.className = 'tn-item';
    el.dataset.cp = p.k;
    el.innerHTML = '<span class="tn-ii">' + _icon(p.i) + '</span>' + p.l;
    el.addEventListener('click', function () {
      closeDd();
      gp(p.id, p.l, p.i);
    });
    menu.appendChild(window._kbdActivate ? window._kbdActivate(el) : el);
  }

  function _makeMobile(section, p) {
    if (section.querySelector('.mn-item[data-cp="' + p.k + '"]')) return;
    var el = document.createElement('div');
    el.className = 'mn-item';
    el.dataset.cp = p.k;
    el.innerHTML = '<span class="mn-ii">' + _icon(p.i) + '</span>' + p.l;
    el.addEventListener('click', function () {
      closeMobileNav();
      gp(p.id, p.l, p.i);
    });
    section.appendChild(window._kbdActivate ? window._kbdActivate(el) : el);
  }

  /* Mappa id DOM dropdown/sezione mobile → sezione (v). */
  var DD_TO_V = {};
  var MN_TO_V = {};
  Object.keys(SEC).forEach(function (v) {
    if (SEC[v].dd) DD_TO_V[SEC[v].dd] = v;
    if (SEC[v].mn) MN_TO_V[SEC[v].mn] = v;
  });
  MN_TO_V['mn-section--lavori'] = 'lavori';

  /* Rimuove dal menu (top-bar, mobile, bottom-nav) gli elementi
     delle sezioni non più presenti in SECTIONS. */
  function _prune() {
    var active = {};
    _sections().forEach(function (s) {
      if (s && s.v) active[s.v] = 1;
    });

    document.querySelectorAll('#tnav .tn-drop').forEach(function (dd) {
      var v = DD_TO_V[dd.id] || (dd.id.indexOf('dd-') === 0 ? dd.id.slice(3) : null);
      if (v && !active[v]) dd.remove();
    });

    document.querySelectorAll('#mobile-nav .mn-section').forEach(function (ms) {
      var v = MN_TO_V[ms.id] || (ms.id.indexOf('mn-sec-') === 0 ? ms.id.slice(7) : null);
      if (!v && ms.classList.contains('mn-section--lavori')) v = 'lavori';
      if (v && !active[v]) ms.remove();
    });

    document.querySelectorAll('#bottom-nav .bnav-item').forEach(function (b) {
      var k = b.getAttribute('data-k');
      if (k && k.indexOf('slot-') === 0) return; /* renderizzate da UI_CONFIG */
      if (k && k !== 'home' && k !== 'esplora' && k !== 'opzioni' && !active[k]) b.remove();
    });
  }

  function _desktopSubHeader(menu, sub) {
    var sel = menu.querySelector('.tn-sub[data-sub="' + sub + '"]');
    if (sel) return sel;
    var el = document.createElement('div');
    el.className = 'tn-sub';
    el.dataset.sub = sub;
    el.textContent = sub;
    menu.appendChild(el);
    return el;
  }

  function _mobileSubHeader(section, sub) {
    var sel = section.querySelector('.mn-sub[data-sub="' + sub + '"]');
    if (sel) return sel;
    var el = document.createElement('div');
    el.className = 'mn-sub';
    el.dataset.sub = sub;
    el.textContent = sub;
    section.appendChild(el);
    return el;
  }

  /* Raggruppa le pagine per sezione e poi per sottosezione ('' = senza sub) */
  function _buildGroups(custom) {
    var groups = {};
    custom.forEach(function (p) {
      var sec = p.sec || '';
      if (!groups[sec]) groups[sec] = {};
      var sub = p.sub || '';
      (groups[sec][sub] = groups[sec][sub] || []).push(p);
    });
    return groups;
  }

  /* Il pannello è largo: se uscirebbe dalla finestra lo si aggancia
     al bordo destro della voce (misura fatta a pannello aperto). */
  function _alignMenu(dd) {
    var menu = dd.querySelector('.tn-menu');
    if (!menu) return;
    menu.classList.remove('align-right');
    var r = menu.getBoundingClientRect();
    if (r.right > window.innerWidth - 12) menu.classList.add('align-right');
  }

  /* Apertura al passaggio del mouse: la topbar è una barra di
     navigazione, non un menù a comparsa che richiede un click. */
  function _hoverBind(dd) {
    if (dd.__arcHover) return;
    dd.__arcHover = true;
    var openT = null;
    var closeT = null;
    dd.addEventListener('mouseenter', function () {
      clearTimeout(closeT);
      openT = setTimeout(function () {
        document.querySelectorAll('.tn-drop').forEach(function (other) {
          if (other === dd) return;
          other.classList.remove('open');
          var t = other.querySelector('.tn');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
        dd.classList.add('open');
        _alignMenu(dd);
        var trigger = dd.querySelector('.tn');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
      }, 70);
    });
    dd.addEventListener('mouseleave', function () {
      clearTimeout(openT);
      closeT = setTimeout(function () {
        dd.classList.remove('open');
        var trigger = dd.querySelector('.tn');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }, 140);
    });
    dd.addEventListener('focusin', function () {
      clearTimeout(closeT);
      dd.classList.add('open');
      _alignMenu(dd);
      var trigger = dd.querySelector('.tn');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
    });
    dd.addEventListener('focusout', function (e) {
      if (dd.contains(e.relatedTarget)) return;
      closeT = setTimeout(function () {
        dd.classList.remove('open');
        var trigger = dd.querySelector('.tn');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }, 140);
    });
  }

  function _ensureDesktopMenu(v, label) {
    var id = SEC[v] && SEC[v].dd ? SEC[v].dd : 'dd-' + v;
    var dd = document.getElementById(id);
    if (dd) {
      var existingTitle = dd.querySelector(':scope > .tn');
      if (existingTitle) existingTitle.textContent = label;
      var existingLabel = dd.querySelector('.tn-menu-label');
      if (existingLabel) existingLabel.textContent = label;
      _hoverBind(dd);
      return dd.querySelector('.tn-menu [data-links]') || dd.querySelector('.tn-menu');
    }
    var nav = document.getElementById('tnav');
    if (!nav) return null;
    dd = document.createElement('div');
    dd.className = 'tn-drop';
    dd.id = id;
    dd.setAttribute('role', 'menu');
    var title = document.createElement('div');
    title.className = 'tn';
    title.setAttribute('role', 'menuitem');
    title.setAttribute('aria-expanded', 'false');
    title.setAttribute('aria-haspopup', 'true');
    title.setAttribute('tabindex', '0');
    title.textContent = label;
    title.onclick = function (e) {
      toggleDd(id, e);
      _alignMenu(dd);
    };
    var menu = document.createElement('div');
    menu.className = 'tn-menu tn-mega';
    menu.innerHTML =
      '<div class="tn-mega-head">' +
      '<span class="tn-menu-label"></span>' +
      '<span class="tn-mega-count" data-count></span>' +
      '</div>' +
      '<div class="tn-mega-body">' +
      '<div class="tn-mega-links" data-links></div>' +
      '<a class="tn-mega-feature" data-feature hidden></a>' +
      '</div>';
    menu.querySelector('.tn-menu-label').textContent = label;
    dd.appendChild(title);
    dd.appendChild(menu);
    nav.appendChild(dd);
    _hoverBind(dd);
    return menu.querySelector('[data-links]');
  }

  /* Riempie testata e pannello in evidenza di un mega-menu:
     la scheda in evidenza è la prima pagina della sezione e usa la
     cover pubblica (/api/cover/<id>); se manca, resta il glifo. */
  function _decorate() {
    document.querySelectorAll('#tnav .tn-mega').forEach(function (menu) {
      var dd = menu.closest('.tn-drop');
      var links = menu.querySelector('[data-links]');
      var count = menu.querySelector('[data-count]');
      var feature = menu.querySelector('[data-feature]');
      if (!links || !feature || !dd) return;
      var items = links.querySelectorAll('.tn-item');
      if (count)
        count.textContent = items.length
          ? items.length + (items.length === 1 ? ' voce' : ' voci')
          : '';
      /* Poche voci: una colonna, pannello stretto. Con una sola voce
         la scheda in evidenza sarebbe un doppione. */
      menu.classList.toggle('is-sparse', items.length < 4);
      var first = null;
      var cps = links.querySelectorAll('.tn-item[data-cp]');
      for (var i = 0; i < cps.length && !first; i++) {
        var cp = cps[i].getAttribute('data-cp');
        first =
          typeof pages !== 'undefined'
            ? pages.find(function (p) {
                return p && p.k === cp;
              })
            : null;
      }
      /* Le schede del Pantheon sono subroute; la cover effettiva
         viene caricata dal padre da content/pages/<key>.json. */
      if (first && first.k === 'pantheon' && typeof _loadPantheonData === 'function') {
        _loadPantheonData('pantheon')
          .then(function (data) {
            var entity = data.deities && data.deities.find(function (d) { return d.entity && d.img; });
            if (!entity || feature.getAttribute('data-cp') !== first.k) return;
            var image = feature.querySelector('.tn-mega-feature-media img');
            if (!image) {
              image = document.createElement('img');
              image.alt = '';
              image.loading = 'lazy';
              image.decoding = 'async';
              image.onerror = function () { image.remove(); };
              feature.querySelector('.tn-mega-feature-media').appendChild(image);
            }
            image.src = entity.img.replace(/#.*$/, '');
            if (entity.pos) image.style.objectPosition = entity.pos[0] + '% ' + entity.pos[1] + '%';
          })
          .catch(function () {});
      }
      if (!first || items.length < 2) {
        feature.hidden = true;
        return;
      }
      feature.hidden = false;
      feature.setAttribute('data-cp', first.k);
      feature.setAttribute('href', '#');
      feature.innerHTML =
        '<span class="tn-mega-feature-media">' +
        '<span class="tn-mega-feature-glyph" aria-hidden="true">' +
        _icon(first.i) +
        '</span>' +
        (first.cover
          ? '<img src="' + _escH2(first.cover) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">'
          : '') +
        '</span>' +
        '<span class="tn-mega-feature-body">' +
        '<span class="tn-mega-feature-kicker">In evidenza</span>' +
        '<span class="tn-mega-feature-title">' +
        _escH2(first.l || '') +
        '</span>' +
        '<span class="tn-mega-feature-cta">Apri la scheda →</span>' +
        '</span>';
      feature.onclick = function (e) {
        e.preventDefault();
        closeDd();
        gp(first.id, first.l, first.i);
      };
      if (!feature.__arcKeys) {
        feature.__arcKeys = true;
        feature.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          feature.click();
        });
      }
    });
  }

  /* Le sezioni si riconoscono prima dall'id (mn-sec-*), poi dalla classe
     storica di SEC[v].mn: inject() può girare più di una volta (attesa dei
     dati), e cercare solo per classe duplicava le sezioni già create. */
  function _ensureMobileSection(v, label) {
    var drawer = document.getElementById('mobile-nav');
    if (!drawer) return null;
    var mnEl = document.getElementById('mn-sec-' + v);
    if (!mnEl && SEC[v] && SEC[v].mn) mnEl = drawer.querySelector('.' + SEC[v].mn);
    if (!mnEl && SEC[v] && !SEC[v].mn) mnEl = drawer.querySelector('.mn-section--lavori');
    if (mnEl) {
      var existingLabel = mnEl.querySelector('.mn-label');
      if (existingLabel) existingLabel.textContent = label;
      return mnEl;
    }
    mnEl = document.createElement('div');
    mnEl.className = 'mn-section';
    mnEl.id = 'mn-sec-' + v;
    var menuLabel = document.createElement('div');
    menuLabel.className = 'mn-label';
    menuLabel.textContent = label;
    mnEl.appendChild(menuLabel);
    var discord = drawer.querySelector('a.mn-discord');
    if (discord) drawer.insertBefore(mnEl, discord);
    else drawer.appendChild(mnEl);
    return mnEl;
  }

  /* Riordina i dropdown della top bar e le sezioni della mobile nav
     secondo l'ordine di SECTIONS. Mantiene Home (desktop) in testa e
     il link Discord in coda alla mobile nav. */
  function _reorder() {
    var nav = document.getElementById('tnav');
    if (nav) {
      var home = nav.querySelector('.tn.ta[data-v="home"]');
      var anchor = home || nav.firstChild;
      _sections().forEach(function (s) {
        if (!s || !s.v) return;
        var dd = document.getElementById(SEC[s.v] && SEC[s.v].dd ? SEC[s.v].dd : 'dd-' + s.v);
        if (!dd || dd.parentNode !== nav) return;
        nav.insertBefore(dd, anchor.nextSibling);
        anchor = dd;
      });
    }
    var drawer = document.getElementById('mobile-nav');
    if (drawer) {
      var first = drawer.querySelector('.mn-section');
      var anchor2 = first || drawer.firstChild;
      _sections().forEach(function (s) {
        if (!s || !s.v) return;
        var mnEl =
          document.getElementById('mn-sec-' + s.v) ||
          (SEC[s.v]
            ? SEC[s.v].mn
              ? document.querySelector('#mobile-nav .' + SEC[s.v].mn)
              : document.querySelector('#mobile-nav .mn-section--lavori')
            : null);
        if (!mnEl || mnEl.parentNode !== drawer) return;
        drawer.insertBefore(mnEl, anchor2.nextSibling);
        anchor2 = mnEl;
      });
    }
  }

  function inject() {
    _prune();
    var custom = _customPages();
    var sections = _sections();
    var groups = _buildGroups(custom);
    sections.forEach(function (s) {
      if (!s || !s.v) return;
      var sec = s.v;
      var subs = groups[sec] || {};
      var menu = _ensureDesktopMenu(sec, s.l || sec);
      var mnEl = _ensureMobileSection(sec, s.l || sec);
      if (!menu && !mnEl) return;
      var subKeys = Object.keys(subs).sort(function (a, b) {
        if (a === '') return -1;
        if (b === '') return 1;
        return 0;
      });
      var firstBlock = true;
      subKeys.forEach(function (sub) {
        var pages = subs[sub];
        if (!pages || !pages.length) return;
        if (firstBlock && menu && !menu.querySelector('.tn-item[data-cp]')) {
          var div = document.createElement('div');
          div.className = 'tn-div';
          div.dataset.cp = 'sep';
          menu.appendChild(div);
        }
        firstBlock = false;
        if (sub && menu) _desktopSubHeader(menu, sub);
        if (sub && mnEl) _mobileSubHeader(mnEl, sub);
        pages.forEach(function (p) {
          if (menu) _makeDesktop(menu, p);
          if (mnEl) _makeMobile(mnEl, p);
        });
      });
    });
    _reorder();
    _decorate();
  }

  /* ════ BOTTOM NAV da UI_CONFIG ════ */
  function _bnavAction(item, el) {
    var a = item.action || 'home';
    if (a === 'home') {
      el.addEventListener('click', function () {
        showHome();
        setBnavActive('slot-' + item.slot);
      });
    } else if (a === 'drawer') {
      el.setAttribute('aria-controls', 'mobile-nav');
      el.addEventListener('click', function () {
        toggleMobileNav();
        setBnavActive('slot-' + item.slot);
      });
    } else if (a === 'options') {
      el.addEventListener('click', function () {
        if (typeof _openOptionsPanel === 'function') _openOptionsPanel();
        setBnavActive('slot-' + item.slot);
      });
    } else if (a === 'page' && item.target) {
      var pg = typeof getPage === 'function' ? getPage(item.target) : null;
      el.addEventListener('click', function () {
        gp(pg ? pg.id : item.target, pg ? pg.l : item.label || '', pg ? pg.i : '📄');
        setBnavActive('slot-' + item.slot);
      });
    } else if (a === 'url' && item.target) {
      el.addEventListener('click', function () {
        window.open(item.target, '_blank', 'noopener');
      });
    } else {
      el.addEventListener('click', function () {
        showHome();
        setBnavActive('slot-' + item.slot);
      });
    }
  }
  function renderBottomNav() {
    var nav = document.getElementById('bottom-nav');
    if (!nav) return;
    var cfg =
      typeof UI_CONFIG !== 'undefined' && UI_CONFIG && Array.isArray(UI_CONFIG.bottomNav) ? UI_CONFIG.bottomNav : null;
    if (!cfg || !cfg.length) return; /* fallback: markup esistente */
    nav.innerHTML = '';
    nav.style.gridTemplateColumns = 'repeat(' + cfg.length + ',1fr)';
    cfg.forEach(function (item, i) {
      item.slot = i;
      var el = document.createElement('div');
      el.className = 'bnav-item' + (i === 0 ? ' active' : '');
      el.setAttribute('data-k', 'slot-' + i);
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.innerHTML =
        '<span>' + _icon(item.icon) + '</span>' + '<span class="bnav-label">' + _escH2(item.label || '') + '</span>';
      if (item.action === 'options') {
        var badge = document.createElement('div');
        badge.className = 'bnav-badge changelog-badge';
        el.appendChild(badge);
      }
      _bnavAction(item, el);
      nav.appendChild(el);
    });
  }
  function _escH2(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function init() {
    if (!document.getElementById('tnav') && !document.getElementById('mobile-nav')) return;
    renderBottomNav();
    inject();
    /* Ricerca drawer: on/off da config */
    if (typeof UI_CONFIG !== 'undefined' && UI_CONFIG && UI_CONFIG.drawerSearch === false) {
      var ms = document.querySelector('.mn-search');
      if (ms) ms.style.display = 'none';
    }
    if (document.getElementById('mobile-nav')) {
      var t = setInterval(function () {
        if (document.querySelector('#mobile-nav .mn-item')) {
          clearInterval(t);
          inject();
        }
      }, 250);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
