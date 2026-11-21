import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const DATA_FILES = [
  path.join(ROOT_DIR, "src", "data", "words-part1.js"),
  path.join(ROOT_DIR, "src", "data", "words-part2.js"),
  path.join(ROOT_DIR, "src", "data", "words-index.js")
];

const VALID_POS = new Set([
  "명사",
  "1류동사",
  "2류동사",
  "3류동사",
  "い형용사",
  "な형용사",
  "부사",
  "표현"
]);

const KANJI_RE = /[\u4E00-\u9FFF\u3400-\u4DBF々〆ヵヶ]/;
const HIRAGANA_ONLY_RE = /^[\u3041-\u3096]+$/;
const KATAKANA_ONLY_RE = /^[\u30A1-\u30FA\u30FC]+$/;
const ROMAJI_RE = /^[a-z]+$/;
const KOREAN_RE = /[가-힣]/;
const JP_SENTENCE_END_RE = /[。！？]$/;
const RUBY_PAIR_RE = /<ruby>([^<>]+)<rt>([^<>]+)<\/rt><\/ruby>/g;

function expectedLevelForRound(round) {
  if (round >= 1 && round <= 20) return 1;
  if (round >= 21 && round <= 38) return 2;
  if (round >= 39 && round <= 50) return 3;
  return -1;
}

function validateRubyIntegrity(item) {
  const { expression, kanji, kana, rubyHtml } = item;
  if (!kanji) {
    if (KANJI_RE.test(expression)) {
      return `kanji 필드가 비어 있는데 expression('${expression}')에 한자가 포함되어 있습니다.`;
    }
    if (expression !== kana) {
      return `순수 가나 단어인데 expression('${expression}')과 kana('${kana}')가 일치하지 않습니다.`;
    }
    if (rubyHtml !== kana) {
      return `순수 가나 단어인데 rubyHtml('${rubyHtml}')이 kana('${kana}')와 일치하지 않습니다.`;
    }
    return null;
  }

  if (kanji !== expression) {
    return `한자 포함 어휘의 kanji('${kanji}')는 expression('${expression}')과 동일해야 합니다.`;
  }
  if (!KANJI_RE.test(expression)) {
    return `kanji('${kanji}')가 지정되었으나 한자 문자가 없습니다.`;
  }
  if (!rubyHtml.includes("<ruby>") || !rubyHtml.includes("<rt>")) {
    return `한자 어휘인데 rubyHtml('${rubyHtml}')에 <ruby>/<rt> 태그가 없습니다.`;
  }

  const stripped = rubyHtml.replace(RUBY_PAIR_RE, "");
  if (/[<>]/.test(stripped)) {
    return `rubyHtml 태그 짝 불일치 또는 중첩 오류: '${rubyHtml}'`;
  }
  if (KANJI_RE.test(stripped)) {
    return `rubyHtml에서 <ruby> 밖에 노출된 한자가 있습니다: '${rubyHtml}'`;
  }

  const reconstructedBase = rubyHtml.replace(RUBY_PAIR_RE, "$1");
  const reconstructedKana = rubyHtml.replace(RUBY_PAIR_RE, "$2");
  if (reconstructedBase !== expression) {
    return `rubyHtml 기본 표기('${reconstructedBase}')가 expression('${expression}')과 불일치합니다.`;
  }
  if (reconstructedKana !== kana) {
    return `rubyHtml 읽기('${reconstructedKana}')가 kana('${kana}')와 불일치합니다.`;
  }

  let match;
  RUBY_PAIR_RE.lastIndex = 0;
  while ((match = RUBY_PAIR_RE.exec(rubyHtml)) !== null) {
    const basePart = match[1];
    const rtPart = match[2];
    if (!KANJI_RE.test(basePart)) {
      return `rubyHtml의 <ruby> 내부('${basePart}')에 한자가 아닌 오쿠리가나가 포함되었습니다: '${rubyHtml}'`;
    }
    if (!HIRAGANA_ONLY_RE.test(rtPart) && !KATAKANA_ONLY_RE.test(rtPart)) {
      return `rubyHtml의 <rt> 읽기('${rtPart}')가 순수 가나가 아닙니다: '${rubyHtml}'`;
    }
  }

  return null;
}

function main() {
  const errors = [];

  for (const filePath of DATA_FILES) {
    if (!fs.existsSync(filePath)) {
      console.error(`[FAIL] 필수 데이터 파일이 없습니다: ${filePath}`);
      process.exit(1);
    }
  }

  const sandbox = { window: {}, console };
  sandbox.globalThis = sandbox.window;
  vm.createContext(sandbox);

  for (const filePath of DATA_FILES) {
    const code = fs.readFileSync(filePath, "utf8");
    try {
      vm.runInContext(code, sandbox, { filename: filePath });
    } catch (err) {
      console.error(`[FAIL] 스크립트 실행 오류 (${path.basename(filePath)}):`, err.message);
      process.exit(1);
    }
  }

  const N5App = sandbox.window.N5App;
  if (!N5App) {
    console.error("[FAIL] window.N5App 네임스페이스가 생성되지 않았습니다.");
    process.exit(1);
  }

  const part1 = N5App.WORDS_PART1;
  const part2 = N5App.WORDS_PART2;
  const words = N5App.WORDS_500;
  const rounds = N5App.ROUNDS_50;
  const bank = N5App.WordBank;

  if (!Array.isArray(part1) || part1.length !== 250) {
    errors.push(`WORDS_PART1 길이는 정확히 250이어야 합니다 (현재: ${Array.isArray(part1) ? part1.length : "배열 아님"})`);
  }
  if (!Array.isArray(part2) || part2.length !== 250) {
    errors.push(`WORDS_PART2 길이는 정확히 250이어야 합니다 (현재: ${Array.isArray(part2) ? part2.length : "배열 아님"})`);
  }
  if (!Array.isArray(words) || words.length !== 500) {
    errors.push(`WORDS_500 길이는 정확히 500이어야 합니다 (현재: ${Array.isArray(words) ? words.length : "배열 아님"})`);
  }
  if (N5App.words !== words || N5App.WORDS_800 !== words) {
    errors.push("window.N5App.words 또는 WORDS_800 하위 호환 별칭이 WORDS_500과 일치하지 않습니다.");
  }
  if (!Array.isArray(rounds) || rounds.length !== 50) {
    errors.push(`ROUNDS_50 길이는 정확히 50이어야 합니다 (현재: ${Array.isArray(rounds) ? rounds.length : "배열 아님"})`);
  }
  if (N5App.rounds !== rounds || N5App.ROUNDS_80 !== rounds) {
    errors.push("window.N5App.rounds 또는 ROUNDS_80 하위 호환 별칭이 ROUNDS_50과 일치하지 않습니다.");
  }
  if (!bank) {
    errors.push("window.N5App.WordBank 객체가 존재하지 않습니다.");
  }

  if (!Array.isArray(words) || !Array.isArray(rounds) || !bank) {
    console.error(errors.join("\n"));
    process.exit(1);
  }

  // 1. Validate 50 Rounds Metadata
  const roundMap = new Map();
  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i];
    const expectedRoundNum = i + 1;
    if (r.round !== expectedRoundNum) {
      errors.push(`ROUNDS_50[${i}].round가 ${expectedRoundNum}이 아닙니다 (현재: ${r.round})`);
    }
    const expLvl = expectedLevelForRound(expectedRoundNum);
    if (r.level !== expLvl) {
      errors.push(`Round ${expectedRoundNum}의 level은 ${expLvl}이어야 합니다 (현재: ${r.level})`);
    }
    if (typeof r.title !== "string" || r.title.trim().length < 2) {
      errors.push(`Round ${expectedRoundNum}의 title이 비어 있습니다.`);
    }
    if (typeof r.emoji !== "string" || r.emoji.trim().length === 0) {
      errors.push(`Round ${expectedRoundNum}의 emoji가 비어 있습니다.`);
    }
    if (!Array.isArray(r.wordIds) || r.wordIds.length !== 10) {
      errors.push(`Round ${expectedRoundNum}의 wordIds 길이가 10이 아닙니다 (현재: ${Array.isArray(r.wordIds) ? r.wordIds.length : "배열 아님"})`);
    }
    roundMap.set(expectedRoundNum, r);
  }

  // 2. Validate 500 Word Objects
  const seenExpressions = new Map();
  const seenMeanings = new Map();
  const roundCounts = new Map();
  const levelDistribution = { 1: 0, 2: 0, 3: 0 };
  const posDistribution = {};
  let kanjiWordCount = 0;
  let katakanaWordCount = 0;
  let hiraganaPureCount = 0;

  const nonEmptyStringFields = [
    "theme",
    "expression",
    "kana",
    "rubyHtml",
    "romaji",
    "koPron",
    "pos",
    "meaning",
    "emoji",
    "tip",
    "example",
    "exampleReading",
    "exampleKo"
  ];

  for (let i = 0; i < words.length; i++) {
    const item = words[i];
    const expectedId = i + 1;
    const expectedRound = Math.floor(i / 10) + 1;
    const expectedLevel = expectedLevelForRound(expectedRound);
    const label = `[ID ${item?.id ?? "?"} / idx ${i}]`;

    if (!item || typeof item !== "object") {
      errors.push(`${label} 단어 객체가 유효하지 않습니다.`);
      continue;
    }

    if (item.id !== expectedId) {
      errors.push(`${label} id 불일치: 기대값=${expectedId}, 실제값=${item.id}`);
    }
    if (item.round !== expectedRound) {
      errors.push(`${label} (${item.expression}) round 불일치: 기대값=${expectedRound}, 실제값=${item.round}`);
    }
    if (item.level !== expectedLevel) {
      errors.push(`${label} (${item.expression}) level 불일치: 기대값=${expectedLevel}, 실제값=${item.level}`);
    }

    if (typeof item.kanji !== "string") {
      errors.push(`${label} (${item.expression}) kanji 필드는 문자열이어야 합니다.`);
    }

    for (const field of nonEmptyStringFields) {
      if (typeof item[field] !== "string" || item[field].trim().length === 0) {
        errors.push(`${label} (${item.expression || "?"}) 필수 문자열 필드 '${field}'가 비어 있거나 누락되었습니다.`);
      }
    }

    const rMeta = roundMap.get(item.round);
    if (rMeta && item.theme !== rMeta.title) {
      errors.push(`${label} (${item.expression}) theme('${item.theme}')이 Round ${item.round} title('${rMeta.title}')과 다릅니다.`);
    }

    if (typeof item.expression === "string") {
      const expr = item.expression.trim();
      if (expr !== item.expression) {
        errors.push(`${label} expression('${item.expression}') 앞뒤에 공백이 있습니다.`);
      }
      if (seenExpressions.has(expr)) {
        errors.push(`중복 일본어 expression 발견: '${expr}' (ID ${seenExpressions.get(expr)} 및 ID ${item.id})`);
      } else {
        seenExpressions.set(expr, item.id);
      }
    }

    if (typeof item.meaning === "string") {
      const m = item.meaning.trim();
      if (!KOREAN_RE.test(m)) {
        errors.push(`${label} (${item.expression}) meaning('${m}')에 한국어가 포함되어 있지 않습니다.`);
      }
      if (seenMeanings.has(m)) {
        errors.push(`중복 한국어 meaning 발견: '${m}' (ID ${seenMeanings.get(m)} 및 ID ${item.id})`);
      } else {
        seenMeanings.set(m, item.id);
      }
    }

    if (typeof item.kana === "string") {
      const isHira = HIRAGANA_ONLY_RE.test(item.kana);
      const isKata = KATAKANA_ONLY_RE.test(item.kana);
      if (!isHira && !isKata) {
        errors.push(`${label} (${item.expression}) kana('${item.kana}')는 순수 히라가나 또는 순수 가타카나여야 합니다.`);
      }
      if (item.kanji) {
        kanjiWordCount++;
      } else if (isKata) {
        katakanaWordCount++;
      } else {
        hiraganaPureCount++;
      }
    }

    if (
      typeof item.expression === "string" &&
      typeof item.kanji === "string" &&
      typeof item.kana === "string" &&
      typeof item.rubyHtml === "string"
    ) {
      const rubyErr = validateRubyIntegrity(item);
      if (rubyErr) {
        errors.push(`${label} (${item.expression}) ${rubyErr}`);
      }
    }

    if (typeof item.romaji === "string" && !ROMAJI_RE.test(item.romaji)) {
      errors.push(`${label} (${item.expression}) romaji('${item.romaji}')는 공백/특수문자 없는 순수 소문자 영문이어야 합니다.`);
    }

    if (typeof item.koPron === "string" && !KOREAN_RE.test(item.koPron)) {
      errors.push(`${label} (${item.expression}) koPron('${item.koPron}')에 한글 발음이 없습니다.`);
    }

    if (!VALID_POS.has(item.pos)) {
      errors.push(`${label} (${item.expression}) 허용되지 않는 품사('${item.pos}')입니다.`);
    } else {
      posDistribution[item.pos] = (posDistribution[item.pos] || 0) + 1;
    }

    if (typeof item.tip === "string" && (!KOREAN_RE.test(item.tip) || item.tip.trim().length < 8)) {
      errors.push(`${label} (${item.expression}) tip('${item.tip}') 설명이 너무 짧거나 한국어가 없습니다.`);
    }

    if (typeof item.example === "string") {
      if (item.example.trim().length < 5 || !JP_SENTENCE_END_RE.test(item.example.trim())) {
        errors.push(`${label} (${item.expression}) 일본어 예문 형식 오류(마침표 。/！/？ 필요): '${item.example}'`);
      }
    }
    if (typeof item.exampleReading === "string") {
      if (KANJI_RE.test(item.exampleReading)) {
        errors.push(`${label} (${item.expression}) exampleReading에 변환되지 않은 한자가 남아 있습니다: '${item.exampleReading}'`);
      }
      if (!JP_SENTENCE_END_RE.test(item.exampleReading.trim())) {
        errors.push(`${label} (${item.expression}) exampleReading 문장부호 오류: '${item.exampleReading}'`);
      }
    }
    if (typeof item.exampleKo === "string") {
      if (!KOREAN_RE.test(item.exampleKo) || item.exampleKo.trim().length < 4) {
        errors.push(`${label} (${item.expression}) exampleKo 품질 미달: '${item.exampleKo}'`);
      }
    }

    levelDistribution[item.level] = (levelDistribution[item.level] || 0) + 1;
    roundCounts.set(item.round, (roundCounts.get(item.round) || 0) + 1);
  }

  for (let r = 1; r <= 50; r++) {
    const cnt = roundCounts.get(r) || 0;
    if (cnt !== 10) {
      errors.push(`Round ${r}의 단어 수가 10개가 아닙니다 (현재: ${cnt}개)`);
    }
  }

  if (levelDistribution[1] !== 200 || levelDistribution[2] !== 180 || levelDistribution[3] !== 120) {
    errors.push(
      `레벨별 단어 분포 불일치 (기대: 200/180/120, 실제: ${levelDistribution[1]}/${levelDistribution[2]}/${levelDistribution[3]})`
    );
  }

  // 3. Exhaustive 500/500 WordBank Method Validation
  const MASK = "［　　］";
  for (const w of words) {
    const blanked = bank.getBlankExample(w.id, MASK);
    if (typeof blanked !== "string" || !blanked.includes(MASK) || blanked === w.example) {
      errors.push(`[ID ${w.id}] (${w.expression}) getBlankExample 마스킹 실패: '${w.example}' -> '${blanked}'`);
    }

    const dists = bank.getDistractors(w.id, 3, { samePos: true, sameLevel: true });
    if (!Array.isArray(dists) || dists.length !== 3) {
      errors.push(`[ID ${w.id}] (${w.expression}) getDistractors 반환 개수 오류 (${dists?.length})`);
    } else {
      const dIds = new Set(dists.map((d) => d.id));
      const dExprs = new Set(dists.map((d) => d.expression));
      const dMeanings = new Set(dists.map((d) => d.meaning));
      if (
        dIds.size !== 3 ||
        dIds.has(w.id) ||
        dExprs.size !== 3 ||
        dExprs.has(w.expression) ||
        dMeanings.size !== 3 ||
        dMeanings.has(w.meaning)
      ) {
        errors.push(`[ID ${w.id}] (${w.expression}) getDistractors 중복 또는 정답 혼입 발생`);
      }
    }

    const kanaDists = bank.getKanaDistractors(w.id, 3);
    if (!Array.isArray(kanaDists) || kanaDists.length !== 3) {
      errors.push(`[ID ${w.id}] (${w.expression} / ${w.kana}) getKanaDistractors 개수 오류 (${kanaDists?.length})`);
    } else {
      const kSet = new Set(kanaDists);
      const isKata = KATAKANA_ONLY_RE.test(w.kana);
      if (kSet.size !== 3 || kSet.has(w.kana)) {
        errors.push(`[ID ${w.id}] (${w.expression} / ${w.kana}) getKanaDistractors 중복 또는 정답 포함: ${JSON.stringify(kanaDists)}`);
      }
      for (const kd of kanaDists) {
        const validScript = isKata ? KATAKANA_ONLY_RE.test(kd) : HIRAGANA_ONLY_RE.test(kd);
        if (!validScript) {
          errors.push(`[ID ${w.id}] (${w.expression} / ${w.kana}) getKanaDistractors 문자계 불일치: '${kd}'`);
        }
      }
    }
  }

  // 4. Search & Lookup API Sanity Checks
  if (bank.getWordsByRound(1).length !== 10 || bank.getWordsByRound(50).length !== 10) {
    errors.push("WordBank.getWordsByRound(1/50) 반환 개수 오류");
  }
  if (bank.getWordsByLevel(1).length !== 200 || bank.getWordsByLevel(2).length !== 180 || bank.getWordsByLevel(3).length !== 120) {
    errors.push("WordBank.getWordsByLevel(1/2/3) 반환 개수 오류");
  }
  const sample251 = bank.getWordById(251);
  if (!sample251 || sample251.round !== 26) {
    errors.push("WordBank.getWordById(251) Part2 시작 라운드(26) 불일치");
  }
  const firstWord = words[0];
  if (firstWord) {
    if (bank.searchWords(firstWord.expression).length === 0) {
      errors.push(`searchWords(expression='${firstWord.expression}') 결과 0건`);
    }
    if (bank.searchWords(firstWord.kana).length === 0) {
      errors.push(`searchWords(kana='${firstWord.kana}') 결과 0건`);
    }
    if (bank.searchWords(firstWord.romaji).length === 0) {
      errors.push(`searchWords(romaji='${firstWord.romaji}') 결과 0건`);
    }
    if (bank.searchWords(firstWord.meaning).length === 0) {
      errors.push(`searchWords(meaning='${firstWord.meaning}') 결과 0건`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n❌ [VALIDATION FAILED] 총 ${errors.length}건의 JLPT N5 데이터 무결성 오류가 발견되었습니다:`);
    for (const err of errors.slice(0, 50)) {
      console.error("  • " + err);
    }
    if (errors.length > 50) {
      console.error(`  ...외 ${errors.length - 50}건 생략`);
    }
    process.exit(1);
  }

  console.log("==================================================================");
  console.log("✅ [PASS] JLPT N5 필수 500단어 커리큘럼 무결성 검증 100% 통과!");
  console.log("==================================================================");
  console.log(` • 총 단어 수       : ${words.length}개 (Part1: ${part1.length}, Part2: ${part2.length})`);
  console.log(` • 고유 일본어 표기 : ${seenExpressions.size}개 (중복 0건)`);
  console.log(` • 고유 한국어 뜻   : ${seenMeanings.size}개 (중복 0건)`);
  console.log(` • 총 라운드 수     : ${rounds.length}라운드 (전 라운드 정확히 10단어)`);
  console.log(` • 레벨별 분포      : Lv.1(${levelDistribution[1]}개) / Lv.2(${levelDistribution[2]}개) / Lv.3(${levelDistribution[3]}개)`);
  console.log(` • 문자별 분포      : 한자어(${kanjiWordCount}개) / 가타카나(${katakanaWordCount}개) / 순수히라가나(${hiraganaPureCount}개)`);
  console.log(` • 품사별 분포      : ${Object.entries(posDistribution).map(([k, v]) => `${k}(${v})`).join(" / ")}`);
  console.log(" • rubyHtml/빈칸마스킹(500/500)/오답생성(500/500)/한자읽기함정(500/500)/검색 검증 완료!");
}

main();
