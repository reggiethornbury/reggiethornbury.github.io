/* Quiz Night game: Telly, Head to Head, Challenge a Mate, Family League.
   No server, no sign-in. Results stay on this device. */
(function () {
  'use strict';
  var QB = window.QB || [];
  var BYID = {};
  QB.forEach(function (q) { BYID[q.id] = q; });
  var app = document.getElementById('app');
  var LET = ['A', 'B', 'C', 'D'];
  var timerId = null;
  var BADGE = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 9a3 3 0 1 1 4.2 2.7c-.8.4-1.2 1-1.2 1.8V14"/><circle cx="12" cy="18" r=".6" fill="#fff"/></svg>';

  /* ---------- helpers ---------- */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function clear() { stopTimer(); app.innerHTML = ''; document.body.className = ''; window.scrollTo(0, 0); }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage off: carry on */ } }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* Pick n questions, preferring ones this device has not seen yet. */
  function pick(n) {
    var seen = load('rt_seen', []);
    var fresh = QB.filter(function (q) { return seen.indexOf(q.id) < 0; });
    if (fresh.length < n) { seen = []; fresh = QB.slice(); }
    var out = shuffle(fresh).slice(0, n).map(function (q) { return q.id; });
    save('rt_seen', seen.concat(out));
    return out;
  }

  function header(title, back) {
    return h('div', { class: 'top' }, [h('div', { class: 'wrap' }, [
      (function () { var d = h('div', { class: 'badge', 'aria-hidden': 'true' }); d.innerHTML = BADGE; return d; })(),
      h('div', { class: 'brand' }, [title, h('small', { text: 'Quiz Night by Reggie Thornbury' })]),
      back ? h('button', { class: 'btn small ghost', style: 'margin-left:auto;color:#fff;border-color:#fff', onclick: home, text: 'Menu' }) : null
    ])]);
  }

  function optButtons(q, onPick, cls) {
    return q.o.map(function (txt, i) {
      return h('button', { class: 'opt' + (cls ? ' ' + cls : ''), 'data-i': i, onclick: function () { onPick(i, this); } },
        [h('span', { class: 'L', text: LET[i] }), h('span', { text: txt })]);
    });
  }

  /* ---------- Family League ---------- */
  function addToLeague(rows) {
    var lg = load('rt_league', {});
    rows.forEach(function (r) {
      var key = r.name.trim().slice(0, 24) || 'Player';
      var p = lg[key] || { games: 0, wins: 0, points: 0, best: 0 };
      p.games += 1; p.points += r.points; if (r.win) p.wins += 1; if (r.points > p.best) p.best = r.points;
      lg[key] = p;
    });
    save('rt_league', lg);
  }
  function saveButton(rows) {
    var b = h('button', { class: 'btn alt', text: 'Add to the Family League', onclick: function () {
      addToLeague(rows); b.disabled = true; b.textContent = 'Added to the Family League';
    } });
    return b;
  }

  function league() {
    clear();
    var lg = load('rt_league', {});
    var names = Object.keys(lg).sort(function (a, b) { return lg[b].points - lg[a].points || lg[b].wins - lg[a].wins; });
    var body;
    if (!names.length) {
      body = h('p', { class: 'note', text: 'The league is empty. Play any game, then tap "Add to the Family League" at the end.' });
    } else {
      body = h('table', { class: 'league' }, [
        h('thead', null, [h('tr', null, [h('th', { text: '#' }), h('th', { text: 'Player or team' }), h('th', { class: 'n', text: 'Games' }), h('th', { class: 'n', text: 'Wins' }), h('th', { class: 'n', text: 'Points' }), h('th', { class: 'n', text: 'Best' })])]),
        h('tbody', null, names.map(function (n, i) {
          var p = lg[n];
          return h('tr', null, [h('td', { text: String(i + 1) }), h('td', { text: n }), h('td', { class: 'n', text: String(p.games) }), h('td', { class: 'n', text: String(p.wins) }), h('td', { class: 'n', text: String(p.points) }), h('td', { class: 'n', text: String(p.best) })]);
        }))
      ]);
    }
    var clr = h('button', { class: 'btn ghost small', text: 'Clear the league' });
    clr.addEventListener('click', function () {
      if (clr.getAttribute('data-sure')) { save('rt_league', {}); league(); }
      else { clr.setAttribute('data-sure', '1'); clr.textContent = 'Tap again to clear everything'; }
    });
    app.appendChild(header('Family League', true));
    app.appendChild(h('div', { class: 'wrap' }, [
      h('h1', { text: 'Family League' }),
      h('p', { class: 'lead', text: 'Every result you add is kept on this device, so the table carries on from one quiz night to the next.' }),
      body,
      h('div', { class: 'row' }, [h('button', { class: 'btn', text: 'Back to the menu', onclick: home }), names.length ? clr : null])
    ]));
  }

  /* ---------- Home ---------- */
  function home() {
    clear();
    if (location.hash) history.replaceState(null, '', location.pathname);
    function card(t, d, label, fn) {
      return h('div', { class: 'card' }, [h('h3', { text: t }), h('p', { text: d }), h('button', { class: 'btn', text: label, onclick: fn })]);
    }
    app.appendChild(header('The Online Quiz Game', false));
    app.appendChild(h('div', { class: 'wrap' }, [
      h('h1', { text: 'Pick your game' }),
      h('p', { class: 'lead', text: QB.length + ' checked questions on sport, telly, music, London, science and geography. None of them are in the book.' }),
      h('div', { class: 'cards' }, [
        card('Quiz Night on the Telly', 'Open this on a laptop or a television. The screen hosts: big questions, a countdown clock, the scores and a podium for the winners.', 'Host a quiz night', tellySetup),
        card('Head to Head', 'Two players, one phone. Lay it flat between you. Each of you gets your own buttons, and the fastest right answer wins the point.', 'Play head to head', h2hSetup),
        card('Challenge a Mate', 'Play ten questions, then send the link. Your mate plays the same ten and you both see the scores side by side.', 'Start a challenge', function () { challengeSetup(null); }),
        card('Family League', 'A running table of everyone who has played on this device: games, wins and points.', 'See the league', league)
      ]),
      h('p', { class: 'foot', text: 'No app, no account and no sign-in. Scores and the league stay on this device only.' })
    ]));
  }

  /* ---------- Quiz Night on the Telly ---------- */
  function seg(values, labels, initial, onChange) {
    var cur = initial;
    var box = h('div', { class: 'seg', role: 'group' });
    values.forEach(function (v, i) {
      var b = h('button', { 'aria-pressed': String(v === cur), text: labels[i], onclick: function () {
        cur = v; Array.prototype.forEach.call(box.children, function (c) { c.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true'); onChange(v);
      } });
      box.appendChild(b);
    });
    return box;
  }

  function tellySetup() {
    clear();
    var cfg = { teams: 3, count: 10, secs: 30 };
    var names = load('rt_teams', ['Team 1', 'Team 2', 'Team 3', 'Team 4', 'Team 5', 'Team 6']);
    var inputs = h('div');
    function drawInputs() {
      inputs.innerHTML = '';
      for (var i = 0; i < cfg.teams; i++) {
        inputs.appendChild(h('div', { class: 'field' }, [
          h('label', { for: 'tn' + i, text: 'Team ' + (i + 1) + ' name' }),
          h('input', { type: 'text', id: 'tn' + i, maxlength: '24', value: names[i] || ('Team ' + (i + 1)) })
        ]));
      }
    }
    drawInputs();
    app.appendChild(header('Quiz Night on the Telly', true));
    app.appendChild(h('div', { class: 'wrap' }, [
      h('h1', { text: 'Set up your quiz night' }),
      h('p', { class: 'lead', text: 'The quizmaster runs the remote or the mouse. Teams shout or write their answers, then the quizmaster taps the teams who got it right.' }),
      h('div', { class: 'field' }, [h('label', { text: 'How many teams?' }), seg([2, 3, 4, 5, 6], ['2', '3', '4', '5', '6'], 3, function (v) { cfg.teams = v; drawInputs(); })]),
      inputs,
      h('div', { class: 'field' }, [h('label', { text: 'How many questions?' }), seg([10, 20, 30], ['10', '20', '30'], 10, function (v) { cfg.count = v; })]),
      h('div', { class: 'field' }, [h('label', { text: 'Countdown clock' }), seg([20, 30, 0], ['20 seconds', '30 seconds', 'Off'], 30, function (v) { cfg.secs = v; })]),
      h('div', { class: 'row' }, [h('button', { class: 'btn', text: 'Start the quiz', onclick: function () {
        var t = [];
        for (var i = 0; i < cfg.teams; i++) {
          var v = document.getElementById('tn' + i).value.trim() || ('Team ' + (i + 1));
          names[i] = v; t.push({ name: v, points: 0 });
        }
        save('rt_teams', names);
        tellyPlay({ teams: t, ids: pick(cfg.count), secs: cfg.secs, n: 0 });
      } })])
    ]));
  }

  function tellyPlay(st) {
    clear();
    document.body.className = 'telly';
    var q = BYID[st.ids[st.n]];
    var revealed = false, right = {};
    var wrap = h('div', { class: 'wrap' });
    var clock = h('span', { class: 'clock' });
    var bar = h('i');
    var opts = optButtons(q, function () { /* host does not pick on telly */ }, '');
    opts.forEach(function (b) { b.disabled = true; b.tabIndex = -1; });
    var factBox = h('div', { class: 'fact hidden' });
    var board = h('div', { class: 'board' });
    var revealBtn = h('button', { class: 'btn', text: 'Reveal the answer', onclick: reveal });
    var nextBtn = h('button', { class: 'btn hidden', text: st.n + 1 < st.ids.length ? 'Next question' : 'See the winners', onclick: next });
    var hint = h('p', { class: 'hidden', style: 'margin:14px 0 0;color:#c8d0dc;font-size:clamp(15px,1.6vw,24px)', text: 'Tap every team that got it right, then go to the next question.' });

    function drawBoard() {
      board.innerHTML = '';
      st.teams.forEach(function (t, i) {
        var el = revealed
          ? h('button', { class: 'team', 'aria-pressed': String(!!right[i]), onclick: function () { right[i] = !right[i]; drawBoard(); } }, [h('b', { text: t.name }), h('span', { class: 'pts', text: String(t.points + (right[i] ? 1 : 0)) })])
          : h('div', { class: 'team' }, [h('b', { text: t.name }), h('span', { class: 'pts', text: String(t.points) })]);
        board.appendChild(el);
      });
    }
    function reveal() {
      if (revealed) return;
      revealed = true; stopTimer();
      opts.forEach(function (b, i) { b.classList.add(i === q.a ? 'right' : 'dim'); });
      if (q.f) { factBox.textContent = q.f; factBox.classList.remove('hidden'); }
      revealBtn.classList.add('hidden'); nextBtn.classList.remove('hidden'); hint.classList.remove('hidden');
      drawBoard(); nextBtn.focus();
    }
    function next() {
      st.teams.forEach(function (t, i) { if (right[i]) t.points += 1; });
      st.n += 1;
      if (st.n < st.ids.length) tellyPlay(st); else tellyEnd(st);
    }

    wrap.appendChild(h('div', { class: 'qhead' }, [h('span', { text: 'Question ' + (st.n + 1) + ' of ' + st.ids.length }), h('span', { class: 'cat', text: q.c }), clock]));
    if (st.secs) wrap.appendChild(h('div', { class: 'timer' }, [bar]));
    wrap.appendChild(h('div', { class: 'qtext', text: q.q }));
    wrap.appendChild(h('div', { class: 'opts' }, opts));
    wrap.appendChild(factBox);
    wrap.appendChild(h('div', { class: 'row' }, [revealBtn, nextBtn, h('button', { class: 'btn ghost small', text: 'End the quiz', onclick: function () { tellyEnd(st); } })]));
    wrap.appendChild(hint);
    wrap.appendChild(board);
    app.appendChild(wrap);
    drawBoard();
    revealBtn.focus();
    if (st.secs) {
      var left = st.secs; clock.textContent = left;
      timerId = setInterval(function () {
        left -= 1; clock.textContent = Math.max(left, 0);
        bar.style.width = Math.max(0, left / st.secs * 100) + '%';
        if (left <= 0) reveal();
      }, 1000);
    }
  }

  function tellyEnd(st) {
    clear();
    document.body.className = 'telly';
    var ranked = st.teams.slice().sort(function (a, b) { return b.points - a.points; });
    var top = ranked[0] ? ranked[0].points : 0;
    var order = [ranked[1], ranked[0], ranked[2]];
    var cls = ['s2', 's1', 's3'], place = ['2nd', '1st', '3rd'];
    var pod = h('div', { class: 'podium' }, order.map(function (t, i) {
      if (!t) return null;
      return h('div', { class: 'step ' + cls[i] }, [h('div', { class: 'nm', text: t.name }), h('div', { class: 'sc', text: t.points + (t.points === 1 ? ' point' : ' points') }), h('div', { class: 'blk', text: place[i] })]);
    }));
    var winners = ranked.filter(function (t) { return t.points === top; }).map(function (t) { return t.name; });
    var rows = st.teams.map(function (t) { return { name: t.name, points: t.points, win: t.points === top && top > 0 }; });
    app.appendChild(h('div', { class: 'wrap' }, [
      h('h1', { style: 'text-align:center;color:#fff', text: winners.length > 1 ? 'It is a tie: ' + winners.join(' and ') : winners[0] + ' win the quiz!' }),
      pod,
      ranked.length > 3 ? h('p', { style: 'text-align:center;color:#c8d0dc', text: ranked.slice(3).map(function (t) { return t.name + ': ' + t.points; }).join('   ') }) : null,
      winners.length > 1 ? h('p', { style: 'text-align:center;color:#c8d0dc', text: 'Need a winner? Read a tie-breaker from the book.' }) : null,
      h('div', { class: 'row', style: 'justify-content:center' }, [saveButton(rows), h('button', { class: 'btn', text: 'Play again', onclick: function () {
        tellyPlay({ teams: st.teams.map(function (t) { return { name: t.name, points: 0 }; }), ids: pick(st.ids.length), secs: st.secs, n: 0 });
      } }), h('button', { class: 'btn ghost', text: 'Menu', onclick: home })])
    ]));
  }

  /* ---------- Head to Head ---------- */
  function h2hSetup() {
    clear();
    var nm = load('rt_h2h', ['Player 1', 'Player 2']);
    app.appendChild(header('Head to Head', true));
    app.appendChild(h('div', { class: 'wrap' }, [
      h('h1', { text: 'Head to Head' }),
      h('p', { class: 'lead', text: 'Lay the phone flat between you. The second player sits at the top, facing the other way. The first right answer scores. A wrong answer locks you out until the next question.' }),
      h('div', { class: 'field' }, [h('label', { for: 'p1', text: 'Player at the bottom' }), h('input', { type: 'text', id: 'p1', maxlength: '24', value: nm[0] })]),
      h('div', { class: 'field' }, [h('label', { for: 'p2', text: 'Player at the top' }), h('input', { type: 'text', id: 'p2', maxlength: '24', value: nm[1] })]),
      h('div', { class: 'row' }, [h('button', { class: 'btn', text: 'Start: 10 questions', onclick: function () {
        var a = document.getElementById('p1').value.trim() || 'Player 1', b = document.getElementById('p2').value.trim() || 'Player 2';
        save('rt_h2h', [a, b]);
        h2hPlay({ p: [{ name: a, points: 0 }, { name: b, points: 0 }], ids: pick(10), n: 0 });
      } })])
    ]));
  }

  function h2hPlay(st) {
    clear();
    document.body.className = 'h2h';
    var q = BYID[st.ids[st.n]];
    var done = false, locked = [false, false];
    var halves = [], allOpts = [];
    var factMini = h('span', { class: 'fact-mini', text: 'First right answer wins the point' });
    var nextBtn = h('button', { class: 'btn small hidden', text: st.n + 1 < st.ids.length ? 'Next' : 'Result', onclick: function () {
      st.n += 1; if (st.n < st.ids.length) h2hPlay(st); else h2hEnd(st);
    } });
    function finish(winner) {
      done = true;
      allOpts.forEach(function (list) { list.forEach(function (b, i) { b.disabled = true; if (i === q.a) b.classList.add('right'); }); });
      halves.forEach(function (hf, i) { hf.msg.textContent = winner === i ? 'Point to you!' : (winner === -1 ? 'Nobody got it' : 'Too slow!'); hf.sc.textContent = st.p[i].points; });
      factMini.textContent = q.o[q.a] + (q.f ? '. ' + q.f : '');
      nextBtn.classList.remove('hidden');
    }
    [0, 1].forEach(function (pi) {
      var msg = h('div', { class: 'msg' });
      var sc = h('span', { class: 'sc', text: String(st.p[pi].points) });
      var list = optButtons(q, function (i, btn) {
        if (done || locked[pi]) return;
        if (i === q.a) { st.p[pi].points += 1; finish(pi); }
        else {
          btn.classList.add('wrong'); locked[pi] = true; half.classList.add('locked'); msg.textContent = 'Wrong! Locked out.';
          if (locked[0] && locked[1]) finish(-1);
        }
      });
      allOpts.push(list);
      var half = h('div', { class: 'half ' + (pi === 0 ? 'p1' : 'p2') }, [
        h('div', { class: 'who' }, [h('span', { text: st.p[pi].name }), sc]),
        h('div', { class: 'hq', text: q.q }),
        h('div', { class: 'hopts' }, list),
        msg
      ]);
      halves.push({ el: half, msg: msg, sc: sc });
    });
    app.appendChild(h('div', { class: 'h2h-wrap' }, [
      halves[1].el,
      h('div', { class: 'midbar' }, [h('span', { text: (st.n + 1) + '/' + st.ids.length }), factMini, nextBtn, h('button', { class: 'btn small ghost', style: 'color:#fff;border-color:#fff', text: 'Quit', onclick: home })]),
      halves[0].el
    ]));
  }

  function h2hEnd(st) {
    clear();
    var a = st.p[0], b = st.p[1];
    var title = a.points === b.points ? 'It is a draw!' : (a.points > b.points ? a.name : b.name) + ' wins!';
    var rows = st.p.map(function (p, i) { return { name: p.name, points: p.points, win: p.points > st.p[1 - i].points }; });
    app.appendChild(header('Head to Head', true));
    app.appendChild(h('div', { class: 'wrap' }, [
      h('h1', { text: title }),
      h('div', { class: 'vs' }, [h('div', { class: 'p' }, [h('b', { text: a.name }), h('span', { class: 's', text: String(a.points) })]), h('div', { class: 'mid', text: 'v' }), h('div', { class: 'p' }, [h('b', { text: b.name }), h('span', { class: 's', text: String(b.points) })])]),
      h('div', { class: 'row' }, [saveButton(rows), h('button', { class: 'btn', text: 'Rematch', onclick: function () {
        h2hPlay({ p: [{ name: a.name, points: 0 }, { name: b.name, points: 0 }], ids: pick(10), n: 0 });
      } }), h('button', { class: 'btn ghost', text: 'Menu', onclick: home })])
    ]));
  }

  /* ---------- Challenge a Mate ---------- */
  function enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function dec(s) {
    try {
      s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
      var o = JSON.parse(decodeURIComponent(escape(atob(s))));
      if (!o || !Array.isArray(o.q) || !o.q.length || o.q.some(function (id) { return !BYID[id]; })) return null;
      return o;
    } catch (e) { return null; }
  }
  function linkFor(o) { return location.origin + location.pathname + '#c=' + enc(o); }

  function challengeSetup(incoming) {
    clear();
    var nm = load('rt_me', '');
    app.appendChild(header('Challenge a Mate', true));
    var kids = [];
    if (incoming) {
      kids.push(h('h1', { text: incoming.n + ' has challenged you!' }));
      kids.push(h('p', { class: 'lead', text: incoming.n + ' scored ' + incoming.s + ' out of ' + incoming.q.length + '. You get exactly the same ' + incoming.q.length + ' questions. Can you beat that?' }));
    } else {
      kids.push(h('h1', { text: 'Challenge a Mate' }));
      kids.push(h('p', { class: 'lead', text: 'Answer ten questions. At the end you get a link to send to anyone you like. They play the same ten, and you both see the scores side by side.' }));
    }
    kids.push(h('div', { class: 'field' }, [h('label', { for: 'me', text: 'Your name' }), h('input', { type: 'text', id: 'me', maxlength: '24', value: nm })]));
    kids.push(h('div', { class: 'row' }, [h('button', { class: 'btn', text: incoming ? 'Take the challenge' : 'Start: 10 questions', onclick: function () {
      var me = document.getElementById('me').value.trim() || 'Mystery player';
      save('rt_me', me);
      soloPlay({ name: me, ids: incoming ? incoming.q : pick(10), n: 0, score: 0, r: [], vs: incoming || null });
    } })]));
    app.appendChild(h('div', { class: 'wrap' }, kids));
  }

  function soloPlay(st) {
    clear();
    var q = BYID[st.ids[st.n]];
    var factBox = h('div', { class: 'fact hidden' });
    var nextBtn = h('button', { class: 'btn hidden', text: st.n + 1 < st.ids.length ? 'Next question' : 'See my score', onclick: function () {
      st.n += 1; if (st.n < st.ids.length) soloPlay(st); else challengeEnd(st);
    } });
    var opts = optButtons(q, function (i, btn) {
      opts.forEach(function (b, j) { b.disabled = true; if (j === q.a) b.classList.add('right'); });
      var ok = i === q.a;
      if (!ok) btn.classList.add('wrong'); else st.score += 1;
      st.r.push(ok ? 1 : 0);
      factBox.textContent = (ok ? 'Right! ' : 'Not this time. The answer is ' + q.o[q.a] + '. ') + (q.f || '');
      factBox.classList.remove('hidden'); nextBtn.classList.remove('hidden'); nextBtn.focus();
    });
    app.appendChild(header('Challenge a Mate', true));
    app.appendChild(h('div', { class: 'wrap' }, [
      h('div', { class: 'qhead' }, [h('span', { text: 'Question ' + (st.n + 1) + ' of ' + st.ids.length + '   Score: ' + st.score }), h('span', { class: 'cat', text: q.c })]),
      h('div', { class: 'qtext', text: q.q }),
      h('div', { class: 'opts' }, opts),
      factBox,
      h('div', { class: 'row' }, [nextBtn])
    ]));
  }

  function ticks(r) { return h('div', { class: 'ticks' }, r.map(function (x) { return h('i', { class: x ? 'y' : 'n', title: x ? 'right' : 'wrong' }); })); }

  function shareBlock(o, label) {
    var url = linkFor(o);
    var box = h('input', { type: 'text', class: 'share', readonly: true, value: url, 'aria-label': 'Challenge link' });
    var msg = h('span', { style: 'font-weight:700;color:var(--green)' });
    var shareBtn = h('button', { class: 'btn', text: label, onclick: function () {
      var text = o.n + ' scored ' + o.s + ' out of ' + o.q.length + ' on the Quiz Night game. Can you beat it?';
      if (navigator.share) { navigator.share({ title: 'Quiz Night challenge', text: text, url: url }).catch(function () {}); return; }
      copy();
    } });
    function copy() {
      box.select();
      var done = function () { msg.textContent = 'Link copied. Paste it into a message to your mate.'; };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { try { document.execCommand('copy'); done(); } catch (e) {} });
      else { try { document.execCommand('copy'); done(); } catch (e) {} }
    }
    return h('div', null, [h('div', { class: 'row' }, [shareBtn, h('button', { class: 'btn ghost', text: 'Copy link', onclick: copy })]), h('div', { class: 'row' }, [box]), msg]);
  }

  function challengeEnd(st) {
    clear();
    app.appendChild(header('Challenge a Mate', true));
    var kids = [];
    var rows = [{ name: st.name, points: st.score, win: false }];
    if (st.vs) {
      var o = st.vs, mine = st.score, theirs = o.s;
      rows[0].win = mine > theirs;
      kids.push(h('h1', { text: mine === theirs ? 'All square!' : (mine > theirs ? 'You beat ' + o.n + '!' : o.n + ' wins this one') }));
      kids.push(h('div', { class: 'vs' }, [
        h('div', { class: 'p' }, [h('b', { text: o.n }), h('span', { class: 's', text: String(theirs) }), o.r ? ticks(o.r) : null]),
        h('div', { class: 'mid', text: 'v' }),
        h('div', { class: 'p' }, [h('b', { text: st.name }), h('span', { class: 's', text: String(mine) }), ticks(st.r)])
      ]));
      if (!o.n2) {
        kids.push(h('h2', { text: 'Send your result back' }));
        kids.push(h('p', { text: 'This link shows ' + o.n + ' both scores side by side.' }));
        kids.push(shareBlock({ v: 1, n: o.n, s: o.s, r: o.r, q: o.q, n2: st.name, s2: mine, r2: st.r }, 'Send it back'));
      }
    } else {
      kids.push(h('h1', { text: 'You scored' }));
      kids.push(h('div', { class: 'big-score', text: st.score + ' / ' + st.ids.length }));
      kids.push(ticks(st.r));
      kids.push(h('h2', { text: 'Now challenge a mate' }));
      kids.push(h('p', { text: 'Send this link. Your mate gets the same ten questions in the same order.' }));
      kids.push(shareBlock({ v: 1, n: st.name, s: st.score, r: st.r, q: st.ids }, 'Send the challenge'));
    }
    kids.push(h('div', { class: 'row' }, [saveButton(rows), h('button', { class: 'btn ghost', text: 'Menu', onclick: home })]));
    app.appendChild(h('div', { class: 'wrap' }, kids));
  }

  function resultView(o) {
    clear();
    app.appendChild(header('Challenge a Mate', true));
    app.appendChild(h('div', { class: 'wrap' }, [
      h('h1', { text: o.s === o.s2 ? 'All square!' : (o.s > o.s2 ? o.n : o.n2) + ' wins the challenge' }),
      h('div', { class: 'vs' }, [
        h('div', { class: 'p' }, [h('b', { text: o.n }), h('span', { class: 's', text: String(o.s) }), o.r ? ticks(o.r) : null]),
        h('div', { class: 'mid', text: 'v' }),
        h('div', { class: 'p' }, [h('b', { text: o.n2 }), h('span', { class: 's', text: String(o.s2) }), o.r2 ? ticks(o.r2) : null])
      ]),
      h('div', { class: 'row' }, [h('button', { class: 'btn', text: 'Start a new challenge', onclick: challengeSetup.bind(null, null) }), h('button', { class: 'btn ghost', text: 'Menu', onclick: home })])
    ]));
  }

  /* ---------- start ---------- */
  function route() {
    var m = /[#&]c=([A-Za-z0-9_\-]+)/.exec(location.hash);
    if (m) {
      var o = dec(m[1]);
      if (o && o.n2 != null) return resultView(o);
      if (o) return challengeSetup(o);
    }
    home();
  }
  window.addEventListener('hashchange', route);
  route();
})();
