/* Shared by question.html and options.html: the price list and a small model of what a
   conversation is billed. index.html does not use this file; it has its own MODELS array,
   and the prices here must be kept equal to the ones there. */
(function (root) {
  "use strict";

  /* US dollars per million tokens, checked on 16 November 2026 (same figures as MODELS in index.html).
     write: input that is not in the cache yet. read: input read from the cache. out: output.
     tier: a request with more input tokens than this is billed at `mult` times the input rates
     and `omult` times the output rate. */
  var MODELS = {
    haiku:  { name: "Haiku 5.5",  write: 0.125, read: 0.01, out: 0.5, tier: 100000, mult: 5, omult: 5 },
    sonnet: { name: "Sonnet 5.5", write: 2.5,   read: 0.10, out: 10 },
    opus:   { name: "Opus 5.5",   write: 5,     read: 0.20, out: 20 },
    fable:  { name: "Fable 5.2",  write: 10,    read: 0.20, out: 40 }
  };

  var PAGE = 650;   /* tokens on one page of a document: about 500 words */

  /* A conversation is a list of turns. Each turn is one request: it adds `add` tokens of new input
     (your message, a document, the result of a tool) to everything said so far, and the model
     writes `out` tokens. `warm` says whether the cache left by the previous request is still alive.
     Every request sends the whole conversation again. With a warm cache the part that the previous
     request already sent is read from the cache; the rest (the previous answer and the new input)
     is written to it. With a cold cache all of it is written.
     Returns one object per request: t (position in time, 0 to 1), by ("you" or "agent"),
     and in tokens: add (the new input of this turn), input, read, write and out. */
  function requests(turns) {
    var ctx = 0, cached = 0;
    return turns.map(function (u) {
      var input = ctx + u.add;
      var read = u.warm ? cached : 0;
      var r = { t: u.t, by: u.by || "you", add: u.add, input: input, read: read, write: input - read, out: u.out };
      cached = input;
      ctx = input + u.out;
      return r;
    });
  }

  /* The bill for a list of requests, in dollars, split by rate. `batch` halves everything. */
  function bill(reqs, model, batch) {
    var m = MODELS[model || "sonnet"], b = { read: 0, write: 0, out: 0 };
    reqs.forEach(function (r) {
      var long = m.tier && r.input > m.tier;
      b.read += r.read * m.read * (long ? m.mult : 1) / 1e6;
      b.write += r.write * m.write * (long ? m.mult : 1) / 1e6;
      b.out += r.out * m.out * (long ? m.omult : 1) / 1e6;
    });
    if (batch) { b.read /= 2; b.write /= 2; b.out /= 2; }
    b.total = b.read + b.write + b.out;
    return b;
  }

  /* ---------- the scenarios ---------- */

  /* One question about a document of `pages` pages. */
  function doc(o) {
    o = o || {};
    var pages = o.pages === undefined ? 200 : o.pages;
    return requests([{ t: 0.5, add: pages * PAGE + 100, out: 400, warm: false }]);
  }

  /* A conversation of n messages. Each message is `user` tokens and each answer `answer` tokens.
     `first` is extra material sent with the first message, for example a document.
     `warm`: every message after the first finds the cache alive. `times`: positions 0 to 1.
     `vary`: a seed. With it the messages and answers differ in length, between about 0.3 and
     2.3 times the given size, and `user` and `answer` are their averages. The same seed always
     gives the same lengths. */
  function chat(o) {
    var user = o.user === undefined ? 150 : o.user, answer = o.answer === undefined ? 500 : o.answer;
    var fu = factors(o.n, o.vary), fa = factors(o.n, o.vary && o.vary + 1);
    var turns = [];
    for (var i = 0; i < o.n; i++) {
      turns.push({
        t: o.times ? o.times[i] : (i + 0.5) / o.n,
        add: Math.round(user * fu[i]) + (i === 0 ? (o.first || 0) : 0),
        out: Math.round(answer * fa[i]),
        warm: !!o.warm && i > 0
      });
    }
    return requests(turns);
  }
  /* n factors with an average of exactly 1: mostly below 1, a few well above, as message lengths are */
  function factors(n, seed) {
    var f = [], sum = 0, i;
    for (i = 0; i < n; i++) {
      if (!seed) { f.push(1); sum += 1; continue; }
      seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      var u = ((t ^ t >>> 14) >>> 0) / 4294967296;
      f.push(0.3 + 2 * u * u);
      sum += f[i];
    }
    return f.map(function (v) { return v * n / sum; });
  }

  /* One prompt to an agent. It starts with `base` tokens of instructions and tool descriptions plus
     your prompt, then calls a tool `steps` times. Each call is `act` tokens of output and brings
     back `result` tokens (a file, a log, a test run), which go into the next request. The steps
     are seconds apart, so the cache is warm throughout. */
  function agent(o) {
    o = o || {};
    var steps = o.steps === undefined ? 40 : o.steps;
    var base = 10000, prompt = 200, result = 3000, act = 250, fin = 600;
    var turns = [{ t: 0, by: "you", add: base + prompt, out: act, warm: false }];
    for (var i = 1; i <= steps; i++) {
      turns.push({ t: i / steps, by: "agent", add: result, out: i === steps ? fin : act, warm: true });
    }
    return requests(turns);
  }

  /* the four scenarios of question.html */
  /* the day of the month on which each of the 25 messages of scenario C is sent */
  var MONTH = [1, 1, 2, 4, 5, 5, 8, 9, 11, 12, 12, 15, 16, 16, 17, 19, 22, 23, 23, 24, 26, 29, 29, 30, 30];
  function monthTimes() {
    return MONTH.map(function (d, i) {
      var twice = MONTH[i - 1] === d || MONTH[i + 1] === d;
      return (d - 1 + (!twice ? 0.5 : MONTH[i - 1] === d ? 0.75 : 0.25)) / 30;
    });
  }
  /* B: one day, and no message finds the cache expired. C: one month, and every message does.
     The numbers of messages are chosen so that the bills rise from A to D. */
  var SCENARIOS = {
    doc:   function () { return doc(); },
    day:   function () { return chat({ n: 50, warm: true, vary: 11 }); },
    month: function () { return chat({ n: MONTH.length, warm: false, times: monthTimes(), vary: 23 }); },
    agent: function () { return agent(); }
  };

  /* ---------- helpers for the pages ---------- */
  var int = new Intl.NumberFormat("en-US");
  function dollars(v) {
    if (v >= 100) return "$" + int.format(Math.round(v));
    if (v >= 0.995) return "$" + v.toFixed(2);
    if (v >= 0.01) return "$" + v.toFixed(2);
    return "$" + v.toFixed(3);
  }
  function tokens(v) { return int.format(Math.round(v)); }
  /* a round number near v with two significant digits, for "up to 140,000 tokens" */
  function round2(v) { return parseFloat(v.toPrecision(2)); }

  root.AICost = {
    MODELS: MODELS, PAGE: PAGE, requests: requests, bill: bill,
    doc: doc, chat: chat, agent: agent, SCENARIOS: SCENARIOS,
    dollars: dollars, tokens: tokens, round2: round2
  };
})(typeof window !== "undefined" ? window : globalThis);
