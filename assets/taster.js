/* The Taster: five questions from the online game. */
(function () {
  'use strict';
  var Q = window.TQ || [], app = document.getElementById('app'), LET = ['A', 'B', 'C', 'D'];
  var n = 0, score = 0;
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') e.className = attrs[k]; else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'onclick') e.addEventListener('click', attrs[k]); else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function intro() {
    app.innerHTML = '';
    app.appendChild(h('h1', { text: 'Five questions. Two minutes. One phone.' }));
    app.appendChild(h('p', { class: 'lead', text: 'This is a taste of the online quiz game that comes with the book. Tap an answer to see if you are right, and the story behind it.' }));
    app.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn', text: 'Start the Taster', onclick: show })]));
  }
  function show() {
    var q = Q[n]; app.innerHTML = ''; window.scrollTo(0, 0);
    var fact = h('div', { class: 'fact hidden' });
    var next = h('button', { class: 'btn hidden', text: n + 1 < Q.length ? 'Next question' : 'See my score', onclick: function () { n += 1; if (n < Q.length) show(); else end(); } });
    var opts = q.o.map(function (t, i) {
      return h('button', { class: 'opt', onclick: function () {
        opts.forEach(function (b, j) { b.disabled = true; if (j === q.a) b.classList.add('right'); });
        if (i === q.a) score += 1; else this.classList.add('wrong');
        fact.textContent = (i === q.a ? 'Right! ' : 'Not this time. The answer is ' + q.o[q.a] + '. ') + (q.f || '');
        fact.classList.remove('hidden'); next.classList.remove('hidden'); next.focus();
      } }, [h('span', { class: 'L', text: LET[i] }), h('span', { text: t })]);
    });
    app.appendChild(h('div', { class: 'qhead' }, [h('span', { text: 'Question ' + (n + 1) + ' of ' + Q.length }), h('span', { class: 'cat', text: q.c })]));
    app.appendChild(h('div', { class: 'qtext', text: q.q }));
    app.appendChild(h('div', { class: 'opts' }, opts));
    app.appendChild(fact);
    app.appendChild(h('div', { class: 'row' }, [next]));
  }
  function end() {
    app.innerHTML = ''; window.scrollTo(0, 0);
    var msg = score === 5 ? 'Perfect! You really do know everything.' : score >= 3 ? 'Not bad at all. The full game will sort out the experts.' : 'A warm-up is a warm-up. The full game gives you plenty more chances.';
    app.appendChild(h('h1', { text: 'You scored' }));
    app.appendChild(h('div', { class: 'big-score', text: score + ' / 5' }));
    app.appendChild(h('p', { class: 'lead', text: msg }));
    app.appendChild(h('div', { class: 'note' }, [h('b', { text: 'Want the full game? ' }), 'It has ' + (window.QCOUNT || 'thousands of') + ' checked questions and four ways to play: Quiz Night on the Telly, Head to Head, Challenge a Mate and the Family League. You will find its code in the book, straight after Part 1.']));
    app.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn ghost', text: 'Play the Taster again', onclick: function () { n = 0; score = 0; show(); } })]));
  }
  intro();
})();
