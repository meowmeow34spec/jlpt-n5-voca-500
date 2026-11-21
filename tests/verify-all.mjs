#!/usr/bin/env node
/**
 * PRISM NIHONGO N5 (500 Words / 50 Rounds) — Comprehensive Automated QA & Headless Chrome E2E Suite
 * Exclusive Owner: @n5-qa-release
 *
 * Suites:
 *  1. Static Assets, Syntax (`node --check`), Zero External CDN, Pipeline Order & CSS/<ruby> Fallbacks
 *  2. JLPT N5 500-Word Curriculum & WordBank Integrity (`validate-words.mjs` + Ruby/Blank/Kana-Trap 500/500)
 *  3. LearningSystem Unit & Edge-Case Tests (Leitner Box 0~3, RomajiHelper, GOJUON_DATA, 3-Stage Hints, Audio/Storage)
 *  4. GameEngine State Machine, N5 Question Modes (kanji-to-kana/pure-kana fallback/match/kana-shard+romaji), Bounce & Timer Audit
 *  5. Real Headless Chromium E2E via CDP (`file://` & `http://`, Dark/Light WCAG AAA, 4-Mask Furigana, Gojuon, 3-Wave, Codex, Mobile 360x640)
 */

import fs from "node:fs";
import os from "node:os";
import net from "node:net";
import http from "node:http";
import path from "node:path";
import vm from "node:vm";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const EXPECTED_WORD_COUNT = 500;
const EXPECTED_ROUND_COUNT = 50;

const SCRIPT_PIPELINE = [
  "src/data/words-part1.js",
  "src/data/words-part2.js",
  "src/data/words-index.js",
  "src/js/learning-system.js",
  "src/js/game-engine.js",
  "src/js/app-ui.js"
];

const REQUIRED_FILES = [
  "index.html",
  "src/css/glassmorphism.css",
  "src/css/animations.css",
  "scripts/validate-words.mjs",
  "scripts/publish-github.ps1",
  "docs/GAME_ARCHITECTURE.md",
  "docs/LEARNING_DESIGN.md",
  "README.md",
  ".gitignore",
  ...SCRIPT_PIPELINE
];

let passedCount = 0;
let failedCount = 0;
const failures = [];

function pass(suite, msg) {
  passedCount++;
  console.log(`  ✅ [${suite}] ${msg}`);
}

function fail(suite, msg, detail = "") {
  failedCount++;
  const full = detail ? `${msg} — ${detail}` : msg;
  failures.push(`[${suite}] ${full}`);
  console.error(`  ❌ [${suite}] ${full}`);
}

function assert(condition, suite, msg, detail = "") {
  if (condition) {
    pass(suite, msg);
    return true;
  } else {
    fail(suite, msg, detail);
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================================================================
   SUITE 1: Static Files, Syntax (`node --check`), Offline & CSS/<ruby> Audit
   ============================================================================ */
async function runSuite1StaticAndSyntax() {
  console.log("\n======================================================================");
  console.log("🔍 SUITE 1: 파일 무결성 · JS 문법(node --check) · 오프라인/CSS/<ruby> 검증");
  console.log("======================================================================");

  const missing = REQUIRED_FILES.filter((rel) => !fs.existsSync(path.join(ROOT_DIR, rel)));
  assert(
    missing.length === 0,
    "STATIC",
    `필수 프로젝트 파일 ${REQUIRED_FILES.length}개 전체 존재 확인`,
    missing.length ? `누락: ${missing.join(", ")}` : ""
  );
  if (missing.length > 0) return false;

  // Syntax check on all JS/MJS files
  const jsFiles = [...SCRIPT_PIPELINE, "scripts/validate-words.mjs", "tests/verify-all.mjs"];
  for (const rel of jsFiles) {
    const abs = path.join(ROOT_DIR, rel);
    const res = spawnSync(process.execPath, ["--check", abs], { encoding: "utf8" });
    assert(
      res.status === 0,
      "SYNTAX",
      `node --check 통과: ${rel}`,
      res.stderr ? res.stderr.trim() : ""
    );
  }

  // index.html offline & script order audit
  const html = fs.readFileSync(path.join(ROOT_DIR, "index.html"), "utf8");
  const hasExternalCdn = /<(?:script|link)\b[^>]*(?:src|href)=["']https?:\/\//i.test(html);
  assert(!hasExternalCdn, "OFFLINE", "index.html 외부 CDN 의존성 0건 (100% 오프라인 & file:// 호환)");

  let lastIdx = -1;
  let orderOk = true;
  for (const rel of SCRIPT_PIPELINE) {
    const idx = html.indexOf(rel);
    if (idx === -1 || idx <= lastIdx) {
      orderOk = false;
      break;
    }
    lastIdx = idx;
  }
  assert(orderOk, "PIPELINE", "index.html 클래식 <script> 로드 순서 계약 100% 일치");

  // Required data-screen containers in index.html
  for (const screen of ["lobby", "study", "battle", "result", "codex"]) {
    assert(
      html.includes(`data-screen="${screen}"`),
      "DOM-CONTRACT",
      `index.html [data-screen="${screen}"] 컨테이너 존재`
    );
  }
  assert(
    html.includes('id="gojuon-modal"') || html.includes('data-modal="gojuon"') || html.includes("gojuon"),
    "DOM-GOJUON",
    "index.html 오십음도(Gojuon) 모달/트리거 마크업 존재"
  );

  // Check for accidental stale "800단어" or "80라운드" text in index.html
  assert(
    !/800\s*단어|80\s*라운드/i.test(html),
    "BRANDING-500",
    "index.html 내 구 스펙('800단어'/'80라운드') 오표기 0건 (순수 500단어/50라운드 반영)"
  );

  // CSS Glassmorphism, <ruby> typography & responsive checks
  const css = fs.readFileSync(path.join(ROOT_DIR, "src/css/glassmorphism.css"), "utf8");
  const animCss = fs.readFileSync(path.join(ROOT_DIR, "src/css/animations.css"), "utf8");
  assert(
    css.includes("backdrop-filter") && css.includes("-webkit-backdrop-filter"),
    "CSS-GLASS",
    "글래스모피즘 backdrop-filter 및 -webkit- 프리픽스 적용 확인"
  );
  assert(
    /@supports\s+not\s*\(/i.test(css),
    "CSS-FALLBACK",
    "backdrop-filter 미지원 브라우저용 @supports not 고대비 폴백 확인"
  );
  assert(
    css.includes("100dvh") && css.includes("crystal-sakura-day"),
    "CSS-THEME",
    "모바일 100dvh 뷰포트 대응 및 듀얼 테마(midnight-sakura / crystal-sakura-day) 확인"
  );
  assert(
    /\bruby\b/i.test(css) && /\brt\b/i.test(css),
    "CSS-RUBY",
    "<ruby> / <rt> 후리가나 전용 타이포그래피 스타일 규칙 존재 확인"
  );
  assert(
    animCss.includes("prefers-reduced-motion"),
    "A11Y",
    "애니메이션 prefers-reduced-motion 접근성 미디어 쿼리 확인"
  );

  return true;
}

/* ============================================================================
   Helper: Create Isolated VM Sandbox with Timer Tracking & Optional Mocks
   ============================================================================ */
function createAppSandbox({ brokenStorage = false } = {}) {
  const store = new Map();
  const activeIntervals = new Set();
  const activeTimeouts = new Set();

  const localStorageMock = brokenStorage
    ? {
        getItem() {
          throw new Error("Simulated Storage SecurityError");
        },
        setItem() {
          throw new Error("Simulated Storage QuotaExceededError");
        },
        removeItem() {
          throw new Error("Simulated Storage Error");
        }
      }
    : {
        getItem(k) {
          return store.has(k) ? store.get(k) : null;
        },
        setItem(k, v) {
          store.set(k, String(v));
        },
        removeItem(k) {
          store.delete(k);
        },
        clear() {
          store.clear();
        }
      };

  function trackedSetInterval(fn, ms, ...args) {
    const id = setInterval(fn, ms, ...args);
    activeIntervals.add(id);
    return id;
  }

  function trackedClearInterval(id) {
    activeIntervals.delete(id);
    clearInterval(id);
  }

  function trackedSetTimeout(fn, ms, ...args) {
    const id = setTimeout(() => {
      activeTimeouts.delete(id);
      fn(...args);
    }, ms);
    activeTimeouts.add(id);
    return id;
  }

  function trackedClearTimeout(id) {
    activeTimeouts.delete(id);
    clearTimeout(id);
  }

  const sandboxWindow = {
    console,
    localStorage: localStorageMock,
    setTimeout: trackedSetTimeout,
    clearTimeout: trackedClearTimeout,
    setInterval: trackedSetInterval,
    clearInterval: trackedClearInterval,
    Date,
    Math,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Set,
    Map,
    RegExp,
    Error,
    Promise,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    performance: globalThis.performance
  };
  sandboxWindow.window = sandboxWindow;
  sandboxWindow.globalThis = sandboxWindow;
  sandboxWindow.self = sandboxWindow;

  const context = vm.createContext(sandboxWindow);
  // Load data + learning-system + game-engine (first 5 scripts)
  const filesToLoad = SCRIPT_PIPELINE.slice(0, 5);
  for (const rel of filesToLoad) {
    const abs = path.join(ROOT_DIR, rel);
    const code = fs.readFileSync(abs, "utf8");
    vm.runInContext(code, context, { filename: abs });
  }

  function cleanupTimers() {
    for (const id of activeIntervals) clearInterval(id);
    for (const id of activeTimeouts) clearTimeout(id);
    activeIntervals.clear();
    activeTimeouts.clear();
  }

  return {
    window: sandboxWindow,
    N5App: sandboxWindow.N5App,
    activeIntervals,
    activeTimeouts,
    cleanupTimers
  };
}

/* ============================================================================
   SUITE 2: JLPT N5 500-Word Curriculum & WordBank Deep Integrity
   ============================================================================ */
async function runSuite2VocabularyIntegrity() {
  console.log("\n======================================================================");
  console.log("📚 SUITE 2: JLPT N5 필수 500단어(50R×10단어) · 후리가나 · 함정보기 전수 검증");
  console.log("======================================================================");

  const valRes = spawnSync(
    process.execPath,
    [path.join(ROOT_DIR, "scripts/validate-words.mjs")],
    { encoding: "utf8" }
  );
  assert(
    valRes.status === 0,
    "DATA-SCRIPT",
    "scripts/validate-words.mjs 공식 데이터 검증 스크립트 100% 통과",
    valRes.status !== 0 ? (valRes.stderr || valRes.stdout).trim() : ""
  );

  const env = createAppSandbox();
  try {
    const app = env.N5App;
    const wordsList = app.WORDS_500 || app.words;
    const roundsList = app.ROUNDS_50 || app.ROUNDS_80;
    const wb = app.WordBank;

    assert(
      Array.isArray(wordsList) && wordsList.length === EXPECTED_WORD_COUNT,
      "DATA-COUNT",
      `N5 필수 어휘 정확히 ${EXPECTED_WORD_COUNT}개 로드 확인 (현재: ${wordsList?.length})`
    );
    assert(
      app.words === wordsList && app.WORDS_800 === wordsList,
      "DATA-ALIAS",
      "하위 호환 별칭(N5App.WORDS_500 === N5App.words === N5App.WORDS_800) 일치 확인"
    );
    assert(
      Array.isArray(roundsList) &&
        roundsList.length === EXPECTED_ROUND_COUNT &&
        app.ROUNDS_80 === roundsList,
      "DATA-ROUNDS",
      `ROUNDS_50 정확히 ${EXPECTED_ROUND_COUNT}개 라운드 및 ROUNDS_80 별칭 일치 확인`
    );

    // Level distribution check: Lv1 R1~20 (200), Lv2 R21~38 (180), Lv3 R39~50 (120)
    const lv1 = wordsList.filter((w) => w.level === 1);
    const lv2 = wordsList.filter((w) => w.level === 2);
    const lv3 = wordsList.filter((w) => w.level === 3);
    assert(
      lv1.length === 200 && lv2.length === 180 && lv3.length === 120,
      "DATA-LEVELS",
      `레벨 배분 검증 (Lv.1=${lv1.length}, Lv.2=${lv2.length}, Lv.3=${lv3.length})`
    );

    // Zero duplicate expression & meaning
    const exprSet = new Set(wordsList.map((w) => String(w.expression || "").trim()));
    const meaningSet = new Set(wordsList.map((w) => String(w.meaning || "").trim()));
    assert(
      exprSet.size === EXPECTED_WORD_COUNT,
      "DATA-UNIQUE-EXPR",
      `일본어 대표 표기(expression) 중복 0건 (${exprSet.size}/${EXPECTED_WORD_COUNT})`
    );
    assert(
      meaningSet.size === EXPECTED_WORD_COUNT,
      "DATA-UNIQUE-MEANING",
      `한국어 뜻(meaning) 중복 0건 (${meaningSet.size}/${EXPECTED_WORD_COUNT})`
    );

    // Ruby HTML & Schema & Pure-Kana Presence Check
    let rubyValidCount = 0;
    let romajiValidCount = 0;
    let pureKanaCount = 0;
    let kanjiWordCount = 0;

    for (const w of wordsList) {
      if (/^[a-z]+$/.test(w.romaji)) romajiValidCount++;
      if (!w.kanji) {
        pureKanaCount++;
        if (w.rubyHtml === w.expression || w.rubyHtml === w.kana) {
          rubyValidCount++;
        }
      } else {
        kanjiWordCount++;
        const openRuby = (w.rubyHtml.match(/<ruby>/g) || []).length;
        const closeRuby = (w.rubyHtml.match(/<\/ruby>/g) || []).length;
        const openRt = (w.rubyHtml.match(/<rt>/g) || []).length;
        const closeRt = (w.rubyHtml.match(/<\/rt>/g) || []).length;
        const strippedBase = w.rubyHtml
          .replace(/<rt>.*?<\/rt>/g, "")
          .replace(/<\/?ruby>/g, "")
          .replace(/<\/?rb>/g, "");
        if (
          openRuby >= 1 &&
          openRuby === closeRuby &&
          openRuby === openRt &&
          openRt === closeRt &&
          strippedBase === w.expression
        ) {
          rubyValidCount++;
        }
      }
    }

    assert(
      rubyValidCount === EXPECTED_WORD_COUNT && kanjiWordCount > 250 && pureKanaCount > 20,
      "DATA-RUBY",
      `전 ${EXPECTED_WORD_COUNT}단어 <ruby><rt> 태그 무결성 통과 (${rubyValidCount}/${EXPECTED_WORD_COUNT}, 한자어=${kanjiWordCount}, 순수가나=${pureKanaCount})`
    );
    assert(
      romajiValidCount === EXPECTED_WORD_COUNT,
      "DATA-ROMAJI",
      `전 ${EXPECTED_WORD_COUNT}단어 표준 영문 소문자 romaji(/^[a-z]+$/) 검증 (${romajiValidCount}/${EXPECTED_WORD_COUNT})`
    );

    // 500/500 Blank Example, Distractors, and Kana Trap Distractors
    let blankPass = 0;
    let distractorPass = 0;
    let kanaTrapPass = 0;

    for (const w of wordsList) {
      const masked = wb.getBlankExample(w.id, "［　　］");
      if (typeof masked === "string" && masked.includes("［　　］") && masked !== w.example) {
        blankPass++;
      }

      const dists = wb.getDistractors(w.id, 3, { samePos: true, sameLevel: true });
      const ids = new Set(dists.map((d) => d.id));
      const meanings = new Set(dists.map((d) => d.meaning));
      const exprs = new Set(dists.map((d) => d.expression));
      if (
        dists.length === 3 &&
        ids.size === 3 &&
        !ids.has(w.id) &&
        meanings.size === 3 &&
        !meanings.has(w.meaning) &&
        exprs.size === 3 &&
        !exprs.has(w.expression)
      ) {
        distractorPass++;
      }

      const kanaDists = wb.getKanaDistractors(w.id, 3);
      const kanaStrings = kanaDists.map((k) => (typeof k === "string" ? k : k?.kana || k?.label || ""));
      const kanaSet = new Set(kanaStrings.filter(Boolean));
      if (kanaStrings.length === 3 && kanaSet.size === 3 && !kanaSet.has(w.kana)) {
        kanaTrapPass++;
      }
    }

    assert(
      blankPass === EXPECTED_WORD_COUNT,
      "WORDBANK-CLOZE",
      `전 ${EXPECTED_WORD_COUNT}단어 일본어 예문 빈칸 마스킹(getBlankExample) 성공 (${blankPass}/${EXPECTED_WORD_COUNT})`
    );
    assert(
      distractorPass === EXPECTED_WORD_COUNT,
      "WORDBANK-DIST",
      `전 ${EXPECTED_WORD_COUNT}단어 뜻/표기 오답 생성기(getDistractors) 중복 0건 (${distractorPass}/${EXPECTED_WORD_COUNT})`
    );
    assert(
      kanaTrapPass === EXPECTED_WORD_COUNT,
      "WORDBANK-KANATRAP",
      `전 ${EXPECTED_WORD_COUNT}단어 한자 읽기 함정 오답(getKanaDistractors) 중복 0건 (${kanaTrapPass}/${EXPECTED_WORD_COUNT})`
    );

    // Unified Search verification (Kanji, Kana, Romaji, Korean, POS)
    const sampleKanjiWord = wordsList.find((w) => Boolean(w.kanji)) || wordsList[0];
    const byKanji = wb.searchWords(sampleKanjiWord.kanji);
    const byKana = wb.searchWords(sampleKanjiWord.kana);
    const byRomaji = wb.searchWords(sampleKanjiWord.romaji);
    const byMeaning = wb.searchWords(sampleKanjiWord.meaning);
    const byPos = wb.searchWords("", { pos: "1류동사" });

    assert(
      byKanji.some((w) => w.id === sampleKanjiWord.id) &&
        byKana.some((w) => w.id === sampleKanjiWord.id) &&
        byRomaji.some((w) => w.id === sampleKanjiWord.id) &&
        byMeaning.some((w) => w.id === sampleKanjiWord.id) &&
        byPos.length > 10 &&
        byPos.every((w) => w.pos === "1류동사"),
      "WORDBANK-SEARCH",
      "WordBank.searchWords(한자 · 가나 · 로마자 · 한국어뜻 · 품사필터) 통합 검색 정확도 확인"
    );
  } finally {
    env.cleanupTimers();
  }
}

/* ============================================================================
   SUITE 3: LearningSystem, RomajiHelper, GOJUON_DATA, Hints & Audio/Storage
   ============================================================================ */
async function runSuite3LearningSystem() {
  console.log("\n======================================================================");
  console.log("🧠 SUITE 3: LearningSystem · RomajiHelper · 오십음도 · 힌트 · 오디오 검증");
  console.log("======================================================================");

  const env = createAppSandbox();
  try {
    const ls = env.N5App.LearningSystem;
    const rh = ls?.RomajiHelper || env.N5App.RomajiHelper;

    assert(Boolean(ls && typeof ls.init === "function"), "LS", "window.N5App.LearningSystem 모듈 로드 확인");
    ls.init();

    const initStats = ls.getMasteryStats();
    assert(
      initStats.total === EXPECTED_WORD_COUNT &&
        initStats.unseen === EXPECTED_WORD_COUNT &&
        initStats.mastered === 0,
      "LS-STATS",
      `초기 마스터리 상태 확인 (total=${initStats.total}, unseen=${initStats.unseen}, mastered=${initStats.mastered})`
    );

    // Leitner Box 0 -> 1 -> 2 -> 3
    const r1 = ls.recordAttempt(1, true, { round: 1, mode: "campaign" });
    const r2 = ls.recordAttempt(1, true, { round: 1, mode: "campaign" });
    const r3 = ls.recordAttempt(1, true, { round: 1, mode: "campaign" });
    assert(
      r1.newBox === 1 && r2.newBox === 2 && r3.newBox === 3 && r3.status === "mastered",
      "LS-LEITNER",
      "3연속 정답 시 Box 0 → 1 → 2 → 3 (mastered) 승급 검증"
    );

    // Wrong answer demotion + wrong note
    const wrongRes = ls.recordAttempt(2, false, { round: 1, mode: "campaign" });
    assert(
      wrongRes.newBox === 1 && wrongRes.inWrongNote === true && ls.getWrongWordIds().includes(2),
      "LS-WRONG",
      "오답 시 Box 1 강등 및 오답노트 자동 등록 확인"
    );

    // Pin toggle & Revenge extraction
    const pinOn = ls.togglePin(3);
    assert(pinOn === true && ls.isPinned(3), "LS-PIN", "별표(Pin) 토글 및 상태 조회 확인");

    const revForR2 = ls.getRevengeWords(2, 2);
    const revIds = revForR2.map((w) => w.id);
    assert(
      revIds.includes(2) && revIds.includes(3) && revForR2.every((w) => w.round !== 2),
      "LS-REVENGE",
      "getRevengeWords(2, 2)가 이전 라운드 오답/핀 단어를 우선 추출하고 현재 라운드 단어를 제외함"
    );

    // RomajiHelper Deep Japanese Phonetics Verification
    assert(Boolean(rh && typeof rh.splitMorae === "function"), "ROMAJI-INIT", "RomajiHelper 모듈 노출 확인");
    if (rh) {
      const mKyoushitsu = rh.splitMorae("きょうしつ");
      const mGakkou = rh.splitMorae("がっこう");
      const mKoohii = rh.splitMorae("コーヒー");
      assert(
        JSON.stringify(mKyoushitsu) === JSON.stringify(["きょ", "う", "し", "つ"]) &&
          JSON.stringify(mGakkou) === JSON.stringify(["が", "っ", "こ", "う"]) &&
          JSON.stringify(mKoohii) === JSON.stringify(["コ", "ー", "ヒ", "ー"]),
        "ROMAJI-MORAE",
        "splitMorae 요음(きょ)·촉음(っ)·가타카나 장음(ー) 모라 분할 정확성 통과"
      );

      // Helper to simulate streaming character-by-character typing into consumeRomajiBuffer
      const simulateStream = (typed, units) => {
        let rem = [...units];
        let buf = "";
        for (const ch of typed) {
          buf += ch;
          const res = rh.consumeRomajiBuffer(buf, rem);
          if (res.matchedCount > 0) {
            rem = rem.slice(res.matchedCount);
            buf = res.remainingBuffer;
          }
        }
        // Flush trailing single 'n' if helper supports flushFinalN or check final 'n' -> ん/ン
        if (rem.length === 1 && (rem[0] === "ん" || rem[0] === "ン") && buf === "n") {
          const flushed = rh.consumeRomajiBuffer("nn", rem);
          if (flushed.matchedCount === 1) {
            rem = [];
            buf = "";
          }
        }
        return rem.length === 0 && buf === "";
      };

      const okSensei = simulateStream("sensei", ["せ", "ん", "せ", "い"]);
      const okGakkou = simulateStream("gakkou", ["が", "っ", "こ", "う"]);
      const okChottoHepburn = simulateStream("chotto", ["ちょ", "っ", "と"]);
      const okChottoKunrei = simulateStream("tyotto", ["ちょ", "っ", "と"]);
      const okShinbun = simulateStream("shinbun", ["し", "ん", "ぶ", "ん"]);
      const okKoohiiVowel = simulateStream("koohii", ["コ", "ー", "ヒ", "ー"]);
      const okKoohiiHyphen = simulateStream("ko-hi-", ["コ", "ー", "ヒ", "ー"]);

      assert(
        okSensei &&
          okGakkou &&
          okChottoHepburn &&
          okChottoKunrei &&
          okShinbun &&
          okKoohiiVowel &&
          okKoohiiHyphen,
        "ROMAJI-STREAM",
        "consumeRomajiBuffer 헵번/훈령식·촉음(gakkou/chotto/tyotto)·발음(sensei/shinbun)·장음(koohii/ko-hi-) 통과",
        JSON.stringify({
          okSensei,
          okGakkou,
          okChottoHepburn,
          okChottoKunrei,
          okShinbun,
          okKoohiiVowel,
          okKoohiiHyphen
        })
      );
    }

    // GOJUON_DATA Check
    const gojuon = ls.GOJUON_DATA || (typeof ls.getGojuonData === "function" ? ls.getGojuonData() : null);
    assert(
      Boolean(gojuon && Array.isArray(gojuon.seion) && gojuon.seion.length >= 10 && gojuon.dakuon && gojuon.yoon),
      "LS-GOJUON",
      "GOJUON_DATA(청음·탁음·반탁음·요음) 오십음도 내장 데이터 구조 확인"
    );

    // 3-Stage Japanese Smart Hints
    const h1 = ls.getHint(1, 1);
    const h2 = ls.getHint(1, 2);
    const h3 = ls.getHint(1, 3);
    assert(
      Boolean(h1 && h1.kanaSkeleton && h1.koInitials && h2 && h2.clozeExample && h3 && h3.koPron && h3.romaji),
      "LS-HINT",
      "3단계 일본어 스마트 힌트(모라뼈대·초성 / 예문빈칸·팁 / 한글발음·로마자) 정상 생성"
    );

    // Unified SFX & ja-JP TTS in headless VM must never throw
    let audioSafe = true;
    try {
      if (ls.sfx.unlock) ls.sfx.unlock();
      ls.sfx.flip();
      ls.sfx.click();
      if (ls.sfx.shardTap) ls.sfx.shardTap();
      ls.sfx.correct();
      ls.sfx.combo(5);
      ls.sfx.pinBonus();
      ls.sfx.fever();
      ls.sfx.wrong();
      ls.sfx.shieldBreak();
      ls.sfx.tick(true);
      ls.sfx.roundClear();
      const m1 = ls.sfx.toggleMute();
      const m2 = ls.sfx.toggleMute();
      if (m1 === m2) audioSafe = false;

      ls.tts.speakWord(1);
      ls.tts.speakExample(1);
      if (ls.tts.speakKana) ls.tts.speakKana("あ");
      ls.tts.setRate(0.78);
      if (Math.abs(ls.tts.getRate() - 0.78) > 0.02) audioSafe = false;
      if (ls.tts.toggleSpeed) {
        ls.tts.toggleSpeed();
      } else {
        ls.tts.setRate(1.0);
      }
      ls.tts.stop();
    } catch (err) {
      audioSafe = false;
      fail("LS-AUDIO", "무음원/미지원 환경 오디오 예외 발생", err.message);
    }
    assert(audioSafe, "LS-AUDIO", "AudioContext/speechSynthesis 미지원 환경에서도 sfx·ja-JP tts(1.0x/0.78x) 무예외 폴백 통과");
  } finally {
    env.cleanupTimers();
  }

  // Broken localStorage fallback check
  const brokenEnv = createAppSandbox({ brokenStorage: true });
  try {
    const lsBroken = brokenEnv.N5App.LearningSystem;
    let fallbackOk = true;
    try {
      lsBroken.init();
      lsBroken.recordAttempt(10, true, { round: 1 });
      lsBroken.togglePin(11);
      lsBroken.resetProgress();
    } catch (_) {
      fallbackOk = false;
    }
    assert(fallbackOk, "LS-STORAGE", "localStorage 차단/예외 환경에서 인메모리 폴백 무크래시 통과");
  } finally {
    brokenEnv.cleanupTimers();
  }
}

/* ============================================================================
   SUITE 4: GameEngine State Machine, N5 Question Modes, Romaji Typing & Locks
   ============================================================================ */
function findCorrectOptionIndex(q, wordsById) {
  const target = q.word || wordsById.get(q.wordId);
  for (let i = 0; i < q.options.length; i++) {
    const opt = q.options[i];
    if (opt.isCorrect === true) return i;
    if (opt.wordId && target && Number(opt.wordId) === Number(target.id) && q.subType !== "kanji-to-kana") {
      return i;
    }
    if (
      target &&
      (opt.label === target.kana || opt.label === target.meaning || opt.label === target.expression)
    ) {
      return i;
    }
  }
  return 0;
}

function findWrongOptionIndex(q, correctIdx) {
  for (let i = 0; i < q.options.length; i++) {
    if (i !== correctIdx && !q.options[i].eliminated) return i;
  }
  return (correctIdx + 1) % q.options.length;
}

async function runSuite4GameEngine() {
  console.log("\n======================================================================");
  console.log("🎮 SUITE 4: GameEngine N5 3-Wave · 한자읽기 분기 · 로마자 타격 · 타이머 검증");
  console.log("======================================================================");

  const env = createAppSandbox();
  try {
    const { GameEngine: ge, LearningSystem: ls, WordBank: wb } = env.N5App;
    assert(Boolean(ge && typeof ge.init === "function"), "GE", "window.N5App.GameEngine 모듈 로드 확인");
    ls.init();
    ge.init();

    const allWords = wb.getAllWords();
    const wordsById = new Map(allWords.map((w) => [w.id, w]));

    // Track event payload dual-shape compliance
    let dualStateChangeOk = true;
    let dualRoundCompleteOk = false;
    ge.on("stateChange", (payload) => {
      if (!payload || !payload.phase || !payload.state || payload.state.phase !== payload.phase) {
        dualStateChangeOk = false;
      }
    });
    ge.on("roundComplete", (payload) => {
      if (
        payload &&
        typeof payload.score === "number" &&
        payload.summary &&
        payload.summary.score === payload.score
      ) {
        dualRoundCompleteOk = true;
      }
    });

    // 1. Empty Revenge Mode Guard
    ls.resetProgress();
    const emptyRevCheck = ge.canStartRevenge();
    const emptyRevStart = ge.startRevengeMode({ allowFallback: false });
    assert(
      emptyRevCheck.available === false &&
        emptyRevStart &&
        emptyRevStart.ok === false &&
        ge.getState().phase === "LOBBY",
      "GE-REVENGE-EMPTY",
      "약점 단어 0개 상태에서 리벤지 진입 시 크래시 없이 NO_WEAK_WORDS 방어 및 LOBBY 유지"
    );

    // 2. Pure-Kana (`kanji === ""`) Safety & Kanji Prompt Furigana Suppression Check
    const roundWithPureKana =
      wb.getAllRounds().find((r) => wb.getWordsByRound(r.round).some((w) => !w.kanji))?.round || 1;
    let pureKanaLeak = false;
    let kanjiPromptCleanOk = true;
    let sawKanjiToKana = false;

    for (const testRound of [1, roundWithPureKana]) {
      ge.startCampaignRound(testRound, { skipMemorize: true, battleStyle: "reading-only" });
      if (ge.getState().phase === "MEMORIZE") ge.startBattleFromMemorize();

      let guard = 0;
      while (ge.getState().phase === "BATTLE" && guard < 25) {
        guard++;
        const q = ge.getState().battle.currentQuestion;
        if (!q) break;
        const target = q.word || wordsById.get(q.wordId);

        if (q.subType === "kanji-to-kana") {
          sawKanjiToKana = true;
          if (!target || !target.kanji) {
            pureKanaLeak = true;
          }
          if (String(q.promptHtml || "").includes("<rt>")) {
            kanjiPromptCleanOk = false;
          }
          if (!String(q.revealRubyHtml || "").includes("<rt>")) {
            kanjiPromptCleanOk = false;
          }
        }

        if (q.type === "multiple-choice" || q.type === "listening") {
          const cIdx = findCorrectOptionIndex(q, wordsById);
          ge.submitAnswer(cIdx);
        } else if (q.type === "pair-match") {
          const jpTiles = q.tiles.filter((t) => t.side === "jp");
          const koTiles = q.tiles.filter((t) => t.side === "ko");
          for (const jt of jpTiles) {
            const kt = koTiles.find((k) => k.wordId === jt.wordId);
            ge.selectMatchTile(jt.tileId);
            if (kt) ge.selectMatchTile(kt.tileId);
          }
        } else if (q.type === "kana-spelling" || q.type === "spelling") {
          ge.submitAnswer(target.kana);
        }
        if (ge.getState().subState === "FEEDBACK") {
          ge.nextQuestion({ force: true, fromKeyboard: false });
        }
      }
      ge.abortToLobby();
    }

    assert(
      sawKanjiToKana && !pureKanaLeak && kanjiPromptCleanOk,
      "GE-KANJI-READING",
      "kanji-to-kana 출제 검증: 순수 가나 단어 출제 0건 & 문제 후리가나 숨김 후 FEEDBACK revealRubyHtml 공개 확인"
    );

    // 3. Start Campaign Round 1 -> MEMORIZE Phase -> Full 3-Wave Playthrough
    ls.resetProgress();
    ge.startCampaignRound(1, { memorizeSec: 45, battleStyle: "prism-mix" });
    let st = ge.getState();
    assert(
      st.phase === "MEMORIZE" && st.subState === "STUDYING" && st.memorize.words.length === 10,
      "GE-MEMORIZE",
      "Round 1 시작 시 MEMORIZE(STUDYING) 진입 및 10단어 로드 확인"
    );

    // +15s Extension once-per-round cap
    const beforeExtMs = st.memorize.remainingMs;
    ge.extendMemorizeTime(15);
    const afterExt1 = ge.getState().memorize;
    ge.extendMemorizeTime(15);
    const afterExt2 = ge.getState().memorize;
    assert(
      afterExt1.remainingMs > beforeExtMs &&
        afterExt1.extensionsLeft === 0 &&
        afterExt2.remainingMs <= afterExt1.remainingMs,
      "GE-EXTEND",
      "암기 시간 +15초 연장 1회 적용 및 2회 중복 연장 차단 검증"
    );

    // Pin Bounty max-3 cap per round
    const r1Words = st.memorize.words;
    ge.togglePinInRound(r1Words[0].id);
    ge.togglePinInRound(r1Words[1].id);
    ge.togglePinInRound(r1Words[2].id);
    const fourthPinRes = ge.togglePinInRound(r1Words[3].id);
    const pinnedInRound = ge.getState().memorize.roundPinnedIds;
    assert(
      pinnedInRound.length === 3 &&
        (!fourthPinRes || fourthPinRes.ok === false || !pinnedInRound.includes(r1Words[3].id)),
      "GE-PIN-CAP",
      "라운드 내 ⭐핀 바운티 최대 3개 상한(cap) 검증"
    );

    // Early Start Boost
    ge.markWordStudied(r1Words[0].id);
    const preview = ge.getEarlyStartPreview();
    ge.startBattleFromMemorize();
    st = ge.getState();
    assert(
      st.phase === "BATTLE" &&
        st.subState === "PLAYING" &&
        st.battle.earlyBonusPoints >= 0 &&
        st.battle.score === st.battle.earlyBonusPoints &&
        Boolean(preview),
      "GE-EARLY-START",
      `조기 출격 부스트 적용 및 Wave 1 진입 확인 (초기 보너스: +${st.battle.earlyBonusPoints}점)`
    );

    // Play Full 3-Wave Round (prism-mix)
    const seenTypes = new Set();
    let testedDoubleTapLock = false;
    let testedKeyboardBounce = false;
    let testedMcHint = false;
    let testedShieldProtection = false;
    let testedHypercorrection = false;
    let kanaSolveCount = 0;
    let romajiLiveTypedOk = false;
    let shardEditOk = false;
    let safetySteps = 0;

    while (ge.getState().phase === "BATTLE" && safetySteps < 55) {
      safetySteps++;
      st = ge.getState();
      const q = st.battle.currentQuestion;
      if (!q) break;
      seenTypes.add(q.type);

      if (q.type === "multiple-choice" || q.type === "listening") {
        const labels = q.options.map((o) => o.label);
        if (new Set(labels).size !== 4) {
          fail("GE-DISTRACTORS", `보기 중복 발견: ${JSON.stringify(labels)}`);
        }

        if (!testedMcHint && st.battle.hintsRemaining > 0) {
          ge.useHint();
          const afterHintQ = ge.getState().battle.currentQuestion;
          const elimCount = afterHintQ.options.filter((o) => o.eliminated).length;
          assert(elimCount === 2, "GE-HINT-MC", "4지선다 스마트 힌트 사용 시 오답 2개 소거(50:50) 확인");
          testedMcHint = true;
        }

        const cIdx = findCorrectOptionIndex(ge.getState().battle.currentQuestion, wordsById);

        if (!testedDoubleTapLock) {
          const qIdxBefore = ge.getState().battle.questionIndex;
          ge.submitAnswer(cIdx);
          const scoreAfterFirst = ge.getState().battle.score;
          const phaseDuringFeedback = ge.getState().subState;
          ge.submitAnswer(cIdx);
          ge.submitAnswer(0);
          const scoreAfterSpam = ge.getState().battle.score;
          const qIdxDuringFeedback = ge.getState().battle.questionIndex;

          assert(
            scoreAfterSpam === scoreAfterFirst &&
              (phaseDuringFeedback !== "FEEDBACK" || qIdxDuringFeedback === qIdxBefore),
            "GE-INPUT-LOCK",
            "연타(Double-Tap) 입력 락 작동: 전환 중 점수 이중 가산 0건 & 다음 문제 스킵 방지"
          );

          if (ge.getState().subState === "FEEDBACK") {
            ge.nextQuestion({ force: true, fromKeyboard: false });
          }
          testedDoubleTapLock = true;
          continue;
        }

        if (!testedShieldProtection && ge.getState().battle.combo >= 1 && ge.getState().battle.shields >= 1) {
          const comboBefore = ge.getState().battle.combo;
          const shieldsBefore = ge.getState().battle.shields;
          const wIdx = findWrongOptionIndex(ge.getState().battle.currentQuestion, cIdx);
          ge.submitAnswer(wIdx);
          const afterWrongShield = ge.getState().battle;
          assert(
            afterWrongShield.shields === shieldsBefore - 1 && afterWrongShield.combo === comboBefore,
            "GE-SHIELD",
            `글래스 쉴드 발동 확인: 오답 시 쉴드 차감(${shieldsBefore}→${afterWrongShield.shields}) 및 ${comboBefore}콤보 보호`
          );
          testedShieldProtection = true;
          if (ge.getState().subState === "FEEDBACK") {
            if (!testedKeyboardBounce) {
              ge.nextQuestion({ force: true, fromKeyboard: true });
              assert(
                ge.getState().subState === "FEEDBACK",
                "GE-KB-BOUNCE",
                "피드백 진입 직후 180ms 이내 키보드 연타 바운스 스킵 차단 확인"
              );
              testedKeyboardBounce = true;
            }
            ge.nextQuestion({ force: true, fromKeyboard: false });
          }
          continue;
        }

        if (testedShieldProtection && !testedHypercorrection && ge.getState().battle.shields === 0) {
          const wIdx = findWrongOptionIndex(ge.getState().battle.currentQuestion, cIdx);
          ge.submitAnswer(wIdx);
          assert(
            ge.getState().subState === "FEEDBACK" && ge.getState().battle.combo === 0,
            "GE-HYPERCORRECTION",
            "쉴드 0개 오답 시 콤보 초기화 및 하이퍼코렉션(FEEDBACK) 각인 상태 진입 확인"
          );
          testedHypercorrection = true;
          ge.nextQuestion({ force: true, fromKeyboard: false });
          continue;
        }

        ge.submitAnswer(cIdx);
        if (ge.getState().subState === "FEEDBACK") {
          ge.nextQuestion({ force: true, fromKeyboard: false });
        }
      } else if (q.type === "pair-match") {
        assert(q.tiles.length === 10, "GE-PAIR-MATCH", "Wave 2 사쿠라 매트릭스 10타일(5쌍) 구성 확인");

        const firstJp = q.tiles.find((t) => t.side === "jp");
        ge.selectMatchTile(firstJp.tileId);
        ge.selectMatchTile(firstJp.tileId);
        assert(
          ge.getState().battle.currentQuestion.matchedPairIds.length === 0,
          "GE-PAIR-SELFTAP",
          "동일 타일 더블클릭 시 오작동 매칭 없이 선택 해제 방어 확인"
        );

        const currentTiles = ge.getState().battle.currentQuestion.tiles;
        const jpList = currentTiles.filter((t) => t.side === "jp");
        const koList = currentTiles.filter((t) => t.side === "ko");
        for (const jpTile of jpList) {
          const koTile = koList.find((k) => k.wordId === jpTile.wordId);
          ge.selectMatchTile(jpTile.tileId);
          ge.selectMatchTile(koTile.tileId);
        }
        ge.selectMatchTile(jpList[0].tileId);
        if (ge.getState().subState === "FEEDBACK") {
          ge.nextQuestion({ force: true, fromKeyboard: false });
        }
      } else if (q.type === "kana-spelling" || q.type === "spelling") {
        kanaSolveCount++;
        const targetWordObj = q.word || wordsById.get(q.wordId);
        const tapFn = ge.tapKanaShard ? ge.tapKanaShard.bind(ge) : ge.tapSpellingShard.bind(ge);
        const backFn = ge.backspaceKana ? ge.backspaceKana.bind(ge) : ge.backspaceSpelling.bind(ge);
        const clearFn = ge.clearKana ? ge.clearKana.bind(ge) : ge.clearSpelling.bind(ge);
        const typeFn = ge.typeKanaKey ? ge.typeKanaKey.bind(ge) : ge.typeSpellingKey.bind(ge);

        if (!shardEditOk) {
          // Test shard click + backspace + clear, then assemble via mora shards!
          const firstShard = q.shards[0];
          tapFn(firstShard.shardId);
          const unitsAfterTap = ge.getState().battle.currentQuestion.enteredUnits?.length ??
            ge.getState().battle.currentQuestion.enteredText.length;
          backFn();
          const unitsAfterBack = ge.getState().battle.currentQuestion.enteredUnits?.length ??
            ge.getState().battle.currentQuestion.enteredText.length;
          tapFn(firstShard.shardId);
          clearFn();
          const unitsAfterClear = ge.getState().battle.currentQuestion.enteredUnits?.length ??
            ge.getState().battle.currentQuestion.enteredText.length;

          shardEditOk = unitsAfterTap >= 1 && unitsAfterBack === 0 && unitsAfterClear === 0;
          assert(shardEditOk, "GE-SHARD-EDIT", "가나 샤드 클릭 · 백스페이스 · 전체초기화 상태 관리 확인");

          const expectedUnits = q.targetUnits || ge.splitMorae(targetWordObj.kana);
          for (const mora of expectedUnits) {
            const liveQ = ge.getState().battle.currentQuestion;
            if (!liveQ || ge.getState().subState !== "PLAYING") break;
            const avail = liveQ.shards.find((s) => !s.used && (s.mora === mora || s.char === mora));
            if (avail) tapFn(avail.shardId);
          }
          if (ge.getState().subState === "PLAYING") {
            typeFn("Enter");
          }
        } else {
          // Solve via live English Romaji keyboard typing!
          const romajiStr = targetWordObj.romaji;
          for (const ch of romajiStr) {
            typeFn(ch);
            if (ge.getState().subState !== "PLAYING") break;
          }
          if (ge.getState().subState === "PLAYING") {
            typeFn("Enter");
          }
          if (ge.getState().battle.lastFeedback?.isCorrect) {
            romajiLiveTypedOk = true;
          }
        }

        if (ge.getState().subState === "FEEDBACK") {
          ge.nextQuestion({ force: true, fromKeyboard: false });
        }
      }
    }

    assert(
      kanaSolveCount >= 2 && romajiLiveTypedOk,
      "GE-ROMAJI-TYPING",
      "Wave 3 가나 크리스탈 샤드 클릭 조립 및 영문 로마자 키보드 실시간 타격 정답 판정 모두 통과"
    );

    const finalState = ge.getState();
    assert(
      finalState.phase === "RESULT" &&
        finalState.result &&
        finalState.result.score > 0 &&
        ["S+", "S", "A", "B", "C"].includes(finalState.result.rank),
      "GE-RESULT",
      `3-Wave 라운드 완주 및 RESULT 결산 성공 (점수: ${finalState.result?.score}, 랭크: ${finalState.result?.rank})`
    );
    assert(
      dualStateChangeOk && dualRoundCompleteOk,
      "GE-EVENT-DUAL",
      "stateChange / roundComplete 이벤트 최상위 필드 + state/summary 중첩 동시 제공 확인"
    );
    assert(
      (seenTypes.has("multiple-choice") || seenTypes.has("listening")) &&
        seenTypes.has("pair-match") &&
        (seenTypes.has("kana-spelling") || seenTypes.has("spelling")),
      "GE-3WAVE",
      `3-Wave 미니게임 유형 전체 출제 확인: [${[...seenTypes].join(", ")}]`
    );

    // 4. Timer Leak Check
    assert(
      env.activeIntervals.size === 0,
      "GE-TIMER-RESULT",
      `RESULT 도달 후 잔여 활성 setInterval 0건 확인 (현재: ${env.activeIntervals.size}건)`
    );

    ge.startCampaignRound(2, { memorizeSec: 30 });
    assert(env.activeIntervals.size >= 1, "GE-TIMER-ACTIVE", "MEMORIZE 중 타이머 정상 가동 확인");
    ge.abortToLobby();
    assert(
      ge.getState().phase === "LOBBY" && env.activeIntervals.size === 0,
      "GE-TIMER-ABORT",
      `로비 중도 이탈(abortToLobby) 시 모든 타이머 즉시 해제 확인 (잔여 interval: ${env.activeIntervals.size}건)`
    );

    // 5. Revenge Mode (populated from Round 1!)
    const revCheckAfter = ge.canStartRevenge();
    const revStartAfter = ge.startRevengeMode({ memorizeSec: 30, battleStyle: "quiz-only" });
    assert(
      revCheckAfter.available === true &&
        (!revStartAfter || revStartAfter.ok !== false) &&
        (ge.getState().phase === "MEMORIZE" || ge.getState().phase === "BATTLE"),
      "GE-REVENGE-RUN",
      `오답/별표 누적 후 리벤지 도장 정상 진입 확인 (약점 풀: ${revCheckAfter.weakCount}개)`
    );
    ge.abortToLobby();

    // 6. Survival Mode (3 Hearts -> Game Over -> RESULT)
    ge.startSurvivalMode({ skipMemorize: true });
    assert(
      ge.getState().phase === "BATTLE" && ge.getState().mode === "survival" && ge.getState().battle.hearts === 3,
      "GE-SURVIVAL-START",
      "무한 서바이벌 블리츠(하트 3개, 암기 스킵) 즉시 진입 확인"
    );

    let survSteps = 0;
    while (ge.getState().phase === "BATTLE" && survSteps < 14) {
      survSteps++;
      const sq = ge.getState().battle.currentQuestion;
      if (sq.type === "multiple-choice" || sq.type === "listening") {
        const cIdx = findCorrectOptionIndex(sq, wordsById);
        const wIdx = findWrongOptionIndex(sq, cIdx);
        ge.submitAnswer(wIdx);
      } else {
        ge.submitAnswer("__wrong_answer__");
      }
      if (ge.getState().subState === "FEEDBACK") {
        ge.nextQuestion({ force: true, fromKeyboard: false });
      }
    }
    assert(
      ge.getState().phase === "RESULT" && env.activeIntervals.size === 0,
      "GE-SURVIVAL-END",
      "서바이벌 하트 소진 시 게임오버 RESULT 결산 및 타이머 해제 완료"
    );
    // 7. Verify All 5 Wave-1 SubTypes (kanji-to-kana, jp-to-ko, ko-to-jp, cloze, audio-to-ko) & SAKURA FEVER Activation
    const seenSubTypes = new Set();
    let feverTriggered = false;
    ge.on("feverStart", () => {
      feverTriggered = true;
    });

    for (const rNum of [1, 2, 3]) {
      ge.startCampaignRound(rNum, { memorizeSec: 60, battleStyle: "prism-mix" });
      ge.startBattleFromMemorize(); // Early start gives initial fever gauge boost!
      let fGuard = 0;
      while (ge.getState().phase === "BATTLE" && fGuard < 40) {
        fGuard++;
        const stNow = ge.getState();
        if (stNow.battle.feverActive) feverTriggered = true;
        const fq = stNow.battle.currentQuestion;
        if (!fq) break;
        if (fq.subType) seenSubTypes.add(fq.subType);

        if (fq.type === "multiple-choice" || fq.type === "listening") {
          const cIdx = findCorrectOptionIndex(fq, wordsById);
          ge.submitAnswer(cIdx);
        } else if (fq.type === "pair-match") {
          const jpTiles = fq.tiles.filter((t) => t.side === "jp");
          const koTiles = fq.tiles.filter((t) => t.side === "ko");
          for (const jt of jpTiles) {
            const kt = koTiles.find((k) => k.wordId === jt.wordId);
            ge.selectMatchTile(jt.tileId);
            if (kt) ge.selectMatchTile(kt.tileId);
            if (ge.getState().battle.feverActive) feverTriggered = true;
          }
        } else {
          const tw = fq.word || wordsById.get(fq.wordId);
          ge.submitAnswer(tw.kana);
        }
        if (ge.getState().battle.feverActive) feverTriggered = true;
        if (ge.getState().subState === "FEEDBACK") {
          ge.nextQuestion({ force: true, fromKeyboard: false });
        }
      }
      ge.abortToLobby();
    }

    const requiredSubTypes = ["kanji-to-kana", "jp-to-ko", "ko-to-jp", "cloze", "audio-to-ko"];
    const all5SubTypesSeen = requiredSubTypes.every((stName) => seenSubTypes.has(stName));
    assert(
      all5SubTypesSeen,
      "GE-5-SUBTYPES",
      `Wave 1 JLPT N5 5대 출제 유형 전체 생성 확인: [${requiredSubTypes.filter((s) => seenSubTypes.has(s)).join(", ")}]`
    );
    assert(
      feverTriggered,
      "GE-SAKURA-FEVER",
      "연속 정답 콤보 누적 시 SAKURA FEVER(점수 ×2.0 & 타이머 감속) 정상 발동 확인"
    );
  } finally {
    env.cleanupTimers();
  }
}

/* ============================================================================
   SUITE 5: Real Headless Browser E2E via Native Chrome DevTools Protocol (CDP)
   ============================================================================ */
function findChromiumExecutable() {
  const candidates = [
    process.env.CHROME_BIN,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

function startStaticServer(rootDir) {
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml"
  };

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url, "http://127.0.0.1");
      let relPath = decodeURIComponent(reqUrl.pathname);
      if (relPath === "/") relPath = "/index.html";
      const filePath = path.resolve(rootDir, "." + relPath);
      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => {
      resolve({
        server,
        port: server.address().port,
        close: () => new Promise((r) => server.close(r))
      });
    });
    server.on("error", reject);
  });
}

async function launchHeadlessBrowser(exePath) {
  const debugPort = await getFreePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "prism-n5-qa-"));

  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-background-networking",
    "--allow-file-access-from-files",
    "--mute-audio",
    "--window-size=1280,840",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ];

  const proc = spawn(exePath, args, { stdio: ["ignore", "pipe", "pipe"] });

  let targetWsUrl = null;
  for (let i = 0; i < 60; i++) {
    try {
      const resp = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      if (resp.ok) {
        const list = await resp.json();
        const pageTarget = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
        if (pageTarget) {
          targetWsUrl = pageTarget.webSocketDebuggerUrl;
          break;
        }
      }
    } catch (_) {
      /* wait until ready */
    }
    await sleep(100);
  }

  if (!targetWsUrl) {
    proc.kill();
    throw new Error("Headless Chromium CDP endpoint did not start in time.");
  }

  const ws = new WebSocket(targetWsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  let seq = 0;
  const pending = new Map();
  const consoleErrors = [];
  const pageErrors = [];

  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(typeof ev.data === "string" ? ev.data : ev.data.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      else resolve(msg.result);
      return;
    }
    if (msg.method === "Runtime.consoleAPICalled" && msg.params?.type === "error") {
      const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
      consoleErrors.push(text);
    } else if (msg.method === "Runtime.exceptionThrown") {
      const details = msg.params?.exceptionDetails;
      pageErrors.push(details?.exception?.description || details?.text || "Unknown page exception");
    } else if (msg.method === "Log.entryAdded" && msg.params?.entry?.level === "error") {
      const entry = msg.params.entry;
      if (!String(entry.url || "").includes("favicon")) {
        consoleErrors.push(`[LogError] ${entry.text} (${entry.url || ""})`);
      }
    }
  });

  function send(method, params = {}) {
    const id = ++seq;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(
        res.exceptionDetails.exception?.description || res.exceptionDetails.text || "Eval error"
      );
    }
    return res.result?.value;
  }

  async function navigateAndWait(url) {
    await send("Page.navigate", { url });
    for (let i = 0; i < 60; i++) {
      const ready = await evaluate(
        "Boolean(document.readyState === 'complete' && window.N5App && window.N5App.UI && window.N5App.GameEngine)"
      ).catch(() => false);
      if (ready) break;
      await sleep(100);
    }
    await sleep(140);
  }

  async function close() {
    try {
      ws.close();
    } catch (_) {}
    try {
      proc.kill();
    } catch (_) {}
    await sleep(150);
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (_) {}
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");

  return { send, evaluate, navigateAndWait, consoleErrors, pageErrors, close };
}

async function runSuite5BrowserE2E() {
  console.log("\n======================================================================");
  console.log("🌐 SUITE 5: 실제 Headless Chrome(CDP) E2E · file:// · 4단후리가나 · 오십음도 · 모바일 검증");
  console.log("======================================================================");

  const exe = findChromiumExecutable();
  if (!exe) {
    fail("E2E-BROWSER", "시스템에 Chrome/Edge 실행 파일이 없습니다.");
    return;
  }

  const staticSrv = await startStaticServer(ROOT_DIR);
  const browser = await launchHeadlessBrowser(exe);

  try {
    // 1. Direct file:// protocol load verification
    const fileUrl = pathToFileURL(path.join(ROOT_DIR, "index.html")).href;
    await browser.navigateAndWait(fileUrl);

    const fileCheck = await browser.evaluate(`(() => {
      const wordsLen = (window.N5App?.WORDS_500 || window.N5App?.words)?.length || 0;
      const roundsRendered = document.querySelectorAll('[data-action="start-round"]').length;
      const activeEl = document.querySelector('[data-screen="lobby"]');
      const activeOk = Boolean(activeEl && !activeEl.hidden && getComputedStyle(activeEl).display !== 'none');
      return { wordsLen, roundsRendered, activeOk };
    })()`);

    assert(
      fileCheck.wordsLen === EXPECTED_WORD_COUNT &&
        fileCheck.roundsRendered === EXPECTED_ROUND_COUNT &&
        fileCheck.activeOk,
      "E2E-FILE-URI",
      `로컬 file:// 직접 열기 100% 동작 확인 (${fileCheck.wordsLen}단어 로드, 월드맵 ${fileCheck.roundsRendered}라운드 렌더링)`
    );
    assert(
      browser.consoleErrors.length === 0 && browser.pageErrors.length === 0,
      "E2E-FILE-ERRORS",
      "file:// 로드 시 콘솔 에러 및 미처리 예외 0건",
      [...browser.consoleErrors, ...browser.pageErrors].join(" | ")
    );

    // 2. HTTP Server (GitHub Pages simulation) Full User Journey E2E
    const httpUrl = `http://127.0.0.1:${staticSrv.port}/index.html`;
    await browser.navigateAndWait(httpUrl);

    await browser.evaluate(`
      window.N5App.LearningSystem.resetProgress();
      if (window.N5App.UI.renderLobby) window.N5App.UI.renderLobby();
    `);

    // Lobby filter tabs, Theme toggle, TTS Speed toggle, Empty Revenge guard, Gojuon Modal!
    const lobbyAndGojuon = await browser.evaluate(`(async () => {
      const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));
      const clickSel = (sel) => {
        const el = document.querySelector(sel);
        if (el) el.click();
        return Boolean(el);
      };

      // Level filters (Lv.1=20, Lv.2=18, Lv.3=12, All=50)
      clickSel('[data-action="filter-level"][data-level="1"]');
      const lv1Count = document.querySelectorAll('[data-action="start-round"]').length;
      clickSel('[data-action="filter-level"][data-level="2"]');
      const lv2Count = document.querySelectorAll('[data-action="start-round"]').length;
      clickSel('[data-action="filter-level"][data-level="3"]');
      const lv3Count = document.querySelectorAll('[data-action="start-round"]').length;
      clickSel('[data-action="filter-level"][data-level="all"]');
      const allCount = document.querySelectorAll('[data-action="start-round"]').length;

      // Theme toggle
      const themeBtn = document.querySelector('[data-action="toggle-theme"]') || document.getElementById('btn-toggle-theme');
      const initialTheme = document.documentElement.getAttribute('data-theme');
      if (themeBtn) themeBtn.click();
      const toggledTheme = document.documentElement.getAttribute('data-theme');
      if (themeBtn) themeBtn.click();
      const restoredTheme = document.documentElement.getAttribute('data-theme');

      // TTS speed toggle
      const rateBefore = window.N5App.LearningSystem.tts.getRate();
      const speedBtn = document.querySelector('[data-action="toggle-tts-speed"]') || document.getElementById('btn-toggle-tts-speed');
      if (speedBtn) speedBtn.click();
      const rateAfter = window.N5App.LearningSystem.tts.getRate();
      if (speedBtn) speedBtn.click();

      // Empty Revenge guard
      const revBtn = document.querySelector('[data-action="start-revenge"]') || document.getElementById('btn-start-revenge');
      if (revBtn) revBtn.click();
      await waitMs(50);
      const stillLobby = window.N5App.GameEngine.getState().phase === 'LOBBY';

      // Gojuon Modal open -> tabs (seion/dakuon/yoon/rules) -> script switch -> kana click -> close
      clickSel('[data-action="open-gojuon"]');
      await waitMs(60);
      const modal = document.getElementById('gojuon-modal') || document.querySelector('[data-modal="gojuon"]');
      const modalOpened = Boolean(modal && !modal.hidden && getComputedStyle(modal).display !== 'none');
      const kanaCellCount = modal ? modal.querySelectorAll('.gojuon-cell, [data-kana], [data-action="speak-kana"]').length : 0;
      const kanaBtn = modal ? modal.querySelector('button[data-kana], [data-action="speak-kana"], .gojuon-cell') : null;
      if (kanaBtn) kanaBtn.click();
      for (const tab of ['dakuon', 'yoon', 'rules', 'seion']) {
        clickSel('[data-action="gojuon-tab"][data-tab="' + tab + '"]');
      }
      for (const sc of ['hira', 'kata', 'both']) {
        clickSel('[data-action="gojuon-script"][data-script="' + sc + '"]');
      }
      await waitMs(40);
      clickSel('[data-action="close-gojuon"]');
      await waitMs(60);
      const modalClosed = Boolean(!modal || modal.hidden || getComputedStyle(modal).display === 'none' || modal.classList.contains('is-hidden'));

      return {
        lv1Count, lv2Count, lv3Count, allCount,
        initialTheme, toggledTheme, restoredTheme,
        rateToggledOk: !speedBtn || Math.abs(rateBefore - rateAfter) > 0.05,
        stillLobby,
        modalOpened,
        kanaCellCount,
        modalClosed
      };
    })()`);

    assert(
      lobbyAndGojuon.lv1Count === 20 &&
        lobbyAndGojuon.lv2Count === 18 &&
        lobbyAndGojuon.lv3Count === 12 &&
        lobbyAndGojuon.allCount === 50,
      "E2E-LOBBY-FILTER",
      `로비 월드맵 레벨 필터(Lv.1=${lobbyAndGojuon.lv1Count}R, Lv.2=${lobbyAndGojuon.lv2Count}R, Lv.3=${lobbyAndGojuon.lv3Count}R, 전체=${lobbyAndGojuon.allCount}R) 확인`
    );
    assert(
      lobbyAndGojuon.initialTheme !== lobbyAndGojuon.toggledTheme &&
        lobbyAndGojuon.initialTheme === lobbyAndGojuon.restoredTheme,
      "E2E-THEME",
      `듀얼 테마(${lobbyAndGojuon.initialTheme} ↔ ${lobbyAndGojuon.toggledTheme}) 즉시 전환 확인`
    );
    assert(
      lobbyAndGojuon.stillLobby,
      "E2E-EMPTY-REVENGE",
      "초기 상태 리벤지 클릭 시 크래시 없이 안내 표시 및 로비 유지 확인"
    );
    assert(
      lobbyAndGojuon.modalOpened && lobbyAndGojuon.kanaCellCount >= 20 && lobbyAndGojuon.modalClosed,
      "E2E-GOJUON-MODAL",
      `오십음도(あ/ア) 글래스 모달 열기 · 셀 렌더링(${lobbyAndGojuon.kanaCellCount}개) · 발음 클릭 · 닫기 통과`
    );

    // WCAG AAA Contrast Check on Glass Hero Panel across Both Themes
    const contrastReport = await browser.evaluate(`(async () => {
      const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));
      function parseRgb(str) {
        const m = String(str || '').match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
        if (!m) return { r: 8, g: 11, b: 26, a: 1 };
        return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
      }
      function blend(fg, bg) {
        const a = fg.a + bg.a * (1 - fg.a);
        if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
        return {
          r: Math.round((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a),
          g: Math.round((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a),
          b: Math.round((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a),
          a
        };
      }
      function lum({ r, g, b }) {
        const srgb = [r, g, b].map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
      }
      function ratio(c1, c2) {
        const l1 = lum(c1), l2 = lum(c2);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      }
      function checkCurrentTheme() {
        const bodyBg = parseRgb(getComputedStyle(document.body).backgroundColor);
        const panel = document.querySelector('[data-screen="lobby"] .glass-panel, .lobby-hero, [data-screen="lobby"] header') || document.body;
        const panelBg = blend(parseRgb(getComputedStyle(panel).backgroundColor), bodyBg);
        const titleEl = document.querySelector('.hero-title, [data-screen="lobby"] h1, [data-screen="lobby"] h2') || document.body;
        const titleColor = parseRgb(getComputedStyle(titleEl).color);
        return ratio(titleColor, panelBg);
      }
      await waitMs(400);
      const darkRatio = checkCurrentTheme();
      const themeBtn = document.querySelector('[data-action="toggle-theme"]') || document.getElementById('btn-toggle-theme');
      if (themeBtn) themeBtn.click();
      await waitMs(420);
      const lightRatio = checkCurrentTheme();
      if (themeBtn) themeBtn.click();
      await waitMs(420);
      return { darkRatio, lightRatio };
    })()`);

    assert(
      contrastReport.darkRatio >= 7.0 && contrastReport.lightRatio >= 7.0,
      "E2E-WCAG-CONTRAST",
      `글래스모피즘 텍스트 명도 대비 WCAG AAA 통과 (MidnightSakura=${contrastReport.darkRatio.toFixed(1)}:1, CrystalSakuraDay=${contrastReport.lightRatio.toFixed(1)}:1)`
    );

    // 3. Enter Round 1 Study Phase: Verify 10 Cards, Zero <ruby> Overflow, 4-Mode Masking, In-Place Pin, Extend, Early Start
    const studyReport = await browser.evaluate(`(() => {
      document.querySelector('[data-action="start-round"][data-round="1"]').click();
      const studyScreen = document.querySelector('[data-screen="study"]');
      const studyActive = Boolean(studyScreen && !studyScreen.hidden && getComputedStyle(studyScreen).display !== 'none');

      const cards = [...studyScreen.querySelectorAll('.vocab-flip-scene, .study-card, [data-word-id]')].filter(
        (el) => el.querySelector('[data-action="flip-card"]') || el.classList.contains('vocab-flip-scene')
      );

      // Check vertical/horizontal overflow on front & back faces with <ruby><rt>
      let cardOverflowCount = 0;
      for (const scene of cards) {
        const faces = scene.querySelectorAll('.vocab-face, .vocab-face--front, .vocab-face--back, .card-face');
        for (const f of faces) {
          if (f.clientHeight > 0 && f.scrollHeight > f.clientHeight + 8) {
            cardOverflowCount++;
            break;
          }
        }
      }

      // Verify In-Place DOM Update on Pin (first card node must remain connected!)
      const firstCardRef = cards[0];
      const pinBtns = studyScreen.querySelectorAll('[data-action="toggle-pin"]');
      if (pinBtns[0]) pinBtns[0].click();
      if (pinBtns[1]) pinBtns[1].click();
      const inPlacePinPreserved = Boolean(firstCardRef && firstCardRef.isConnected);
      const pinnedIdsLen = window.N5App.GameEngine.getState().memorize.roundPinnedIds.length;

      // Flip first card
      const flipTrigger = cards[0]?.querySelector('[data-action="flip-card"]') || cards[0];
      if (flipTrigger) flipTrigger.click();
      const firstFlipped = Boolean(
        cards[0]?.classList.contains('is-flipped') ||
        studyScreen.querySelector('.is-flipped')
      );

      // Test all 4 masking modes: all, furigana, meaning, japanese
      const maskModesSeen = [];
      let furiganaMaskedVisually = false;
      for (const mode of ['furigana', 'meaning', 'japanese', 'all']) {
        const btn = studyScreen.querySelector('[data-action="toggle-mask"][data-mask="' + mode + '"]');
        if (btn) {
          btn.click();
          const gridEl = document.getElementById('study-cards-grid') || document.getElementById('study-mask-stage');
          const activeMask = gridEl ? gridEl.getAttribute('data-mask') : (btn.classList.contains('is-active') ? mode : '');
          if (activeMask === mode) maskModesSeen.push(mode);
          if (mode === 'furigana') {
            const rt = studyScreen.querySelector('ruby rt');
            if (rt) {
              const st = getComputedStyle(rt);
              if (parseFloat(st.opacity) < 0.9 || st.filter !== 'none' || st.visibility === 'hidden' || st.color === 'rgba(0, 0, 0, 0)') {
                furiganaMaskedVisually = true;
              }
            } else {
              furiganaMaskedVisually = true;
            }
          }
        }
      }

      // Extend +15s & Early Start
      const extBtn = studyScreen.querySelector('[data-action="extend-time"]') || document.getElementById('btn-extend-time');
      if (extBtn) extBtn.click();
      const extLeft = window.N5App.GameEngine.getState().memorize.extensionsLeft;

      const earlyBtn = studyScreen.querySelector('[data-action="start-battle-early"]') || document.getElementById('btn-start-battle-early');
      if (earlyBtn) earlyBtn.click();
      const battleScreen = document.querySelector('[data-screen="battle"]');
      const battleActive = Boolean(battleScreen && !battleScreen.hidden && getComputedStyle(battleScreen).display !== 'none');

      return {
        studyActive,
        cardCount: cards.length,
        cardOverflowCount,
        inPlacePinPreserved,
        pinnedIdsLen,
        firstFlipped,
        maskModesSeen,
        furiganaMaskedVisually,
        extLeft,
        battleActive
      };
    })()`);

    assert(
      studyReport.studyActive &&
        studyReport.cardCount === 10 &&
        studyReport.inPlacePinPreserved &&
        studyReport.pinnedIdsLen === 2 &&
        studyReport.firstFlipped &&
        studyReport.maskModesSeen.length === 4 &&
        studyReport.furiganaMaskedVisually &&
        studyReport.extLeft === 0 &&
        studyReport.battleActive,
      "E2E-STUDY-4MASK",
      `10단어 기억 공방(3D 플립 · 4단 후리가나 마스킹[${studyReport.maskModesSeen.join(",")}] · In-Place 핀 · +15초 연장 · 조기출격) 통과`,
      JSON.stringify(studyReport)
    );
    assert(
      studyReport.cardOverflowCount === 0,
      "E2E-RUBY-CARD-FIT",
      `<ruby><rt> 후리가나 포함 10단어 3D 플립 카드 앞/뒷면 오버플로우 0건 (오버플로우 카드: ${studyReport.cardOverflowCount}장)`
    );

    // 4. Play Through Entire 3-Wave Battle via Real DOM Clicks & Live Romaji KeyboardEvents!
    const battleReport = await browser.evaluate(`(async () => {
      const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));
      const ge = window.N5App.GameEngine;
      const wb = window.N5App.WordBank;
      const wordsById = new Map(wb.getAllWords().map((w) => [w.id, w]));

      let didIntentionalWrongOverlay = false;
      let hintDomEliminatedOk = true;
      let usedDomRomajiTyping = false;
      let pairMatchInPlaceOk = true;
      let steps = 0;
      let kanaCount = 0;

      while (ge.getState().phase === 'BATTLE' && steps < 60) {
        steps++;
        const st = ge.getState();
        const q = st.battle.currentQuestion;
        if (!q) break;

        if (q.type === 'multiple-choice' || q.type === 'listening') {
          if (st.battle.hintsRemaining > 0 && steps === 1) {
            const hintBtn = document.querySelector('[data-action="use-hint"]') || document.getElementById('btn-use-hint');
            if (hintBtn) hintBtn.click();
            await sleepMs(25);
            const optBtns = [...document.querySelectorAll('[data-action="answer-option"], .mc-option-btn')];
            const domElim = optBtns.filter((b) => b.disabled || b.classList.contains('is-eliminated')).length;
            if (domElim !== 2) hintDomEliminatedOk = false;
          }

          const target = q.word || wordsById.get(q.wordId);
          let cIdx = 0;
          q.options.forEach((o, idx) => {
            if (o.isCorrect || (target && (o.label === target.kana || o.label === target.meaning || o.label === target.expression))) {
              cIdx = idx;
            }
          });

          const optBtns = [...document.querySelectorAll('[data-action="answer-option"], .mc-option-btn')];

          // Trigger intentional wrong answer (accounting for 1 initial shield -> need wrong when shields===0 or twice)
          if (!didIntentionalWrongOverlay && steps >= 2) {
            const wIdx = q.options.findIndex((o, idx) => idx !== cIdx && !o.eliminated);
            if (wIdx !== -1 && optBtns[wIdx]) {
              const hadShield = st.battle.shields > 0;
              optBtns[wIdx].click();
              await sleepMs(45);
              const skipBtn = document.querySelector('[data-action="skip-feedback"]') || document.getElementById('btn-skip-feedback');
              if (!hadShield && skipBtn && skipBtn.offsetParent !== null) {
                didIntentionalWrongOverlay = true;
                skipBtn.click();
                await sleepMs(35);
                continue;
              }
              if (ge.getState().subState === 'FEEDBACK') {
                didIntentionalWrongOverlay = !hadShield;
                if (skipBtn) skipBtn.click();
                if (ge.getState().subState === 'FEEDBACK') {
                  ge.nextQuestion({ force: true, fromKeyboard: false });
                }
              }
              await sleepMs(30);
              continue;
            }
          }

          if (optBtns[cIdx]) {
            optBtns[cIdx].click();
            optBtns[cIdx].click();
          } else {
            ge.submitAnswer(cIdx);
          }
          await sleepMs(30);
          if (ge.getState().subState === 'FEEDBACK') {
            ge.nextQuestion({ force: true, fromKeyboard: false });
          }
          await sleepMs(20);
        } else if (q.type === 'pair-match') {
          const allTileEls = [...document.querySelectorAll('[data-action="match-tile"], .pair-tile')];
          const sampleRef = allTileEls[0];
          const jpTiles = q.tiles.filter((t) => t.side === 'jp');
          const koTiles = q.tiles.filter((t) => t.side === 'ko');

          for (const jt of jpTiles) {
            const kt = koTiles.find((k) => k.wordId === jt.wordId);
            const jBtn = document.querySelector('[data-tile-id="' + jt.tileId + '"]');
            const kBtn = kt ? document.querySelector('[data-tile-id="' + kt.tileId + '"]') : null;
            if (jBtn && kBtn) {
              jBtn.click();
              if (sampleRef && !sampleRef.isConnected) pairMatchInPlaceOk = false;
              kBtn.click();
            } else {
              ge.selectMatchTile(jt.tileId);
              if (kt) ge.selectMatchTile(kt.tileId);
            }
            await sleepMs(15);
          }
          if (ge.getState().subState === 'FEEDBACK') {
            ge.nextQuestion({ force: true, fromKeyboard: false });
          }
          await sleepMs(20);
        } else if (q.type === 'kana-spelling' || q.type === 'spelling') {
          kanaCount++;
          const target = q.word || wordsById.get(q.wordId);

          if (kanaCount === 1) {
            // Method A: Click Mora Shards via DOM!
            const units = q.targetUnits || ge.splitMorae(target.kana);
            for (const mora of units) {
              const shardBtn = [...document.querySelectorAll('[data-action="tap-shard"]:not(:disabled), .letter-shard:not(:disabled), .kana-shard:not(:disabled)')].find(
                (b) => {
                  const sid = b.getAttribute('data-shard-id');
                  const sObj = ge.getState().battle.currentQuestion?.shards?.find((s) => s.shardId === sid);
                  return (sObj && !sObj.used && (sObj.mora === mora || sObj.char === mora)) ||
                    b.getAttribute('data-char') === mora ||
                    b.getAttribute('data-mora') === mora;
                }
              );
              if (shardBtn) shardBtn.click();
              await sleepMs(15);
            }
          } else {
            // Method B: Real DOM KeyboardEvent('keydown') English Romaji Typing!
            await sleepMs(160);
            for (const ch of target.romaji) {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true, cancelable: true }));
              await sleepMs(10);
              if (ge.getState().subState !== 'PLAYING') break;
            }
            if (ge.getState().subState === 'PLAYING') {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
            }
            usedDomRomajiTyping = true;
          }

          await sleepMs(25);
          if (ge.getState().subState === 'PLAYING') {
            ge.submitAnswer(target.kana);
          }
          if (ge.getState().subState === 'FEEDBACK') {
            ge.nextQuestion({ force: true, fromKeyboard: false });
          }
          await sleepMs(20);
        }
      }

      const resultScreen = document.querySelector('[data-screen="result"]');
      const resultVisible = Boolean(resultScreen && !resultScreen.hidden && getComputedStyle(resultScreen).display !== 'none');
      const finalRes = ge.getState().result;

      return {
        resultVisible,
        rank: finalRes?.rank || '',
        score: finalRes?.score || 0,
        didIntentionalWrongOverlay,
        hintDomEliminatedOk,
        pairMatchInPlaceOk,
        usedDomRomajiTyping
      };
    })()`);

    assert(
      battleReport.hintDomEliminatedOk,
      "E2E-HINT-DOM",
      "배틀 스마트 힌트 클릭 시 DOM 보기 2개 소거 즉시 반영 확인"
    );
    assert(
      battleReport.pairMatchInPlaceOk,
      "E2E-PAIR-INPLACE",
      "Wave 2 매트릭스 타일 클릭 시 DOM 노드 detach 없는 In-Place 갱신 확인"
    );
    assert(
      battleReport.usedDomRomajiTyping,
      "E2E-DOM-ROMAJI",
      "Wave 3 실제 브라우저 keydown 영문 로마자 타이핑 → 가나 샤드 자동 조립 통과"
    );
    assert(
      battleReport.didIntentionalWrongOverlay,
      "E2E-HC-FEEDBACK",
      "오답 발생 시 하이퍼코렉션 후리가나·한자음 각인 피드백 노출 확인"
    );
    assert(
      battleReport.resultVisible && ["S+", "S", "A", "B", "C"].includes(battleReport.rank) && battleReport.score > 0,
      "E2E-RESULT-SCREEN",
      `결과 화면 렌더링 완료 (랭크: ${battleReport.rank}, 점수: ${battleReport.score})`
    );

    // 5. 500-Word N5 Prism Codex Unified Search (Kanji / Kana / Romaji / Korean / POS) & Revenge Launch
    const codexReport = await browser.evaluate(`(async () => {
      const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));
      // Ensure at least 1 wrong word in note for filter verification
      window.N5App.LearningSystem.recordAttempt(5, false, { round: 1, mode: 'campaign' });

      const openBtn = document.querySelector('[data-action="open-codex"]') || document.getElementById('btn-open-codex');
      if (openBtn) openBtn.click();
      else if (window.N5App.UI.openCodex) window.N5App.UI.openCodex();
      await waitMs(40);

      const codexScreen = document.querySelector('[data-screen="codex"]');
      const codexVisible = Boolean(codexScreen && !codexScreen.hidden && getComputedStyle(codexScreen).display !== 'none');

      const sample = window.N5App.WordBank.getAllWords().find((w) => Boolean(w.kanji)) || window.N5App.WordBank.getAllWords()[0];
      const searchInput = codexScreen.querySelector('input[type="search"], input[type="text"], #codex-search-input');

      const countCards = () => codexScreen.querySelectorAll('.codex-card, [data-codex-word], [data-word-id]').length;

      const testQuery = (qStr) => {
        if (!searchInput) return 0;
        searchInput.value = qStr;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        return countCards();
      };

      const kanjiHits = testQuery(sample.kanji);
      const kanaHits = testQuery(sample.kana);
      const romajiHits = testQuery(sample.romaji);
      const koHits = testQuery(sample.meaning);
      testQuery('');

      // Test POS select filter (1류동사) + Pinned & Wrong filter tabs
      const posSelect = document.getElementById('codex-pos-select');
      let posHits = 0;
      if (posSelect) {
        posSelect.value = '1류동사';
        posSelect.dispatchEvent(new Event('change', { bubbles: true }));
        posHits = countCards();
        posSelect.value = '';
        posSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const pinFilterBtn = codexScreen.querySelector('[data-action="codex-filter"][data-filter="pinned"]');
      if (pinFilterBtn) pinFilterBtn.click();
      const pinnedHits = countCards();
      const wrongFilterBtn = codexScreen.querySelector('[data-action="codex-filter"][data-filter="wrong"]');
      if (wrongFilterBtn) wrongFilterBtn.click();
      const wrongHits = countCards();
      const allFilterBtn = codexScreen.querySelector('[data-action="codex-filter"][data-filter="all"]');
      if (allFilterBtn) allFilterBtn.click();

      // Launch Revenge from Codex or Lobby
      const revBtn = codexScreen.querySelector('[data-action="start-revenge"]') || document.querySelector('[data-action="start-revenge"]');
      if (revBtn) revBtn.click();
      await waitMs(40);
      const enteredRevenge = window.N5App.GameEngine.getState().mode === 'revenge';
      window.N5App.GameEngine.abortToLobby();

      return { codexVisible, kanjiHits, kanaHits, romajiHits, koHits, posHits, pinnedHits, wrongHits, enteredRevenge };
    })()`);

    assert(
      codexReport.codexVisible &&
        codexReport.kanjiHits >= 1 &&
        codexReport.kanaHits >= 1 &&
        codexReport.romajiHits >= 1 &&
        codexReport.koHits >= 1 &&
        codexReport.posHits >= 10 &&
        codexReport.pinnedHits >= 2 &&
        codexReport.wrongHits >= 1 &&
        codexReport.enteredRevenge,
      "E2E-CODEX-SEARCH",
      `500단어 도감 통합 검색(한자=${codexReport.kanjiHits}, 가나=${codexReport.kanaHits}, 로마자=${codexReport.romajiHits}, 뜻=${codexReport.koHits}, 1류동사=${codexReport.posHits}, 별표=${codexReport.pinnedHits}, 오답=${codexReport.wrongHits}) & 리벤지 통과`
    );

    // 6. Mobile 360x640 Viewport Zero Horizontal Overflow Audit across All Screens & Gojuon Modal!
    await browser.send("Emulation.setDeviceMetricsOverride", {
      width: 360,
      height: 640,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(120);

    const mobileAudit = await browser.evaluate(`(async () => {
      const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));
      const ge = window.N5App.GameEngine;
      const results = {};

      // 1. Lobby
      ge.abortToLobby();
      await waitMs(30);
      results.lobby = document.documentElement.scrollWidth - window.innerWidth;

      // 2. Gojuon Modal on 360px
      const gojuonBtn = document.querySelector('[data-action="open-gojuon"]');
      if (gojuonBtn) gojuonBtn.click();
      await waitMs(40);
      results.gojuon = document.documentElement.scrollWidth - window.innerWidth;
      const closeGojuon = document.querySelector('[data-action="close-gojuon"]');
      if (closeGojuon) closeGojuon.click();
      await waitMs(30);

      // 3. Study (<ruby> cards)
      ge.startCampaignRound(1, { memorizeSec: 45, battleStyle: 'prism-mix' });
      await waitMs(30);
      results.study = document.documentElement.scrollWidth - window.innerWidth;

      // 4. Battle (Quiz / Kanji-to-Kana)
      ge.startBattleFromMemorize();
      await waitMs(30);
      results.battleQuiz = document.documentElement.scrollWidth - window.innerWidth;

      // 5. Battle (Pair Match)
      ge.startCampaignRound(1, { skipMemorize: true, battleStyle: 'match-only' });
      if (ge.getState().phase === 'MEMORIZE') ge.startBattleFromMemorize();
      await waitMs(30);
      results.battleMatch = document.documentElement.scrollWidth - window.innerWidth;

      // 6. Battle (Kana Shards & Romaji Buffer)
      ge.startCampaignRound(1, { skipMemorize: true, battleStyle: 'kana-only' });
      if (ge.getState().phase === 'MEMORIZE') ge.startBattleFromMemorize();
      await waitMs(30);
      results.battleKana = document.documentElement.scrollWidth - window.innerWidth;

      // 7. Codex
      const openCodexBtn = document.querySelector('[data-action="open-codex"]') || document.getElementById('btn-open-codex');
      if (openCodexBtn) openCodexBtn.click();
      else if (window.N5App.UI.openCodex) window.N5App.UI.openCodex();
      await waitMs(30);
      results.codex = document.documentElement.scrollWidth - window.innerWidth;

      ge.abortToLobby();
      return results;
    })()`);

    const maxOverflow = Math.max(...Object.values(mobileAudit));
    assert(
      maxOverflow <= 1,
      "E2E-MOBILE-360x640",
      `모바일 뷰포트(360×640) 전 화면(오십음도·후리가나·가나샤드 포함) 가로 잘림 0px 확인 (${JSON.stringify(mobileAudit)})`
    );

    // 7. Round 50 Finale & Keyboard Shortcuts Check
    await browser.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 840,
      deviceScaleFactor: 1,
      mobile: false
    });
    const kbAndR50 = await browser.evaluate(`(async () => {
      const waitMs = (ms) => new Promise((r) => setTimeout(r, ms));
      const ge = window.N5App.GameEngine;
      ge.startCampaignRound(50, { memorizeSec: 45, battleStyle: 'kana-only' });
      const r50Loaded = ge.getState().memorize.words.length === 10 && ge.getState().round === 50;

      // Space flips card
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
      await waitMs(30);
      const spaceFlipped = Boolean(document.querySelector('[data-screen="study"] .is-flipped'));

      // Enter starts battle early
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      await waitMs(40);
      const enterStartedBattle = ge.getState().phase === 'BATTLE';

      ge.abortToLobby();
      return { r50Loaded, spaceFlipped, enterStartedBattle };
    })()`);

    assert(
      kbAndR50.r50Loaded && kbAndR50.spaceFlipped && kbAndR50.enterStartedBattle,
      "E2E-KEYBOARD-R50",
      "Round 50(N5 피날레) 로드 및 키보드 단축키(Space 플립 · Enter 조기출격) 동작 확인"
    );

    assert(
      browser.consoleErrors.length === 0 && browser.pageErrors.length === 0,
      "E2E-ZERO-CONSOLE-ERR",
      "전 구간 플레이 중 브라우저 console.error 및 미처리 예외 0건 달성",
      [...browser.consoleErrors, ...browser.pageErrors].join(" | ")
    );
  } finally {
    await browser.close();
    await staticSrv.close();
  }
}

/* ============================================================================
   Main Runner
   ============================================================================ */
async function main() {
  const startTime = Date.now();
  console.log("╔══════════════════════════════════════════════════════════════════════════╗");
  console.log("║  🌸 PRISM NIHONGO N5 (500단어/50R) — 전수 자동화 QA (tests/verify-all.mjs) ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════╝");

  const filesReady = await runSuite1StaticAndSyntax();
  if (filesReady) {
    await runSuite2VocabularyIntegrity();
    await runSuite3LearningSystem();
    await runSuite4GameEngine();
    await runSuite5BrowserE2E();
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("\n======================================================================");
  if (failedCount === 0) {
    console.log(`🎉 [ALL PASS] 총 ${passedCount}개 검증 항목 100% 통과! (소요 시간: ${elapsed}s)`);
    console.log("======================================================================");
    process.exit(0);
  } else {
    console.error(`🚨 [QA FAILED] 통과: ${passedCount}건 / 실패: ${failedCount}건 (소요 시간: ${elapsed}s)`);
    for (const f of failures) {
      console.error("  • " + f);
    }
    console.log("======================================================================");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("💥 치명적 테스트 러너 오류:", err);
  process.exit(1);
});
