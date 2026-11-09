/* ════════════════════════════════════════════════════════════
   ARCAMIS — scripts/js/feedback.js

   Widget pubblico di feedback (vanilla, nessuna dipendenza).
   - trigger flottante + pannello modale con focus trap ed ESC
   - validazione client, contatore caratteri, stato di invio
   - successo con toast, errori con retry
   - coda offline in localStorage, svuotata al ritorno online

   Endpoint: POST /api/feedback (functions/api/feedback.js).
   Il testo dell'utente non passa mai da innerHTML.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__arcFeedbackReady) return;
  window.__arcFeedbackReady = true;

  var API = '/api/feedback';
  var STORAGE_KEY = 'arc_feedback_queue';
  var MAX_LEN = 1200;
  var MIN_LEN = 5;
  var MAX_QUEUE = 8;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var trigger, backdrop, panel, form, category, textarea, counter, email, honeypot;
  var errorBox, retryBtn, submitBtn, submitTxt, spinner, successBox, successMsg;
  var closeBtn, lastFocus, busy = false, hideTimer = null;

  var TEMPLATE =
    '<div class="arc-fb-head">' +
    '<h2 id="arc-fb-title" class="arc-fb-title">Invia un feedback</h2>' +
    '<button type="button" class="arc-fb-close" aria-label="Chiudi il modulo di feedback">✕</button>' +
    '</div>' +
    '<p id="arc-fb-desc" class="arc-fb-desc">Un bug, un’idea o un commento sulla wiki: scrivi qui sotto, non serve un account.</p>' +
    '<form class="arc-fb-form" novalidate>' +
    '<div class="arc-fb-field">' +
    '<label for="arc-fb-cat">Categoria</label>' +
    '<select id="arc-fb-cat" name="category" required>' +
    '<option value="bug">Bug — qualcosa non funziona</option>' +
    '<option value="feature">Idea — proposta o contenuto mancante</option>' +
    '<option value="ux">UI/UX — leggibilità e accessibilità</option>' +
    '<option value="general">Generale</option>' +
    '</select>' +
    '</div>' +
    '<div class="arc-fb-field">' +
    '<label for="arc-fb-msg">Messaggio</label>' +
    '<textarea id="arc-fb-msg" name="message" rows="5" maxlength="1200" required ' +
    'aria-describedby="arc-fb-count arc-fb-error" ' +
    'placeholder="Descrivi cosa è successo, dove e cosa ti aspettavi…"></textarea>' +
    '<div class="arc-fb-meta"><span id="arc-fb-count" class="arc-fb-count" aria-live="polite">0 / 1200</span></div>' +
    '</div>' +
    '<div class="arc-fb-field">' +
    '<label for="arc-fb-email">Email <span class="arc-fb-opt">(facoltativa)</span></label>' +
    '<input id="arc-fb-email" name="email" type="email" autocomplete="email" maxlength="120" ' +
    'inputmode="email" placeholder="Per essere ricontattato" ' +
    'aria-describedby="arc-fb-email-hint arc-fb-error">' +
    '<p id="arc-fb-email-hint" class="arc-fb-hint">La usiamo solo per risponderti su questo feedback.</p>' +
    '</div>' +
    '<div class="arc-fb-hp" aria-hidden="true">' +
    '<label for="arc-fb-web">Non compilare questo campo</label>' +
    '<input id="arc-fb-web" name="website" type="text" tabindex="-1" autocomplete="off">' +
    '</div>' +
    '<p id="arc-fb-error" class="arc-fb-error" role="alert" tabindex="-1" hidden></p>' +
    '<div class="arc-fb-actions">' +
    '<button type="submit" class="arc-fb-submit">' +
    '<span class="arc-fb-spinner" aria-hidden="true" hidden></span>' +
    '<span class="arc-fb-submit-txt">Invia feedback</span>' +
    '</button>' +
    '<button type="button" class="arc-fb-cancel">Annulla</button>' +
    '</div>' +
    '<button type="button" class="arc-fb-retry" hidden>Riprova l’invio</button>' +
    '</form>' +
    '<div class="arc-fb-success" hidden>' +
    '<div class="arc-fb-success-icon" aria-hidden="true">✓</div>' +
    '<p id="arc-fb-success-msg" class="arc-fb-success-msg" role="status" tabindex="-1">' +
    'Grazie per il tuo feedback!</p>' +
    '<p class="arc-fb-success-sub">Lo abbiamo ricevuto. Se hai lasciato un contatto ti risponderemo.</p>' +
    '<div class="arc-fb-actions">' +
    '<button type="button" class="arc-fb-again">Invia un altro</button>' +
    '<button type="button" class="arc-fb-cancel">Chiudi</button>' +
    '</div>' +
    '</div>';

  function build() {
    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = 'arc-fb-trigger';
    trigger.className = 'arc-fb-trigger';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', 'arc-fb-panel');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Apri il modulo di feedback');
    trigger.innerHTML =
      '<span class="arc-fb-trigger-icon" aria-hidden="true">💬</span>' +
      '<span class="arc-fb-trigger-label">Feedback</span>';

    backdrop = document.createElement('div');
    backdrop.className = 'arc-fb-backdrop';
    backdrop.hidden = true;

    panel = document.createElement('div');
    panel.id = 'arc-fb-panel';
    panel.className = 'arc-fb-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'arc-fb-title');
    panel.setAttribute('aria-describedby', 'arc-fb-desc');
    panel.hidden = true;
    panel.innerHTML = TEMPLATE;

    document.body.appendChild(trigger);
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    form = panel.querySelector('.arc-fb-form');
    category = panel.querySelector('#arc-fb-cat');
    textarea = panel.querySelector('#arc-fb-msg');
    counter = panel.querySelector('#arc-fb-count');
    email = panel.querySelector('#arc-fb-email');
    honeypot = panel.querySelector('#arc-fb-web');
    errorBox = panel.querySelector('#arc-fb-error');
    retryBtn = panel.querySelector('.arc-fb-retry');
    submitBtn = panel.querySelector('.arc-fb-submit');
    submitTxt = panel.querySelector('.arc-fb-submit-txt');
    spinner = panel.querySelector('.arc-fb-spinner');
    successBox = panel.querySelector('.arc-fb-success');
    successMsg = panel.querySelector('#arc-fb-success-msg');
    closeBtn = panel.querySelector('.arc-fb-close');

    trigger.addEventListener('click', function () {
      if (panel.hidden) open();
      else close();
    });
    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    Array.prototype.forEach.call(panel.querySelectorAll('.arc-fb-cancel'), function (btn) {
      btn.addEventListener('click', close);
    });
    panel.querySelector('.arc-fb-again').addEventListener('click', function () {
      successBox.hidden = true;
      form.hidden = false;
      clearError();
      textarea.focus();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submit();
    });
    retryBtn.addEventListener('click', submit);
    textarea.addEventListener('input', function () {
      updateCounter();
      if (!errorBox.hidden) clearError();
    });
    email.addEventListener('input', function () {
      if (!errorBox.hidden) clearError();
    });
    document.addEventListener('keydown', function (e) {
      if (panel.hidden) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'Tab') {
        trapFocus(e);
      }
    });
  }

  function focusables() {
    var nodes = panel.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), ' +
        'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    var list = [];
    Array.prototype.forEach.call(nodes, function (node) {
      if (node.hidden || node.closest('[hidden]')) return;
      list.push(node);
    });
    return list;
  }

  function trapFocus(e) {
    var list = focusables();
    if (!list.length) return;
    var first = list[0];
    var last = list[list.length - 1];
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  }

  function open() {
    clearTimeout(hideTimer);
    lastFocus = document.activeElement;
    backdrop.hidden = false;
    panel.hidden = false;
    void panel.offsetWidth;
    panel.classList.add('is-open');
    backdrop.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-label', 'Chiudi il modulo di feedback');
    document.body.classList.add('arc-fb-lock');
    window.setTimeout(function () {
      textarea.focus();
    }, 60);
  }

  function close() {
    if (!panel || panel.hidden) return;
    panel.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Apri il modulo di feedback');
    document.body.classList.remove('arc-fb-lock');
    hideTimer = window.setTimeout(function () {
      panel.hidden = true;
      backdrop.hidden = true;
    }, 180);
    if (lastFocus && document.contains(lastFocus) && typeof lastFocus.focus === 'function') {
      try {
        lastFocus.focus({ preventScroll: true });
      } catch (_err) {
        lastFocus.focus();
      }
    }
  }

  function updateCounter() {
    var len = textarea.value.length;
    counter.textContent = len + ' / ' + MAX_LEN;
    counter.classList.toggle('is-near', len > MAX_LEN * 0.9);
  }

  function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = '';
    retryBtn.hidden = true;
    textarea.removeAttribute('aria-invalid');
    email.removeAttribute('aria-invalid');
  }

  function showError(text, retryable) {
    errorBox.textContent = text;
    errorBox.hidden = false;
    retryBtn.hidden = !retryable;
    try {
      errorBox.focus();
    } catch (_err) {
      /* focus non disponibile */
    }
  }

  function validate() {
    var message = textarea.value.trim();
    if (message.length < MIN_LEN) {
      textarea.setAttribute('aria-invalid', 'true');
      showError('Scrivi almeno ' + MIN_LEN + ' caratteri per raccontarci cosa è successo.', false);
      textarea.focus();
      return false;
    }
    var mail = email.value.trim();
    if (mail && !EMAIL_RE.test(mail)) {
      email.setAttribute('aria-invalid', 'true');
      showError('L’indirizzo email non sembra valido: controllalo o lascia il campo vuoto.', false);
      email.focus();
      return false;
    }
    return true;
  }

  function buildPayload() {
    return {
      category: category.value,
      message: textarea.value.trim(),
      email: email.value.trim(),
      page: location.pathname,
      locale: navigator.language || '',
      website: honeypot.value,
    };
  }

  function post(payload) {
    if (!navigator.onLine) {
      return Promise.reject({ code: 'offline' });
    }
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = null;
    if (controller) {
      timer = setTimeout(function () {
        controller.abort();
      }, 12000);
    }
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined,
    })
      .then(function (res) {
        return res
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            if (!res.ok || !data.ok) {
              var err = new Error(data.error || 'request_failed');
              err.status = res.status;
              err.code = data.error || 'request_failed';
              if (res.status === 429) {
                err.friendly = 'Hai inviato troppi feedback in poco tempo. Riprova tra un’ora.';
              } else if (res.status === 503) {
                err.friendly = 'La raccolta feedback non è disponibile in questo momento. Riprova più tardi.';
              } else if (res.status === 400) {
                err.friendly = 'Il server ha rifiutato il contenuto: controlla categoria e messaggio.';
              } else {
                err.friendly = 'Invio non riuscito. Controlla la connessione e riprova.';
              }
              throw err;
            }
            return data;
          });
      })
      .then(
        function (data) {
          if (timer) clearTimeout(timer);
          return data;
        },
        function (err) {
          if (timer) clearTimeout(timer);
          throw err;
        }
      );
  }

  function setBusy(state) {
    busy = state;
    form.setAttribute('aria-busy', state ? 'true' : 'false');
    submitBtn.disabled = state;
    retryBtn.disabled = state;
    spinner.hidden = !state;
    submitTxt.textContent = state ? 'Invio…' : 'Invia feedback';
  }

  function showSuccess() {
    form.hidden = true;
    successBox.hidden = false;
    textarea.value = '';
    email.value = '';
    updateCounter();
    clearError();
    try {
      successMsg.focus();
    } catch (_err) {
      /* focus non disponibile */
    }
    if (typeof window.showToast === 'function') {
      window.showToast('Grazie per il tuo feedback!', '✅', 3200);
    }
  }

  function readQueue() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (_err) {
      return [];
    }
  }

  function writeQueue(list) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-MAX_QUEUE)));
      return true;
    } catch (_err) {
      return false;
    }
  }

  function queuePayload(payload) {
    var list = readQueue();
    payload.queuedAt = new Date().toISOString();
    list.push(payload);
    return writeQueue(list);
  }

  function flushQueue() {
    if (!navigator.onLine) return;
    var list = readQueue();
    if (!list.length) return;
    post(list[0])
      .then(function () {
        var rest = readQueue().slice(1);
        writeQueue(rest);
        if (typeof window.showToast === 'function') {
          window.showToast('Feedback in coda inviato', '✅', 2400);
        }
        if (rest.length) flushQueue();
      })
      .catch(function () {
        /* si riprova al prossimo evento online */
      });
  }

  function submit() {
    if (busy) return;
    clearError();
    if (!validate()) return;
    var payload = buildPayload();
    setBusy(true);
    post(payload)
      .then(function () {
        setBusy(false);
        showSuccess();
      })
      .catch(function (err) {
        setBusy(false);
        if (err && err.code === 'offline') {
          if (queuePayload(payload)) {
            showError(
              'Sei offline: il feedback è stato salvato sul dispositivo e partiremo appena torni online.',
              false
            );
          } else {
            showError('Sei offline e la memoria locale è piena: riprova quando torni online.', false);
          }
          return;
        }
        var friendly =
          (err && err.friendly) || 'Invio non riuscito. Controlla la connessione e riprova.';
        if (panel.hidden && typeof window.showToast === 'function') {
          window.showToast(friendly, '⚠️', 4200);
        }
        showError(friendly, true);
      });
  }

  function init() {
    if (!document.body) return;
    build();
    updateCounter();
    flushQueue();
    window.addEventListener('online', flushQueue);
    window.arcOpenFeedback = open;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
