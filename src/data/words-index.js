(function (globalScope) {
  "use strict";

  const root = typeof window !== "undefined" ? window : globalScope;
  root.N5App = root.N5App || {};

  const part1 = Array.isArray(root.N5App.WORDS_PART1) ? root.N5App.WORDS_PART1 : [];
  const part2 = Array.isArray(root.N5App.WORDS_PART2) ? root.N5App.WORDS_PART2 : [];

  const WORDS_500 = part1.concat(part2).slice().sort(function (a, b) {
    return a.id - b.id;
  });

  const ROUND_META_CONFIG = [
    // Level 1: Lv.1 N5 입문 기초 (Round 1 ~ 20, 200단어)
    { round: 1, level: 1, title: "설레는 첫인사와 교실 사람", emoji: "👩‍🏫" },
    { round: 2, level: 1, title: "나와 너, 대명사와 지시어", emoji: "👉" },
    { round: 3, level: 1, title: "궁금할 때 묻는 핵심 의문사", emoji: "❓" },
    { round: 4, level: 1, title: "숫자의 시작 1부터 10까지", emoji: "🔢" },
    { round: 5, level: 1, title: "백·천·만과 고유어 개수 세기", emoji: "🧮" },
    { round: 6, level: 1, title: "시험 단골 특별 날짜와 사람 세기", emoji: "📆" },
    { round: 7, level: 1, title: "시계 읽기와 일주일 요일", emoji: "⏰" },
    { round: 8, level: 1, title: "어제·오늘·내일 달력과 시간", emoji: "⏳" },
    { round: 9, level: 1, title: "소중한 나의 가족과 호칭", emoji: "👨‍👩‍👧‍👦" },
    { round: 10, level: 1, title: "다정한 상대방 가족과 이웃 호칭", emoji: "🏡" },
    { round: 11, level: 1, title: "활기찬 학교와 공부 도구", emoji: "🏫" },
    { round: 12, level: 1, title: "책상 위 문구류와 언어 생활", emoji: "✏️" },
    { round: 13, level: 1, title: "맛있는 밥상과 신선한 식재료", emoji: "🍚" },
    { round: 14, level: 1, title: "향긋한 음료와 달콤한 간식", emoji: "🍵" },
    { round: 15, level: 1, title: "위아래 앞뒤 위치와 방향", emoji: "📍" },
    { round: 16, level: 1, title: "가방 속 매일 쓰는 소지품", emoji: "🎒" },
    { round: 17, level: 1, title: "사계절과 아름다운 날씨·자연", emoji: "🌿" },
    { round: 18, level: 1, title: "크기와 거리 기초 い형용사 1", emoji: "📏" },
    { round: 19, level: 1, title: "온도와 미각 기초 い형용사 2", emoji: "🍜" },
    { round: 20, level: 1, title: "하루를 여는 입문 필수 동사", emoji: "🏃" },

    // Level 2: Lv.2 N5 핵심 활용 (Round 21 ~ 38, 180단어)
    { round: 21, level: 2, title: "일상 행동 필수 1류동사 1", emoji: "⚡" },
    { round: 22, level: 2, title: "만남과 생각 필수 1류동사 2", emoji: "💬" },
    { round: 23, level: 2, title: "손끝으로 다루는 1류동사 3", emoji: "🛠️" },
    { round: 24, level: 2, title: "이동과 주고받기 1류동사 4", emoji: "🚶" },
    { round: 25, level: 2, title: "착용과 생활 변화 1류동사 5", emoji: "🧥" },
    { round: 26, level: 2, title: "깔끔 변신 필수 2류동사 1", emoji: "🌟" },
    { round: 27, level: 2, title: "배움과 생활 필수 2류동사 2", emoji: "📖" },
    { round: 28, level: 2, title: "만능 3류(불규칙) 하다 동사", emoji: "🎯" },
    { round: 29, level: 2, title: "감정과 성격 핵심 い형용사", emoji: "😊" },
    { round: 30, level: 2, title: "색깔과 상태 묘사 い형용사", emoji: "🎨" },
    { round: 31, level: 2, title: "매력 만점 필수 な형용사 1", emoji: "🌸" },
    { round: 32, level: 2, title: "일상 단골 필수 な형용사 2", emoji: "💡" },
    { round: 33, level: 2, title: "기차역과 대중교통 길 찾기", emoji: "🚆" },
    { round: 34, level: 2, title: "도시의 공공장소와 가게", emoji: "🏙️" },
    { round: 35, level: 2, title: "쇼핑·돈 계산과 자연 풍경", emoji: "💴" },
    { round: 36, level: 2, title: "소중한 우리 몸과 병원 진료", emoji: "🩺" },
    { round: 37, level: 2, title: "아늑한 우리 집과 방 안 가구", emoji: "🏠" },
    { round: 38, level: 2, title: "빈도와 정도를 나타내는 부사", emoji: "🔄" },

    // Level 3: Lv.3 N5 실전 완성 (Round 39 ~ 50, 120단어)
    { round: 39, level: 3, title: "수량·모양 부사와 필수 접속사", emoji: "🔗" },
    { round: 40, level: 3, title: "장음(おう·ゅう·えい) 함정 한자어", emoji: "🎯" },
    { round: 41, level: 3, title: "촉음(っ)·탁음(゛) 주의 핵심 명사", emoji: "⚡" },
    { round: 42, level: 3, title: "촉음·연탁 단골 N5 필수 조수사", emoji: "🔢" },
    { round: 43, level: 3, title: "도시와 미식 가타카나 외래어 1", emoji: "🏪" },
    { round: 44, level: 3, title: "교통과 시설 가타카나 외래어 2", emoji: "🚕" },
    { round: 45, level: 3, title: "미디어·리빙 가타카나 외래어 3", emoji: "📷" },
    { round: 46, level: 3, title: "패션·소품 가타카나 외래어 4", emoji: "🎁" },
    { round: 47, level: 3, title: "수수(授受)와 실전 완주 동사 1", emoji: "🤝" },
    { round: 48, level: 3, title: "자타동사 짝꿍 실전 완주 동사 2", emoji: "🏆" },
    { round: 49, level: 3, title: "회화·청해 1순위 필수 인사 표현", emoji: "💬" },
    { round: 50, level: 3, title: "JLPT N5 파이널 합격 피날레", emoji: "👑" }
  ];

  const LEVEL_LABELS = {
    1: "Lv.1 N5 입문 기초",
    2: "Lv.2 N5 핵심 활용",
    3: "Lv.3 N5 실전 완성"
  };

  const POS_LIST = [
    "명사",
    "1류동사",
    "2류동사",
    "3류동사",
    "い형용사",
    "な형용사",
    "부사",
    "표현"
  ];

  const KANJI_CHAR_RE = /[\u4E00-\u9FFF\u3400-\u4DBF々〆ヵヶ]/;
  const KATAKANA_ONLY_RE = /^[\u30A1-\u30FA\u30FC]+$/;

  const byId = new Map();
  const byExpression = new Map();
  const byKana = new Map();
  const byRomaji = new Map();
  const byRound = new Map();
  const byLevel = new Map([
    [1, []],
    [2, []],
    [3, []]
  ]);
  const roundMetaByNum = new Map();

  for (let i = 0; i < WORDS_500.length; i++) {
    const item = WORDS_500[i];
    byId.set(item.id, item);
    if (typeof item.expression === "string") {
      byExpression.set(item.expression.trim(), item);
    }
    if (typeof item.kana === "string" && !byKana.has(item.kana.trim())) {
      byKana.set(item.kana.trim(), item);
    }
    if (typeof item.romaji === "string" && !byRomaji.has(item.romaji.trim().toLowerCase())) {
      byRomaji.set(item.romaji.trim().toLowerCase(), item);
    }
    if (!byRound.has(item.round)) {
      byRound.set(item.round, []);
    }
    byRound.get(item.round).push(item);
    if (byLevel.has(item.level)) {
      byLevel.get(item.level).push(item);
    }
  }

  const ROUNDS_50 = ROUND_META_CONFIG.map(function (cfg) {
    const roundWords = byRound.get(cfg.round) || [];
    const meta = {
      round: cfg.round,
      level: cfg.level,
      levelLabel: LEVEL_LABELS[cfg.level] || "",
      title: cfg.title,
      emoji: cfg.emoji,
      wordIds: roundWords.map(function (w) {
        return w.id;
      })
    };
    roundMetaByNum.set(cfg.round, meta);
    return meta;
  });

  function resolveWord(wordOrId) {
    if (!wordOrId) return null;
    if (typeof wordOrId === "number") return byId.get(wordOrId) || null;
    if (typeof wordOrId === "string") {
      const trimmed = wordOrId.trim();
      if (/^\d+$/.test(trimmed)) return byId.get(Number(trimmed)) || null;
      return (
        byExpression.get(trimmed) ||
        byKana.get(trimmed) ||
        byRomaji.get(trimmed.toLowerCase()) ||
        null
      );
    }
    if (typeof wordOrId === "object") {
      if (wordOrId.id && byId.has(wordOrId.id)) return byId.get(wordOrId.id);
      return wordOrId;
    }
    return null;
  }

  function shuffleCopy(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function buildInflectionPatterns(target) {
    const expr = target.expression || "";
    const pos = target.pos || "";
    const patterns = [];

    if (!expr) return patterns;

    if (expr.length === 1 && KANJI_CHAR_RE.test(expr)) {
      patterns.push(
        new RegExp("(?<![\\u4E00-\\u9FFF\\u3400-\\u4DBF々])" + escapeRegex(expr) + "(?![\\u4E00-\\u9FFF\\u3400-\\u4DBF々])")
      );
    }
    patterns.push(new RegExp(escapeRegex(expr)));

    if (pos === "1류동사" && expr.length >= 2) {
      const stem = escapeRegex(expr.slice(0, -1));
      const last = expr.slice(-1);
      const godanMap = {
        "う": "(?:い(?:ます|ました|ません|ましょう|たいです|たい)?|っ(?:て|た|たら)|わ(?:ない|なかった)|え(?:ます|る|ば)|お(?:う)|う)",
        "く": "(?:き(?:ます|ました|ません|ましょう|たいです|たい)?|い(?:て|た|たら)|っ(?:て|た|たら)|か(?:ない|なかった)|け(?:る|ば)|こ(?:う)|く)",
        "ぐ": "(?:ぎ(?:ます|ました|ません|ましょう|たいです|たい)?|い(?:で|だ|だら)|が(?:ない|なかった)|げ(?:る|ば)|ご(?:う)|ぐ)",
        "す": "(?:し(?:ます|ました|ません|ましょう|たいです|たい|て|た|たら)?|さ(?:ない|なかった)|せ(?:る|ば)|そ(?:う)|す)",
        "つ": "(?:ち(?:ます|ました|ません|ましょう|たいです|たい)?|っ(?:て|た|たら)|た(?:ない|なかった)|て(?:る|ば)|と(?:う)|つ)",
        "ぬ": "(?:に(?:ます|ました|ません|ましょう)?|ん(?:で|だ)|な(?:ない|なかった)|ぬ)",
        "ぶ": "(?:び(?:ます|ました|ません|ましょう|たいです|たい)?|ん(?:で|だ)|ば(?:ない|なかった)|べ(?:る|ば)|ぼ(?:う)|ぶ)",
        "む": "(?:み(?:ます|ました|ません|ましょう|たいです|たい)?|ん(?:で|だ)|ま(?:ない|なかった)|め(?:る|ば)|も(?:う)|む)",
        "る": "(?:り(?:ます|ました|ません|ましょう|たいです|たい)?|っ(?:て|た|たら)|ら(?:ない|なかった)|れ(?:る|ば)|ろ(?:う)|る)"
      };
      if (godanMap[last]) {
        patterns.unshift(new RegExp(stem + godanMap[last]));
      }
    } else if (pos === "2류동사" && expr.endsWith("る") && expr.length >= 2) {
      const stem = escapeRegex(expr.slice(0, -1));
      patterns.unshift(
        new RegExp(
          stem +
            "(?:ます|ました|ません|ましょう|たいです|たい|られます|られる|ないでください|ないで|なかった|ない|て|た|たら|よう|に|る)"
        )
      );
    } else if (pos === "3류동사") {
      if (expr === "来る" || expr === "くる") {
        patterns.unshift(
          new RegExp("(?:来(?:ます|ました|ません|ましょう|たいです|たい|て|た|ない|なかった|る)|き(?:ます|ました|ません|て)|こ(?:ない|なかった))")
        );
      } else if (expr.endsWith("する")) {
        const prefix = expr.slice(0, -2);
        if (prefix.length > 0) {
          patterns.unshift(
            new RegExp(
              escapeRegex(prefix) +
                "(?:を)?(?:します|しました|しません|しましょう|したいです|したい|して|した|しない|しなかった|する)"
            )
          );
          patterns.push(new RegExp(escapeRegex(prefix)));
        } else {
          patterns.unshift(
            new RegExp("(?:します|しました|しません|しましょう|したいです|したい|して|した|しない|しなかった|する)")
          );
        }
      }
    } else if (pos === "い형용사" && expr.endsWith("い")) {
      if (expr === "いい") {
        patterns.unshift(new RegExp("(?:いい|よくなかった|よくない|よかった|よくて|よく|よい)"));
      } else if (expr.length >= 2) {
        const stem = escapeRegex(expr.slice(0, -1));
        patterns.unshift(new RegExp(stem + "(?:くなかった|くない|かった|くて|く|い)"));
      }
    } else if (pos === "な형용사") {
      patterns.unshift(new RegExp(escapeRegex(expr) + "(?:じゃありません|ではありません|じゃない|でした|な|に)?"));
      patterns.unshift(new RegExp(escapeRegex(expr)));
    }

    if (target.kana) {
      patterns.push(new RegExp(escapeRegex(target.kana)));
    }

    return patterns;
  }

  function getBlankExample(wordOrId, mask) {
    const target = resolveWord(wordOrId);
    const blank = typeof mask === "string" && mask.length > 0 ? mask : "［　　］";
    if (!target || !target.example) return "";

    const sentence = target.example;

    if (target.pos !== "1류동사" && target.pos !== "2류동사" && target.pos !== "3류동사") {
      if (target.expression.length === 1 && KANJI_CHAR_RE.test(target.expression)) {
        const guarded = new RegExp(
          "(?<![\\u4E00-\\u9FFF\\u3400-\\u4DBF々])" +
            escapeRegex(target.expression) +
            "(?![\\u4E00-\\u9FFF\\u3400-\\u4DBF々])"
        );
        if (guarded.test(sentence)) {
          return sentence.replace(guarded, blank);
        }
      }
      if (sentence.includes(target.expression)) {
        return sentence.replace(target.expression, blank);
      }
    }

    const patterns = buildInflectionPatterns(target);
    for (let i = 0; i < patterns.length; i++) {
      if (patterns[i].test(sentence)) {
        return sentence.replace(patterns[i], blank);
      }
    }

    return sentence;
  }

  function getBlankExampleReading(wordOrId, mask) {
    const target = resolveWord(wordOrId);
    const blank = typeof mask === "string" && mask.length > 0 ? mask : "［　　］";
    if (!target || !target.exampleReading) return "";
    if (target.kana && target.exampleReading.includes(target.kana)) {
      return target.exampleReading.replace(target.kana, blank);
    }
    return target.exampleReading;
  }

  function isKatakanaWord(word) {
    return Boolean(word && typeof word.kana === "string" && KATAKANA_ONLY_RE.test(word.kana));
  }

  function getDistractors(targetWordOrId, count, opts) {
    const target = resolveWord(targetWordOrId);
    const needed = typeof count === "number" && count > 0 ? count : 3;
    const options = opts || {};
    if (!target) return [];

    const samePos = options.samePos !== false;
    const sameLevel = options.sameLevel !== false;
    const onlyKanji = Boolean(options.onlyKanji);
    const preferSameRound = Boolean(options.preferSameRound);
    const targetIsKata = isKatakanaWord(target);
    const targetHasKanji = Boolean(target.kanji);

    const excludedIds = new Set([target.id]);
    if (Array.isArray(options.excludeIds)) {
      for (let i = 0; i < options.excludeIds.length; i++) {
        excludedIds.add(options.excludeIds[i]);
      }
    }

    const usedMeanings = new Set([target.meaning]);
    const usedExpressions = new Set([target.expression]);
    const usedKana = new Set([target.kana]);

    const tier0 = [];
    const tier1 = [];
    const tier2 = [];
    const tier3 = [];
    const tier4 = [];

    for (let i = 0; i < WORDS_500.length; i++) {
      const cand = WORDS_500[i];
      if (excludedIds.has(cand.id)) continue;
      if (onlyKanji && !cand.kanji) continue;
      if (usedMeanings.has(cand.meaning)) continue;
      if (usedExpressions.has(cand.expression)) continue;
      if (usedKana.has(cand.kana)) continue;

      const isPosMatch = cand.pos === target.pos;
      const isLevelMatch = cand.level === target.level;
      const isRoundMatch = cand.round === target.round;
      const isScriptMatch = isKatakanaWord(cand) === targetIsKata && Boolean(cand.kanji) === targetHasKanji;

      if (preferSameRound && isRoundMatch && (!samePos || isPosMatch)) {
        tier0.push(cand);
      } else if (samePos && sameLevel && isPosMatch && isLevelMatch && isScriptMatch) {
        tier1.push(cand);
      } else if (samePos && isPosMatch && (isLevelMatch || isScriptMatch)) {
        tier2.push(cand);
      } else if ((samePos && isPosMatch) || (sameLevel && isLevelMatch)) {
        tier3.push(cand);
      } else {
        tier4.push(cand);
      }
    }

    const orderedCandidates = []
      .concat(shuffleCopy(tier0))
      .concat(shuffleCopy(tier1))
      .concat(shuffleCopy(tier2))
      .concat(shuffleCopy(tier3))
      .concat(shuffleCopy(tier4));

    const picked = [];
    for (let i = 0; i < orderedCandidates.length && picked.length < needed; i++) {
      const item = orderedCandidates[i];
      if (
        !usedMeanings.has(item.meaning) &&
        !usedExpressions.has(item.expression) &&
        !usedKana.has(item.kana)
      ) {
        usedMeanings.add(item.meaning);
        usedExpressions.add(item.expression);
        usedKana.add(item.kana);
        picked.push(item);
      }
    }
    return picked;
  }

  // --- JLPT N5 Kanji Reading Trap Generator (getKanaDistractors) ---
  const HIRA_DAKUTEN_SWAPS = {
    "か": ["が"], "き": ["ぎ"], "く": ["ぐ"], "け": ["げ"], "こ": ["ご"],
    "が": ["か"], "ぎ": ["き"], "ぐ": ["く"], "げ": ["け"], "ご": ["こ"],
    "さ": ["ざ"], "し": ["じ"], "す": ["ず"], "せ": ["ぜ"], "そ": ["ぞ"],
    "ざ": ["さ"], "じ": ["し", "ち"], "ず": ["す", "つ"], "ぜ": ["せ"], "ぞ": ["そ"],
    "た": ["だ"], "ち": ["じ", "し"], "つ": ["ず", "す"], "て": ["で"], "と": ["ど"],
    "だ": ["た"], "ぢ": ["ち", "じ"], "づ": ["つ", "ず"], "で": ["て"], "ど": ["と"],
    "は": ["ば", "ぱ"], "ひ": ["び", "ぴ"], "ふ": ["ぶ", "ぷ"], "へ": ["べ", "ぺ"], "ほ": ["ぼ", "ぽ"],
    "ば": ["ぱ", "は"], "び": ["ぴ", "ひ"], "ぶ": ["ぷ", "ふ"], "べ": ["ぺ", "へ"], "ぼ": ["ぽ", "ほ"],
    "ぱ": ["ば", "は"], "ぴ": ["び", "ひ"], "ぷ": ["ぶ", "ふ"], "ぺ": ["べ", "へ"], "ぽ": ["ぼ", "ほ"]
  };

  const KATA_DAKUTEN_SWAPS = {
    "カ": ["ガ"], "キ": ["ギ"], "ク": ["グ"], "ケ": ["ゲ"], "コ": ["ゴ"],
    "ガ": ["カ"], "ギ": ["キ"], "グ": ["ク"], "ゲ": ["ケ"], "ゴ": ["コ"],
    "サ": ["ザ"], "シ": ["ジ", "ツ"], "ス": ["ズ"], "セ": ["ゼ"], "ソ": ["ゾ", "ン"],
    "ザ": ["サ"], "ジ": ["シ"], "ズ": ["ス"], "ゼ": ["セ"], "ゾ": ["ソ"],
    "タ": ["ダ"], "チ": ["ジ", "シ"], "ツ": ["ズ", "シ"], "テ": ["デ"], "ト": ["ド"],
    "ダ": ["タ"], "デ": ["テ"], "ド": ["ト"],
    "ハ": ["バ", "パ"], "ヒ": ["ビ", "ピ"], "フ": ["ブ", "プ"], "ヘ": ["ベ", "ペ"], "ホ": ["ボ", "ポ"],
    "バ": ["パ", "ハ"], "ビ": ["ピ", "ヒ"], "ブ": ["プ", "フ"], "ベ": ["ペ", "ヘ"], "ボ": ["ポ", "ホ"],
    "パ": ["バ", "ハ"], "ピ": ["ビ", "ヒ"], "プ": ["ブ", "フ"], "ペ": ["ベ", "ヘ"], "ポ": ["ボ", "ホ"]
  };

  const HIRA_SIMILAR_SWAPS = {
    "あ": ["お", "め"], "い": ["り", "こ"], "う": ["つ", "ら"], "え": ["さ", "け"], "お": ["あ", "む"],
    "め": ["ぬ", "み"], "ぬ": ["め", "ね"], "ね": ["れ", "わ"], "れ": ["ね", "わ"], "わ": ["れ", "ね"],
    "る": ["ろ", "う"], "ろ": ["る", "そ"], "ま": ["ほ", "よ"], "み": ["め", "び"], "む": ["す", "お"],
    "や": ["ゆ", "よ"], "ゆ": ["や", "よ"], "よ": ["ゆ", "ま"], "ら": ["ち", "り"], "り": ["い", "ら"],
    "な": ["た", "ま"], "に": ["こ", "た"], "の": ["め", "あ"]
  };

  function isWellFormedKana(str, isKata) {
    if (!str || str.length === 0) return false;
    if (/^[っッーんンゃゅょャュョぁぃぅぇぉァィゥェォ]/.test(str)) return false;
    if (/[っッ]{2,}|ーー+|んん+|ンン+/.test(str)) return false;
    if (/[っッ]$/.test(str)) return false;
    if (/[っッ][んンーゃゅょャュョあいうえおアイウエオなにぬねのナニヌネノまみむめもマミムメモやゆよヤユヨらりるれろラリルレロわをワヲ]/.test(str)) {
      return false;
    }
    if (/(?<![きぎしじちぢにひびぴみり])[ゃゅょ]/.test(str)) return false;
    if (/(?<![キギシジチヂニヒビピミリ])[ャュョ]/.test(str)) return false;
    if (isKata) {
      return /^[\u30A1-\u30FA\u30FC]+$/.test(str);
    }
    return /^[\u3041-\u3096]+$/.test(str);
  }

  function generateHiraganaTrapBuckets(kana) {
    const longVowel = [];
    const sokuon = [];
    const voicing = [];
    const youon = [];
    const visualSimilar = [];

    const shortenRules = [
      [/([おこそとのほものよろごぞどぼぽ]|[きしちにひみりぎじぢびぴ]ょ)う/g, "$1"],
      [/([うくすつぬふむゆるぐずづぶぷ]|[きしちにひみりぎじぢびぴ]ゅ)う/g, "$1"],
      [/([えけせてねへめれげぜでべぺ])い/g, "$1"],
      [/([いきしちにひみりぎじぢびぴ])い/g, "$1"],
      [/([あかさたなはまやらわがざだばぱ])あ/g, "$1"],
      [/おお/g, "お"]
    ];
    for (let i = 0; i < shortenRules.length; i++) {
      const re = shortenRules[i][0];
      const rep = shortenRules[i][1];
      let match;
      re.lastIndex = 0;
      while ((match = re.exec(kana)) !== null) {
        const replaced =
          kana.slice(0, match.index) +
          match[0].replace(new RegExp(re.source), rep) +
          kana.slice(match.index + match[0].length);
        if (replaced !== kana && isWellFormedKana(replaced, false)) {
          longVowel.push(replaced);
        }
      }
    }

    const lengthenRules = [
      [/([きしちにひみりぎじぢびぴ]ょ)(?!う)/, "$1う"],
      [/([きしちにひみりぎじぢびぴ]ゅ)(?!う)/, "$1う"],
      [/([おこそとのほものよろごぞどぼぽ])(?![うおんっ])/, "$1う"],
      [/([えけせてねへめれげぜでべぺ])(?![いえんっ])/, "$1い"]
    ];
    for (let i = 0; i < lengthenRules.length; i++) {
      const m = kana.replace(lengthenRules[i][0], lengthenRules[i][1]);
      if (m !== kana && isWellFormedKana(m, false)) longVowel.push(m);
    }

    if (kana.includes("っ")) {
      const removed = kana.replace("っ", "");
      if (isWellFormedKana(removed, false)) sokuon.push(removed);
      const kuRestore = kana.replace(/っ([かきくけこ])/, "く$1").replace(/っ([さしすせそたちつてとぱぴぷぺぽ])/, "つ$1");
      if (kuRestore !== kana && isWellFormedKana(kuRestore, false)) sokuon.push(kuRestore);
    }
    const kuToSokuon = kana.replace(/([くきつち])([かきくけこさしすせそたちつてと])/, "っ$2");
    if (kuToSokuon !== kana && isWellFormedKana(kuToSokuon, false)) sokuon.push(kuToSokuon);

    for (let idx = 1; idx < kana.length; idx++) {
      const prev = kana[idx - 1];
      const curr = kana[idx];
      if (!/[っんー]/.test(prev) && /[かきくけこさしすせそたちつてとぱぴぷぺぽ]/.test(curr)) {
        const inserted = kana.slice(0, idx) + "っ" + kana.slice(idx);
        if (isWellFormedKana(inserted, false)) {
          sokuon.push(inserted);
          break;
        }
      }
    }

    for (let idx = 0; idx < kana.length; idx++) {
      const ch = kana[idx];
      const swaps = HIRA_DAKUTEN_SWAPS[ch];
      if (swaps) {
        for (let s = 0; s < swaps.length; s++) {
          const mutated = kana.slice(0, idx) + swaps[s] + kana.slice(idx + 1);
          if (mutated !== kana && isWellFormedKana(mutated, false)) {
            voicing.push(mutated);
          }
        }
      }
    }

    const youonPairs = [
      ["しゃ", "さ"], ["しゅ", "す"], ["しょ", "そ"],
      ["ちゃ", "た"], ["ちゅ", "つ"], ["ちょ", "と"],
      ["じゃ", "ざ"], ["じゅ", "ず"], ["じょ", "ぞ"],
      ["きゃ", "か"], ["きゅ", "く"], ["きょ", "こ"],
      ["りゃ", "ら"], ["りゅ", "る"], ["りょ", "ろ"],
      ["びょ", "ぼ"], ["ぴょ", "ぽ"], ["ぎょ", "ご"], ["にょ", "の"]
    ];
    for (let i = 0; i < youonPairs.length; i++) {
      const y = youonPairs[i][0];
      const plain = youonPairs[i][1];
      if (kana.includes(y)) {
        const m = kana.replace(y, plain);
        if (isWellFormedKana(m, false)) youon.push(m);
      } else if (kana.includes(plain)) {
        const m = kana.replace(plain, y);
        if (isWellFormedKana(m, false)) youon.push(m);
      }
    }

    for (let idx = 0; idx < kana.length; idx++) {
      if (idx > 0 && /[ゃゅょ]/.test(kana[idx - 1]) && kana[idx] === "う") continue;
      if (/[ゃゅょ]/.test(kana[idx + 1] || "")) continue;
      const sim = HIRA_SIMILAR_SWAPS[kana[idx]];
      if (sim) {
        for (let s = 0; s < sim.length; s++) {
          const mutated = kana.slice(0, idx) + sim[s] + kana.slice(idx + 1);
          if (mutated !== kana && isWellFormedKana(mutated, false)) {
            visualSimilar.push(mutated);
          }
        }
      }
    }

    return [longVowel, sokuon, voicing, youon, visualSimilar];
  }

  function generateKatakanaTrapBuckets(kana) {
    const longVowel = [];
    const sokuon = [];
    const voicing = [];
    const similar = [];

    if (kana.includes("ー")) {
      const removed = kana.replace("ー", "");
      if (isWellFormedKana(removed, true)) longVowel.push(removed);
      const lastIdx = kana.lastIndexOf("ー");
      if (lastIdx > 0) {
        const removedLast = kana.slice(0, lastIdx) + kana.slice(lastIdx + 1);
        if (isWellFormedKana(removedLast, true)) longVowel.push(removedLast);
      }
    }
    for (let idx = 0; idx < kana.length; idx++) {
      const ch = kana[idx];
      const next = kana[idx + 1] || "";
      if (!/[ッンーャュョァィゥェォ]/.test(ch) && next !== "ー") {
        const added = kana.slice(0, idx + 1) + "ー" + kana.slice(idx + 1);
        if (isWellFormedKana(added, true)) longVowel.push(added);
      }
    }

    if (kana.includes("ッ")) {
      const removed = kana.replace("ッ", "");
      if (isWellFormedKana(removed, true)) sokuon.push(removed);
    }
    for (let idx = 1; idx < kana.length; idx++) {
      const prev = kana[idx - 1];
      const curr = kana[idx];
      if (!/[ッンー]/.test(prev) && /[カキクケコサシスセソタチツテトパピプペポ]/.test(curr)) {
        const added = kana.slice(0, idx) + "ッ" + kana.slice(idx);
        if (isWellFormedKana(added, true)) sokuon.push(added);
      }
    }

    for (let idx = 0; idx < kana.length; idx++) {
      const swaps = KATA_DAKUTEN_SWAPS[kana[idx]];
      if (swaps) {
        for (let s = 0; s < swaps.length; s++) {
          const mutated = kana.slice(0, idx) + swaps[s] + kana.slice(idx + 1);
          if (mutated !== kana && isWellFormedKana(mutated, true)) {
            voicing.push(mutated);
          }
        }
      }
    }

    const kataPairs = [
      ["シャ", "サ"], ["シュ", "ス"], ["ショ", "ソ"],
      ["チャ", "タ"], ["チュ", "ツ"], ["チョ", "ト"],
      ["ジャ", "ザ"], ["ジュ", "ズ"], ["ジョ", "ゾ"],
      ["ル", "ロ"], ["マ", "ム"], ["ラ", "ワ"], ["リ", "イ"]
    ];
    for (let i = 0; i < kataPairs.length; i++) {
      if (kana.includes(kataPairs[i][0])) {
        const m = kana.replace(kataPairs[i][0], kataPairs[i][1]);
        if (isWellFormedKana(m, true)) similar.push(m);
      } else if (kana.includes(kataPairs[i][1])) {
        const m = kana.replace(kataPairs[i][1], kataPairs[i][0]);
        if (isWellFormedKana(m, true)) similar.push(m);
      }
    }

    return [longVowel, sokuon, voicing, similar];
  }

  function getKanaDistractors(targetWordOrId, count) {
    const target = resolveWord(targetWordOrId);
    const needed = typeof count === "number" && count > 0 ? count : 3;
    const baseKana =
      target && typeof target.kana === "string"
        ? target.kana.trim()
        : typeof targetWordOrId === "string"
        ? targetWordOrId.trim()
        : "";

    if (!baseKana) return [];

    const isKata = KATAKANA_ONLY_RE.test(baseKana);
    const buckets = isKata
      ? generateKatakanaTrapBuckets(baseKana)
      : generateHiraganaTrapBuckets(baseKana);

    const seen = new Set([baseKana]);
    const result = [];
    const primaryCount = Math.min(4, buckets.length);

    // First pass: pick 1 from each phonological trap bucket (longVowel, sokuon, voicing, youon)
    for (let b = 0; b < primaryCount && result.length < needed; b++) {
      const candidates = buckets[b];
      for (let i = 0; i < candidates.length; i++) {
        if (!seen.has(candidates[i])) {
          seen.add(candidates[i]);
          result.push(candidates[i]);
          break;
        }
      }
    }

    // Second pass: fill remaining from primary phonological trap buckets, then visualSimilar
    for (let b = 0; b < buckets.length && result.length < needed; b++) {
      const candidates = buckets[b];
      for (let i = 0; i < candidates.length && result.length < needed; i++) {
        if (!seen.has(candidates[i])) {
          seen.add(candidates[i]);
          result.push(candidates[i]);
        }
      }
    }

    if (result.length < needed) {
      const pool = WORDS_500.filter(function (w) {
        return (
          KATAKANA_ONLY_RE.test(w.kana) === isKata &&
          !seen.has(w.kana) &&
          Math.abs(w.kana.length - baseKana.length) <= 1
        );
      });
      for (let i = 0; i < pool.length && result.length < needed; i++) {
        if (!seen.has(pool[i].kana)) {
          seen.add(pool[i].kana);
          result.push(pool[i].kana);
        }
      }
    }

    const fallbackPool = isKata
      ? ["ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ"]
      : ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ"];
    for (let i = 0; i < fallbackPool.length && result.length < needed; i++) {
      if (!seen.has(fallbackPool[i])) {
        seen.add(fallbackPool[i]);
        result.push(fallbackPool[i]);
      }
    }

    return result.slice(0, needed);
  }

  function searchWords(query, filters) {
    const rawQ = typeof query === "string" ? query.trim() : "";
    const q = rawQ.toLowerCase();
    const qCompact = q.replace(/[\s\-']/g, "");
    const f = filters || {};
    const idSet = f.ids
      ? f.ids instanceof Set
        ? f.ids
        : new Set(Array.isArray(f.ids) ? f.ids : [])
      : null;

    return WORDS_500.filter(function (item) {
      if (f.level && item.level !== Number(f.level)) return false;
      if (f.round && item.round !== Number(f.round)) return false;
      if (f.pos && f.pos !== "all" && item.pos !== f.pos) return false;
      if (typeof f.hasKanji === "boolean" && Boolean(item.kanji) !== f.hasKanji) return false;
      if (idSet && !idSet.has(item.id)) return false;
      if (!q) return true;

      return (
        item.expression.toLowerCase().includes(q) ||
        (item.kanji && item.kanji.toLowerCase().includes(q)) ||
        item.kana.toLowerCase().includes(q) ||
        item.romaji.toLowerCase().includes(qCompact) ||
        (item.koPron && item.koPron.toLowerCase().includes(q)) ||
        item.meaning.toLowerCase().includes(q) ||
        item.theme.toLowerCase().includes(q) ||
        item.example.toLowerCase().includes(q) ||
        item.exampleReading.toLowerCase().includes(q) ||
        item.exampleKo.toLowerCase().includes(q)
      );
    });
  }

  const WordBank = {
    TOTAL_WORDS: 500,
    TOTAL_ROUNDS: 50,
    WORDS_PER_ROUND: 10,
    LEVEL_LABELS: LEVEL_LABELS,
    POS_LIST: POS_LIST,
    getAllWords: function () {
      return WORDS_500;
    },
    getAllRounds: function () {
      return ROUNDS_50;
    },
    getWordById: function (id) {
      return byId.get(Number(id)) || null;
    },
    getWordByText: function (text) {
      return resolveWord(text);
    },
    getRoundMeta: function (round) {
      return roundMetaByNum.get(Number(round)) || null;
    },
    getWordsByRound: function (round) {
      const list = byRound.get(Number(round));
      return list ? list.slice() : [];
    },
    getWordsByLevel: function (level) {
      const list = byLevel.get(Number(level));
      return list ? list.slice() : [];
    },
    getBlankExample: getBlankExample,
    getBlankExampleReading: getBlankExampleReading,
    getDistractors: getDistractors,
    getKanaDistractors: getKanaDistractors,
    searchWords: searchWords
  };

  // Primary 500/50 properties + backward-compatible 800/80 aliases
  root.N5App.WORDS_500 = WORDS_500;
  root.N5App.WORDS_800 = WORDS_500;
  root.N5App.words = WORDS_500;
  root.N5App.ROUNDS_50 = ROUNDS_50;
  root.N5App.ROUNDS_80 = ROUNDS_50;
  root.N5App.rounds = ROUNDS_50;
  root.N5App.WordBank = WordBank;

  // Root-level convenience aliases on window.N5App
  root.N5App.getAllWords = WordBank.getAllWords;
  root.N5App.getAllRounds = WordBank.getAllRounds;
  root.N5App.getWordById = WordBank.getWordById;
  root.N5App.getWordByText = WordBank.getWordByText;
  root.N5App.getRoundMeta = WordBank.getRoundMeta;
  root.N5App.getWordsByRound = WordBank.getWordsByRound;
  root.N5App.getWordsByLevel = WordBank.getWordsByLevel;
  root.N5App.getBlankExample = WordBank.getBlankExample;
  root.N5App.getBlankExampleReading = WordBank.getBlankExampleReading;
  root.N5App.getDistractors = WordBank.getDistractors;
  root.N5App.getKanaDistractors = WordBank.getKanaDistractors;
  root.N5App.searchWords = WordBank.searchWords;
})(typeof globalThis !== "undefined" ? globalThis : this);
