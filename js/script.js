(() => {
  const bank = (
    "about above across after again almost along already also always " +
    "among another answer any around ask away back become before " +
    "began being below between both bring build called came change " +
    "close come could country day different does down each early " +
    "earth end even every example eye face fact family few " +
    "find first following form found four from general get give " +
    "good great group hand hard have head help high home " +
    "house important into keep kind know large last later learn " +
    "letter life light line little long made make many might " +
    "money month more most mother move much music name near " +
    "need never new next night number often once only open " +
    "order other over part people place point right room same " +
    "school seem sentence set should show small something sound spell " +
    "still story study such take tell than that their them " +
    "then there these they thing think this those three through " +
    "time together too turn two under until use very want " +
    "water way well went were what when where which while " +
    "white whole why will with word work world would write " +
    "year young your"
  ).split(" ");

  const input     = document.getElementById('typingInput');
  const wordsEl   = document.getElementById('words');
  const card      = document.getElementById('typingCard');
  const timerEl   = document.getElementById('timer');
  const wpmEl     = document.getElementById('liveWpm');
  const accEl     = document.getElementById('liveAcc');
  const wordsStat = document.getElementById('liveWords');
  const results   = document.getElementById('results');

  let mode        = 'time';
  let duration    = 15;
  let targetWords = 15;
  let sequence    = [];
  let typed       = '';
  let started     = false;
  let finished    = false;
  let startAt     = 0;
  let interval    = null;
  let elapsed     = 0;

  const shuffle = () => {
    const arr = [];
    while (arr.length < 180) arr.push(bank[Math.floor(Math.random() * bank.length)]);
    return arr;
  };

  function makeSequence() {
    sequence = shuffle().slice(0, mode === 'words' ? duration : 180);
    render();
  }

  function render() {
    wordsEl.innerHTML = '';
    const cursor = typed.length;
    let pos = 0;

    sequence.forEach((word, wi) => {
      const span = document.createElement('span');
      span.className = 'word';

      [...word].forEach((ch, ci) => {
        const s = document.createElement('span');
        s.className = 'char';

        const idx = pos + ci;
        s.textContent = ch;
        if (idx < typed.length) s.classList.add(typed[idx] === ch ? 'correct' : 'incorrect');
        if (idx === cursor) s.classList.add('current');

        span.appendChild(s);
      });

      if (wi < sequence.length - 1) {
        const s = document.createElement('span');
        s.className = 'char';
        s.textContent = ' ';

        const idx = pos + word.length;
        if (idx < typed.length && typed[idx] !== ' ') s.classList.add('incorrect');
        if (idx === cursor) s.classList.add('current');

        span.appendChild(s);
      }

      wordsEl.appendChild(span);
      pos += word.length + 1;
    });

    const current = wordsEl.querySelector('.current');
    if (current) {
      const r = current.getBoundingClientRect();
      const p = wordsEl.getBoundingClientRect();
      if (r.bottom > p.bottom - 25) wordsEl.scrollTop += r.bottom - p.bottom + 35;
    }
  }

  function metrics() {
    let correct = 0;
    let letters = 0;

    for (let i = 0; i < typed.length; i++) {
      if (typed[i] !== ' ') {
        letters++;
        if (typed[i] === sequence.join(' ')[i]) correct++;
      }
    }

    const mins = Math.max((Date.now() - startAt) / 60000, 1 / 60000);
    const wpm  = Math.round((correct / 5) / mins);
    const acc  = typed.length ? Math.round(correct / Math.max(letters, 1) * 100) : 100;

    return { wpm, acc, correct, letters };
  }

  function update() {
    const m = metrics();
    const remaining = Math.max(0, duration - Math.floor((Date.now() - startAt) / 1000));

    timerEl.textContent = mode === 'time'
      ? remaining
      : Math.max(0, sequence.length - typed.trim().split(/\s+/).filter(Boolean).length);

    wpmEl.textContent = m.wpm;
    accEl.textContent = m.acc + '%';
    wordsStat.textContent =
      typed.trim().split(/\s+/).filter(Boolean).length + ' / ' +
      (mode === 'time' ? duration : targetWords);

    if (mode === 'time' && remaining <= 0) finish();
  }

  function begin() {
    if (started) return;
    started = true;
    startAt = Date.now();
    interval = setInterval(update, 200);
    document.querySelector('.test-hint span').textContent = 'keep going — you are in the zone';
  }

  function finish() {
    if (finished) return;
    finished = true;
    clearInterval(interval);
    document.querySelector('.test-shell').classList.add('completed');

    const m = metrics();
    document.getElementById('finalWpm').textContent   = m.wpm;
    document.getElementById('finalAcc').textContent   = m.acc + '%';
    document.getElementById('finalChars').textContent = m.correct;
    document.getElementById('finalCons').textContent  =
      m.acc >= 98 ? 'Excellent' :
      m.acc >= 94 ? 'Strong'    :
      m.acc >= 85 ? 'Steady'    : 'Keep going';

    results.classList.add('show');
  }

  function reset() {
    clearInterval(interval);
    document.querySelector('.test-shell').classList.remove('completed');

    typed    = '';
    started  = false;
    finished = false;
    startAt  = 0;
    elapsed  = 0;

    input.value = '';
    results.classList.remove('show');

    timerEl.textContent   = duration;
    wpmEl.textContent     = '0';
    accEl.textContent     = '100%';
    wordsStat.textContent = '0 / ' + (mode === 'time' ? duration : targetWords);
    document.querySelector('.test-hint span').textContent = 'start typing to begin';

    makeSequence();
    input.focus();
  }

  input.addEventListener('input', () => {
    if (finished) return;

    const value = input.value.replace(/\n/g, ' ');

    if (value.length > typed.length && value.endsWith(' ')) {
      const wordsDone = value.trim().split(/\s+/).length;
      if (wordsDone >= sequence.length && mode === 'words') {
        typed = value.trim();
        render();
        update();
        finish();
        return;
      }
    }

    typed = value;

    if (!started && typed.length) begin();
    render();
    update();

    if (mode === 'words' &&
        typed.trim().split(/\s+/).length >= targetWords &&
        typed.endsWith(' ')) {
      finish();
    }
  });

  card.addEventListener('click', () => input.focus());

  document.getElementById('restart').onclick = reset;
  document.getElementById('again').onclick   = reset;

  document.querySelectorAll('[data-mode]').forEach(b => {
    b.onclick = () => {
      mode = b.dataset.mode;
      document.querySelectorAll('[data-mode]')
        .forEach(x => x.classList.toggle('selected', x === b));

      document.getElementById('options').innerHTML = '';

      (mode === 'time' ? [15, 30, 60, 120] : [10, 25, 50, 100]).forEach(n => {
        const x = document.createElement('button');
        x.textContent  = n;
        x.dataset.value = n;
        if (n === (mode === 'time' ? 15 : 25)) x.classList.add('selected');

        x.onclick = () => {
          duration    = n;
          targetWords = n;
          document.querySelectorAll('#options button')
            .forEach(y => y.classList.toggle('selected', y === x));
          reset();
        };

        document.getElementById('options').appendChild(x);
      });

      duration    = mode === 'time' ? 15 : 25;
      targetWords = duration;
      reset();
    };
  });

  document.getElementById('options').querySelectorAll('button').forEach(b => {
    b.onclick = () => {
      duration    = +b.dataset.value;
      targetWords = duration;
      document.querySelectorAll('#options button')
        .forEach(x => x.classList.toggle('selected', x === b));
      reset();
    };
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.key === 'Tab' && e.shiftKey) return;
      reset();
    }
  });

  document.getElementById('navTest').onclick = () =>
    document.getElementById('test').scrollIntoView({ behavior: 'smooth' });

  document.getElementById('copyResult').onclick = () => {
    const m = metrics();
    navigator.clipboard
      ?.writeText(`keystroke — ${m.wpm} WPM · ${m.acc}% accuracy`)
      .then(() => toast('Copied to clipboard'))
      .catch(() => toast('Clipboard unavailable'));
  };

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 1800);
  }

  reset();
})();