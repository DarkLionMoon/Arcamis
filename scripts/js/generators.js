/* ════════════════════════════════════
   ARCAMIS — generators.js
   Generatori random per il tavolo: nomi, taverne, bottini, incontri.
   Logica pura su window.ArcGenerators (testabile), renderer su
   window.initGenerators(root) per le pagine con layout `generatori`.
   (Classic script — variabili globali condivise)
════════════════════════════════════ */
(function () {
  'use strict';

  function pick(rnd, arr) {
    return arr[Math.floor(rnd() * arr.length)];
  }

  function d(rnd, sides) {
    return 1 + Math.floor(rnd() * sides);
  }

  var NOMI = {
    umano: {
      pre: ['Ald', 'Bel', 'Cor', 'Don', 'El', 'Fal', 'Gar', 'Had', 'Is', 'Jor', 'Kel', 'Lor', 'Mar', 'Nor', 'Os', 'Per', 'Quen', 'Rav', 'Sel', 'Tor'],
      mid: ['', '', 'a', 'e', 'ia', 'o'],
      end: ['ric', 'mond', 'gar', 'win', 'dred', 'mir', 'beth', 'lian', 'dor', 'wen', 'stan', 'fred']
    },
    elfo: {
      pre: ['Ael', 'Bel', 'Cele', 'Dae', 'Eol', 'Fael', 'Gal', 'Hel', 'Ith', 'Lae', 'Mae', 'Nae', 'Olo', 'Rae', 'Sae', 'Thael', 'Yael'],
      mid: ['a', 'e', 'i', '', 'o'],
      end: ['driel', 'las', 'mir', 'niel', 'riel', 'thas', 'viel', 'wen', 'dil', 'nor']
    },
    nano: {
      pre: ['Bal', 'Dain', 'Dor', 'Dval', 'Gim', 'Har', 'Kaz', 'Mor', 'Rur', 'Snor', 'Thor', 'Ul'],
      mid: ['', 'a', 'i', 'o'],
      end: ['in', 'li', 'grim', 'din', 'bek', 'rum', 'gar', 'nak']
    },
    halfling: {
      pre: ['Bil', 'Fos', 'Hob', 'Lot', 'Mer', 'Pip', 'Ros', 'Sam', 'Tob', 'Wil'],
      mid: ['', 'o', 'a'],
      end: ['bo', 'co', 'do', 'go', 'wise', 'foot', 'banks', 'son']
    }
  };

  var COGNOMI = ['Ferrofuso', 'Meddiapinta', 'Scudobuono', 'Lumacandela', 'Pietracava', 'Ventolesto', 'Corvonero', 'Manforte', 'Sangueblu', 'Roccagrigia', 'Boscofitto', 'Acquechiare'];

  var TAVERNE_A = ['Il Cinghiale', 'La Lanterna', 'Il Drago', 'La Botte', 'Il Grifone', 'La Volpe', 'Il Corvo', 'La Sirena', 'Il Tasso', 'La Quercia'];
  var TAVERNE_B = ['Ubriaco', 'Rampante', 'Dormiente', 'd’Oro', 'Spezzato', 'Sornione', 'Assetato', 'Ridanciano', 'Inchinato', 'Volante'];
  var OSTI = ['un ex avventuriero zoppo', 'una mezzelfa arcigna', 'un nano gioviale', 'due gemelli identici', 'una nonna halfling', 'un tiefling silenzioso'];
  var VOCI = [
    'si parla di sparizioni oltre il fiume',
    'qualcuno paga bene per mappe delle rovine',
    'la Guardia cerca volontari per la notte',
    'un mercante vende reliquie dubbie',
    'si dice che il pozzo canti quando piove',
    'un viandante non è mai ripartito'
  ];

  var LOOT = {
    comune: ['2d6 mo', 'un pugnale arrugginito', 'una corda di canapa', 'razioni per 3 giorni', 'un amuleto portafortuna', '1d10 mo e un anello di rame'],
    nonComune: ['una pozione di guarigione', 'un’arma d’argento', 'una pergamena di 1° livello', 'gioielli da 50 mo', 'un mantello mimetico logoro'],
    raro: ['un’arma +1', 'una Bacchetta dei Dardi Incantati', 'un Amuleto della Salute (falso?)', 'gemme da 200 mo', 'una mappa del tesoro parziale'],
    moltoRaro: ['un’armatura di mithral', 'una Spada del Furto di Vita', 'una Pietra Ioun incrinata', 'un desiderio minore in bottiglia']
  };

  var INCONTRI = {
    strada: ['banditi in agguato', 'un mercante derubato', 'lupi affamati', 'una pattuglia della Guardia', 'un carro ribaltato'],
    bosco: ['un treant addormentato', 'pixie dispettose', 'un orso guards', 'tracce di un branco di blink dog', 'spore allucinogene'],
    rovine: ['scheletri rianimati', 'una trappola a lame', 'un mimico affamato', 'glifi esplosivi', 'il diario di un esploratore morto'],
    citta: ['un borseggiatore fulmineo', 'una rissa tra marinai', 'un predicatore delirante', 'spie che si scambiano un messaggio', 'un incendio doloso']
  };

  var G = {
    dado: function (rnd, sides) {
      return d(rnd || Math.random, sides || 20);
    },
    nome: function (rnd, specie) {
      rnd = rnd || Math.random;
      var t = NOMI[specie] || NOMI.umano;
      var pre = pick(rnd, t.pre);
      var mid = pick(rnd, t.mid);
      var end = pick(rnd, t.end);
      return {
        nome: pre + mid + end,
        cognome: pick(rnd, COGNOMI),
        specie: specie || 'umano'
      };
    },
    taverna: function (rnd) {
      rnd = rnd || Math.random;
      return {
        nome: pick(rnd, TAVERNE_A) + ' ' + pick(rnd, TAVERNE_B),
        oste: pick(rnd, OSTI),
        voce: pick(rnd, VOCI)
      };
    },
    bottino: function (rnd, rarita) {
      rnd = rnd || Math.random;
      var t = LOOT[rarita] || LOOT.comune;
      return { rarita: rarita || 'comune', risultato: pick(rnd, t) };
    },
    incontro: function (rnd, ambiente) {
      rnd = rnd || Math.random;
      var t = INCONTRI[ambiente] || INCONTRI.strada;
      return { ambiente: ambiente || 'strada', risultato: pick(rnd, t), dado: d(rnd, 6) };
    }
  };

  window.ArcGenerators = G;

  /* ── Renderer pagina ── */
  var CARDS = [
    { id: 'nome', icon: '🧝', title: 'Nome PNG', desc: 'Nome e cognome per specie' },
    { id: 'taverna', icon: '🍺', title: 'Taverna', desc: 'Nome, oste e voce di corridoio' },
    { id: 'bottino', icon: '💰', title: 'Bottino', desc: 'Cosa si trova addosso ai nemici' },
    { id: 'incontro', icon: '⚔️', title: 'Incontro', desc: 'Eventi per ambiente' }
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.initGenerators = function (root) {
    if (!root || root._genInit) return;
    root._genInit = true;
    var html = '<div class="gen-grid">';
    CARDS.forEach(function (c) {
      html +=
        '<div class="gen-card" data-gen="' + c.id + '">' +
        '<div class="gen-card-head"><span class="gen-icon">' + c.icon + '</span><strong>' + esc(c.title) + '</strong></div>' +
        '<p class="gen-desc">' + esc(c.desc) + '</p>' +
        '<div class="gen-opts">' +
        (c.id === 'nome'
          ? '<select class="gen-in" data-opt="specie"><option value="umano">Umano</option><option value="elfo">Elfo</option><option value="nano">Nano</option><option value="halfling">Halfling</option></select>'
          : '') +
        (c.id === 'bottino'
          ? '<select class="gen-in" data-opt="rarita"><option value="comune">Comune</option><option value="nonComune">Non comune</option><option value="raro">Raro</option><option value="moltoRaro">Molto raro</option></select>'
          : '') +
        (c.id === 'incontro'
          ? '<select class="gen-in" data-opt="ambiente"><option value="strada">Strada</option><option value="bosco">Bosco</option><option value="rovine">Rovine</option><option value="citta">Città</option></select>'
          : '') +
        '<button class="gen-roll" type="button">🎲 Genera</button></div>' +
        '<div class="gen-out" aria-live="polite">Premi genera…</div>' +
        '</div>';
    });
    root.innerHTML = html + '</div>';
    root.querySelectorAll('.gen-card').forEach(function (card) {
      var kind = card.getAttribute('data-gen');
      var out = card.querySelector('.gen-out');
      card.querySelector('.gen-roll').addEventListener('click', function () {
        var opt = card.querySelector('.gen-in');
        var v = opt ? opt.value : null;
        var res;
        if (kind === 'nome') {
          var n = G.nome(Math.random, v);
          res = '<strong>' + esc(n.nome + ' ' + n.cognome) + '</strong>';
        } else if (kind === 'taverna') {
          var t = G.taverna(Math.random);
          res = '<strong>' + esc(t.nome) + '</strong><br>Oste: ' + esc(t.oste) + '<br><em>Voce:</em> ' + esc(t.voce);
        } else if (kind === 'bottino') {
          var l = G.bottino(Math.random, v);
          res = '<strong>' + esc(l.rarita) + '</strong>: ' + esc(l.risultato);
        } else {
          var e = G.incontro(Math.random, v);
          res = '<strong>' + esc(e.ambiente) + ' (d6: ' + e.dado + ')</strong><br>' + esc(e.risultato);
        }
        out.innerHTML = res;
      });
    });
  };
})();
