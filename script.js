/* =========================================================
   Moavia SEO Pro — script.js
   1. Theme toggle (persisted)
   2. Sticky nav, mobile menu, smooth scroll, scrollspy
   3. Scroll reveal + animated counters + bar draw
   4. Services tabs (keyboard accessible)
   5. Pricing → contact prefill
   6. Contact form validation + success state
   7. "Moavia AI" assistant widget
   ========================================================= */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- safe storage ---------- */
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

  /* =======================================================
     1. THEME TOGGLE
     ======================================================= */
  var root = document.documentElement;
  var themeBtn = $('#themeToggle');

  function applyTheme(mode) {
    root.setAttribute('data-theme', mode);
    var light = mode === 'light';
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(light));
      themeBtn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? '#F4F6FC' : '#07080F');
  }

  /* Dark is the brand default. Only an explicit toggle switches it,
     so a visitor whose OS is set to light still lands on the dark site. */
  var saved = store.get('msp-theme');
  if (saved === 'light' || saved === 'dark') applyTheme(saved);

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      store.set('msp-theme', next);
    });
  }

  /* =======================================================
     2. NAV: sticky, mobile menu, smooth scroll, scrollspy
     ======================================================= */
  var nav = $('#nav');
  var navLinks = $('#navLinks');
  var burger = $('#navBurger');

  function onScroll() {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 12);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function closeMenu() {
    if (!navLinks) return;
    navLinks.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }

  if (burger) {
    burger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  document.addEventListener('click', function (e) {
    if (!navLinks || !navLinks.classList.contains('is-open')) return;
    if (navLinks.contains(e.target) || (burger && burger.contains(e.target))) return;
    closeMenu();
  });

  /* smooth scroll for every in-page link */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      var top = target.getBoundingClientRect().top + window.scrollY - (nav ? nav.offsetHeight + 14 : 0);
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (link.hasAttribute('data-chat-close')) closeChat();
      history.replaceState(null, '', id);
    });
  });

  /* scrollspy — highlight the section currently in view */
  var spyTargets = $$('.nav__links a').map(function (a) {
    return { link: a, sec: document.querySelector(a.getAttribute('href')) };
  }).filter(function (o) { return o.sec; });

  if ('IntersectionObserver' in window && spyTargets.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        spyTargets.forEach(function (o) { o.link.classList.toggle('is-current', o.sec === en.target); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyTargets.forEach(function (o) { spy.observe(o.sec); });
  }

  /* =======================================================
     3. REVEAL + COUNTERS + BAR DRAW
     ======================================================= */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target) || el.dataset.done === '1') return;
    el.dataset.done = '1';
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = prefix + target + suffix; return; }

    var start = performance.now();
    var dur = 1400;
    function frame(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        $$('[data-count]', en.target).forEach(countUp);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    $$('[data-count]').forEach(countUp);
  }

  /* hero animates on load rather than on scroll */
  window.addEventListener('load', function () {
    var console_ = $('.console');
    if (console_) console_.classList.add('is-drawn');
    setTimeout(function () { $$('.hero [data-count]').forEach(countUp); }, 260);
  });

  /* =======================================================
     4. SERVICES TABS
     ======================================================= */
  var tabs = $$('.tab');
  var panels = $$('.panel');

  function selectTab(i) {
    tabs.forEach(function (t, n) {
      var on = n === i;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p, n) {
      var on = n === i;
      p.classList.toggle('is-active', on);
      p.hidden = !on;
    });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(i); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      selectTab(next);
      tabs[next].focus();
    });
  });

  /* =======================================================
     5. PRICING → CONTACT PREFILL
     ======================================================= */
  $$('[data-plan]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var plan = btn.getAttribute('data-plan');
      var msg = $('#f-msg');
      if (msg && !msg.value.trim()) {
        msg.value = "I'd like to start with the " + plan + " plan. Here's my situation: ";
      }
    });
  });

  /* =======================================================
     6. CONTACT FORM
     ======================================================= */
  var form = $('#contactForm');
  var done = $('#formDone');
  var doneMsg = $('#formDoneMsg');
  var submitBtn = $('#formSubmit');
  var resetBtn = $('#formReset');

  var RULES = {
    'f-name':    function (v) { return v.trim().length >= 2 ? '' : 'Add your name so I know who I\'m replying to.'; },
    'f-email':   function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()) ? '' : 'That email doesn\'t look right — check for a typo.'; },
    'f-service': function (v) { return v ? '' : 'Pick a service, or choose "Not sure yet".'; },
    'f-budget':  function (v) { return v ? '' : 'Pick a budget range so I can scope it properly.'; },
    'f-msg':     function (v) { return v.trim().length >= 12 ? '' : 'A sentence or two about the problem is plenty.'; }
  };

  function validateField(id) {
    var input = document.getElementById(id);
    if (!input || !RULES[id]) return true;
    var wrap = input.closest('.field');
    var err = $('[data-err-for="' + id + '"]');
    var message = RULES[id](input.value);
    if (wrap) wrap.classList.toggle('is-bad', !!message);
    if (err) err.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }

  Object.keys(RULES).forEach(function (id) {
    var input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('blur', function () { validateField(id); });
    input.addEventListener('input', function () {
      var wrap = input.closest('.field');
      if (wrap && wrap.classList.contains('is-bad')) validateField(id);
    });
  });

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var firstBad = null;
      Object.keys(RULES).forEach(function (id) {
        var valid = validateField(id);
        if (!valid && !firstBad) firstBad = document.getElementById(id);
        ok = ok && valid;
      });

      if (!ok) { if (firstBad) firstBad.focus(); return; }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      /* Front-end simulation. Wire this to Formspree, WP REST or your own
         endpoint when you deploy — replace the setTimeout with a fetch(). */
      setTimeout(function () {
        var name = ($('#f-name').value || '').trim().split(' ')[0];
        if (doneMsg) {
          doneMsg.textContent = 'Thanks' + (name ? ', ' + name : '') +
            ' — I\'ve got it. Expect a reply at ' + $('#f-email').value.trim() + ' within one business day.';
        }
        done.hidden = false;
        done.setAttribute('role', 'status');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send enquiry';
      }, 900);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      form.reset();
      done.hidden = true;
      $$('.field').forEach(function (f) { f.classList.remove('is-bad'); });
      $('#f-name').focus();
    });
  }

  /* =======================================================
     7. "MOAVIA AI" ASSISTANT
     ======================================================= */
  var chat = $('#chat');
  var chatPanel = $('#chatPanel');
  var chatLaunch = $('#chatLaunch');
  var chatClose = $('#chatClose');
  var chatLog = $('#chatLog');
  var chatForm = $('#chatForm');
  var chatInput = $('#chatInput');
  var chatChips = $('#chatChips');
  var started = false;

  var KB = [
    {
      id: 'greet',
      keys: ['hi', 'hello', 'hey', 'salam', 'assalam', 'good morning', 'good evening', 'yo'],
      reply: "Hey — I'm Moavia AI, the assistant for Moavia SEO Pro. I can explain any of the four services, walk you through pricing, or help you work out which one you actually need. What's on your mind?",
      chips: ['Which service do I need?', 'How much does it cost?', 'What is AEO?']
    },
    {
      id: 'choose',
      keys: ['which service', 'what do i need', 'not sure', 'help me choose', 'recommend', 'where do i start', 'best for me', 'unsure'],
      reply: "Easiest way to narrow it down — which of these sounds most like you right now?<ul><li><strong>Phone isn't ringing at all</strong> → AI-integrated SEO plus Google Ads</li><li><strong>Leads come in but cost too much</strong> → Google Ads rebuild</li><li><strong>Need volume fast in a local area</strong> → Meta Ads lead campaigns</li><li><strong>Traffic arrives but nobody converts</strong> → WordPress rebuild first</li></ul>Tell me which line fits and I'll go deeper.",
      chips: ['Phone isn\'t ringing', 'Leads cost too much', 'Nobody converts']
    },
    {
      id: 'seo',
      keys: ['seo', 'rank', 'ranking', 'organic', 'google search', 'keywords', 'backlink', 'search engine'],
      reply: "AI-integrated SEO covers four things: <strong>Answer Engine Optimization</strong> (getting quoted in AI Overviews), <strong>Generative Engine Optimization</strong> (showing up inside ChatGPT, Gemini and Perplexity answers), <strong>technical SEO</strong>, and <strong>semantic content strategy</strong>.<ul><li>Typical first movement: 60–90 days</li><li>Included from the Launch plan, $497/month</li></ul>",
      chips: ['What is AEO?', 'How long until results?', 'See pricing']
    },
    {
      id: 'aeo',
      keys: ['aeo', 'answer engine', 'geo', 'generative engine', 'ai overview', 'chatgpt', 'perplexity', 'gemini', 'llm', 'ai search'],
      reply: "AEO and GEO are about being the <strong>source an AI quotes</strong>, not just a link on page one. In practice that means entity and schema markup, content written as clear answers to real questions, and citations from places the models actually crawl. Then I track which prompts surface your business and report on it monthly.",
      chips: ['Does that replace SEO?', 'See pricing', 'Book a call']
    },
    {
      id: 'gads',
      keys: ['google ads', 'adwords', 'ppc', 'search ads', 'performance max', 'pmax', 'shopping', 'display'],
      reply: "Google Ads work covers Search, Display, Shopping and Performance Max. Most accounts I take over are leaking 30–50% of spend on broad match and missing negatives, so the first two weeks are usually cleanup plus proper conversion tracking.<ul><li>Management from $997/month on Growth</li><li>Ad budget is paid straight to Google and stays yours</li><li>You own the account — always</li></ul>",
      chips: ['What budget do I need?', 'Meta Ads instead?', 'Book a call']
    },
    {
      id: 'meta',
      keys: ['meta', 'facebook', 'instagram', 'fb ads', 'social ads', 'retarget', 'creative'],
      reply: "AI-powered Meta Ads cover lead generation campaigns, e-commerce scale campaigns, retargeting funnels and creative strategy. For trades, jobsite footage from your crew's phone consistently beats polished stock — I generate the hooks and angles with AI, you shoot 20 seconds of the work.<ul><li>Fresh creative batch every two weeks</li><li>Reported as cost per booked job, not cost per click</li></ul>",
      chips: ['What budget do I need?', 'Google Ads instead?', 'See pricing']
    },
    {
      id: 'wp',
      keys: ['wordpress', 'website', 'web design', 'elementor', 'plugin', 'theme', 'speed', 'core web vitals', 'page speed', 'hosting', 'maintenance'],
      reply: "WordPress work runs from custom theme and plugin development through Elementor Pro design, speed and Core Web Vitals optimisation, and ongoing maintenance.<ul><li>One-off builds start at $850</li><li>Maintenance is included from the Growth plan</li><li>Target: mobile LCP under 2.5s, every time</li></ul>",
      chips: ['How long does a build take?', 'See pricing', 'Book a call']
    },
    {
      id: 'price',
      keys: ['price', 'pricing', 'cost', 'how much', 'budget', 'package', 'plan', 'rate', 'fee', 'charge', 'afford'],
      reply: "Three flat monthly retainers, no percentage of ad spend:<ul><li><strong>Launch — $497/mo</strong>: SEO for one service area</li><li><strong>Growth — $997/mo</strong>: SEO plus Google or Meta Ads, most clients start here</li><li><strong>Scale — $1,997/mo</strong>: both ad platforms, custom development, weekly reporting</li></ul>Month to month after the first 90 days. One-off WordPress builds start at $850.",
      chips: ['What\'s in Growth?', 'Which one fits me?', 'Book a call']
    },
    {
      id: 'growth',
      keys: ['growth plan', 'what\'s in growth', 'whats in growth', 'mid tier', 'middle plan', 'most popular'],
      reply: "Growth at $997/month includes everything in Launch across multiple locations, plus Google Ads <em>or</em> Meta Ads management, AEO and GEO work, landing pages built and tested, a creative batch every two weeks, and WordPress maintenance. It's the tier most trade businesses land on.",
      chips: ['See all plans', 'Book a call']
    },
    {
      id: 'timeline',
      keys: ['how long', 'timeline', 'when will', 'how soon', 'results take', 'turnaround', 'fast'],
      reply: "Rough timelines from experience:<ul><li><strong>Ads</strong>: live in 7–10 days, meaningful data by week 3</li><li><strong>WordPress build</strong>: 3–6 weeks depending on page count</li><li><strong>SEO</strong>: first movement 60–90 days, compounding after month 4</li></ul>Anyone promising page one in 30 days is selling you something.",
      chips: ['See pricing', 'Book a call']
    },
    {
      id: 'guarantee',
      keys: ['guarantee', 'contract', 'lock in', 'cancel', 'refund', 'risk', 'commitment'],
      reply: "No rankings guarantee — nobody can honestly offer one. What you do get: a 90-day initial term, then month to month; full ownership of every account and asset; and audit findings you keep whether or not we continue.",
      chips: ['See pricing', 'Book a call']
    },
    {
      id: 'about',
      keys: ['who are you', 'about', 'moavia', 'experience', 'team', 'agency', 'certified', 'certification', 'years'],
      reply: "Moavia SEO Pro is Moavia Hassan — a solo specialist based in Islamabad, working US and European hours. UC Davis SEO certified, shipping client work daily on Fiverr and Upwork, focused on small trade and home-service businesses. No account managers in between: the person who audits your account is the one who builds it.",
      chips: ['Where are you based?', 'See portfolio', 'Book a call']
    },
    {
      id: 'location',
      keys: ['where', 'based', 'located', 'country', 'timezone', 'time zone', 'hours', 'pakistan', 'remote'],
      reply: "Based in Islamabad, Pakistan, working US and European hours. Calls run on Zoom or Google Meet, and weekday replies land within 24 hours.",
      chips: ['Book a call', 'See pricing']
    },
    {
      id: 'industry',
      keys: ['roof', 'hvac', 'plumb', 'construction', 'contractor', 'remodel', 'landscap', 'electrician', 'trade', 'home service', 'my industry', 'work with'],
      reply: "That's exactly the niche — roofing, HVAC, plumbing, remodeling, landscaping and general contracting, mostly teams of one to ten across the US and Europe. Local intent, seasonal demand and service-area pages behave very differently from generic SEO, and that's what the playbook is built around.",
      chips: ['See portfolio', 'Which service do I need?', 'Book a call']
    },
    {
      id: 'results',
      keys: ['portfolio', 'case study', 'results', 'proof', 'example', 'client', 'testimonial', 'work'],
      reply: "Scroll to the portfolio section for three engagements: a Texas roofer (+212% organic leads), an HVAC company in Manchester (4.8× ROAS), and a Dublin remodeler (mobile load 4.8s → 1.1s). Happy to walk through the exact approach on a call.",
      chips: ['Book a call', 'See pricing']
    },
    {
      id: 'contact',
      keys: ['contact', 'call', 'book', 'consult', 'talk', 'email', 'phone', 'whatsapp', 'reach', 'hire', 'get started', 'start'],
      reply: "Easiest route: the enquiry form below — it takes about a minute and you'll get a reply within one business day. Direct lines work too: <a href=\"mailto:moavia400@gmail.com\">moavia400@gmail.com</a> or <a href=\"tel:+923234313869\">+92 323 4313869</a>. You'll also find me on Fiverr and Upwork as moavia_seopro.",
      chips: ['Open the form', 'See pricing']
    },
    {
      id: 'thanks',
      keys: ['thanks', 'thank you', 'cheers', 'appreciate', 'great', 'perfect', 'awesome'],
      reply: "Anytime. If you want a real answer on your specific situation, send the form below — Moavia replies personally, usually the same day.",
      chips: ['Open the form']
    }
  ];

  var FALLBACK = {
    reply: "I don't have a scripted answer for that one — I'm a simple assistant, not the real thing. Moavia will though. Send the enquiry form below, or ask me about services, pricing, timelines or how the work runs.",
    chips: ['See pricing', 'Which service do I need?', 'Book a call']
  };

  /* Chip labels that should also move the page to the matching section. */
  var JUMPS = {
    'open the form': '#contact',
    'book a call': '#contact',
    'see pricing': '#pricing',
    'see all plans': '#pricing',
    'see portfolio': '#portfolio'
  };

  function match(text) {
    var q = ' ' + text.toLowerCase().replace(/[^\w\s']/g, ' ').replace(/\s+/g, ' ') + ' ';
    var best = null, bestScore = 0;

    KB.forEach(function (entry) {
      var score = 0;
      entry.keys.forEach(function (k) {
        if (q.indexOf(k) !== -1) score += k.length; /* longer match = stronger signal */
      });
      if (score > bestScore) { bestScore = score; best = entry; }
    });

    return bestScore > 0 ? best : null;
  }

  function bubble(html, who) {
    var el = document.createElement('div');
    el.className = 'msg msg--' + who;
    el.innerHTML = html;
    chatLog.appendChild(el);
    chatLog.scrollTop = chatLog.scrollHeight;
    return el;
  }

  function setChips(list) {
    chatChips.innerHTML = '';
    (list || []).forEach(function (label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = label;
      b.addEventListener('click', function () { send(label); });
      chatChips.appendChild(b);
    });
  }

  function typing() {
    var el = document.createElement('div');
    el.className = 'msg msg--bot typing';
    el.innerHTML = '<i></i><i></i><i></i>';
    chatLog.appendChild(el);
    chatLog.scrollTop = chatLog.scrollHeight;
    return el;
  }

  function respond(text) {
    var dots = typing();
    var wait = reduceMotion ? 120 : 480 + Math.random() * 420;

    setTimeout(function () {
      dots.remove();
      var hit = match(text);
      var answer = hit || FALLBACK;
      bubble(answer.reply, 'bot');
      setChips(answer.chips);

      /* Only move the page when the visitor asked to be taken somewhere. */
      var lower = text.toLowerCase();
      var jump = null;
      Object.keys(JUMPS).forEach(function (phrase) {
        if (lower.indexOf(phrase) !== -1) jump = JUMPS[phrase];
      });

      if (jump) {
        var target = document.querySelector(jump);
        if (target) {
          setTimeout(function () {
            var top = target.getBoundingClientRect().top + window.scrollY - (nav ? nav.offsetHeight + 14 : 0);
            window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
          }, 600);
        }
      }
    }, wait);
  }

  function send(text) {
    var clean = (text || '').trim();
    if (!clean) return;
    bubble(clean.replace(/</g, '&lt;'), 'me');
    setChips([]);
    respond(clean);
  }

  function openChat() {
    chat.classList.add('is-open');
    chatPanel.hidden = false;
    chatLaunch.setAttribute('aria-expanded', 'true');

    if (!started) {
      started = true;
      setTimeout(function () {
        bubble("Hi — I'm <strong>Moavia AI</strong>. I can explain the services, break down pricing, or help you figure out which one your business actually needs.", 'bot');
        setChips(['Which service do I need?', 'How much does it cost?', 'Book a call']);
      }, 260);
    }
    setTimeout(function () { chatInput.focus(); }, 320);
  }

  function closeChat() {
    if (!chat) return;
    chat.classList.remove('is-open');
    chatPanel.hidden = true;
    chatLaunch.setAttribute('aria-expanded', 'false');
  }

  if (chatLaunch) {
    chatLaunch.addEventListener('click', function () {
      chat.classList.contains('is-open') ? closeChat() : openChat();
    });
  }
  if (chatClose) chatClose.addEventListener('click', function () { closeChat(); chatLaunch.focus(); });

  if (chatForm) {
    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      send(chatInput.value);
      chatInput.value = '';
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (chat && chat.classList.contains('is-open')) { closeChat(); chatLaunch.focus(); }
    closeMenu();
  });

  /* =======================================================
     MISC
     ======================================================= */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
