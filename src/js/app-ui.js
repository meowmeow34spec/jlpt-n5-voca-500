/* ==========================================================================
   PRISM NIHONGO N5 — Sakura Glassmorphism Frontend Controller (N5App.UI)
   Exclusive Owner: @n5-ui-artist
   Connects WordBank, LearningSystem, and GameEngine to DOM, Keyboard & FX.
   ========================================================================== */
(function (globalScope) {
  "use strict";

  const root = typeof window !== "undefined" ? window : globalScope;
  root.N5App = root.N5App || {};

  const RING_CIRCUMFERENCE = 2 * Math.PI * 30;

  /* Complete Built-in Gojuon Fallback & Normalization Table */
  const FALLBACK_GOJUON = {
    seion: [
      [
        { hira: "あ", kata: "ア", romaji: "a", koPron: "아" },
        { hira: "い", kata: "イ", romaji: "i", koPron: "이" },
        { hira: "う", kata: "ウ", romaji: "u", koPron: "우" },
        { hira: "え", kata: "エ", romaji: "e", koPron: "에" },
        { hira: "お", kata: "オ", romaji: "o", koPron: "오" }
      ],
      [
        { hira: "か", kata: "カ", romaji: "ka", koPron: "카" },
        { hira: "き", kata: "キ", romaji: "ki", koPron: "키" },
        { hira: "く", kata: "ク", romaji: "ku", koPron: "쿠" },
        { hira: "け", kata: "ケ", romaji: "ke", koPron: "케" },
        { hira: "こ", kata: "コ", romaji: "ko", koPron: "코" }
      ],
      [
        { hira: "さ", kata: "サ", romaji: "sa", koPron: "사" },
        { hira: "し", kata: "シ", romaji: "shi", koPron: "시" },
        { hira: "す", kata: "ス", romaji: "su", koPron: "스" },
        { hira: "せ", kata: "セ", romaji: "se", koPron: "세" },
        { hira: "そ", kata: "ソ", romaji: "so", koPron: "소" }
      ],
      [
        { hira: "た", kata: "タ", romaji: "ta", koPron: "타" },
        { hira: "ち", kata: "チ", romaji: "chi", koPron: "치" },
        { hira: "つ", kata: "ツ", romaji: "tsu", koPron: "츠" },
        { hira: "て", kata: "テ", romaji: "te", koPron: "테" },
        { hira: "と", kata: "ト", romaji: "to", koPron: "토" }
      ],
      [
        { hira: "な", kata: "ナ", romaji: "na", koPron: "나" },
        { hira: "に", kata: "ニ", romaji: "ni", koPron: "니" },
        { hira: "ぬ", kata: "ヌ", romaji: "nu", koPron: "누" },
        { hira: "ね", kata: "ネ", romaji: "ne", koPron: "네" },
        { hira: "の", kata: "ノ", romaji: "no", koPron: "노" }
      ],
      [
        { hira: "は", kata: "ハ", romaji: "ha", koPron: "하" },
        { hira: "ひ", kata: "ヒ", romaji: "hi", koPron: "히" },
        { hira: "ふ", kata: "フ", romaji: "fu", koPron: "후" },
        { hira: "へ", kata: "ヘ", romaji: "he", koPron: "헤" },
        { hira: "ほ", kata: "ホ", romaji: "ho", koPron: "호" }
      ],
      [
        { hira: "ま", kata: "マ", romaji: "ma", koPron: "마" },
        { hira: "み", kata: "ミ", romaji: "mi", koPron: "미" },
        { hira: "む", kata: "ム", romaji: "mu", koPron: "무" },
        { hira: "め", kata: "メ", romaji: "me", koPron: "메" },
        { hira: "も", kata: "モ", romaji: "mo", koPron: "모" }
      ],
      [
        { hira: "や", kata: "ヤ", romaji: "ya", koPron: "야" },
        null,
        { hira: "ゆ", kata: "ユ", romaji: "yu", koPron: "유" },
        null,
        { hira: "よ", kata: "ヨ", romaji: "yo", koPron: "요" }
      ],
      [
        { hira: "ら", kata: "ラ", romaji: "ra", koPron: "라" },
        { hira: "り", kata: "リ", romaji: "ri", koPron: "리" },
        { hira: "る", kata: "ル", romaji: "ru", koPron: "루" },
        { hira: "れ", kata: "レ", romaji: "re", koPron: "레" },
        { hira: "ろ", kata: "ロ", romaji: "ro", koPron: "로" }
      ],
      [
        { hira: "わ", kata: "ワ", romaji: "wa", koPron: "와" },
        null,
        null,
        null,
        { hira: "を", kata: "ヲ", romaji: "wo", koPron: "오(조사)" }
      ],
      [
        { hira: "ん", kata: "ン", romaji: "n/nn", koPron: "응/ㄴ/ㅁ" },
        null,
        null,
        null,
        null
      ]
    ],
    dakuon: [
      { hira: "が", kata: "ガ", romaji: "ga", koPron: "가" },
      { hira: "ぎ", kata: "ギ", romaji: "gi", koPron: "기" },
      { hira: "ぐ", kata: "グ", romaji: "gu", koPron: "구" },
      { hira: "げ", kata: "ゲ", romaji: "ge", koPron: "게" },
      { hira: "ご", kata: "ゴ", romaji: "go", koPron: "고" },
      { hira: "ざ", kata: "ザ", romaji: "za", koPron: "자" },
      { hira: "じ", kata: "ジ", romaji: "ji", koPron: "지" },
      { hira: "ず", kata: "ズ", romaji: "zu", koPron: "즈" },
      { hira: "ぜ", kata: "ゼ", romaji: "ze", koPron: "제" },
      { hira: "ぞ", kata: "ゾ", romaji: "zo", koPron: "조" },
      { hira: "だ", kata: "ダ", romaji: "da", koPron: "다" },
      { hira: "ぢ", kata: "ヂ", romaji: "ji/di", koPron: "지" },
      { hira: "づ", kata: "ヅ", romaji: "zu/du", koPron: "즈" },
      { hira: "で", kata: "デ", romaji: "de", koPron: "데" },
      { hira: "ど", kata: "ド", romaji: "do", koPron: "도" },
      { hira: "ば", kata: "バ", romaji: "ba", koPron: "바" },
      { hira: "び", kata: "ビ", romaji: "bi", koPron: "비" },
      { hira: "ぶ", kata: "ブ", romaji: "bu", koPron: "부" },
      { hira: "べ", kata: "ベ", romaji: "be", koPron: "베" },
      { hira: "ぼ", kata: "ボ", romaji: "bo", koPron: "보" }
    ],
    handakuon: [
      { hira: "ぱ", kata: "パ", romaji: "pa", koPron: "파" },
      { hira: "ぴ", kata: "ピ", romaji: "pi", koPron: "피" },
      { hira: "ぷ", kata: "プ", romaji: "pu", koPron: "푸" },
      { hira: "ぺ", kata: "ペ", romaji: "pe", koPron: "페" },
      { hira: "ぽ", kata: "ポ", romaji: "po", koPron: "포" }
    ],
    yoon: [
      { hira: "きゃ", kata: "キャ", romaji: "kya", koPron: "캬" },
      { hira: "きゅ", kata: "キュ", romaji: "kyu", koPron: "큐" },
      { hira: "きょ", kata: "キョ", romaji: "kyo", koPron: "쿄" },
      { hira: "しゃ", kata: "シャ", romaji: "sha", koPron: "샤" },
      { hira: "しゅ", kata: "シュ", romaji: "shu", koPron: "슈" },
      { hira: "しょ", kata: "ショ", romaji: "sho", koPron: "쇼" },
      { hira: "ちゃ", kata: "チャ", romaji: "cha", koPron: "차" },
      { hira: "ちゅ", kata: "チュ", romaji: "chu", koPron: "추" },
      { hira: "ちょ", kata: "チョ", romaji: "cho", koPron: "초" },
      { hira: "にゃ", kata: "ニャ", romaji: "nya", koPron: "냐" },
      { hira: "にゅ", kata: "ニュ", romaji: "nyu", koPron: "뉴" },
      { hira: "にょ", kata: "ニョ", romaji: "nyo", koPron: "뇨" },
      { hira: "ひゃ", kata: "ヒャ", romaji: "hya", koPron: "햐" },
      { hira: "ひゅ", kata: "ヒュ", romaji: "hyu", koPron: "휴" },
      { hira: "ひょ", kata: "ヒョ", romaji: "hyo", koPron: "효" },
      { hira: "みゃ", kata: "ミャ", romaji: "mya", koPron: "먀" },
      { hira: "みゅ", kata: "ミュ", romaji: "myu", koPron: "뮤" },
      { hira: "みょ", kata: "ミョ", romaji: "myo", koPron: "묘" },
      { hira: "りゃ", kata: "リャ", romaji: "rya", koPron: "랴" },
      { hira: "りゅ", kata: "リュ", romaji: "ryu", koPron: "류" },
      { hira: "りょ", kata: "リョ", romaji: "ryo", koPron: "료" },
      { hira: "ぎゃ", kata: "ギャ", romaji: "gya", koPron: "갸" },
      { hira: "ぎゅ", kata: "ギュ", romaji: "gyu", koPron: "규" },
      { hira: "ぎょ", kata: "ギョ", romaji: "gyo", koPron: "교" },
      { hira: "じゃ", kata: "ジャ", romaji: "ja", koPron: "자" },
      { hira: "じゅ", kata: "ジュ", romaji: "ju", koPron: "주" },
      { hira: "じょ", kata: "ジョ", romaji: "jo", koPron: "조" },
      { hira: "びゃ", kata: "ビャ", romaji: "bya", koPron: "뱌" },
      { hira: "びゅ", kata: "ビュ", romaji: "byu", koPron: "뷰" },
      { hira: "びょ", kata: "ビョ", romaji: "byo", koPron: "뵤" },
      { hira: "ぴゃ", kata: "ピャ", romaji: "pya", koPron: "퍄" },
      { hira: "ぴゅ", kata: "ピュ", romaji: "pyu", koPron: "퓨" },
      { hira: "ぴょ", kata: "ピョ", romaji: "pyo", koPron: "표" }
    ],
    specialRules: [
      {
        title: "① 촉음 (っ / ッ) — 한 박자 숨을 멈추는 받침 소리",
        desc: "작은 っ는 뒤따르는 자음 앞에서 1박자 멈추며 받침(ㄱ/ㅅ/ㅂ)처럼 발음됩니다. 로마자 타이핑 시 뒷자음을 두 번 치면(kk, tt, pp, ss) 자동 입력됩니다!",
        examples: "学校(がっこう · gakkou) / 切手(きって · kitte) / 雑誌(ざっし · zasshi)"
      },
      {
        title: "② 장음 (おう · えい · ー) — 두 박자로 길게 끄는 소리",
        desc: "JLPT N5 한자 읽기 1순위 함정! え단+い(せんせい), お단+う(がっこう), 가타카나 ー(コーヒー)는 모두 길게 2박자로 발음합니다.",
        examples: "先生(せんせい · sensei) / 空港(くうこう · kuukou) / コーヒー(koohii)"
      },
      {
        title: "③ 발음 (ん / ン) — 뒤에 오는 소리에 따라 변하는 비음",
        desc: "한 글자 독립 1박자를 차지하며 뒷소리에 따라 ㄴ·ㅁ·ㅇ으로 자연스럽게 발음됩니다. 로마자에서는 자음 앞 n 또는 nn으로 입력합니다.",
        examples: "新聞(しんぶん · shinbun) / 散歩(さんぽ · sanpo) / 本(ほん · hon)"
      }
    ]
  };

  const uiState = {
    initialized: false,
    activeScreen: "lobby",
    previousScreenBeforeCodex: "lobby",
    lobbyLevelFilter: "all",
    memorizeSec: 45,
    battleStyle: "prism-mix",
    studyMask: "all", // 'all' | 'furigana' | 'meaning' | 'japanese'
    studyView: "grid", // 'grid' | 'focus'
    studyFocusIndex: 0,
    flippedWordIds: new Set(),
    renderedQuestionKey: null,
    renderedStudyKey: null,
    lastQuestionEnteredAt: 0,
    lastFeedbackEnteredAt: 0,
    inputLocked: false,
    codexQuery: "",
    codexLevel: "",
    codexPos: "",
    codexFilter: "all",
    codexLimit: 60,
    gojuonTab: "seion", // 'seion' | 'dakuon' | 'yoon' | 'rules'
    gojuonScript: "both", // 'both' | 'hira' | 'kata'
    unsubscribers: []
  };

  /* ------------------------------------------------------------------------
     Safe Helpers, Ruby Sanitizer & Module Accessors
     ------------------------------------------------------------------------ */
  function getWB() {
    return root.N5App.WordBank || null;
  }

  function getLS() {
    return root.N5App.LearningSystem || null;
  }

  function getGE() {
    return root.N5App.GameEngine || null;
  }

  function getRomajiHelper() {
    const ls = getLS();
    return (ls && ls.RomajiHelper) || root.N5App.RomajiHelper || null;
  }

  function getAllWords() {
    const wb = getWB();
    if (wb && typeof wb.getAllWords === "function") {
      const list = wb.getAllWords();
      if (Array.isArray(list) && list.length > 0) return list;
    }
    return root.N5App.WORDS_500 || root.N5App.WORDS_800 || root.N5App.words || [];
  }

  function getAllRounds() {
    const wb = getWB();
    if (wb && typeof wb.getAllRounds === "function") {
      const list = wb.getAllRounds();
      if (Array.isArray(list) && list.length > 0) return list;
    }
    return root.N5App.ROUNDS_50 || root.N5App.ROUNDS_80 || [];
  }

  function getWordById(id) {
    const numId = Number(id);
    const wb = getWB();
    if (wb && typeof wb.getWordById === "function") {
      const found = wb.getWordById(numId);
      if (found) return found;
    }
    const words = getAllWords();
    for (let i = 0; i < words.length; i++) {
      if (words[i].id === numId) return words[i];
    }
    return null;
  }

  function esc(val) {
    if (val === null || val === undefined) return "";
    return String(val)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* Escapes all HTML except safe <ruby>, </ruby>, <rt>, </rt>, <rp>, </rp> tags */
  function safeRubyHtml(rawHtml, fallbackPlain) {
    const src = rawHtml || fallbackPlain || "";
    if (!src) return "";
    const escaped = esc(src);
    return escaped.replace(/&lt;(\/?(?:ruby|rt|rp))&gt;/gi, function (_, tag) {
      return "<" + tag.toLowerCase() + ">";
    });
  }

  function byId(id) {
    return typeof document !== "undefined" ? document.getElementById(id) : null;
  }

  function playUiFlipSfx() {
    const ls = getLS();
    try {
      if (ls && ls.sfx) {
        if (typeof ls.sfx.flip === "function") ls.sfx.flip();
        else if (typeof ls.sfx.play === "function") ls.sfx.play("flip");
      }
    } catch (_) {
      /* never block UI */
    }
  }

  function playUiClickSfx() {
    const ls = getLS();
    try {
      if (ls && ls.sfx) {
        if (typeof ls.sfx.click === "function") ls.sfx.click();
        else if (typeof ls.sfx.play === "function") ls.sfx.play("click");
      }
    } catch (_) {
      /* never block UI */
    }
  }

  function speakWordSafe(wordOrId) {
    const ls = getLS();
    try {
      if (ls && ls.tts) {
        if (typeof ls.tts.speakWord === "function") {
          ls.tts.speakWord(wordOrId);
          return;
        }
        const w = typeof wordOrId === "object" ? wordOrId : getWordById(wordOrId);
        if (w && typeof ls.tts.speak === "function") {
          ls.tts.speak(w.kana || w.expression);
        }
      }
    } catch (_) {
      /* never block UI */
    }
  }

  function speakExampleSafe(wordOrId) {
    const ls = getLS();
    try {
      if (ls && ls.tts) {
        if (typeof ls.tts.speakExample === "function") {
          ls.tts.speakExample(wordOrId);
          return;
        }
        const w = typeof wordOrId === "object" ? wordOrId : getWordById(wordOrId);
        if (w && w.example && typeof ls.tts.speak === "function") {
          ls.tts.speak(w.example);
        }
      }
    } catch (_) {
      /* never block UI */
    }
  }

  function speakKanaSafe(kanaText) {
    if (!kanaText) return;
    const ls = getLS();
    try {
      if (ls && ls.tts) {
        if (typeof ls.tts.speakKana === "function") ls.tts.speakKana(kanaText);
        else if (typeof ls.tts.speak === "function") ls.tts.speak(kanaText);
      }
    } catch (_) {
      /* never block UI */
    }
  }

  /* ------------------------------------------------------------------------
     Sakura Petal & Crystal Prism Particle System (Zero Idle RAF Overhead)
     ------------------------------------------------------------------------ */
  const FX = (function () {
    let canvas = null;
    let ctx = null;
    let particles = [];
    let rafId = null;

    const COLORS = ["#ff85b3", "#fda4af", "#c084fc", "#38bdf8", "#fbbf24", "#ffffff"];

    function ensureCanvas() {
      if (typeof document === "undefined") return false;
      if (!canvas) {
        canvas = byId("fx-canvas");
        if (canvas && typeof canvas.getContext === "function") {
          try {
            ctx = canvas.getContext("2d");
          } catch (_) {
            ctx = null;
          }
        }
      }
      if (!canvas || !ctx) return false;
      const w = root.innerWidth || 800;
      const h = root.innerHeight || 600;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      return true;
    }

    function step() {
      if (!ctx || !canvas) {
        rafId = null;
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.14;
        p.rot += p.vrot;
        p.life -= p.decay;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        if (p.shape === "petal") {
          ctx.moveTo(0, -p.size);
          ctx.bezierCurveTo(p.size * 0.9, -p.size * 0.5, p.size * 0.85, p.size * 0.7, 0, p.size);
          ctx.bezierCurveTo(-p.size * 0.85, p.size * 0.7, -p.size * 0.9, -p.size * 0.5, 0, -p.size);
        } else {
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.7, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size * 0.7, 0);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      if (particles.length > 0 && typeof root.requestAnimationFrame === "function") {
        rafId = root.requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rafId = null;
      }
    }

    function burst(x, y, count) {
      if (!ensureCanvas()) return;
      const total = count || 18;
      const cx = typeof x === "number" ? x : canvas.width * 0.5;
      const cy = typeof y === "number" ? y : canvas.height * 0.42;
      for (let i = 0; i < total; i++) {
        const angle = (Math.PI * 2 * i) / total + (Math.random() - 0.5) * 0.5;
        const speed = 2.4 + Math.random() * 6.0;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.0,
          size: 4.5 + Math.random() * 6,
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 0.22,
          color: COLORS[i % COLORS.length],
          shape: i % 2 === 0 ? "petal" : "shard",
          life: 1,
          decay: 0.022 + Math.random() * 0.018
        });
      }
      if (!rafId && typeof root.requestAnimationFrame === "function") {
        rafId = root.requestAnimationFrame(step);
      }
    }

    function clear() {
      particles = [];
      if (rafId && typeof root.cancelAnimationFrame === "function") {
        root.cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    return { burst: burst, clear: clear };
  })();

  /* ------------------------------------------------------------------------
     Toast & Floating Score Popups
     ------------------------------------------------------------------------ */
  function showToast(message, durationMs) {
    if (typeof document === "undefined" || !message) return;
    const container = byId("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "glass-toast";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, durationMs || 2500);
  }

  function spawnFloatingScore(text, x, y) {
    if (typeof document === "undefined" || !text) return;
    const el = document.createElement("div");
    el.className = "floating-score";
    el.textContent = text;
    const px = typeof x === "number" ? x : (root.innerWidth || 800) * 0.5;
    const py = typeof y === "number" ? y : (root.innerHeight || 600) * 0.36;
    el.style.left = px + "px";
    el.style.top = py + "px";
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 950);
  }

  /* ------------------------------------------------------------------------
     Screen Switching, Theme & Audio/TTS Speed Controls
     ------------------------------------------------------------------------ */
  function showScreen(screenName) {
    if (typeof document === "undefined") return;
    const screens = document.querySelectorAll("[data-screen]");
    screens.forEach(function (sec) {
      const match = sec.getAttribute("data-screen") === screenName;
      sec.classList.toggle("is-active", match);
      sec.hidden = !match;
    });
    uiState.activeScreen = screenName;
    if (screenName !== "battle") {
      document.body.classList.remove("is-fever");
    }
  }

  function normalizeThemeName(raw) {
    if (raw === "crystal-sakura-day" || raw === "crystal-day" || raw === "light") {
      return "crystal-sakura-day";
    }
    return "midnight-sakura";
  }

  function getCurrentTtsRate() {
    const ls = getLS();
    if (ls && ls.tts && typeof ls.tts.getRate === "function") {
      const r = Number(ls.tts.getRate());
      if (r > 0) return r;
    }
    const settings = ls && typeof ls.getSettings === "function" ? ls.getSettings() : {};
    return Number(settings.ttsRate) || 1.0;
  }

  function applySettingsToDom() {
    if (typeof document === "undefined") return;
    const ls = getLS();
    const settings = ls && typeof ls.getSettings === "function" ? ls.getSettings() : {};
    const theme = normalizeThemeName(settings.theme || document.documentElement.getAttribute("data-theme"));
    document.documentElement.setAttribute("data-theme", theme);

    const themeBtn = byId("btn-toggle-theme");
    if (themeBtn) {
      const isLight = theme === "crystal-sakura-day";
      themeBtn.textContent = isLight ? "☀️" : "🌙";
      themeBtn.title = isLight ? "미드나잇 사쿠라(다크) 테마로 전환" : "크리스탈 사쿠라 데이(라이트) 테마로 전환";
    }

    const isMuted =
      ls && ls.sfx && typeof ls.sfx.isMuted === "function"
        ? ls.sfx.isMuted()
        : Boolean(settings.muted);
    const muteBtn = byId("btn-toggle-mute");
    if (muteBtn) {
      muteBtn.textContent = isMuted ? "🔇" : "🔊";
    }

    const ttsEnabled =
      ls && ls.tts && typeof ls.tts.isEnabled === "function"
        ? ls.tts.isEnabled()
        : settings.ttsEnabled !== false;
    const ttsBtn = byId("btn-toggle-tts");
    if (ttsBtn) {
      ttsBtn.textContent = ttsEnabled ? "🗣️" : "🙊";
      ttsBtn.style.opacity = ttsEnabled ? "1" : "0.55";
    }

    const rate = getCurrentTtsRate();
    const isSlow = rate < 0.9;
    const navSpeedBtn = byId("btn-toggle-tts-speed");
    if (navSpeedBtn) {
      navSpeedBtn.textContent = isSlow ? "🐢0.78x" : "1.0x";
    }
    const battleSpeedBtn = byId("btn-battle-tts-speed");
    if (battleSpeedBtn) {
      battleSpeedBtn.textContent = isSlow ? "🐢 0.78x" : "🔊 1.0x";
    }
    const codexSpeedBtn = byId("btn-codex-tts-speed");
    if (codexSpeedBtn) {
      codexSpeedBtn.textContent = isSlow ? "🐢 0.78x 느리게" : "🇯🇵 1.0x 표준 속도";
    }

    if (settings.memorizeSec && [30, 45, 60].indexOf(Number(settings.memorizeSec)) !== -1) {
      uiState.memorizeSec = Number(settings.memorizeSec);
      const sel = byId("select-memorize-sec");
      if (sel) sel.value = String(uiState.memorizeSec);
    }
  }

  function toggleTheme() {
    const ls = getLS();
    const cur = normalizeThemeName(document.documentElement.getAttribute("data-theme"));
    const next = cur === "crystal-sakura-day" ? "midnight-sakura" : "crystal-sakura-day";
    document.documentElement.setAttribute("data-theme", next);
    if (ls && typeof ls.updateSettings === "function") {
      ls.updateSettings({ theme: next });
    }
    applySettingsToDom();
    showToast(next === "crystal-sakura-day" ? "☀️ 크리스탈 사쿠라 데이 테마 적용" : "🌸 미드나잇 사쿠라 테마 적용", 1600);
  }

  function toggleMute() {
    const ls = getLS();
    let muted = false;
    if (ls && ls.sfx && typeof ls.sfx.toggleMute === "function") {
      muted = ls.sfx.toggleMute();
    } else if (ls && typeof ls.getSettings === "function" && typeof ls.updateSettings === "function") {
      muted = !ls.getSettings().muted;
      ls.updateSettings({ muted: muted });
    }
    applySettingsToDom();
    showToast(muted ? "🔇 효과음 음소거" : "🔊 사쿠라 크리스탈 효과음 켜짐", 1400);
  }

  function toggleTts() {
    const ls = getLS();
    let next = true;
    if (ls && ls.tts && typeof ls.tts.isEnabled === "function" && typeof ls.tts.setEnabled === "function") {
      next = !ls.tts.isEnabled();
      ls.tts.setEnabled(next);
    }
    if (ls && typeof ls.updateSettings === "function") {
      ls.updateSettings({ ttsEnabled: next });
    }
    applySettingsToDom();
    showToast(next ? "🗣️ 일본어 원어민 발음(ja-JP) 켜짐" : "🙊 일본어 발음(TTS) 꺼짐", 1500);
  }

  function toggleTtsSpeed() {
    const ls = getLS();
    let nextRate = getCurrentTtsRate() < 0.9 ? 1.0 : 0.78;
    if (ls && ls.tts) {
      if (typeof ls.tts.toggleSpeed === "function") {
        const res = ls.tts.toggleSpeed();
        if (typeof res === "number" && res > 0) nextRate = res;
        else if (res && typeof res.rate === "number") nextRate = res.rate;
      } else if (typeof ls.tts.setRate === "function") {
        ls.tts.setRate(nextRate);
      }
    }
    if (ls && typeof ls.updateSettings === "function") {
      ls.updateSettings({ ttsRate: nextRate });
    }
    applySettingsToDom();
    showToast(
      nextRate < 0.9
        ? "🐢 0.78x 또박또박 느린 청해 모드로 전환"
        : "🇯🇵 1.0x 실전 표준 발음 속도로 전환",
      1500
    );
  }

  /* ------------------------------------------------------------------------
     Top Nav & Lobby Rendering (50-Round N5 World Map + Mastery Stats)
     ------------------------------------------------------------------------ */
  function getMasterySnapshot() {
    const totalWords = getAllWords().length || 500;
    const totalRounds = getAllRounds().length || 50;
    const ls = getLS();
    if (ls && typeof ls.getMasteryStats === "function") {
      const s = ls.getMasteryStats();
      if (s) {
        return Object.assign(
          {
            total: totalWords,
            totalRounds: totalRounds,
            unseen: totalWords,
            learning: 0,
            mastered: 0,
            pinnedCount: 0,
            wrongNoteCount: 0,
            clearedRoundsCount: 0,
            totalScore: 0,
            bestCombo: 0,
            streakDays: 1,
            survivalBestScore: 0
          },
          s
        );
      }
    }
    return {
      total: totalWords,
      totalRounds: totalRounds,
      unseen: totalWords,
      learning: 0,
      mastered: 0,
      pinnedCount: 0,
      wrongNoteCount: 0,
      clearedRoundsCount: 0,
      totalScore: 0,
      bestCombo: 0,
      streakDays: 1,
      survivalBestScore: 0
    };
  }

  function getRoundRecordSafe(roundNum) {
    const ls = getLS();
    if (ls && typeof ls.getRoundRecord === "function") {
      const rec = ls.getRoundRecord(roundNum);
      if (rec) return rec;
    }
    return { round: roundNum, cleared: false, bestScore: 0, bestRank: null, stars: 0, playCount: 0 };
  }

  function updateNavStats() {
    const stats = getMasterySnapshot();
    const totalWords = stats.total || getAllWords().length || 500;
    const elStreak = byId("nav-streak");
    const elMastered = byId("nav-mastered");
    const elTotalWords = byId("nav-total-words");
    const elScore = byId("nav-total-score");
    if (elStreak) elStreak.textContent = String(stats.streakDays || 1);
    if (elMastered) elMastered.textContent = String(stats.mastered || 0);
    if (elTotalWords) elTotalWords.textContent = String(totalWords);
    if (elScore) elScore.textContent = Number(stats.totalScore || 0).toLocaleString();
  }

  function renderLobby() {
    updateNavStats();
    const stats = getMasterySnapshot();
    const rounds = getAllRounds();
    const totalWords = stats.total || getAllWords().length || 500;
    const totalRounds = rounds.length || stats.totalRounds || 50;
    const mastered = stats.mastered || 0;
    const learning = stats.learning || 0;
    const masteredPct = Math.min(100, (mastered / Math.max(1, totalWords)) * 100);
    const learningPct = Math.min(100 - masteredPct, (learning / Math.max(1, totalWords)) * 100);

    const masteryTitle = byId("hero-mastery-title");
    if (masteryTitle) masteryTitle.textContent = "전체 " + totalWords + "단어 N5 마스터리";

    const pctLabel = byId("hero-mastery-percent");
    if (pctLabel) pctLabel.textContent = ((mastered / Math.max(1, totalWords)) * 100).toFixed(1) + "% 정복";

    const mBar = byId("hero-mastered-bar");
    const lBar = byId("hero-learning-bar");
    if (mBar) mBar.style.width = masteredPct.toFixed(2) + "%";
    if (lBar) lBar.style.width = learningPct.toFixed(2) + "%";

    const pb = byId("hero-mastery-progressbar");
    if (pb) {
      pb.setAttribute("aria-valuemax", String(totalWords));
      pb.setAttribute("aria-valuenow", String(mastered));
    }

    const campBadge = byId("campaign-total-badge");
    if (campBadge) campBadge.textContent = totalRounds + " ROUNDS · " + totalWords + "단어";

    const kpiRounds = byId("kpi-cleared-rounds");
    const kpiWords = byId("kpi-learning-words");
    const kpiCombo = byId("kpi-best-combo");
    if (kpiRounds) kpiRounds.textContent = (stats.clearedRoundsCount || 0) + "/" + totalRounds;
    if (kpiWords) kpiWords.textContent = String(mastered + learning);
    if (kpiCombo) kpiCombo.textContent = String(stats.bestCombo || 0);

    // Recommended next round
    const ge = getGE();
    let nextRecommended = 1;
    if (ge && typeof ge.getRecommendedNextRound === "function") {
      nextRecommended = Number(ge.getRecommendedNextRound()) || 1;
    } else {
      for (let i = 0; i < rounds.length; i++) {
        const rec = getRoundRecordSafe(rounds[i].round);
        if (!rec.cleared) {
          nextRecommended = rounds[i].round;
          break;
        }
        if (i === rounds.length - 1) nextRecommended = rounds[i].round;
      }
    }

    const heroBtn = byId("btn-hero-start");
    const heroLabel = byId("hero-start-label");
    const roundMeta = rounds[nextRecommended - 1];
    if (heroBtn) heroBtn.setAttribute("data-round", String(nextRecommended));
    if (heroLabel) {
      heroLabel.textContent = roundMeta
        ? "Round " + nextRecommended + " · " + roundMeta.title + " 출격"
        : "Round " + nextRecommended + " 출격하기";
    }

    // Revenge & Survival badges
    const revBadge = byId("revenge-count-badge");
    if (revBadge) {
      let weakCount = (stats.wrongNoteCount || 0) + (stats.pinnedCount || 0);
      if (ge && typeof ge.canStartRevenge === "function") {
        const check = ge.canStartRevenge();
        if (check && typeof check.weakCount === "number") weakCount = check.weakCount;
      }
      revBadge.textContent = weakCount > 0 ? "약점 " + weakCount + "개 대기!" : "약점 0개 (클린)";
    }

    const survBadge = byId("survival-best-badge");
    if (survBadge) {
      survBadge.textContent = "BEST " + Number(stats.survivalBestScore || 0).toLocaleString() + "점";
    }

    renderRoundsGrid();
  }

  function renderRoundsGrid() {
    const grid = byId("rounds-grid");
    if (!grid) return;
    const rounds = getAllRounds();
    const filter = uiState.lobbyLevelFilter;
    const html = [];

    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      if (filter !== "all" && String(r.level) !== String(filter)) continue;
      const rec = getRoundRecordSafe(r.round);
      const rank = rec.bestRank || "";
      const rankClass =
        rank === "S+"
          ? "rank-badge--Splus"
          : rank === "S"
            ? "rank-badge--S"
            : rank === "A"
              ? "rank-badge--A"
              : rank
                ? "rank-badge--B"
                : "";
      const stars = rec.stars || 0;
      const starStr = "★".repeat(stars) + "☆".repeat(Math.max(0, 3 - stars));
      const lvLabel = r.level === 1 ? "N5 입문" : r.level === 2 ? "N5 핵심" : "N5 완성";

      html.push(
        '<button type="button" class="glass-card round-tile" data-action="start-round" data-round="' +
          r.round +
          '" data-level="' +
          r.level +
          '">' +
          '<div class="round-tile__head">' +
          '<span class="round-tile__num">ROUND ' +
          String(r.round).padStart(2, "0") +
          " · " +
          lvLabel +
          "</span>" +
          (rank
            ? '<span class="rank-badge ' + rankClass + '">' + esc(rank) + "</span>"
            : '<span class="rank-badge" style="opacity:0.58;">NEW</span>') +
          "</div>" +
          '<div class="round-tile__title"><span>' +
          esc(r.emoji || "🌸") +
          "</span><span>" +
          esc(r.title) +
          "</span></div>" +
          '<div class="round-tile__foot">' +
          '<span class="round-stars">' +
          starStr +
          "</span>" +
          "<span>" +
          (rec.bestScore > 0 ? Number(rec.bestScore).toLocaleString() + "점" : "10단어") +
          "</span>" +
          "</div>" +
          "</button>"
      );
    }

    grid.innerHTML = html.join("");
  }

  /* ------------------------------------------------------------------------
     Study Phase Rendering (10-Word Sakura Prism Memory Workshop)
     ------------------------------------------------------------------------ */
  function formatHighlightedExample(wordObj) {
    const wb = getWB();
    if (wb && typeof wb.getBlankExample === "function") {
      return wb.getBlankExample(wordObj, "［" + (wordObj.expression || wordObj.kana) + "］");
    }
    return wordObj.example || "";
  }

  function renderStudyScreen(state) {
    if (!state || !state.memorize) return;
    const mem = state.memorize;
    const meta = state.roundMeta || { round: state.round || 1, level: 1, title: "10단어 암기 공방", emoji: "🌸" };

    const labelEl = byId("study-round-label");
    const titleEl = byId("study-round-title");
    if (labelEl) {
      labelEl.textContent =
        state.mode === "revenge"
          ? "🔥 REVENGE DOJO · 약점 복수 도장"
          : "ROUND " + meta.round + " · Lv." + (meta.level || 1);
    }
    if (titleEl) {
      titleEl.textContent = (meta.emoji || "🌸") + " " + (meta.title || "10단어 암기 공방");
    }

    updateStudyTimerUI(mem);
    updateStudyPinBadge(mem);
    renderStudyCards(mem);
  }

  function updateStudyTimerUI(mem) {
    if (!mem) return;
    const totalSec = Math.max(1, Number(mem.totalSec || 45));
    const remMs = typeof mem.remainingMs === "number" ? mem.remainingMs : Number(mem.remainingSec || 0) * 1000;
    const remSec = Math.max(0, Math.ceil(remMs / 1000));
    const ratio = Math.max(0, Math.min(1, remMs / (totalSec * 1000)));

    const secEl = byId("study-timer-sec");
    if (secEl) secEl.textContent = remSec + "s";

    const ringProg = byId("study-ring-progress");
    if (ringProg) {
      ringProg.style.strokeDasharray = String(RING_CIRCUMFERENCE);
      ringProg.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - ratio));
    }

    const ringWrap = byId("study-ring-timer");
    if (ringWrap) {
      ringWrap.classList.toggle("is-urgent", remSec <= 8);
    }

    const extBtn = byId("btn-extend-time");
    if (extBtn) {
      const left = typeof mem.extensionsLeft === "number" ? mem.extensionsLeft : 0;
      extBtn.disabled = left <= 0;
      extBtn.textContent = left > 0 ? "+15초 연장" : "연장 사용됨";
    }

    const earlyBadge = byId("early-bonus-badge");
    if (earlyBadge) {
      const prev = mem.earlyStartPreview || mem.earlyBonusPreview;
      if (prev && prev.bonusPoints > 0) {
        earlyBadge.textContent = "(⚡ +" + prev.bonusPoints + "점 · x" + Number(prev.scoreMultiplier || 1).toFixed(2) + ")";
      } else if (prev && prev.label) {
        earlyBadge.textContent = "(" + prev.label + ")";
      } else {
        earlyBadge.textContent = "(배틀 출격)";
      }
    }
  }

  function updateStudyPinBadge(mem) {
    const pinCounter = byId("study-pin-counter");
    if (!pinCounter || !mem) return;
    const pinnedIds = Array.isArray(mem.roundPinnedIds) ? mem.roundPinnedIds : [];
    pinCounter.textContent = "⭐ 핀 바운티 " + pinnedIds.length + "/3 (정답 시 x2.0!)";
  }

  /* In-Place DOM Update on pinUpdated (Zero Node Detachment!) */
  function updateStudyPinsDom(mem) {
    if (!mem || typeof document === "undefined") return;
    updateStudyPinBadge(mem);
    const pinnedSet = new Set(
      (Array.isArray(mem.roundPinnedIds) ? mem.roundPinnedIds : []).map(Number)
    );
    document.querySelectorAll("#study-cards-grid .vocab-flip-scene[data-word-id]").forEach(function (scene) {
      const wid = Number(scene.getAttribute("data-word-id"));
      const isPinned = pinnedSet.has(wid);
      scene.classList.toggle("is-pinned", isPinned);
      scene.querySelectorAll('[data-action="toggle-pin"]').forEach(function (btn) {
        btn.classList.toggle("is-pinned", isPinned);
        btn.textContent = isPinned ? "⭐" : "☆";
      });
    });
  }

  function renderStudyCards(mem) {
    const grid = byId("study-cards-grid");
    const focusBar = byId("study-focus-controls");
    if (!grid || !mem) return;

    const words = Array.isArray(mem.words) ? mem.words : [];
    const pinnedSet = new Set((Array.isArray(mem.roundPinnedIds) ? mem.roundPinnedIds : []).map(Number));

    const maskStage = byId("study-mask-stage");
    if (maskStage) maskStage.setAttribute("data-mask", uiState.studyMask);
    grid.setAttribute("data-mask", uiState.studyMask);
    const isFocus = uiState.studyView === "focus";
    grid.classList.toggle("is-focus-mode", isFocus);
    if (focusBar) focusBar.hidden = !isFocus;

    if (uiState.studyFocusIndex >= words.length) uiState.studyFocusIndex = 0;
    const focusIdxLabel = byId("study-focus-index");
    if (focusIdxLabel) {
      focusIdxLabel.textContent = (uiState.studyFocusIndex + 1) + " / " + Math.max(1, words.length);
    }

    const visibleWords = isFocus && words.length > 0 ? [words[uiState.studyFocusIndex]] : words;
    const html = [];

    for (let i = 0; i < visibleWords.length; i++) {
      const w = visibleWords[i];
      if (!w) continue;
      const isFlipped = uiState.flippedWordIds.has(w.id);
      const isPinned = pinnedSet.has(Number(w.id)) || Boolean(w.pinned);
      const exprRuby = safeRubyHtml(w.rubyHtml, w.expression || w.kana);
      const subReading = w.kanji
        ? esc(w.kana) + (w.koPron ? " · [" + esc(w.koPron) + "]" : "")
        : (w.koPron ? "[" + esc(w.koPron) + "] · " : "") + esc(w.romaji || "");

      html.push(
        '<div class="vocab-flip-scene' +
          (isFlipped ? " is-flipped" : "") +
          (isPinned ? " is-pinned" : "") +
          '" data-word-id="' +
          w.id +
          '">' +
          '<div class="vocab-card-3d">' +
          // Front Face
          '<div class="vocab-face vocab-face--front" data-action="flip-card" data-word-id="' +
          w.id +
          '">' +
          '<div class="vocab-card__top">' +
          '<span class="pos-tag">' +
          esc(w.pos) +
          "</span>" +
          '<div class="vocab-card__actions">' +
          '<button type="button" class="card-mini-btn" data-action="speak-word" data-word-id="' +
          w.id +
          '" title="일본어 원어민 발음 듣기" aria-label="' +
          esc(w.expression || w.kana) +
          ' 발음 듣기">🔊</button>' +
          '<button type="button" class="card-mini-btn' +
          (isPinned ? " is-pinned" : "") +
          '" data-action="toggle-pin" data-word-id="' +
          w.id +
          '" title="헷갈리는 단어 핀 바운티 (정답 시 점수 2배)" aria-label="별표 핀 토글">' +
          (isPinned ? "⭐" : "☆") +
          "</button>" +
          "</div>" +
          "</div>" +
          '<div class="vocab-card__center">' +
          '<span class="vocab-emoji">' +
          esc(w.emoji || "🌸") +
          "</span>" +
          '<div class="vocab-jp-expr">' +
          exprRuby +
          "</div>" +
          '<div class="vocab-reading-sub">' +
          subReading +
          "</div>" +
          '<div class="vocab-meaning">' +
          esc(w.meaning) +
          "</div>" +
          "</div>" +
          '<div class="vocab-card__foot">' +
          "<span>#" +
          w.id +
          " · " +
          esc(w.romaji || "") +
          "</span>" +
          "<span>한자팁·예문 ↻</span>" +
          "</div>" +
          "</div>" +
          // Back Face
          '<div class="vocab-face vocab-face--back" data-action="flip-card" data-word-id="' +
          w.id +
          '">' +
          '<div class="vocab-card__top">' +
          '<strong class="jp-text" style="font-size:0.94rem;color:var(--accent-sakura);">' +
          esc(w.expression || w.kana) +
          " (" +
          esc(w.kana) +
          ") · " +
          esc(w.meaning) +
          "</strong>" +
          '<button type="button" class="card-mini-btn" data-action="speak-example" data-word-id="' +
          w.id +
          '" title="일본어 예문 전체 발음 듣기">🔊</button>' +
          "</div>" +
          '<div class="vocab-tip-box">💡 ' +
          esc(w.tip || "장음과 촉음 박자에 유의하며 소리로 외워 보세요!") +
          "</div>" +
          '<div class="vocab-example-box">' +
          '<div class="vocab-example-jp">' +
          esc(formatHighlightedExample(w)) +
          "</div>" +
          "<div>" +
          esc(w.exampleKo || "") +
          "</div>" +
          "</div>" +
          '<div class="vocab-card__foot">' +
          "<span>4채널 부호화 기억카드</span>" +
          "<span>앞면으로 ↻</span>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>"
      );
    }

    grid.innerHTML = html.join("");
  }

  /* ------------------------------------------------------------------------
     Battle Phase Rendering (Wave 1 Quiz / Wave 2 Pair Matrix / Wave 3 Kana Shards)
     ------------------------------------------------------------------------ */
  function updateBattleHud(state) {
    if (!state || !state.battle) return;
    const b = state.battle;

    const wavePill = byId("battle-wave-pill");
    if (wavePill) {
      const q = b.currentQuestion;
      const isBoss = Boolean((q && (q.isBoss || q.isRevenge)) || b.wave >= 4);
      wavePill.textContent = b.waveTitle || "WAVE " + (b.wave || 1);
      wavePill.classList.toggle("is-boss", isBoss);
    }

    const progPill = byId("battle-progress-pill");
    if (progPill) {
      const cur = Math.min((b.questionIndex || 0) + 1, Math.max(1, b.totalQuestions || 1));
      progPill.textContent = cur + " / " + Math.max(1, b.totalQuestions || 1);
    }

    const shieldEl = byId("battle-shields");
    if (shieldEl) {
      shieldEl.textContent = "🛡️×" + (b.shields || 0);
    }

    const heartEl = byId("battle-hearts");
    if (heartEl) {
      if (state.mode === "survival") {
        heartEl.hidden = false;
        const h = Math.max(0, b.hearts || 0);
        const maxH = Math.max(3, b.maxHearts || 3);
        heartEl.textContent = "❤️".repeat(h) + "🖤".repeat(Math.max(0, maxH - h));
      } else {
        heartEl.hidden = true;
      }
    }

    const comboEl = byId("battle-combo-pill");
    if (comboEl) {
      const mult = Number(b.comboMultiplier || 1).toFixed(1);
      comboEl.textContent = b.feverActive
        ? "🌸 SAKURA FEVER! " + (b.combo || 0) + " COMBO · x2.0"
        : (b.combo || 0) + " COMBO · x" + mult;
      comboEl.classList.toggle("is-fever", Boolean(b.feverActive));
    }

    const scoreEl = byId("battle-score");
    if (scoreEl) {
      scoreEl.textContent = Number(b.score || 0).toLocaleString();
    }

    const hintBtn = byId("btn-use-hint");
    const hintsLeftEl = byId("battle-hints-left");
    const hintsLeft = typeof b.hintsRemaining === "number" ? b.hintsRemaining : 0;
    if (hintsLeftEl) hintsLeftEl.textContent = String(hintsLeft);
    if (hintBtn) hintBtn.disabled = hintsLeft <= 0 || state.subState !== "PLAYING";

    updateBattleBars(b);
  }

  function updateBattleBars(b) {
    if (!b) return;
    const qFill = byId("battle-q-timer-fill");
    if (qFill) {
      const totalMs = Math.max(1000, Number(b.totalSec || 10) * 1000);
      const remMs = typeof b.remainingMs === "number" ? b.remainingMs : Number(b.remainingSec || 0) * 1000;
      const pct = Math.max(0, Math.min(100, (remMs / totalMs) * 100));
      qFill.style.width = pct.toFixed(1) + "%";
      qFill.classList.toggle("is-urgent", remMs <= 3200);
    }

    const fFill = byId("battle-fever-fill");
    if (fFill) {
      const fpct = b.feverActive ? 100 : Math.max(0, Math.min(100, Number(b.feverGauge || 0)));
      fFill.style.width = fpct.toFixed(1) + "%";
    }
  }

  function buildQuestionTagsHtml(q) {
    const tags = [];
    if (q.isPinned) {
      tags.push('<span class="bounty-tag">⭐ 핀 바운티 x2.0</span>');
    }
    if (q.isBoss) {
      tags.push('<span class="revenge-tag">👑 BOSS FINALE</span>');
    } else if (q.isRevenge) {
      tags.push('<span class="revenge-tag">🔥 약점 복수 보너스</span>');
    }
    if (q.pos) {
      tags.push('<span class="pos-tag">' + esc(q.pos) + "</span>");
    }
    return '<div class="question-header-tags">' + tags.join("") + "</div>";
  }

  function renderBattleQuestion(state, forceRender) {
    if (!state || !state.battle) return;
    const b = state.battle;
    const q = b.currentQuestion;
    const arena = byId("battle-arena");
    if (!arena || !q) return;

    const qKey = (b.wave || 1) + ":" + (b.questionIndex || 0) + ":" + (q.id || q.type || "");
    if (!forceRender && uiState.renderedQuestionKey === qKey) {
      return;
    }
    uiState.renderedQuestionKey = qKey;
    uiState.lastQuestionEnteredAt = Date.now();
    uiState.inputLocked = false;

    const hc = byId("hypercorrection-overlay");
    if (hc && state.subState !== "FEEDBACK") hc.hidden = true;

    if (q.type === "pair-match") {
      renderPairMatchQuestion(arena, q);
    } else if (q.type === "kana-spelling" || q.type === "spelling") {
      renderKanaSpellingQuestion(arena, q);
    } else {
      renderMultipleChoiceOrListening(arena, q);
    }
  }

  function renderMultipleChoiceOrListening(arena, q) {
    const isListening = q.type === "listening" || q.subType === "audio-to-ko";
    const isKanjiReading = q.subType === "kanji-to-kana";
    const wordObj = q.word || getWordById(q.wordId) || {};
    const wordId = q.wordId || wordObj.id || "";

    const modeLabel = isListening
      ? "🎧 JLPT N5 청해 — 일본어 발음을 듣고 알맞은 뜻을 고르세요"
      : isKanjiReading
        ? "🈯 JLPT N5 한자 읽기 — 장음·촉음·탁음에 주의하여 정확한 가나를 고르세요"
        : q.subType === "ko-to-jp"
          ? "🇰🇷 한국어 뜻에 알맞은 일본어 어휘를 고르세요"
          : q.subType === "cloze"
            ? "📝 일본어 예문 빈칸 ［　　］에 들어갈 알맞은 어휘를 고르세요"
            : "🇯🇵 일본어 어휘의 알맞은 한국어 뜻을 고르세요";

    // Prompt rendering: kanji-to-kana MUST show pure kanji without furigana!
    let mainPromptHtml = "";
    if (isKanjiReading) {
      mainPromptHtml = esc(q.prompt || wordObj.kanji || wordObj.expression || "");
    } else if (q.promptHtml) {
      mainPromptHtml = safeRubyHtml(q.promptHtml, q.prompt);
    } else if (q.subType === "jp-to-ko" && wordObj.rubyHtml) {
      mainPromptHtml = safeRubyHtml(wordObj.rubyHtml, wordObj.expression);
    } else {
      mainPromptHtml = esc(q.prompt || wordObj.expression || "");
    }

    const options = Array.isArray(q.options) ? q.options : [];
    const optHtml = options
      .map(function (opt, idx) {
        const labelRendered = opt.labelHtml
          ? safeRubyHtml(opt.labelHtml, opt.label)
          : esc(opt.label !== undefined ? opt.label : opt.text || "");
        const sub = opt.subLabel
          ? '<small style="opacity:0.68;margin-left:auto;font-size:0.78rem;">' + esc(opt.subLabel) + "</small>"
          : "";
        return (
          '<button type="button" class="mc-option-btn' +
          (opt.eliminated ? " is-eliminated" : "") +
          '" data-action="answer-option" data-index="' +
          idx +
          '" data-option-id="' +
          esc(opt.id || "opt_" + idx) +
          '"' +
          (opt.eliminated ? " disabled" : "") +
          ">" +
          '<span class="mc-keycap">' +
          (idx + 1) +
          "</span>" +
          "<span>" +
          labelRendered +
          "</span>" +
          sub +
          "</button>"
        );
      })
      .join("");

    arena.innerHTML =
      buildQuestionTagsHtml(q) +
      '<div class="question-prompt-box" style="margin-top:10px;">' +
      '<span class="q-prompt-label">' +
      esc(modeLabel) +
      "</span>" +
      (q.emoji ? '<div style="font-size:2.05rem;line-height:1.1;">' + esc(q.emoji) + "</div>" : "") +
      (isListening
        ? '<button type="button" class="audio-wave-btn" data-action="speak-word" data-word-id="' +
          esc(wordId) +
          '">' +
          '<span class="wave-bars"><span></span><span></span><span></span><span></span><span></span></span>' +
          "<span>일본어 발음 다시 듣기</span>" +
          "</button>"
        : '<div id="battle-q-prompt-main" class="q-prompt-main' +
          (isKanjiReading ? " q-prompt-main--kanji" : "") +
          '">' +
          mainPromptHtml +
          "</div>") +
      (q.subPrompt ? '<div class="q-prompt-sub">' + esc(q.subPrompt) + "</div>" : "") +
      "</div>" +
      '<div id="battle-hint-banner" class="q-hint-banner" style="margin-top:10px;" hidden></div>' +
      '<div class="mc-options-grid" style="margin-top:14px;">' +
      optHtml +
      "</div>";
  }

  function renderPairMatchQuestion(arena, q) {
    const tiles = Array.isArray(q.tiles) ? q.tiles : [];
    let leftTiles = tiles.filter(function (t) {
      return t.side === "jp" || t.side === "kanji" || t.side === "en";
    });
    let rightTiles = tiles.filter(function (t) {
      return t.side !== "jp" && t.side !== "kanji" && t.side !== "en";
    });
    if (leftTiles.length === 0 || rightTiles.length === 0) {
      const half = Math.ceil(tiles.length / 2);
      leftTiles = tiles.slice(0, half);
      rightTiles = tiles.slice(half);
    }

    const matchedCount = Array.isArray(q.matchedPairIds) ? q.matchedPairIds.length : 0;
    const totalPairs = q.totalPairs || 5;
    const isKanjiKana = q.subType === "kanji-kana-5x2";

    function renderCol(list) {
      return list
        .map(function (t) {
          const classes = ["pair-tile"];
          if (t.matched) classes.push("is-matched");
          if (t.selected || q.selectedTileId === t.tileId) classes.push("is-selected");
          if (q.hintPairWordId && Number(t.wordId) === Number(q.hintPairWordId) && !t.matched) {
            classes.push("is-hinted");
          }
          const content = t.labelHtml ? safeRubyHtml(t.labelHtml, t.label) : esc(t.label);
          return (
            '<button type="button" class="' +
            classes.join(" ") +
            '" data-action="match-tile" data-tile-id="' +
            esc(t.tileId) +
            '" data-word-id="' +
            esc(t.wordId) +
            '" data-side="' +
            esc(t.side) +
            '"' +
            (t.matched ? " disabled" : "") +
            ">" +
            "<span>" +
            content +
            "</span>" +
            "</button>"
          );
        })
        .join("");
    }

    arena.innerHTML =
      '<div class="question-prompt-box" style="padding:12px 14px;">' +
      '<span class="q-prompt-label">🌸 WAVE 2 · 사쿠라 글래스 매트릭스 스피드 매칭</span>' +
      '<div style="font-weight:800;font-size:0.98rem;">' +
      (isKanjiKana
        ? "왼쪽 한자 표기와 오른쪽 히라가나 읽기를 짝지어 터치하세요!"
        : "왼쪽 일본어 어휘와 오른쪽 한국어 뜻을 짝지어 터치하세요!") +
      ' (<span id="pair-matched-count">' +
      matchedCount +
      "</span>/" +
      totalPairs +
      "쌍 완료)</div>" +
      "</div>" +
      '<div id="battle-hint-banner" class="q-hint-banner" style="margin-top:8px;" hidden></div>' +
      '<div class="pair-matrix" style="margin-top:12px;">' +
      '<div class="pair-col">' +
      renderCol(leftTiles) +
      "</div>" +
      '<div class="pair-col">' +
      renderCol(rightTiles) +
      "</div>" +
      "</div>";
  }

  function buildRomajiBufferInner(q) {
    const buf = String((q && q.romajiBuffer) || "");
    const preview = String((q && q.romajiPreviewKana) || "");
    if (buf) {
      return (
        '<span>⌨️ 로마자 변환 중:</span>' +
        '<span class="romaji-buffer-code">' +
        esc(buf) +
        "_</span>" +
        (preview ? '<span>→ <strong class="jp-text">' + esc(preview) + "</strong></span>" : "")
      );
    }
    return "⌨️ 영문 키보드(예: sensei, gakkou, chotto) 타이핑 또는 아래 가나 샤드를 클릭하세요!";
  }

  function renderKanaSpellingQuestion(arena, q) {
    const wordObj = q.word || getWordById(q.wordId) || {};
    const targetUnits = Array.isArray(q.targetUnits) ? q.targetUnits : [];
    const targetLen = Number(
      q.targetLength || targetUnits.length || (q.targetKana ? q.targetKana.length : 0) || 1
    );
    const enteredUnits = Array.isArray(q.enteredUnits) ? q.enteredUnits : [];
    const enteredText = String(q.enteredText || "");
    const kanjiHint = q.kanjiHint !== undefined ? q.kanjiHint : wordObj.kanji || "";

    const slots = [];
    for (let i = 0; i < targetLen; i++) {
      const unit = enteredUnits[i] !== undefined ? enteredUnits[i] : enteredText.charAt(i) || "";
      slots.push(
        '<span class="kana-slot letter-slot' +
          (unit ? " is-filled" : "") +
          '" data-slot-index="' +
          i +
          '">' +
          esc(unit) +
          "</span>"
      );
    }

    const shards = Array.isArray(q.shards) ? q.shards : [];
    const shardHtml = shards
      .map(function (sh) {
        const mora = sh.mora || sh.char || "";
        return (
          '<button type="button" class="kana-shard letter-shard' +
          (sh.used ? " is-used" : "") +
          '" data-action="tap-shard" data-shard-id="' +
          esc(sh.shardId) +
          '" data-char="' +
          esc(mora) +
          '" data-mora="' +
          esc(mora) +
          '"' +
          (sh.used ? " disabled" : "") +
          ">" +
          "<span>" +
          esc(mora) +
          "</span>" +
          (sh.romajiHint ? "<small>" + esc(sh.romajiHint) + "</small>" : "") +
          "</button>"
        );
      })
      .join("");

    const hasBuf = Boolean(q.romajiBuffer);

    arena.innerHTML =
      buildQuestionTagsHtml(q) +
      '<div class="question-prompt-box" style="margin-top:10px;">' +
      '<span class="q-prompt-label">💎 WAVE 3 · 가나 크리스탈 샤드 &amp; 로마자 타격 (' +
      targetLen +
      "박자)</span>" +
      (q.emoji ? '<div style="font-size:1.95rem;line-height:1.1;">' + esc(q.emoji) + "</div>" : "") +
      '<div class="q-prompt-main" style="line-height:1.35;">' +
      esc(q.prompt || wordObj.meaning || "") +
      "</div>" +
      (kanjiHint ? '<span class="kanji-hint-pill">🈯 한자 단서: ' + esc(kanjiHint) + "</span>" : "") +
      (q.subPrompt ? '<div class="q-prompt-sub">' + esc(q.subPrompt) + "</div>" : "") +
      "</div>" +
      '<div id="battle-hint-banner" class="q-hint-banner" style="margin-top:10px;" hidden></div>' +
      '<div class="spelling-arena" style="margin-top:14px;">' +
      '<div id="spelling-slots" class="spelling-slots">' +
      slots.join("") +
      "</div>" +
      '<div id="romaji-buffer-display" class="romaji-buffer-capsule' +
      (hasBuf ? " is-typing" : "") +
      '" data-role="romaji-buffer">' +
      buildRomajiBufferInner(q) +
      "</div>" +
      '<div id="spelling-shards" class="shard-pool">' +
      shardHtml +
      "</div>" +
      '<div class="spelling-controls">' +
      '<button type="button" class="btn-glass" data-action="kana-backspace">⌫ 지우기 (Backspace)</button>' +
      '<button type="button" class="btn-glass" data-action="kana-clear">↺ 초기화</button>' +
      '<button type="button" class="btn-prism btn-emerald" data-action="kana-submit">⏎ 정답 확정 (Enter)</button>' +
      "</div>" +
      "</div>";
  }

  /* In-Place DOM Update on pairMatchUpdate (Zero Node Detachment!) */
  function updatePairMatchDom(q) {
    if (!q || typeof document === "undefined") return;
    const matchedCount = Array.isArray(q.matchedPairIds) ? q.matchedPairIds.length : 0;
    const countEl = byId("pair-matched-count");
    if (countEl) countEl.textContent = String(matchedCount);

    const tileMap = new Map();
    if (Array.isArray(q.tiles)) {
      q.tiles.forEach(function (t) {
        tileMap.set(String(t.tileId), t);
      });
    }

    document.querySelectorAll("#battle-arena .pair-tile[data-tile-id]").forEach(function (btn) {
      const tid = btn.getAttribute("data-tile-id");
      const t = tileMap.get(String(tid));
      if (!t) return;
      const isMatched = Boolean(t.matched);
      const isSelected = Boolean(t.selected || q.selectedTileId === t.tileId);
      const isHinted = Boolean(q.hintPairWordId && Number(t.wordId) === Number(q.hintPairWordId) && !isMatched);

      btn.classList.remove("is-mismatch");
      btn.classList.toggle("is-matched", isMatched);
      btn.classList.toggle("is-selected", isSelected);
      btn.classList.toggle("is-hinted", isHinted);
      btn.disabled = isMatched;
    });
  }

  /* In-Place DOM Update on kanaUpdate / spellingUpdate */
  function updateKanaSpellingDom(q) {
    if (!q || typeof document === "undefined") return;
    const slotsWrap = byId("spelling-slots");
    if (slotsWrap) {
      const enteredUnits = Array.isArray(q.enteredUnits) ? q.enteredUnits : null;
      const enteredText = String(q.enteredText || "");
      const slotEls = slotsWrap.querySelectorAll(".kana-slot, .letter-slot");
      slotEls.forEach(function (el, idx) {
        const val = enteredUnits ? enteredUnits[idx] || "" : enteredText.charAt(idx) || "";
        el.textContent = val;
        el.classList.toggle("is-filled", Boolean(val));
      });
    }

    const bufEl = byId("romaji-buffer-display");
    if (bufEl) {
      bufEl.classList.toggle("is-typing", Boolean(q.romajiBuffer));
      bufEl.innerHTML = buildRomajiBufferInner(q);
    }

    const shardsWrap = byId("spelling-shards");
    if (shardsWrap && Array.isArray(q.shards)) {
      const map = new Map();
      q.shards.forEach(function (s) {
        map.set(String(s.shardId), Boolean(s.used));
      });
      shardsWrap.querySelectorAll("[data-shard-id]").forEach(function (btn) {
        const used = Boolean(map.get(btn.getAttribute("data-shard-id")));
        btn.classList.toggle("is-used", used);
        btn.disabled = used;
      });
    }
  }

  function showHypercorrectionOverlay(payload) {
    const hc = byId("hypercorrection-overlay");
    if (!hc || !payload) return;
    const w = payload.word || getWordById(payload.wordId) || {};
    const badge = byId("hc-badge");
    if (badge) {
      badge.textContent = payload.shieldUsed
        ? "🛡️ 사쿠라 글래스 쉴드가 콤보를 지켰어요! 후리가나를 눈에 새기세요"
        : "⚡ 오답 즉시 각인 (오답노트 자동 편입 · 2.4초)";
    }
    const emojiEl = byId("hc-emoji");
    const wordEl = byId("hc-word");
    const phonEl = byId("hc-phonetic");
    const meanEl = byId("hc-meaning");
    const tipEl = byId("hc-tip");
    const speakBtn = byId("hc-speak-btn");

    if (emojiEl) emojiEl.textContent = w.emoji || "💡";
    if (wordEl) {
      wordEl.innerHTML = safeRubyHtml(
        payload.revealRubyHtml || w.rubyHtml,
        w.expression || w.kana || payload.correctAnswer || ""
      );
    }
    if (phonEl) {
      const parts = [w.kana, w.koPron ? "[" + w.koPron + "]" : "", w.romaji].filter(Boolean);
      phonEl.textContent = parts.join(" · ");
    }
    if (meanEl) meanEl.textContent = w.meaning || "";
    if (tipEl) tipEl.textContent = "💡 " + (w.tip || w.example || "장음·촉음 박자와 소리를 함께 기억하세요!");
    if (speakBtn && w.id) speakBtn.setAttribute("data-word-id", String(w.id));

    uiState.lastFeedbackEnteredAt = Date.now();
    hc.hidden = false;
  }

  /* ------------------------------------------------------------------------
     Result Screen Rendering
     ------------------------------------------------------------------------ */
  function renderResultScreen(summary, state) {
    const fullState = summary && summary.state ? summary.state : state;
    const res = summary && summary.summary ? summary.summary : summary || (fullState && fullState.result);
    if (!res) return;

    updateNavStats();
    FX.burst((root.innerWidth || 800) * 0.5, (root.innerHeight || 600) * 0.28, 32);

    const rankOrb = byId("result-rank-orb");
    const starsEl = byId("result-stars");
    const titleEl = byId("result-title");
    const subEl = byId("result-subtitle");

    const rank = res.rank || "A";
    const stars = typeof res.stars === "number" ? res.stars : 2;
    if (rankOrb) rankOrb.textContent = rank;
    if (starsEl) starsEl.textContent = "★".repeat(stars) + "☆".repeat(Math.max(0, 3 - stars));

    const mode = res.mode || (fullState && fullState.mode) || "campaign";
    const roundNum = res.round || (fullState && fullState.round) || 1;
    const maxRounds = getAllRounds().length || 50;

    if (titleEl) {
      titleEl.textContent =
        mode === "survival"
          ? "⚡ 서바이벌 블리츠 종료!"
          : mode === "revenge"
            ? "🔥 약점 복수 도장 클리어!"
            : "ROUND " + roundNum + " 클리어!";
    }
    if (subEl) {
      subEl.textContent =
        rank === "S+" || rank === "S"
          ? "완벽해요! 한자 읽기와 가나 박자가 장기 기억에 각인되었습니다 🌸"
          : "훌륭한 도전이에요! 아래 오답 어휘의 장음·촉음을 확인하면 바로 S+ 달성!";
    }

    const elScore = byId("res-score");
    const elAcc = byId("res-accuracy");
    const elCombo = byId("res-max-combo");
    const elBonus = byId("res-early-bonus");

    const accVal =
      typeof res.accuracy === "number"
        ? res.accuracy <= 1 && res.totalQuestions > 1 && res.correctCount > 0 && res.accuracy < 1.01
          ? Math.round(res.accuracy * 100)
          : Math.round(res.accuracy)
        : 100;

    if (elScore) elScore.textContent = Number(res.score || 0).toLocaleString();
    if (elAcc) elAcc.textContent = accVal + "%";
    if (elCombo) elCombo.textContent = String(res.maxCombo || 0);
    if (elBonus) {
      const bonusSum = Number(res.earlyBonusPoints || 0) + Number(res.pinBountyPoints || 0);
      elBonus.textContent = "+" + bonusSum.toLocaleString();
    }

    const badgesRow = byId("result-badges-row");
    const unlocked = Array.isArray(res.unlockedBadges) ? res.unlockedBadges : [];
    if (badgesRow) {
      if (unlocked.length > 0) {
        badgesRow.hidden = false;
        badgesRow.innerHTML = unlocked
          .map(function (b) {
            return (
              '<span class="bounty-tag">🏅 새 업적 달성: ' +
              esc((b.icon || "🌸") + " " + (b.name || b.title || b.id)) +
              "</span>"
            );
          })
          .join("");
      } else {
        badgesRow.hidden = true;
      }
    }

    const nextBtn = byId("btn-next-round");
    if (nextBtn) {
      if (mode === "campaign" && roundNum < maxRounds) {
        nextBtn.hidden = false;
        nextBtn.textContent = "🌸 Round " + (roundNum + 1) + " 출격 →";
      } else if (mode === "campaign" && roundNum >= maxRounds) {
        nextBtn.hidden = false;
        nextBtn.textContent = "👑 Round 1부터 마스터 투어";
      } else {
        nextBtn.hidden = true;
      }
    }

    const reviewGrid = byId("result-review-grid");
    if (!reviewGrid) return;

    const ls = getLS();
    let reviewItems = Array.isArray(res.wordResults) ? res.wordResults : [];
    if (reviewItems.length === 0 && fullState && fullState.memorize && Array.isArray(fullState.memorize.words)) {
      reviewItems = fullState.memorize.words.map(function (w) {
        return { word: w, wordId: w.id, wrong: 0, wrongCount: 0, correctCount: 1 };
      });
    }

    const wrongSet = new Set(
      Array.isArray(res.wrongWords)
        ? res.wrongWords.map(function (w) {
            return typeof w === "object" ? w.id : Number(w);
          })
        : []
    );

    reviewGrid.innerHTML = reviewItems
      .map(function (item) {
        const w = item.word || getWordById(item.wordId || item.id);
        if (!w) return "";
        const missed = Boolean(item.wrong > 0 || item.wrongCount > 0 || item.missed || wrongSet.has(w.id));
        const prog = ls && typeof ls.getWordProgress === "function" ? ls.getWordProgress(w.id) : { box: 0, pinned: false };
        const isPinned = Boolean(prog.pinned);
        return (
          '<div class="glass-card review-word-row ' +
          (missed ? "is-missed" : "is-cleared") +
          '">' +
          "<div>" +
          '<div class="jp-text" style="font-weight:900;font-size:1.05rem;line-height:1.8;">' +
          esc(w.emoji || "") +
          " " +
          safeRubyHtml(w.rubyHtml, w.expression || w.kana) +
          ' <span class="box-pill box-pill--' +
          (prog.box || 0) +
          '">Box ' +
          (prog.box || 0) +
          "</span></div>" +
          '<div style="font-size:0.83rem;color:var(--text-secondary);">' +
          esc(w.meaning) +
          (w.koPron ? " · [" + esc(w.koPron) + "]" : "") +
          "</div>" +
          "</div>" +
          '<div style="display:flex;gap:5px;">' +
          '<button type="button" class="card-mini-btn" data-action="speak-word" data-word-id="' +
          w.id +
          '" title="발음 듣기">🔊</button>' +
          '<button type="button" class="card-mini-btn' +
          (isPinned ? " is-pinned" : "") +
          '" data-action="toggle-pin" data-word-id="' +
          w.id +
          '" title="별표 토글">' +
          (isPinned ? "⭐" : "☆") +
          "</button>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  /* ------------------------------------------------------------------------
     500-Word JLPT N5 Prism Codex & Interactive Gojuon / Badges Modals
     ------------------------------------------------------------------------ */
  function openCodex() {
    if (uiState.activeScreen !== "codex") {
      uiState.previousScreenBeforeCodex = uiState.activeScreen || "lobby";
    }
    uiState.codexLimit = 60;
    showScreen("codex");
    renderCodex();
  }

  function closeCodex() {
    const target = uiState.previousScreenBeforeCodex || "lobby";
    showScreen(target);
    if (target === "lobby") renderLobby();
  }

  function renderCodex() {
    const grid = byId("codex-grid");
    if (!grid) return;

    const ls = getLS();
    const wb = getWB();
    const rh = getRomajiHelper();
    const stats = getMasterySnapshot();
    const totalWords = stats.total || getAllWords().length || 500;

    const codexTitle = byId("codex-main-title");
    if (codexTitle) codexTitle.textContent = "📖 PRISM N5 " + totalWords + "단어 프리즘 도감";

    const cAll = byId("cf-count-all");
    const cMas = byId("cf-count-mastered");
    const cLea = byId("cf-count-learning");
    const cUns = byId("cf-count-unseen");
    const cPin = byId("cf-count-pinned");
    const cWro = byId("cf-count-wrong");
    if (cAll) cAll.textContent = String(totalWords);
    if (cMas) cMas.textContent = String(stats.mastered || 0);
    if (cLea) cLea.textContent = String(stats.learning || 0);
    if (cUns) cUns.textContent = String(stats.unseen != null ? stats.unseen : totalWords);
    if (cPin) cPin.textContent = String(stats.pinnedCount || 0);
    if (cWro) cWro.textContent = String(stats.wrongNoteCount || 0);

    let candidates = null;
    if (ls && typeof ls.getWordsForCodex === "function") {
      try {
        candidates = ls.getWordsForCodex({
          status: uiState.codexFilter,
          query: uiState.codexQuery,
          level: uiState.codexLevel ? Number(uiState.codexLevel) : undefined,
          pos: uiState.codexPos || undefined
        });
      } catch (_) {
        candidates = null;
      }
    }

    if (!Array.isArray(candidates)) {
      const q = uiState.codexQuery.trim().toLowerCase();
      if (wb && typeof wb.searchWords === "function") {
        candidates = wb.searchWords(uiState.codexQuery, {
          level: uiState.codexLevel ? Number(uiState.codexLevel) : undefined,
          pos: uiState.codexPos || undefined
        });
        if (q && candidates.length === 0 && rh && typeof rh.matchesQuery === "function") {
          candidates = getAllWords().filter(function (w) {
            if (uiState.codexLevel && String(w.level) !== String(uiState.codexLevel)) return false;
            if (uiState.codexPos && w.pos !== uiState.codexPos) return false;
            return rh.matchesQuery(w, q);
          });
        }
      } else {
        candidates = getAllWords().filter(function (w) {
          if (uiState.codexLevel && String(w.level) !== String(uiState.codexLevel)) return false;
          if (uiState.codexPos && w.pos !== uiState.codexPos) return false;
          if (!q) return true;
          if (rh && typeof rh.matchesQuery === "function" && rh.matchesQuery(w, q)) return true;
          return (
            (w.expression && w.expression.toLowerCase().indexOf(q) !== -1) ||
            (w.kanji && w.kanji.toLowerCase().indexOf(q) !== -1) ||
            (w.kana && w.kana.toLowerCase().indexOf(q) !== -1) ||
            (w.romaji && w.romaji.toLowerCase().indexOf(q) !== -1) ||
            (w.koPron && w.koPron.toLowerCase().indexOf(q) !== -1) ||
            (w.meaning && w.meaning.toLowerCase().indexOf(q) !== -1) ||
            (w.theme && w.theme.toLowerCase().indexOf(q) !== -1)
          );
        });
      }

      const f = uiState.codexFilter;
      if (f !== "all" && ls) {
        const pinnedSet = new Set(typeof ls.getPinnedWordIds === "function" ? ls.getPinnedWordIds().map(Number) : []);
        const wrongSet = new Set(typeof ls.getWrongWordIds === "function" ? ls.getWrongWordIds().map(Number) : []);
        candidates = candidates.filter(function (w) {
          if (f === "pinned") return pinnedSet.has(Number(w.id));
          if (f === "wrong") return wrongSet.has(Number(w.id));
          const prog = typeof ls.getWordProgress === "function" ? ls.getWordProgress(w.id) : { status: "unseen" };
          return prog.status === f;
        });
      }
    }

    const countEl = byId("codex-result-count");
    if (countEl) countEl.textContent = "검색 결과 " + candidates.length + "개";

    const slice = candidates.slice(0, uiState.codexLimit);
    const moreBtn = byId("btn-codex-more");
    if (moreBtn) {
      moreBtn.hidden = candidates.length <= uiState.codexLimit;
      moreBtn.textContent = "더 많은 단어 보기 (" + slice.length + " / " + candidates.length + ")";
    }

    if (slice.length === 0) {
      grid.innerHTML =
        '<div class="glass-panel" style="grid-column:1/-1;padding:32px;text-align:center;color:var(--text-secondary);">' +
        "조건에 해당하는 JLPT N5 어휘가 없습니다. 검색어(한자·가나·로마자·뜻)나 필터를 변경해 보세요! 🌸" +
        "</div>";
      return;
    }

    grid.innerHTML = slice
      .map(function (w) {
        const prog =
          ls && typeof ls.getWordProgress === "function"
            ? ls.getWordProgress(w.id)
            : { box: 0, pinned: false, inWrongNote: false };
        const boxLabel =
          prog.box === 3 ? "🌸 마스터" : prog.box >= 1 ? "🌱 Box " + prog.box : "미학습";

        return (
          '<article class="glass-card codex-card" data-word-id="' +
          w.id +
          '">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">' +
          '<span style="font-size:0.74rem;color:var(--text-muted);font-weight:700;">R' +
          w.round +
          " · " +
          esc(w.pos) +
          "</span>" +
          '<div style="display:inline-flex;align-items:center;gap:5px;">' +
          '<span class="box-pill box-pill--' +
          (prog.box || 0) +
          '">' +
          boxLabel +
          "</span>" +
          '<button type="button" class="card-mini-btn" data-action="speak-word" data-word-id="' +
          w.id +
          '" title="ja-JP 발음 듣기">🔊</button>' +
          '<button type="button" class="card-mini-btn' +
          (prog.pinned ? " is-pinned" : "") +
          '" data-action="toggle-pin" data-word-id="' +
          w.id +
          '" title="별표 핀">' +
          (prog.pinned ? "⭐" : "☆") +
          "</button>" +
          "</div>" +
          "</div>" +
          '<div class="codex-jp-line">' +
          '<span style="font-size:1.3rem;">' +
          esc(w.emoji || "🌸") +
          "</span>" +
          '<strong class="jp-text" style="font-size:1.26rem;font-weight:900;">' +
          safeRubyHtml(w.rubyHtml, w.expression || w.kana) +
          "</strong>" +
          '<span class="vocab-phonetic">' +
          esc(w.koPron ? "[" + w.koPron + "] · " : "") +
          esc(w.romaji || "") +
          "</span>" +
          "</div>" +
          '<div style="font-weight:800;color:var(--accent-cyan);font-size:0.96rem;">' +
          esc(w.meaning) +
          "</div>" +
          '<div style="font-size:0.79rem;color:var(--text-secondary);">💡 ' +
          esc(w.tip || "") +
          "</div>" +
          '<div class="jp-text" style="font-size:0.79rem;color:var(--text-muted);border-top:1px solid var(--glass-border);padding-top:6px;">' +
          esc(w.example || "") +
          (w.exampleKo ? '<div style="margin-top:2px;">' + esc(w.exampleKo) + "</div>" : "") +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  /* Gojuon Data Extractor (Supports LearningSystem.GOJUON_DATA in any structure + Fallback) */
  function extractFlatCells(rawGroup, fallbackList) {
    if (!rawGroup) return fallbackList;
    if (Array.isArray(rawGroup)) {
      const out = [];
      for (let i = 0; i < rawGroup.length; i++) {
        const item = rawGroup[i];
        if (Array.isArray(item)) {
          for (let j = 0; j < item.length; j++) out.push(item[j]);
        } else if (item && Array.isArray(item.cells)) {
          for (let j = 0; j < item.cells.length; j++) out.push(item.cells[j]);
        } else {
          out.push(item);
        }
      }
      if (out.length > 0) return out;
    }
    return fallbackList;
  }

  function renderGojuonCell(cell) {
    if (!cell || (!cell.hira && !cell.kata)) {
      return '<div class="gojuon-cell gojuon-cell--empty" aria-hidden="true">·</div>';
    }
    const script = uiState.gojuonScript;
    const hira = cell.hira || "";
    const kata = cell.kata || "";
    const speakTarget = script === "kata" ? kata || hira : hira || kata;

    let mainChar = hira;
    let subChar = kata;
    if (script === "hira") {
      mainChar = hira;
      subChar = "";
    } else if (script === "kata") {
      mainChar = kata;
      subChar = "";
    }

    return (
      '<button type="button" class="gojuon-cell" data-action="speak-kana" data-kana="' +
      esc(speakTarget) +
      '" title="' +
      esc(hira + " / " + kata + " (" + (cell.romaji || "") + ") 발음 듣기") +
      '">' +
      '<span class="gojuon-char-main">' +
      esc(mainChar) +
      "</span>" +
      (subChar ? '<span class="gojuon-char-sub">' + esc(subChar) + "</span>" : "") +
      '<span class="gojuon-romaji">' +
      esc(cell.romaji || "") +
      (cell.koPron ? " · " + esc(cell.koPron) : "") +
      "</span>" +
      "</button>"
    );
  }

  function renderGojuonModal() {
    const body = byId("gojuon-body");
    if (!body) return;
    const ls = getLS();
    const rawData =
      (ls && typeof ls.getGojuonData === "function" ? ls.getGojuonData() : null) ||
      (ls && ls.GOJUON_DATA) ||
      FALLBACK_GOJUON;

    const tab = uiState.gojuonTab;
    if (tab === "seion") {
      const cells = extractFlatCells(rawData.seion, extractFlatCells(FALLBACK_GOJUON.seion, []));
      body.innerHTML = '<div class="gojuon-grid-5">' + cells.map(renderGojuonCell).join("") + "</div>";
    } else if (tab === "dakuon") {
      const daku = extractFlatCells(rawData.dakuon, FALLBACK_GOJUON.dakuon).filter(Boolean);
      const handaku = extractFlatCells(rawData.handakuon, FALLBACK_GOJUON.handakuon).filter(Boolean);
      body.innerHTML =
        '<div class="gojuon-section-label">゛ 탁음 (Dakuon · 20자)</div>' +
        '<div class="gojuon-grid-5">' +
        daku.map(renderGojuonCell).join("") +
        "</div>" +
        '<div class="gojuon-section-label">゜ 반탁음 (Handakuon · 5자)</div>' +
        '<div class="gojuon-grid-5">' +
        handaku.map(renderGojuonCell).join("") +
        "</div>";
    } else if (tab === "yoon") {
      const yoonCells = extractFlatCells(rawData.yoon, FALLBACK_GOJUON.yoon).filter(Boolean);
      body.innerHTML = '<div class="gojuon-grid-3">' + yoonCells.map(renderGojuonCell).join("") + "</div>";
    } else {
      const rules =
        Array.isArray(rawData.specialRules) && rawData.specialRules.length > 0
          ? rawData.specialRules
          : FALLBACK_GOJUON.specialRules;
      body.innerHTML = rules
        .map(function (r) {
          const exText = Array.isArray(r.examples)
            ? r.examples
                .map(function (e) {
                  return typeof e === "string" ? e : (e.expression || e.kana || "") + (e.romaji ? " (" + e.romaji + ")" : "");
                })
                .join(" / ")
            : r.examples || "";
          return (
            '<div class="glass-card gojuon-rule-card">' +
            '<strong style="font-size:0.96rem;color:var(--accent-sakura);">' +
            esc(r.title || r.name || "발음 규칙") +
            "</strong>" +
            '<p style="font-size:0.84rem;color:var(--text-secondary);">' +
            esc(r.desc || r.description || "") +
            "</p>" +
            (exText
              ? '<div class="jp-text" style="font-size:0.82rem;color:var(--accent-cyan);font-weight:700;">예시: ' +
                esc(exText) +
                "</div>"
              : "") +
            "</div>"
          );
        })
        .join("");
    }
  }

  function openGojuonModal() {
    const modal = byId("gojuon-modal");
    if (!modal) return;
    renderGojuonModal();
    modal.hidden = false;
  }

  function closeGojuonModal() {
    const modal = byId("gojuon-modal");
    if (modal) modal.hidden = true;
  }

  function openBadgesModal() {
    const modal = byId("badges-modal");
    const grid = byId("badges-grid");
    if (!modal || !grid) return;
    const ls = getLS();
    const badges = ls && typeof ls.getBadges === "function" ? ls.getBadges() : [];

    if (badges.length === 0) {
      grid.innerHTML = '<div style="color:var(--text-secondary);">아직 등록된 업적이 없습니다.</div>';
    } else {
      grid.innerHTML = badges
        .map(function (b) {
          return (
            '<div class="glass-card ach-card' +
            (b.unlocked ? " is-unlocked" : "") +
            '">' +
            '<span style="font-size:1.7rem;">' +
            esc(b.icon || "🏅") +
            "</span>" +
            "<div>" +
            '<div style="font-weight:800;font-size:0.9rem;">' +
            esc(b.name || b.title || b.id) +
            "</div>" +
            '<div style="font-size:0.76rem;color:var(--text-secondary);">' +
            esc(b.desc || "") +
            "</div>" +
            "</div>" +
            "</div>"
          );
        })
        .join("");
    }
    modal.hidden = false;
  }

  function closeBadgesModal() {
    const modal = byId("badges-modal");
    if (modal) modal.hidden = true;
  }

  /* ------------------------------------------------------------------------
     GameEngine Event Subscriptions
     ------------------------------------------------------------------------ */
  function bindEngineEvents() {
    const ge = getGE();
    if (!ge || typeof ge.on !== "function") return;

    uiState.unsubscribers.forEach(function (unsub) {
      if (typeof unsub === "function") unsub();
    });
    uiState.unsubscribers = [];

    uiState.unsubscribers.push(
      ge.on("stateChange", function (payload) {
        const state = payload && payload.state ? payload.state : payload || ge.getState();
        if (!state) return;
        document.body.classList.toggle("is-fever", Boolean(state.battle && state.battle.feverActive));

        if (state.phase === "LOBBY") {
          uiState.renderedQuestionKey = null;
          uiState.renderedStudyKey = null;
          showScreen("lobby");
          renderLobby();
        } else if (state.phase === "MEMORIZE") {
          uiState.renderedQuestionKey = null;
          const studyKey = state.mode + ":" + state.round;
          if (uiState.activeScreen !== "study" || uiState.renderedStudyKey !== studyKey) {
            uiState.flippedWordIds.clear();
            uiState.studyFocusIndex = 0;
            uiState.renderedStudyKey = studyKey;
            showScreen("study");
            renderStudyScreen(state);
          } else if (state.memorize) {
            updateStudyTimerUI(state.memorize);
            updateStudyPinsDom(state.memorize);
          }
        } else if (state.phase === "BATTLE") {
          uiState.renderedStudyKey = null;
          if (uiState.activeScreen !== "battle") {
            showScreen("battle");
          }
          updateBattleHud(state);
          renderBattleQuestion(state, false);
        } else if (state.phase === "RESULT") {
          uiState.renderedQuestionKey = null;
          uiState.renderedStudyKey = null;
          showScreen("result");
          renderResultScreen(state.result, state);
        }
      })
    );

    uiState.unsubscribers.push(
      ge.on("memorizeTick", function (payload) {
        const state = ge.getState();
        updateStudyTimerUI((state && state.memorize) || payload);
      })
    );

    uiState.unsubscribers.push(
      ge.on("memorizeExtended", function () {
        const state = ge.getState();
        if (state && state.memorize) updateStudyTimerUI(state.memorize);
        showToast("⏱️ 암기 시간이 +15초 연장되었습니다!");
      })
    );

    uiState.unsubscribers.push(
      ge.on("pinUpdated", function () {
        const state = ge.getState();
        if (state && state.phase === "MEMORIZE" && state.memorize) {
          updateStudyPinsDom(state.memorize);
        }
      })
    );

    uiState.unsubscribers.push(
      ge.on("questionStart", function () {
        const state = ge.getState();
        updateBattleHud(state);
        renderBattleQuestion(state, true);
      })
    );

    uiState.unsubscribers.push(
      ge.on("battleTick", function () {
        const state = ge.getState();
        if (state && state.battle) {
          updateBattleBars(state.battle);
        }
      })
    );

    function handleKanaOrSpellingUpdate() {
      const state = ge.getState();
      if (state && state.battle && state.battle.currentQuestion) {
        updateKanaSpellingDom(state.battle.currentQuestion);
      }
    }

    uiState.unsubscribers.push(ge.on("kanaUpdate", handleKanaOrSpellingUpdate));
    uiState.unsubscribers.push(ge.on("spellingUpdate", handleKanaOrSpellingUpdate));

    uiState.unsubscribers.push(
      ge.on("pairMatchUpdate", function (payload) {
        const state = ge.getState();
        if (state && state.battle && state.battle.currentQuestion) {
          updatePairMatchDom(state.battle.currentQuestion);
          updateBattleHud(state);
        }
        if (payload && (payload.action === "matched" || payload.matched || payload.isMatch)) {
          FX.burst((root.innerWidth || 800) * 0.5, (root.innerHeight || 600) * 0.45, 14);
          if (payload.pointsEarned) {
            spawnFloatingScore("+" + payload.pointsEarned);
          }
        } else if (payload && (payload.action === "mismatch" || payload.mismatch || payload.isMatch === false)) {
          if (typeof document !== "undefined" && Array.isArray(payload.tileIds)) {
            payload.tileIds.forEach(function (tid) {
              const tEl = document.querySelector('[data-tile-id="' + tid + '"]');
              if (tEl) tEl.classList.add("is-mismatch");
            });
          }
          const stage = byId("battle-stage");
          if (stage) {
            stage.classList.remove("anim-shake");
            void stage.offsetWidth;
            stage.classList.add("anim-shake");
          }
        }
      })
    );

    uiState.unsubscribers.push(
      ge.on("hintUsed", function (payload) {
        const state = ge.getState();
        if (state && state.battle) {
          updateBattleHud(state);
          const q = state.battle.currentQuestion;
          const elimSet = new Set(
            payload && Array.isArray(payload.eliminatedOptionIds) ? payload.eliminatedOptionIds : []
          );
          if (q && (q.type === "multiple-choice" || q.type === "listening")) {
            document.querySelectorAll(".mc-option-btn").forEach(function (btn, idx) {
              const opt = q.options && q.options[idx];
              if ((opt && opt.eliminated) || (opt && elimSet.has(opt.id))) {
                btn.classList.add("is-eliminated");
                btn.disabled = true;
              }
            });
          } else if (q && (q.type === "kana-spelling" || q.type === "spelling")) {
            updateKanaSpellingDom(q);
          } else if (q && q.type === "pair-match") {
            updatePairMatchDom(q);
          }
        }
        const banner = byId("battle-hint-banner");
        if (banner && payload) {
          const rawTxt =
            payload.hintText ||
            (payload.hintData && payload.hintData.text) ||
            (payload.hintData && payload.hintData.tip) ||
            (payload.hint && payload.hint.text) ||
            (payload.hint && payload.hint.tip) ||
            "스마트 힌트가 적용되었습니다!";
          banner.textContent = "💡 " + String(rawTxt).replace(/^💡\s*/, "");
          banner.hidden = false;
        }
      })
    );

    uiState.unsubscribers.push(
      ge.on("feverStart", function () {
        document.body.classList.add("is-fever");
        FX.burst((root.innerWidth || 800) * 0.5, (root.innerHeight || 600) * 0.35, 32);
        showToast("🌸 SAKURA FEVER 돌입! 12초간 점수 2배 & 타이머 감속!", 2200);
      })
    );

    uiState.unsubscribers.push(
      ge.on("feverEnd", function () {
        document.body.classList.remove("is-fever");
      })
    );

    uiState.unsubscribers.push(
      ge.on("shieldBroken", function () {
        showToast("🛡️ 사쿠라 글래스 쉴드가 깨지며 콤보와 하트를 지켰습니다!", 2200);
      })
    );

    uiState.unsubscribers.push(
      ge.on("answerResult", function (payload) {
        const state = ge.getState();
        updateBattleHud(state);
        updateNavStats();
        if (!payload) return;

        const isCorrect = payload.isCorrect !== undefined ? payload.isCorrect : Boolean(payload.correct);
        const pts = Number(payload.pointsEarned || payload.points || 0);

        if (typeof document !== "undefined") {
          const q = (payload && payload.question) || (state && state.battle && state.battle.currentQuestion);
          // Reveal furigana on kanji-to-kana question prompt upon answer feedback!
          if (q && q.subType === "kanji-to-kana" && (payload.revealRubyHtml || (q.word && q.word.rubyHtml))) {
            const pMain = byId("battle-q-prompt-main");
            if (pMain) {
              pMain.innerHTML = safeRubyHtml(
                payload.revealRubyHtml || (q.word && q.word.rubyHtml),
                q.prompt
              );
            }
          }

          const mcBtns = document.querySelectorAll(".mc-option-btn");
          if (mcBtns.length > 0) {
            mcBtns.forEach(function (btn, idx) {
              btn.disabled = true;
              const opt = q && q.options && q.options[idx];
              const isOptCorrect =
                payload.correctIndex === idx ||
                Boolean(opt && opt.isCorrect) ||
                Boolean(opt && payload.correctAnswer && opt.label === payload.correctAnswer);
              const isOptSelectedWrong =
                !isCorrect &&
                (payload.selectedIndex === idx ||
                  Boolean(opt && payload.submittedAnswer && opt.label === payload.submittedAnswer));
              if (isOptCorrect) btn.classList.add("is-correct");
              else if (isOptSelectedWrong) btn.classList.add("is-wrong");
            });
          }
          const slots = document.querySelectorAll("#spelling-slots .kana-slot, #spelling-slots .letter-slot");
          if (slots.length > 0) {
            slots.forEach(function (s) {
              s.classList.add(isCorrect ? "is-correct" : "is-wrong");
            });
          }
        }

        if (isCorrect) {
          FX.burst((root.innerWidth || 800) * 0.5, (root.innerHeight || 600) * 0.42, payload.isPinned ? 28 : 18);
          const tag = payload.isPinned ? " ⭐x2" : state && state.battle && state.battle.feverActive ? " 🌸FEVER" : "";
          if (pts > 0) spawnFloatingScore("+" + pts + tag);
        } else {
          showHypercorrectionOverlay(payload);
        }
      })
    );

    uiState.unsubscribers.push(
      ge.on("roundComplete", function (payload) {
        const summary = payload && payload.summary ? payload.summary : payload;
        const state = payload && payload.state ? payload.state : ge.getState();
        showScreen("result");
        renderResultScreen(summary, state);
      })
    );

    uiState.unsubscribers.push(
      ge.on("notice", function (payload) {
        const msg = typeof payload === "string" ? payload : payload && payload.message;
        if (msg) showToast(msg, 2600);
      })
    );
  }

  /* ------------------------------------------------------------------------
     Delegated Click & Keyboard Action Handlers
     ------------------------------------------------------------------------ */
  function handleAction(action, targetEl) {
    const ge = getGE();
    const ls = getLS();

    switch (action) {
      case "toggle-theme":
        toggleTheme();
        break;

      case "toggle-mute":
        toggleMute();
        break;

      case "toggle-tts":
        toggleTts();
        break;

      case "toggle-tts-speed":
        toggleTtsSpeed();
        break;

      case "open-gojuon":
        openGojuonModal();
        break;

      case "close-gojuon":
        closeGojuonModal();
        break;

      case "gojuon-tab": {
        const tab = targetEl.getAttribute("data-tab") || "seion";
        uiState.gojuonTab = tab;
        document.querySelectorAll('[data-action="gojuon-tab"]').forEach(function (b) {
          b.classList.toggle("is-active", b.getAttribute("data-tab") === tab);
        });
        renderGojuonModal();
        break;
      }

      case "gojuon-script": {
        const sc = targetEl.getAttribute("data-script") || "both";
        uiState.gojuonScript = sc;
        document.querySelectorAll('[data-action="gojuon-script"]').forEach(function (b) {
          b.classList.toggle("is-active", b.getAttribute("data-script") === sc);
        });
        renderGojuonModal();
        break;
      }

      case "speak-kana": {
        const kana = targetEl.getAttribute("data-kana");
        playUiClickSfx();
        speakKanaSafe(kana);
        break;
      }

      case "open-codex":
        openCodex();
        break;

      case "close-codex":
        closeCodex();
        break;

      case "open-badges":
        openBadgesModal();
        break;

      case "close-badges":
        closeBadgesModal();
        break;

      case "reset-progress":
        if (typeof root.confirm === "function" && !root.confirm("모든 JLPT N5 암기 숙련도와 라운드 기록을 초기화할까요?")) {
          return;
        }
        if (ls && typeof ls.resetProgress === "function") ls.resetProgress();
        closeBadgesModal();
        renderLobby();
        showToast("초기화가 완료되었습니다.");
        break;

      case "focus-worldmap": {
        const wm = byId("worldmap-section");
        if (wm && typeof wm.scrollIntoView === "function") {
          wm.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        break;
      }

      case "filter-level": {
        const lv = targetEl.getAttribute("data-level") || "all";
        uiState.lobbyLevelFilter = lv;
        document.querySelectorAll('[data-action="filter-level"]').forEach(function (b) {
          b.classList.toggle("is-active", b.getAttribute("data-level") === lv);
        });
        renderRoundsGrid();
        break;
      }

      case "start-recommended":
      case "start-round": {
        const rNum = Number(targetEl.getAttribute("data-round") || 1);
        if (ge && typeof ge.startCampaignRound === "function") {
          ge.startCampaignRound(rNum, {
            memorizeSec: uiState.memorizeSec,
            battleStyle: uiState.battleStyle
          });
        }
        break;
      }

      case "start-revenge": {
        if (!ge || typeof ge.startRevengeMode !== "function") break;
        const res = ge.startRevengeMode({
          memorizeSec: uiState.memorizeSec,
          battleStyle: uiState.battleStyle
        });
        if (res && res.ok === false) {
          showToast(res.message || "아직 오답이나 ⭐별표 단어가 없어요! 캠페인 라운드를 먼저 플레이해 보세요.");
        }
        break;
      }

      case "start-survival": {
        if (ge && typeof ge.startSurvivalMode === "function") {
          ge.startSurvivalMode({ skipMemorize: true });
        }
        break;
      }

      case "abort-lobby":
      case "back-to-lobby": {
        FX.clear();
        if (ge && typeof ge.abortToLobby === "function") {
          ge.abortToLobby();
        } else {
          showScreen("lobby");
          renderLobby();
        }
        break;
      }

      case "extend-time": {
        if (ge && typeof ge.extendMemorizeTime === "function") {
          ge.extendMemorizeTime(15);
        }
        break;
      }

      case "start-battle-early": {
        if (ge && typeof ge.startBattleFromMemorize === "function") {
          ge.startBattleFromMemorize();
        }
        break;
      }

      case "toggle-mask": {
        const mask = targetEl.getAttribute("data-mask") || "all";
        uiState.studyMask = mask;
        document.querySelectorAll('[data-action="toggle-mask"]').forEach(function (b) {
          b.classList.toggle("is-active", b.getAttribute("data-mask") === mask);
        });
        const maskStage = byId("study-mask-stage");
        if (maskStage) maskStage.setAttribute("data-mask", mask);
        const grid = byId("study-cards-grid");
        if (grid) grid.setAttribute("data-mask", mask);
        break;
      }

      case "set-study-view": {
        const view = targetEl.getAttribute("data-view") || "grid";
        uiState.studyView = view;
        document.querySelectorAll('[data-action="set-study-view"]').forEach(function (b) {
          b.classList.toggle("is-active", b.getAttribute("data-view") === view);
        });
        const state = ge ? ge.getState() : null;
        if (state && state.memorize) renderStudyCards(state.memorize);
        break;
      }

      case "focus-prev": {
        const state = ge ? ge.getState() : null;
        const len = state && state.memorize && state.memorize.words ? state.memorize.words.length : 10;
        uiState.studyFocusIndex = (uiState.studyFocusIndex - 1 + len) % Math.max(1, len);
        if (state && state.memorize) renderStudyCards(state.memorize);
        break;
      }

      case "focus-next": {
        const state = ge ? ge.getState() : null;
        const len = state && state.memorize && state.memorize.words ? state.memorize.words.length : 10;
        uiState.studyFocusIndex = (uiState.studyFocusIndex + 1) % Math.max(1, len);
        if (state && state.memorize) renderStudyCards(state.memorize);
        break;
      }

      case "focus-flip": {
        const state = ge ? ge.getState() : null;
        const w =
          state && state.memorize && state.memorize.words
            ? state.memorize.words[uiState.studyFocusIndex]
            : null;
        if (w) flipWordCard(w.id);
        break;
      }

      case "flip-card": {
        const wordId = Number(targetEl.getAttribute("data-word-id"));
        if (wordId) flipWordCard(wordId);
        break;
      }

      case "speak-word": {
        const wordId = Number(targetEl.getAttribute("data-word-id"));
        if (wordId) {
          speakWordSafe(wordId);
          if (ge && uiState.activeScreen === "study" && typeof ge.markWordStudied === "function") {
            ge.markWordStudied(wordId);
          }
        }
        break;
      }

      case "speak-example": {
        const wordId = Number(targetEl.getAttribute("data-word-id"));
        if (wordId) {
          speakExampleSafe(wordId);
          if (ge && uiState.activeScreen === "study" && typeof ge.markWordStudied === "function") {
            ge.markWordStudied(wordId);
          }
        }
        break;
      }

      case "toggle-pin": {
        const wordId = Number(targetEl.getAttribute("data-word-id"));
        if (!wordId) break;
        if (uiState.activeScreen === "study" && ge && typeof ge.togglePinInRound === "function") {
          const res = ge.togglePinInRound(wordId);
          if (res && res.ok === false && res.message) showToast(res.message, 2000);
        } else if (ls && typeof ls.togglePin === "function") {
          const pinned = ls.togglePin(wordId);
          targetEl.classList.toggle("is-pinned", Boolean(pinned));
          targetEl.textContent = pinned ? "⭐" : "☆";
          if (uiState.activeScreen === "codex" && uiState.codexFilter === "pinned") {
            renderCodex();
          } else if (uiState.activeScreen === "codex") {
            const stats = getMasterySnapshot();
            const cPin = byId("cf-count-pinned");
            if (cPin) cPin.textContent = String(stats.pinnedCount || 0);
          }
          updateNavStats();
        }
        break;
      }

      case "answer-option": {
        if (!ge || uiState.inputLocked) break;
        const state = ge.getState();
        if (!state || state.subState !== "PLAYING") break;
        const idx = Number(targetEl.getAttribute("data-index"));
        if (!Number.isNaN(idx)) {
          uiState.inputLocked = true;
          ge.submitAnswer(idx);
        }
        break;
      }

      case "match-tile": {
        if (!ge) break;
        const state = ge.getState();
        if (!state || state.subState !== "PLAYING") break;
        const tileId = targetEl.getAttribute("data-tile-id");
        if (tileId && typeof ge.selectMatchTile === "function") {
          ge.selectMatchTile(tileId);
        }
        break;
      }

      case "tap-shard": {
        if (!ge) break;
        const state = ge.getState();
        if (!state || state.subState !== "PLAYING") break;
        const shardId = targetEl.getAttribute("data-shard-id");
        if (shardId) {
          if (typeof ge.tapKanaShard === "function") ge.tapKanaShard(shardId);
          else if (typeof ge.tapSpellingShard === "function") ge.tapSpellingShard(shardId);
        }
        break;
      }

      case "kana-backspace":
      case "spelling-backspace": {
        if (!ge) break;
        if (typeof ge.typeKanaKey === "function") ge.typeKanaKey("Backspace");
        else if (typeof ge.backspaceKana === "function") ge.backspaceKana();
        else if (typeof ge.backspaceSpelling === "function") ge.backspaceSpelling();
        break;
      }

      case "kana-clear":
      case "spelling-clear": {
        if (!ge) break;
        if (typeof ge.clearKana === "function") ge.clearKana();
        else if (typeof ge.clearSpelling === "function") ge.clearSpelling();
        break;
      }

      case "kana-submit":
      case "spelling-submit": {
        if (!ge) break;
        const state = ge.getState();
        if (!state || state.subState !== "PLAYING") break;
        const q = state.battle && state.battle.currentQuestion;
        if (q && (q.type === "kana-spelling" || q.type === "spelling")) {
          if (typeof ge.typeKanaKey === "function") ge.typeKanaKey("Enter");
          else if (typeof ge.typeSpellingKey === "function") ge.typeSpellingKey("Enter");
          else if (typeof ge.submitAnswer === "function") ge.submitAnswer(q.enteredText || "");
        }
        break;
      }

      case "use-hint": {
        if (ge && typeof ge.useHint === "function") ge.useHint();
        break;
      }

      case "skip-feedback": {
        if (ge && typeof ge.nextQuestion === "function") {
          ge.nextQuestion({ force: true, fromKeyboard: false });
        }
        break;
      }

      case "next-round": {
        if (!ge) break;
        if (typeof ge.startNextRound === "function") {
          ge.startNextRound({ memorizeSec: uiState.memorizeSec, battleStyle: uiState.battleStyle });
          break;
        }
        const state = ge.getState();
        const curRound = (state && state.round) || 1;
        const maxRound = getAllRounds().length || 50;
        const nextRound = curRound >= maxRound ? 1 : curRound + 1;
        ge.startCampaignRound(nextRound, {
          memorizeSec: uiState.memorizeSec,
          battleStyle: uiState.battleStyle
        });
        break;
      }

      case "retry-round": {
        if (!ge) break;
        if (typeof ge.retryRound === "function") {
          ge.retryRound({ memorizeSec: uiState.memorizeSec, battleStyle: uiState.battleStyle });
          break;
        }
        const state = ge.getState();
        if (state && state.mode === "survival") {
          ge.startSurvivalMode({ skipMemorize: true });
        } else if (state && state.mode === "revenge") {
          ge.startRevengeMode({ memorizeSec: uiState.memorizeSec, battleStyle: uiState.battleStyle });
        } else {
          const curRound = (state && state.round) || 1;
          ge.startCampaignRound(curRound, {
            memorizeSec: uiState.memorizeSec,
            battleStyle: uiState.battleStyle
          });
        }
        break;
      }

      case "codex-filter": {
        const f = targetEl.getAttribute("data-filter") || "all";
        uiState.codexFilter = f;
        uiState.codexLimit = 60;
        document.querySelectorAll('[data-action="codex-filter"]').forEach(function (b) {
          b.classList.toggle("is-active", b.getAttribute("data-filter") === f);
        });
        renderCodex();
        break;
      }

      case "codex-load-more": {
        uiState.codexLimit += 80;
        renderCodex();
        break;
      }

      default:
        break;
    }
  }

  function flipWordCard(wordId) {
    const ge = getGE();
    if (uiState.flippedWordIds.has(wordId)) {
      uiState.flippedWordIds.delete(wordId);
    } else {
      uiState.flippedWordIds.add(wordId);
      if (ge && typeof ge.markWordStudied === "function") {
        ge.markWordStudied(wordId);
      }
    }
    playUiFlipSfx();
    const scene = document.querySelector('.vocab-flip-scene[data-word-id="' + wordId + '"]');
    if (scene) {
      scene.classList.toggle("is-flipped", uiState.flippedWordIds.has(wordId));
    }
  }

  function onDocumentClick(e) {
    const ls = getLS();
    if (ls && ls.sfx && typeof ls.sfx.unlock === "function") {
      try {
        ls.sfx.unlock();
      } catch (_) {}
    }

    // Close modal if clicking directly on backdrop
    if (e.target && e.target.id === "gojuon-modal") {
      closeGojuonModal();
      return;
    }
    if (e.target && e.target.id === "badges-modal") {
      closeBadgesModal();
      return;
    }

    const actionEl = e.target && typeof e.target.closest === "function" ? e.target.closest("[data-action]") : null;
    if (!actionEl) return;
    const action = actionEl.getAttribute("data-action");
    if (action === "speak-word" || action === "speak-example" || action === "toggle-pin") {
      e.stopPropagation();
    }
    if (
      action === "open-codex" ||
      action === "close-codex" ||
      action === "open-gojuon" ||
      action === "close-gojuon" ||
      action === "gojuon-tab" ||
      action === "gojuon-script" ||
      action === "open-badges" ||
      action === "close-badges" ||
      action === "filter-level" ||
      action === "codex-filter" ||
      action === "toggle-mask" ||
      action === "set-study-view"
    ) {
      playUiClickSfx();
    }
    handleAction(action, actionEl);
  }

  function onDocumentKeyDown(e) {
    if (!e || e.ctrlKey || e.altKey || e.metaKey) return;
    const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea" || tag === "select") {
      if (e.key === "Escape") e.target.blur();
      return;
    }

    const gojuonModal = byId("gojuon-modal");
    if (gojuonModal && !gojuonModal.hidden) {
      if (e.key === "Escape") closeGojuonModal();
      return;
    }

    const badgesModal = byId("badges-modal");
    if (badgesModal && !badgesModal.hidden) {
      if (e.key === "Escape") closeBadgesModal();
      return;
    }

    if (uiState.activeScreen === "codex") {
      if (e.key === "Escape") closeCodex();
      return;
    }

    const ge = getGE();
    if (!ge) return;
    const state = ge.getState();
    if (!state) return;

    // Study Shortcuts
    if (uiState.activeScreen === "study" && state.phase === "MEMORIZE") {
      if (e.key === " ") {
        e.preventDefault();
        const words = (state.memorize && state.memorize.words) || [];
        const targetWord = words[uiState.studyFocusIndex] || words[0];
        if (targetWord) flipWordCard(targetWord.id);
      } else if (e.key === "ArrowRight") {
        const len = (state.memorize && state.memorize.words && state.memorize.words.length) || 10;
        uiState.studyFocusIndex = (uiState.studyFocusIndex + 1) % len;
        if (uiState.studyView === "focus") renderStudyCards(state.memorize);
      } else if (e.key === "ArrowLeft") {
        const len = (state.memorize && state.memorize.words && state.memorize.words.length) || 10;
        uiState.studyFocusIndex = (uiState.studyFocusIndex - 1 + len) % len;
        if (uiState.studyView === "focus") renderStudyCards(state.memorize);
      } else if (e.key === "Enter") {
        e.preventDefault();
        ge.startBattleFromMemorize();
      }
      return;
    }

    // Battle Shortcuts
    if (uiState.activeScreen === "battle" && state.phase === "BATTLE") {
      if (state.subState === "FEEDBACK") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          if (Date.now() - uiState.lastFeedbackEnteredAt < 200) return;
          ge.nextQuestion({ force: true, fromKeyboard: true });
        }
        return;
      }

      if (state.subState !== "PLAYING") return;
      const q = state.battle && state.battle.currentQuestion;
      if (!q) return;

      if (Date.now() - uiState.lastQuestionEnteredAt < 120) return;

      if (q.type === "multiple-choice" || q.type === "listening") {
        if (["1", "2", "3", "4"].indexOf(e.key) !== -1 && !uiState.inputLocked) {
          const idx = Number(e.key) - 1;
          if (q.options && q.options[idx] && !q.options[idx].eliminated) {
            e.preventDefault();
            uiState.inputLocked = true;
            ge.submitAnswer(idx);
          }
        } else if (e.key === "h" || e.key === "H") {
          ge.useHint();
        }
      } else if (q.type === "pair-match") {
        if (e.key === "h" || e.key === "H") {
          ge.useHint();
        }
      } else if (q.type === "kana-spelling" || q.type === "spelling") {
        const sendKey = typeof ge.typeKanaKey === "function" ? ge.typeKanaKey.bind(ge) : ge.typeSpellingKey ? ge.typeSpellingKey.bind(ge) : null;
        if (!sendKey) return;

        if (/^[a-zA-Z\-']$/.test(e.key)) {
          e.preventDefault();
          sendKey(e.key.toLowerCase());
        } else if (/^[\u3040-\u309F\u30A0-\u30FF]$/.test(e.key)) {
          e.preventDefault();
          sendKey(e.key);
        } else if (e.key === "Backspace") {
          e.preventDefault();
          sendKey("Backspace");
        } else if (e.key === "Escape") {
          e.preventDefault();
          if (typeof ge.clearKana === "function") ge.clearKana();
          else if (typeof ge.clearSpelling === "function") ge.clearSpelling();
        } else if (e.key === "Enter") {
          e.preventDefault();
          sendKey("Enter");
        }
      }
    }
  }

  function bindFormInputs() {
    const memSelect = byId("select-memorize-sec");
    if (memSelect) {
      memSelect.addEventListener("change", function () {
        const val = Number(memSelect.value) || 45;
        uiState.memorizeSec = val;
        const ls = getLS();
        if (ls && typeof ls.updateSettings === "function") {
          ls.updateSettings({ memorizeSec: val });
        }
      });
    }

    const styleSelect = byId("select-battle-style");
    if (styleSelect) {
      styleSelect.addEventListener("change", function () {
        uiState.battleStyle = styleSelect.value || "prism-mix";
      });
    }

    const searchInput = byId("codex-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        uiState.codexQuery = searchInput.value || "";
        uiState.codexLimit = 60;
        renderCodex();
      });
    }

    const levelSelect = byId("codex-level-select");
    if (levelSelect) {
      levelSelect.addEventListener("change", function () {
        uiState.codexLevel = levelSelect.value || "";
        uiState.codexLimit = 60;
        renderCodex();
      });
    }

    const posSelect = byId("codex-pos-select");
    if (posSelect) {
      posSelect.addEventListener("change", function () {
        uiState.codexPos = posSelect.value || "";
        uiState.codexLimit = 60;
        renderCodex();
      });
    }
  }

  /* ------------------------------------------------------------------------
     Public UI Lifecycle API (window.N5App.UI)
     ------------------------------------------------------------------------ */
  function init() {
    if (uiState.initialized) return UI;
    if (typeof document === "undefined") return UI;

    const ls = getLS();
    if (ls && typeof ls.init === "function") {
      try {
        ls.init();
      } catch (_) {}
    }

    const ge = getGE();
    if (ge && typeof ge.init === "function") {
      try {
        ge.init();
      } catch (_) {}
    }

    applySettingsToDom();
    bindFormInputs();
    bindEngineEvents();

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onDocumentKeyDown);

    showScreen("lobby");
    renderLobby();
    uiState.initialized = true;
    return UI;
  }

  const UI = {
    init: init,
    showScreen: showScreen,
    renderLobby: renderLobby,
    openCodex: openCodex,
    closeCodex: closeCodex,
    openGojuon: openGojuonModal,
    closeGojuon: closeGojuonModal,
    showToast: showToast,
    burstParticles: FX.burst,
    getState: function () {
      return Object.assign({}, uiState);
    }
  };

  root.N5App.UI = UI;

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
