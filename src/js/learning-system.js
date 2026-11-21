/**
 * PRISM NIHONGO N5 — Japanese Cognitive Learning, Romaji Bridge, Gojuon & Unified Audio Engine
 * Module: window.N5App.LearningSystem (plus window.N5App.RomajiHelper & window.N5App.GOJUON_DATA)
 * Owner: @n5-pedagogue
 *
 * Provides:
 * 1. Leitner Box (0~3) spaced-repetition mastery tracking for all JLPT N5 words (dynamic 500-word / 50-round support)
 * 2. Metacognitive Pin (⭐) bounty tracking & Wrong-Note / Revenge candidate selection
 * 3. RomajiHelper: Hepburn + Kunrei-shiki + Wapuro IME bidirectional converter, mora splitter, and real-time Wave 3 buffer matcher
 * 4. GOJUON_DATA: Structured Seion / Dakuon / Handakuon / Yoon / N5 Rhythm Rules dataset for interactive Gojuon modal
 * 5. Generation-Effect 3-stage Japanese smart hint generator (mora skeleton + Korean choseong / cloze + Hanja tip / koPron + romaji + 0.78x TTS)
 * 6. Campaign round records (1~50+), survival high score, daily study streak, and 14 JLPT N5 achievements
 * 7. Unified zero-asset Web Audio Sakura-Crystal pentatonic synthesizer (sfx) & ja-JP pronunciation engine (tts: 1.0x / 0.78x)
 * 8. Resilient localStorage persistence with automatic in-memory fallback (works on file://, https://, and Node/VM/Headless Chrome)
 */
(function (root) {
  'use strict';

  var N5App = (root.N5App = root.N5App || {});

  var STORAGE_KEY = 'prism_jlpt_n5_500_v1';
  var LEGACY_STORAGE_KEY = 'prism_jlpt_n5_800_v1';
  var SCHEMA_VERSION = 1;
  var TOTAL_WORDS_DEFAULT = 500;
  var TOTAL_ROUNDS_DEFAULT = 50;

  // Korean Hangul initial consonants (Choseong) table for Unicode 0xAC00..0xD7A3
  var CHOSEONG_LIST = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
    'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];

  var RANK_WEIGHT = {
    'S+': 5,
    'S': 4,
    'A': 3,
    'B': 2,
    'C': 1
  };

  var BADGE_DEFINITIONS = [
    {
      id: 'first_round',
      name: '사쿠라 첫 출격',
      desc: '첫 번째 라운드를 완주하여 일본어 기억의 프리즘을 깨웠어요!',
      icon: '🌸'
    },
    {
      id: 'perfect_round',
      name: '무결점 크리스탈',
      desc: '단 한 번의 오답 없이 라운드를 퍼펙트(S+ 또는 100%)로 클리어했어요!',
      icon: '💎'
    },
    {
      id: 'early_bird',
      name: '전광석화 암기왕',
      desc: '암기 공방 조기 출격 보너스를 받고 S랭크 이상을 달성했어요!',
      icon: '⚡'
    },
    {
      id: 'pin_sniper',
      name: '약점 저격수',
      desc: '헷갈려서 별표(⭐) 친 타겟 단어를 배틀에서 누적 10회 격파했어요!',
      icon: '🎯'
    },
    {
      id: 'revenge_hunter',
      name: '리벤지 사무라이',
      desc: '오답·리벤지 단어를 누적 10회 멋지게 설욕했어요!',
      icon: '🔥'
    },
    {
      id: 'combo_15',
      name: '풍경(風鈴)의 리듬',
      desc: '연속 정답 15 콤보를 달성했어요!',
      icon: '🎐'
    },
    {
      id: 'combo_30',
      name: '초신성 사쿠라 콤보',
      desc: '연속 정답 30 콤보를 돌파했어요!',
      icon: '🚀'
    },
    {
      id: 'streak_3',
      name: '작심삼일 격파',
      desc: '3일 연속 일본어 학습 스트릭을 달성했어요!',
      icon: '📅'
    },
    {
      id: 'streak_7',
      name: '도쿄 루틴 마스터',
      desc: '7일 연속 일본어 학습 스트릭을 달성했어요!',
      icon: '🏮'
    },
    {
      id: 'master_50',
      name: '오십음도 졸업생',
      desc: '완벽 암기(Box 3) 단어를 50개 이상 달성했어요!',
      icon: '🌱'
    },
    {
      id: 'master_200',
      name: '교토 스칼라',
      desc: '완벽 암기(Box 3) 단어를 200개 이상 달성했어요!',
      icon: '⛩️'
    },
    {
      id: 'master_500',
      name: 'JLPT N5 만점 제패자',
      desc: 'JLPT N5 필수 500단어 전부를 완벽 암기(Box 3)로 정복했어요!',
      icon: '👑'
    },
    {
      id: 'campaign_lv1',
      name: 'N5 입문 구역 평정',
      desc: 'Lv.1 N5 입문 기초(Round 1~20) 전 라운드를 클리어했어요!',
      icon: '🟢'
    },
    {
      id: 'campaign_all',
      name: '사쿠라 그랜드마스터',
      desc: '50라운드 캠페인 월드맵 전 구간을 완주했어요!',
      icon: '🌈'
    }
  ];

  // ===========================================================================
  // 1. RomajiHelper — Hepburn + Kunrei-shiki + Wapuro IME Smart Bridge
  // ===========================================================================
  var SMALL_GLIDE_HIRA_RE = /^[ゃゅょぁぃぅぇぉゎ]$/;
  var SMALL_GLIDE_BOTH_RE = /^[ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ]$/;

  // Canonical + Accepted Romaji Table (keys in Hiragana; Katakana normalized via kataToHira)
  var MORA_ROMAJI_MAP = {
    // Seion
    'あ': ['a'], 'い': ['i'], 'う': ['u', 'wu'], 'え': ['e'], 'お': ['o'],
    'か': ['ka', 'ca'], 'き': ['ki'], 'く': ['ku', 'cu', 'qu'], 'け': ['ke'], 'こ': ['ko', 'co'],
    'さ': ['sa'], 'し': ['shi', 'si', 'ci'], 'す': ['su'], 'せ': ['se', 'ce'], 'そ': ['so'],
    'た': ['ta'], 'ち': ['chi', 'ti'], 'つ': ['tsu', 'tu'], 'て': ['te'], 'と': ['to'],
    'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
    'は': ['ha', 'wa'], 'ひ': ['hi'], 'ふ': ['fu', 'hu'], 'へ': ['he'], 'ほ': ['ho'],
    'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
    'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
    'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
    'わ': ['wa'], 'ゐ': ['wi', 'i'], 'ゑ': ['we', 'e'], 'を': ['wo', 'o'],
    'ん': ['n', 'nn', "n'", 'xn'],

    // Dakuon & Handakuon
    'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
    'ざ': ['za'], 'じ': ['ji', 'zi', 'jyi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
    'だ': ['da'], 'ぢ': ['di', 'ji', 'zi'], 'づ': ['du', 'zu', 'dzu'], 'で': ['de'], 'ど': ['do'],
    'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
    'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
    'ゔ': ['vu', 'bu'],

    // Yoon (Contracted Digraphs)
    'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'], 'きぇ': ['kye'],
    'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'], 'ぎぇ': ['gye'],
    'しゃ': ['sha', 'sya'], 'しゅ': ['shu', 'syu'], 'しょ': ['sho', 'syo'], 'しぇ': ['she', 'sye'],
    'じゃ': ['ja', 'jya', 'zya'], 'じゅ': ['ju', 'jyu', 'zyu'], 'じょ': ['jo', 'jyo', 'zyo'], 'じぇ': ['je', 'jye', 'zye'],
    'ちゃ': ['cha', 'tya', 'cya'], 'ちゅ': ['chu', 'tyu', 'cyu'], 'ちょ': ['cho', 'tyo', 'cyo'], 'ちぇ': ['che', 'tye', 'cye'],
    'ぢゃ': ['dya', 'ja', 'jya'], 'ぢゅ': ['dyu', 'ju', 'jyu'], 'ぢょ': ['dyo', 'jo', 'jyo'],
    'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
    'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
    'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
    'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
    'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
    'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],

    // Loanword Digraphs (normalized to Hiragana keys)
    'てぃ': ['ti', 'thi', 'texi', 'teli'],
    'でぃ': ['di', 'dhi', 'dexi', 'deli'],
    'とぅ': ['tu', 'twu', 'toxu'],
    'どぅ': ['du', 'dwu', 'doxu'],
    'ふぁ': ['fa', 'fwa'], 'ふぃ': ['fi', 'fyi'], 'ふぇ': ['fe', 'fye'], 'ふぉ': ['fo', 'fwo'],
    'うぃ': ['wi', 'uxi'], 'うぇ': ['we', 'uxe'], 'うぉ': ['wo', 'uxo'],
    'ゔぁ': ['va', 'ba'], 'ゔぃ': ['vi', 'bi'], 'ゔぇ': ['ve', 'be'], 'ゔぉ': ['vo', 'bo'],
    'つぁ': ['tsa'], 'つぃ': ['tsi'], 'つぇ': ['tse'], 'つぉ': ['tso'],
    'くぁ': ['kwa', 'qa'], 'くぃ': ['kwi', 'qi'], 'くぇ': ['kwe', 'qe'], 'くぉ': ['kwo', 'qo'],

    // Standalone small kana
    'ぁ': ['xa', 'la'], 'ぃ': ['xi', 'li'], 'ぅ': ['xu', 'lu'], 'ぇ': ['xe', 'le'], 'ぉ': ['xo', 'lo'],
    'ゃ': ['xya', 'lya'], 'ゅ': ['xyu', 'lyu'], 'ょ': ['xyo', 'lyo'], 'ゎ': ['xwa', 'lwa'],
    'っ': ['xtu', 'ltu', 'xtsu', 'ltsu'],
    'ー': ['-']
  };

  // Reverse Romaji -> Hiragana lookup table (built automatically + explicit Kunrei/Hepburn overrides)
  var ROMAJI_TO_HIRA_MAP = {};
  (function buildReverseRomajiMap() {
    var keys = Object.keys(MORA_ROMAJI_MAP);
    for (var i = 0; i < keys.length; i++) {
      var hira = keys[i];
      if (hira === 'ん' || hira === 'ー') continue;
      var list = MORA_ROMAJI_MAP[hira];
      for (var j = 0; j < list.length; j++) {
        var rom = list[j];
        if (!ROMAJI_TO_HIRA_MAP[rom]) {
          ROMAJI_TO_HIRA_MAP[rom] = hira;
        }
      }
    }
    // Ensure standard Kunrei/Hepburn priorities when converting free-form romaji -> Hiragana
    ROMAJI_TO_HIRA_MAP['ti'] = 'ち';
    ROMAJI_TO_HIRA_MAP['tu'] = 'つ';
    ROMAJI_TO_HIRA_MAP['si'] = 'し';
    ROMAJI_TO_HIRA_MAP['hu'] = 'ふ';
    ROMAJI_TO_HIRA_MAP['zi'] = 'じ';
    ROMAJI_TO_HIRA_MAP['di'] = 'ぢ';
    ROMAJI_TO_HIRA_MAP['du'] = 'づ';
    ROMAJI_TO_HIRA_MAP['dzu'] = 'づ';
    ROMAJI_TO_HIRA_MAP['thi'] = 'てぃ';
    ROMAJI_TO_HIRA_MAP['dhi'] = 'でぃ';
    ROMAJI_TO_HIRA_MAP['twu'] = 'とぅ';
    ROMAJI_TO_HIRA_MAP['dwu'] = 'どぅ';
    ROMAJI_TO_HIRA_MAP['wo'] = 'を';
    ROMAJI_TO_HIRA_MAP['wa'] = 'わ';
  })();

  function kataToHira(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[\u30A1-\u30F6]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0x60);
    });
  }

  function hiraToKata(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[\u3041-\u3096]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) + 0x60);
    });
  }

  function splitChars(kana) {
    if (!kana || typeof kana !== 'string') return [];
    return Array.from(kana.trim());
  }

  function splitMorae(kana) {
    if (!kana || typeof kana !== 'string') return [];
    var chars = Array.from(kana.trim());
    var morae = [];
    for (var i = 0; i < chars.length; i++) {
      var cur = chars[i];
      var next = i + 1 < chars.length ? chars[i + 1] : '';
      // Combine base kana + small glide (ゃゅょぁぃぅぇぉゎ / Katakana equivalents),
      // except after っ/ッ, ん/ン, ー, or whitespace.
      if (
        next &&
        SMALL_GLIDE_BOTH_RE.test(next) &&
        cur !== 'っ' &&
        cur !== 'ッ' &&
        cur !== 'ん' &&
        cur !== 'ン' &&
        cur !== 'ー' &&
        !SMALL_GLIDE_BOTH_RE.test(cur)
      ) {
        morae.push(cur + next);
        i += 1;
      } else {
        morae.push(cur);
      }
    }
    return morae;
  }

  function getTrailingVowel(kanaUnit) {
    if (!kanaUnit) return '';
    var hira = kataToHira(kanaUnit);
    var list = MORA_ROMAJI_MAP[hira];
    if (!list || list.length === 0) {
      // Check last character alone
      var lastCh = hira.slice(-1);
      list = MORA_ROMAJI_MAP[lastCh];
    }
    if (!list || list.length === 0) return '';
    var canonical = list[0];
    var m = canonical.match(/[aiueo]$/);
    return m ? m[0] : '';
  }

  function getBaseAcceptedRomaji(kanaUnit) {
    if (!kanaUnit) return [];
    var hira = kataToHira(kanaUnit);
    if (MORA_ROMAJI_MAP[hira]) {
      return MORA_ROMAJI_MAP[hira].slice();
    }
    // Fallback for multi-char chunk not in table: combine sub-characters
    if (hira.length > 1) {
      var parts = splitMorae(hira);
      if (parts.length > 1) {
        var acc = [''];
        for (var i = 0; i < parts.length; i++) {
          var sub = MORA_ROMAJI_MAP[parts[i]] || [parts[i]];
          var nextAcc = [];
          for (var a = 0; a < acc.length; a++) {
            for (var b = 0; b < sub.length; b++) {
              nextAcc.push(acc[a] + sub[b]);
            }
          }
          acc = nextAcc;
        }
        return acc;
      }
    }
    return [];
  }

  function uniqueStrings(arr) {
    var seen = {};
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i];
      if (s && !seen[s]) {
        seen[s] = true;
        out.push(s);
      }
    }
    return out;
  }

  function getAcceptedRomaji(kanaUnit, nextUnit, prevUnit) {
    if (!kanaUnit || typeof kanaUnit !== 'string') return [];
    var hira = kataToHira(kanaUnit);
    var nextHira = nextUnit ? kataToHira(nextUnit) : '';

    if (hira === 'ー') {
      var v = getTrailingVowel(prevUnit);
      if (v) {
        return v === 'e' ? [v, '-', 'i'] : [v, '-'];
      }
      return ['-', 'a', 'i', 'u', 'e', 'o'];
    }

    if (hira === 'っ') {
      var out = ['xtu', 'ltu', 'xtsu', 'ltsu'];
      if (nextHira) {
        var nextRom = getBaseAcceptedRomaji(nextHira);
        for (var i = 0; i < nextRom.length; i++) {
          var ch = nextRom[i].charAt(0);
          if (ch && !/[aiueon'-]/.test(ch)) {
            out.unshift(ch);
          }
        }
        if (nextHira.charAt(0) === 'ち') {
          out.unshift('t');
        }
      }
      return uniqueStrings(out);
    }

    if (hira === 'ん') {
      var nasal = ['n', 'nn', "n'", 'xn'];
      if (nextHira) {
        var nextList = getBaseAcceptedRomaji(nextHira);
        for (var j = 0; j < nextList.length; j++) {
          if (/^[bpm]/.test(nextList[j])) {
            nasal.push('m');
            break;
          }
        }
      }
      return uniqueStrings(nasal);
    }

    return getBaseAcceptedRomaji(hira);
  }

  function toRomaji(kana) {
    if (!kana || typeof kana !== 'string') return '';
    var morae = splitMorae(kana);
    var out = '';
    var prevVowel = '';

    for (var i = 0; i < morae.length; i++) {
      var m = morae[i];
      var hira = kataToHira(m);
      var nextHira = i + 1 < morae.length ? kataToHira(morae[i + 1]) : '';

      if (hira === 'ー') {
        out += prevVowel || '-';
        continue;
      }

      if (hira === 'っ') {
        if (nextHira) {
          if (nextHira.charAt(0) === 'ち') {
            // Standard Hepburn uses 'tch' for っち/っちゃ/っちょ or 'tt'/'cc'; note @n5-curator uses 'chotto' for ちょっと and 'matcha'/'kocchi'
            // Check canonical first consonant of nextHira: for ち/ちゃ/ちょ canonical starts with 'c' -> 'c' or 't'?
            // Wait: ちょっと -> 'chotto' (っ is BEFORE と 'to', so nextHira is 'と', consonant 't'!).
            // What if nextHira IS ち/ちゃ/ちょ (e.g. まっちゃ / こっち)? Standard pure-alpha Hepburn is 'matcha' or 'kocchi'; we output 't' before 'ch' -> 'matcha', while isFullMatch/consumeRomajiBuffer accepts BOTH 'matcha' AND 'maccha'!
            out += 't';
          } else {
            var nextBase = getBaseAcceptedRomaji(nextHira);
            var c = nextBase.length > 0 ? nextBase[0].charAt(0) : '';
            out += c || 't';
          }
        }
        prevVowel = '';
        continue;
      }

      if (hira === 'ん') {
        out += 'n';
        prevVowel = '';
        continue;
      }

      if (hira === 'を') {
        out += 'o';
        prevVowel = 'o';
        continue;
      }

      var romList = getBaseAcceptedRomaji(hira);
      var chosen = romList.length > 0 ? romList[0] : m;
      out += chosen;
      var vm = chosen.match(/[aiueo]$/);
      prevVowel = vm ? vm[0] : '';
    }

    return out;
  }

  function toHiragana(romaji) {
    if (!romaji || typeof romaji !== 'string') return '';
    var s = romaji.trim().toLowerCase();
    var out = '';
    var i = 0;

    while (i < s.length) {
      var ch = s[i];

      // Pass through existing Hiragana/Katakana/long-vowel directly
      if (/[\u3040-\u309F]/.test(ch)) {
        out += ch;
        i += 1;
        continue;
      }
      if (/[\u30A0-\u30FF]/.test(ch)) {
        out += ch === 'ー' ? 'ー' : kataToHira(ch);
        i += 1;
        continue;
      }
      if (ch === '-') {
        out += 'ー';
        i += 1;
        continue;
      }
      if (!/[a-z']/.test(ch)) {
        out += ch;
        i += 1;
        continue;
      }

      // Explicit nn / n' / xn -> ん
      if (s.slice(i, i + 2) === 'nn' || s.slice(i, i + 2) === "n'" || s.slice(i, i + 2) === 'xn') {
        // Watch out for 'nna' vs 'nnna': if 'nn' is followed by a vowel or 'y' (e.g. 'onna', 'konnichiha', 'kinyoubi' typed 'kinnyoubi'):
        var afterNN = s[i + 2] || '';
        if (s.slice(i, i + 2) === 'nn' && /[aiueoy]/.test(afterNN)) {
          // In Hepburn 'onna' / 'minna' / 'annai', the first 'n' is ん and the second 'n' starts な/に/ぬ/ね/の/にゃ!
          out += 'ん';
          i += 1;
          continue;
        }
        out += 'ん';
        i += 2;
        continue;
      }

      // 4-char romaji tokens (xtsu, ltsu, texi, etc.)
      var c4 = s.slice(i, i + 4);
      if (c4.length === 4 && ROMAJI_TO_HIRA_MAP[c4]) {
        out += ROMAJI_TO_HIRA_MAP[c4];
        i += 4;
        continue;
      }

      // 'tch' geminate (matcha -> まっちゃ, kotchi -> こっち)
      if (s.slice(i, i + 3) === 'tch') {
        out += 'っ';
        i += 1; // leave 'ch...' for next iteration
        continue;
      }

      // Geminate double consonant (kk, ss, tt, pp, cc, gg, zz, jj, dd, bb, ff, hh, rr, mm)
      if (
        i + 1 < s.length &&
        ch === s[i + 1] &&
        /[kstpcgzjdbfhrmw]/.test(ch)
      ) {
        if (ch === 'm' && i + 2 < s.length && /[aiueoy]/.test(s[i + 2])) {
          // 'amma' -> あんま
          out += 'ん';
          i += 1;
          continue;
        }
        out += 'っ';
        i += 1;
        continue;
      }

      // Labial nasal 'm' before b/p (shimbun -> しんぶん, sampo -> さんぽ)
      if (ch === 'm' && i + 1 < s.length && /[bp]/.test(s[i + 1])) {
        out += 'ん';
        i += 1;
        continue;
      }

      // Single 'n' before consonant (not vowel, not y) or at end of string -> ん
      if (ch === 'n') {
        var nextCh = s[i + 1] || '';
        if (!nextCh || (!/[aiueoy']/.test(nextCh) && nextCh !== 'n')) {
          out += 'ん';
          i += 1;
          continue;
        }
      }

      // 3-char romaji tokens (shi, chi, tsu, sha, cho, kya, etc.)
      var c3 = s.slice(i, i + 3);
      if (c3.length === 3 && ROMAJI_TO_HIRA_MAP[c3]) {
        out += ROMAJI_TO_HIRA_MAP[c3];
        i += 3;
        continue;
      }

      // 2-char romaji tokens (ka, sa, ta, si, ti, tu, hu, ja, etc.)
      var c2 = s.slice(i, i + 2);
      if (c2.length === 2 && ROMAJI_TO_HIRA_MAP[c2]) {
        out += ROMAJI_TO_HIRA_MAP[c2];
        i += 2;
        continue;
      }

      // 1-char vowel (a, i, u, e, o)
      if (ROMAJI_TO_HIRA_MAP[ch]) {
        out += ROMAJI_TO_HIRA_MAP[ch];
        i += 1;
        continue;
      }

      out += ch;
      i += 1;
    }

    return out;
  }

  function toKatakana(romaji) {
    return hiraToKata(toHiragana(romaji));
  }

  /**
   * Resolves effective mora at `idx` in `units`, handling both mora-split (['きょ','う'])
   * and char-split (['き','ょ','う']) shard arrays seamlessly.
   */
  function peekMoraAt(units, idx) {
    if (!units || idx >= units.length) return null;
    var first = String(units[idx] || '');
    var firstHira = kataToHira(first);
    if (
      first.length === 1 &&
      idx + 1 < units.length &&
      SMALL_GLIDE_BOTH_RE.test(String(units[idx + 1] || '')) &&
      firstHira !== 'っ' &&
      firstHira !== 'ん' &&
      first !== 'ー' &&
      !SMALL_GLIDE_BOTH_RE.test(first)
    ) {
      var combined = first + String(units[idx + 1]);
      if (MORA_ROMAJI_MAP[kataToHira(combined)]) {
        return {
          mora: combined,
          hira: kataToHira(combined),
          span: 2,
          singleHira: firstHira
        };
      }
    }
    return {
      mora: first,
      hira: firstHira,
      span: 1,
      singleHira: firstHira
    };
  }

  function isPrefixForTargetAt(buf, units, idx, prevKana) {
    if (!buf) return true;
    var info = peekMoraAt(units, idx);
    if (!info) return false;
    var hira = info.hira;
    var nextInfo = peekMoraAt(units, idx + info.span);

    // Direct kana typing
    if (info.mora.indexOf(buf) === 0 || hira.indexOf(kataToHira(buf)) === 0) {
      return true;
    }

    if (hira === 'ー') {
      var longAccepted = getAcceptedRomaji('ー', null, prevKana);
      for (var li = 0; li < longAccepted.length; li++) {
        if (longAccepted[li].indexOf(buf) === 0) return true;
      }
      return false;
    }

    if (hira === 'っ') {
      var standaloneSokuon = ['xtu', 'ltu', 'xtsu', 'ltsu'];
      for (var si = 0; si < standaloneSokuon.length; si++) {
        if (standaloneSokuon[si].indexOf(buf) === 0) return true;
      }
      if (nextInfo) {
        var nextRom = getBaseAcceptedRomaji(nextInfo.hira);
        for (var ni = 0; ni < nextRom.length; ni++) {
          var c = nextRom[ni].charAt(0);
          if (c && !/[aiueon'-]/.test(c)) {
            if ((c + c).indexOf(buf) === 0) return true;
          }
        }
        if (nextInfo.hira.charAt(0) === 'ち' && 'tc'.indexOf(buf) === 0) {
          return true;
        }
      }
      return false;
    }

    if (hira === 'ん') {
      if ('nn'.indexOf(buf) === 0 || "n'".indexOf(buf) === 0 || 'xn'.indexOf(buf) === 0) {
        return true;
      }
      if (nextInfo) {
        var nextRoms = getBaseAcceptedRomaji(nextInfo.hira);
        for (var mj = 0; mj < nextRoms.length; mj++) {
          if (/^[bpm]/.test(nextRoms[mj]) && buf === 'm') {
            return true;
          }
        }
      }
      return false;
    }

    // Tolerant double-'n' before な-row (supports 3-'n' IME typing like 'minnna' after 'nn' consumed ん)
    if (buf === 'nn' && /^[なにぬねのにゃにゅにょ]/.test(hira)) {
      return true;
    }

    var candidates = getBaseAcceptedRomaji(hira);
    if (info.span === 2) {
      candidates = candidates.concat(getBaseAcceptedRomaji(info.singleHira));
    }
    for (var ci = 0; ci < candidates.length; ci++) {
      if (candidates[ci].indexOf(buf) === 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Real-time Wave 3 Romaji Buffer Consumer.
   * Accepts `buffer` (current typed string) and `remainingUnits` (ordered remaining target units/morae).
   * Returns `{ matchedCount, matchedUnits, remainingBuffer, isValidPrefix, previewKana }`.
   */
  function consumeRomajiBuffer(buffer, remainingUnits, opts) {
    var options = opts && typeof opts === 'object' ? opts : {};
    var units = Array.isArray(remainingUnits) ? remainingUnits : splitMorae(String(remainingUnits || ''));
    var buf = typeof buffer === 'string' ? buffer.trim().toLowerCase() : '';
    var matchedUnits = [];
    var idx = 0;
    var prevKana = options.prevUnit || '';
    var allowTerminalSingleN = options.allowTerminalSingleN !== false;

    while (buf.length > 0 && idx < units.length) {
      var info = peekMoraAt(units, idx);
      if (!info) break;

      var hira = info.hira;
      var nextInfo = peekMoraAt(units, idx + info.span);
      var consumed = false;

      // 0. Direct Kana input match (if player HAS Japanese IME enabled!)
      var bufHira = kataToHira(buf);
      if (bufHira.indexOf(hira) === 0) {
        for (var kStep = 0; kStep < info.span; kStep++) {
          matchedUnits.push(units[idx + kStep]);
        }
        prevKana = info.mora;
        idx += info.span;
        buf = buf.slice(info.mora.length);
        continue;
      }
      if (info.span === 2 && bufHira.indexOf(info.singleHira) === 0) {
        matchedUnits.push(units[idx]);
        prevKana = units[idx];
        idx += 1;
        buf = buf.slice(1);
        continue;
      }

      // 1. Long vowel mark 'ー'
      if (hira === 'ー') {
        var acceptedLong = getAcceptedRomaji('ー', null, prevKana);
        var matchedLong = '';
        for (var li = 0; li < acceptedLong.length; li++) {
          if (buf.indexOf(acceptedLong[li]) === 0) {
            matchedLong = acceptedLong[li];
            break;
          }
        }
        if (matchedLong) {
          matchedUnits.push(units[idx]);
          idx += 1;
          buf = buf.slice(matchedLong.length);
          continue;
        }
        break;
      }

      // 2. Sokuon 'っ' / 'ッ'
      if (hira === 'っ') {
        var standalone = ['xtsu', 'ltsu', 'xtu', 'ltu'];
        var matchedStandalone = '';
        for (var si = 0; si < standalone.length; si++) {
          if (buf.indexOf(standalone[si]) === 0) {
            matchedStandalone = standalone[si];
            break;
          }
        }
        if (matchedStandalone) {
          matchedUnits.push(units[idx]);
          prevKana = units[idx];
          idx += 1;
          buf = buf.slice(matchedStandalone.length);
          continue;
        }

        if (nextInfo) {
          // Hepburn 'tch' before ち/ちゃ/ちゅ/ちぇ/ちょ (e.g. matcha, kotchi)
          if (nextInfo.hira.charAt(0) === 'ち' && buf.indexOf('tc') === 0) {
            matchedUnits.push(units[idx]);
            prevKana = units[idx];
            idx += 1;
            buf = buf.slice(1); // keep 'c...' for 'ch...'
            continue;
          }

          var nextRoms = getBaseAcceptedRomaji(nextInfo.hira);
          for (var nr = 0; nr < nextRoms.length; nr++) {
            var c = nextRoms[nr].charAt(0);
            if (c && !/[aiueon'-]/.test(c) && buf.indexOf(c + c) === 0) {
              matchedUnits.push(units[idx]);
              prevKana = units[idx];
              idx += 1;
              buf = buf.slice(1); // keep second consonant for next mora!
              consumed = true;
              break;
            }
          }
          if (consumed) continue;
        }
        break;
      }

      // 3. Syllabic Nasal 'ん' / 'ン'
      if (hira === 'ん') {
        var nextStartsWithN = Boolean(nextInfo && /^[なにぬねのにゃにゅにょ]/.test(nextInfo.hira));

        // Explicit apostrophe or xn ('n'', 'xn')
        if (buf.indexOf("n'") === 0 || buf.indexOf('xn') === 0) {
          matchedUnits.push(units[idx]);
          prevKana = units[idx];
          idx += 1;
          buf = buf.slice(2);
          continue;
        }

        // 'nn...'
        if (buf.indexOf('nn') === 0) {
          matchedUnits.push(units[idx]);
          prevKana = units[idx];
          idx += 1;
          if (nextStartsWithN) {
            // If user typed 'nnna' (3 n's), consume 'nn' so 'na' remains;
            // if user typed 'nn' or 'nna' (2 n's, Hepburn 'onna'/'minna'), consume 1 'n' so 'n'/'na' remains!
            if (buf.indexOf('nnn') === 0) {
              buf = buf.slice(2);
            } else {
              buf = buf.slice(1);
            }
          } else {
            buf = buf.slice(2);
          }
          continue;
        }

        // Terminal 'ん' at the very end of the word (e.g. 'hon', 'shinbun', 'pan')
        if (!nextInfo && allowTerminalSingleN && buf === 'n') {
          matchedUnits.push(units[idx]);
          prevKana = units[idx];
          idx += 1;
          buf = '';
          continue;
        }
        if (!nextInfo && options.flush && (buf === 'n' || buf === 'm')) {
          matchedUnits.push(units[idx]);
          prevKana = units[idx];
          idx += 1;
          buf = '';
          continue;
        }

        // Single 'n' (or labial 'm' before b/p/m) followed by valid start of nextInfo
        if (nextInfo && buf.length >= 2) {
          var firstCh = buf.charAt(0);
          var rest = buf.slice(1);
          if (firstCh === 'n' && rest.charAt(0) !== 'n' && rest.charAt(0) !== "'") {
            if (isPrefixForTargetAt(rest, units, idx + info.span, units[idx]) ||
                consumeRomajiBuffer(rest, units.slice(idx + info.span), { prevUnit: units[idx], allowTerminalSingleN: allowTerminalSingleN }).matchedCount > 0) {
              matchedUnits.push(units[idx]);
              prevKana = units[idx];
              idx += 1;
              buf = rest;
              continue;
            }
          }
          if (firstCh === 'm') {
            var nextCandList = getBaseAcceptedRomaji(nextInfo.hira);
            var isLabialNext = nextCandList.some(function (r) { return /^[bpm]/.test(r); });
            if (isLabialNext && (isPrefixForTargetAt(rest, units, idx + info.span, units[idx]) ||
                consumeRomajiBuffer(rest, units.slice(idx + info.span), { prevUnit: units[idx], allowTerminalSingleN: allowTerminalSingleN }).matchedCount > 0)) {
              matchedUnits.push(units[idx]);
              prevKana = units[idx];
              idx += 1;
              buf = rest;
              continue;
            }
          }
        }
        break;
      }

      // 4. Normal Mora / Digraph
      // Tolerant 'nn' collapse before な-row (handles 3rd 'n' in 'minnna' keystroke-by-keystroke)
      if (/^[なにぬねのにゃにゅにょ]/.test(hira) && buf.indexOf('nn') === 0) {
        buf = buf.slice(1);
      }

      var candidates = getBaseAcceptedRomaji(hira).slice().sort(function (a, b) {
        return b.length - a.length;
      });
      var matchedCand = '';
      for (var ci = 0; ci < candidates.length; ci++) {
        if (buf.indexOf(candidates[ci]) === 0) {
          matchedCand = candidates[ci];
          break;
        }
      }

      if (matchedCand) {
        for (var step = 0; step < info.span; step++) {
          matchedUnits.push(units[idx + step]);
        }
        prevKana = info.mora;
        idx += info.span;
        buf = buf.slice(matchedCand.length);
        continue;
      }

      // If char-split (span === 2), also allow explicit single base kana + small kana IME input ('chi' + 'xyo')
      if (info.span === 2) {
        var singleCands = getBaseAcceptedRomaji(info.singleHira).slice().sort(function (a, b) {
          return b.length - a.length;
        });
        var matchedSingle = '';
        for (var sci = 0; sci < singleCands.length; sci++) {
          if (buf.indexOf(singleCands[sci]) === 0) {
            matchedSingle = singleCands[sci];
            break;
          }
        }
        if (matchedSingle) {
          matchedUnits.push(units[idx]);
          prevKana = units[idx];
          idx += 1;
          buf = buf.slice(matchedSingle.length);
          continue;
        }
      }

      break;
    }

    // Absorb redundant second 'n' right after terminal 'ん'/'ン' was already matched by single 'n'
    // (e.g. when autoSubmitKana is false and player types 'honn' or 'shinnbunn')
    if (idx >= units.length && buf === 'n' && kataToHira(prevKana) === 'ん') {
      buf = '';
    }

    var validPrefix = buf === '' ? true : isPrefixForTargetAt(buf, units, idx, prevKana);
    var previewTarget = idx < units.length ? peekMoraAt(units, idx) : null;

    return {
      matchedCount: matchedUnits.length,
      matchedUnits: matchedUnits,
      remainingBuffer: buf,
      isValidPrefix: validPrefix,
      previewKana: buf && validPrefix && previewTarget ? previewTarget.mora : ''
    };
  }

  function isFullMatch(inputStr, targetWordOrKana) {
    if (!inputStr || typeof inputStr !== 'string') return false;
    var cleanInput = inputStr.trim();
    if (!cleanInput) return false;

    var targetKana = '';
    var targetRomaji = '';
    var targetExpr = '';
    if (typeof targetWordOrKana === 'object' && targetWordOrKana !== null) {
      targetKana = targetWordOrKana.kana || '';
      targetRomaji = (targetWordOrKana.romaji || '').toLowerCase();
      targetExpr = targetWordOrKana.expression || targetWordOrKana.kanji || '';
    } else {
      targetKana = String(targetWordOrKana || '').trim();
    }

    if (targetExpr && cleanInput === targetExpr) return true;
    if (targetKana && kataToHira(cleanInput) === kataToHira(targetKana)) return true;
    if (targetRomaji && cleanInput.toLowerCase() === targetRomaji) return true;

    if (targetKana) {
      var morae = splitMorae(targetKana);
      var res = consumeRomajiBuffer(cleanInput.toLowerCase(), morae, {
        allowTerminalSingleN: true,
        flush: true
      });
      if (res.matchedCount === morae.length && res.remainingBuffer === '') {
        return true;
      }
      // Also check hiragana conversion equivalence (handles e.g. oo vs ou or hyphenated katakana)
      var convertedHira = toHiragana(cleanInput);
      if (convertedHira === kataToHira(targetKana)) {
        return true;
      }
    }
    return false;
  }

  function matchesQuery(wordObj, rawQuery) {
    if (!wordObj) return false;
    if (!rawQuery || typeof rawQuery !== 'string') return true;
    var q = rawQuery.trim().toLowerCase();
    if (!q) return true;

    var expr = (wordObj.expression || wordObj.word || '').toLowerCase();
    var kanji = (wordObj.kanji || '').toLowerCase();
    var kana = (wordObj.kana || '').toLowerCase();
    var kanaHira = kataToHira(kana);
    var romaji = (wordObj.romaji || '').toLowerCase();
    var koPron = (wordObj.koPron || '').toLowerCase();
    var meaning = (wordObj.meaning || '').toLowerCase();
    var theme = (wordObj.theme || '').toLowerCase();
    var pos = (wordObj.pos || '').toLowerCase();

    if (
      expr.indexOf(q) !== -1 ||
      kanji.indexOf(q) !== -1 ||
      kana.indexOf(q) !== -1 ||
      kanaHira.indexOf(kataToHira(q)) !== -1 ||
      romaji.indexOf(q) !== -1 ||
      koPron.indexOf(q) !== -1 ||
      meaning.indexOf(q) !== -1 ||
      theme.indexOf(q) !== -1 ||
      pos.indexOf(q) !== -1
    ) {
      return true;
    }

    // If query is ASCII romaji (Hepburn or Kunrei-shiki, e.g. "tiisai", "si", "gakkou", "ko-hi-"),
    // convert query to Hiragana and check substring against word's Hiragana reading!
    if (/^[a-z'-]+$/.test(q)) {
      var qHira = toHiragana(q);
      if (qHira && kanaHira.indexOf(qHira) !== -1) {
        return true;
      }
      var generatedRomaji = toRomaji(kana);
      if (generatedRomaji && generatedRomaji.indexOf(q.replace(/-/g, '')) !== -1) {
        return true;
      }
    }

    return false;
  }

  var RomajiHelper = {
    splitMorae: splitMorae,
    splitChars: splitChars,
    kataToHira: kataToHira,
    hiraToKata: hiraToKata,
    toRomaji: toRomaji,
    kanaToRomaji: toRomaji,
    toHiragana: toHiragana,
    romajiToHiragana: toHiragana,
    toKatakana: toKatakana,
    romajiToKatakana: toKatakana,
    getAcceptedRomaji: getAcceptedRomaji,
    getAcceptedRomajiList: getAcceptedRomaji,
    consumeRomajiBuffer: consumeRomajiBuffer,
    isFullMatch: isFullMatch,
    matchesQuery: matchesQuery
  };

  // ===========================================================================
  // 2. GOJUON_DATA — Structured Interactive Kana Chart Dataset
  // ===========================================================================
  function makeCell(hira, kata, romaji, koPron, row, col, altRomaji) {
    return {
      hira: hira,
      kata: kata,
      romaji: romaji,
      altRomaji: altRomaji || [],
      ko: koPron,
      koPron: koPron,
      row: row,
      col: col
    };
  }

  function makeRow(rowKey, rowLabel, cellsArray) {
    // Hybrid Array + Row Metadata Object: works with both `row.forEach(...)` AND `row.cells.forEach(...)`!
    var arr = cellsArray.slice();
    arr.id = rowKey;
    arr.rowKey = rowKey;
    arr.label = rowLabel;
    arr.rowLabel = rowLabel;
    arr.cells = arr;
    return arr;
  }

  var SEION_ROWS = [
    makeRow('a', 'あ행', [
      makeCell('あ', 'ア', 'a', '아', 'a', 0),
      makeCell('い', 'イ', 'i', '이', 'a', 1),
      makeCell('う', 'ウ', 'u', '우', 'a', 2),
      makeCell('え', 'エ', 'e', '에', 'a', 3),
      makeCell('お', 'オ', 'o', '오', 'a', 4)
    ]),
    makeRow('ka', 'か행', [
      makeCell('か', 'カ', 'ka', '카', 'ka', 0),
      makeCell('き', 'キ', 'ki', '키', 'ka', 1),
      makeCell('く', 'ク', 'ku', '쿠', 'ka', 2),
      makeCell('け', 'ケ', 'ke', '케', 'ka', 3),
      makeCell('こ', 'コ', 'ko', '코', 'ka', 4)
    ]),
    makeRow('sa', 'さ행', [
      makeCell('さ', 'サ', 'sa', '사', 'sa', 0),
      makeCell('し', 'シ', 'shi', '시', 'sa', 1, ['si']),
      makeCell('す', 'ス', 'su', '스', 'sa', 2),
      makeCell('せ', 'セ', 'se', '세', 'sa', 3),
      makeCell('そ', 'ソ', 'so', '소', 'sa', 4)
    ]),
    makeRow('ta', 'た행', [
      makeCell('た', 'タ', 'ta', '타', 'ta', 0),
      makeCell('ち', 'チ', 'chi', '치', 'ta', 1, ['ti']),
      makeCell('つ', 'ツ', 'tsu', '츠', 'ta', 2, ['tu']),
      makeCell('て', 'テ', 'te', '테', 'ta', 3),
      makeCell('と', 'ト', 'to', '토', 'ta', 4)
    ]),
    makeRow('na', 'な행', [
      makeCell('な', 'ナ', 'na', '나', 'na', 0),
      makeCell('に', 'ニ', 'ni', '니', 'na', 1),
      makeCell('ぬ', 'ヌ', 'nu', '누', 'na', 2),
      makeCell('ね', 'ネ', 'ne', '네', 'na', 3),
      makeCell('の', 'ノ', 'no', '노', 'na', 4)
    ]),
    makeRow('ha', 'は행', [
      makeCell('は', 'ハ', 'ha', '하', 'ha', 0),
      makeCell('ひ', 'ヒ', 'hi', '히', 'ha', 1),
      makeCell('ふ', 'フ', 'fu', '후', 'ha', 2, ['hu']),
      makeCell('へ', 'ヘ', 'he', '헤', 'ha', 3),
      makeCell('ほ', 'ホ', 'ho', '호', 'ha', 4)
    ]),
    makeRow('ma', 'ま행', [
      makeCell('ま', 'マ', 'ma', '마', 'ma', 0),
      makeCell('み', 'ミ', 'mi', '미', 'ma', 1),
      makeCell('む', 'ム', 'mu', '무', 'ma', 2),
      makeCell('め', 'メ', 'me', 'メ' === 'メ' ? '메' : '메', 'ma', 3),
      makeCell('も', 'モ', 'mo', '모', 'ma', 4)
    ]),
    makeRow('ya', 'や행', [
      makeCell('や', 'ヤ', 'ya', '야', 'ya', 0),
      null,
      makeCell('ゆ', 'ユ', 'yu', '유', 'ya', 2),
      null,
      makeCell('よ', 'ヨ', 'yo', '요', 'ya', 4)
    ]),
    makeRow('ra', 'ら행', [
      makeCell('ら', 'ラ', 'ra', '라', 'ra', 0),
      makeCell('り', 'リ', 'ri', '리', 'ra', 1),
      makeCell('る', 'ル', 'ru', '루', 'ra', 2),
      makeCell('れ', 'レ', 're', '레', 'ra', 3),
      makeCell('ろ', 'ロ', 'ro', '로', 'ra', 4)
    ]),
    makeRow('wa', 'わ행', [
      makeCell('わ', 'ワ', 'wa', '와', 'wa', 0),
      null,
      null,
      null,
      makeCell('を', 'ヲ', 'wo', '오', 'wa', 4, ['o'])
    ]),
    makeRow('n', 'ん(발음)', [
      makeCell('ん', 'ン', 'n', 'ㄴ/응', 'n', 0, ['nn']),
      null,
      null,
      null,
      null
    ])
  ];

  var DAKUON_ROWS = [
    makeRow('ga', 'が행 (탁음)', [
      makeCell('が', 'ガ', 'ga', '가', 'ga', 0),
      makeCell('ぎ', 'ギ', 'gi', '기', 'ga', 1),
      makeCell('ぐ', 'グ', 'gu', '구', 'ga', 2),
      makeCell('げ', 'ゲ', 'ge', '게', 'ga', 3),
      makeCell('ご', 'ゴ', 'go', '고', 'ga', 4)
    ]),
    makeRow('za', 'ざ행 (탁음)', [
      makeCell('ざ', 'ザ', 'za', '자', 'za', 0),
      makeCell('じ', 'ジ', 'ji', '지', 'za', 1, ['zi']),
      makeCell('ず', 'ズ', 'zu', '즈', 'za', 2),
      makeCell('ぜ', 'ゼ', 'ze', '제', 'za', 3),
      makeCell('ぞ', 'ゾ', 'zo', '조', 'za', 4)
    ]),
    makeRow('da', 'だ행 (탁음)', [
      makeCell('だ', 'ダ', 'da', '다', 'da', 0),
      makeCell('ぢ', 'ヂ', 'ji', '지', 'da', 1, ['di', 'zi']),
      makeCell('づ', 'ヅ', 'zu', '즈', 'da', 2, ['du', 'dzu']),
      makeCell('で', 'デ', 'de', '데', 'da', 3),
      makeCell('ど', 'ド', 'do', '도', 'da', 4)
    ]),
    makeRow('ba', 'ば행 (탁음)', [
      makeCell('ば', 'バ', 'ba', '바', 'ba', 0),
      makeCell('び', 'ビ', 'bi', '비', 'ba', 1),
      makeCell('ぶ', 'ブ', 'bu', '부', 'ba', 2),
      makeCell('べ', 'ベ', 'be', '베', 'ba', 3),
      makeCell('ぼ', 'ボ', 'bo', '보', 'ba', 4)
    ])
  ];

  var HANDAKUON_ROWS = [
    makeRow('pa', 'ぱ행 (반탁음)', [
      makeCell('ぱ', 'パ', 'pa', '파', 'pa', 0),
      makeCell('ぴ', 'ピ', 'pi', '피', 'pa', 1),
      makeCell('ぷ', 'プ', 'pu', '푸', 'pa', 2),
      makeCell('ぺ', 'ペ', 'pe', '페', 'pa', 3),
      makeCell('ぽ', 'ポ', 'po', '포', 'pa', 4)
    ])
  ];

  var YOON_ROWS = [
    makeRow('kya', 'きゃ행', [
      makeCell('きゃ', 'キャ', 'kya', '캬', 'kya', 0),
      makeCell('きゅ', 'キュ', 'kyu', '큐', 'kya', 1),
      makeCell('きょ', 'キョ', 'kyo', '쿄', 'kya', 2)
    ]),
    makeRow('sha', 'しゃ행', [
      makeCell('しゃ', 'シャ', 'sha', '샤', 'sha', 0, ['sya']),
      makeCell('しゅ', 'シュ', 'shu', '슈', 'sha', 1, ['syu']),
      makeCell('しょ', 'ショ', 'sho', '쇼', 'sha', 2, ['syo'])
    ]),
    makeRow('cha', 'ちゃ행', [
      makeCell('ちゃ', 'チャ', 'cha', '차', 'cha', 0, ['tya', 'cya']),
      makeCell('ちゅ', 'チュ', 'chu', '츄', 'cha', 1, ['tyu', 'cyu']),
      makeCell('ちょ', 'チョ', 'cho', '초', 'cha', 2, ['tyo', 'cyo'])
    ]),
    makeRow('nya', 'にゃ행', [
      makeCell('にゃ', 'ニャ', 'nya', '냐', 'nya', 0),
      makeCell('にゅ', 'ニュ', 'nyu', '뉴', 'nya', 1),
      makeCell('にょ', 'ニョ', 'nyo', '뇨', 'nya', 2)
    ]),
    makeRow('hya', 'ひゃ행', [
      makeCell('ひゃ', 'ヒャ', 'hya', '햐', 'hya', 0),
      makeCell('ひゅ', 'ヒュ', 'hyu', '휴', 'hya', 1),
      makeCell('ひょ', 'ヒョ', 'hyo', '효', 'hya', 2)
    ]),
    makeRow('mya', 'みゃ행', [
      makeCell('みゃ', 'ミャ', 'mya', '먀', 'mya', 0),
      makeCell('みゅ', 'ミュ', 'myu', '뮤', 'mya', 1),
      makeCell('みょ', 'ミョ', 'myo', '묘', 'mya', 2)
    ]),
    makeRow('rya', 'りゃ행', [
      makeCell('りゃ', 'リャ', 'rya', '랴', 'rya', 0),
      makeCell('りゅ', 'リュ', 'ryu', '류', 'rya', 1),
      makeCell('りょ', 'リョ', 'ryo', '료', 'rya', 2)
    ]),
    makeRow('gya', 'ぎゃ행', [
      makeCell('ぎゃ', 'ギャ', 'gya', '갸', 'gya', 0),
      makeCell('ぎゅ', 'ギュ', 'gyu', '규', 'gya', 1),
      makeCell('ぎょ', 'ギョ', 'gyo', '교', 'gya', 2)
    ]),
    makeRow('ja', 'じゃ행', [
      makeCell('じゃ', 'ジャ', 'ja', '자', 'ja', 0, ['jya', 'zya']),
      makeCell('じゅ', 'ジュ', 'ju', '쥬', 'ja', 1, ['jyu', 'zyu']),
      makeCell('じょ', 'ジョ', 'jo', '조', 'ja', 2, ['jyo', 'zyo'])
    ]),
    makeRow('bya', 'びゃ행', [
      makeCell('びゃ', 'ビャ', 'bya', '뱌', 'bya', 0),
      makeCell('びゅ', 'ビュ', 'byu', '뷰', 'bya', 1),
      makeCell('びょ', 'ビョ', 'byo', '뵤', 'bya', 2)
    ]),
    makeRow('pya', 'ぴゃ행', [
      makeCell('ぴゃ', 'ピャ', 'pya', '퍄', 'pya', 0),
      makeCell('ぴゅ', 'ピュ', 'pyu', '퓨', 'pya', 1),
      makeCell('ぴょ', 'ピョ', 'pyo', '표', 'pya', 2)
    ])
  ];

  function flattenRows(rows) {
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      for (var j = 0; j < rows[i].length; j++) {
        if (rows[i][j]) out.push(rows[i][j]);
      }
    }
    return out;
  }

  var SPECIAL_RULES = [
    {
      id: 'sokuon',
      symbol: 'っ / ッ',
      hira: 'っ',
      kata: 'ッ',
      name: '촉음 (促音 · 작은 つ)',
      romajiRule: '뒷자음 2번 입력 (kk, tt, pp, ss, tch)',
      desc: '작은 つ는 한 박자 숨을 멈췄다가 다음 자음을 된소리처럼 강하게 발음합니다.',
      examples: [
        { expression: '学校', kana: 'がっこう', romaji: 'gakkou', ko: '학교 (각코-)' },
        { expression: '切符', kana: 'きっぷ', romaji: 'kippu', ko: '표 (킵푸)' },
        { expression: 'ちょっと', kana: 'ちょっと', romaji: 'chotto', ko: '잠깐 (춋토)' }
      ]
    },
    {
      id: 'chouon',
      symbol: 'おう · えい · ー',
      hira: 'おう',
      kata: 'ー',
      name: '장음 (長音 · 긴 소리)',
      romajiRule: 'ou / ei / 모음 중복 또는 하이픈(-)',
      desc: '앞 모음을 정확히 2박자 길이로 길게 끌어 발음해야 의미가 구별됩니다.',
      examples: [
        { expression: '先生', kana: 'せんせい', romaji: 'sensei', ko: '선생님 (센세-)' },
        { expression: 'コーヒー', kana: 'コーヒー', romaji: 'koohii / ko-hi-', ko: '커피 (코-히-)' }
      ]
    },
    {
      id: 'hatsuon',
      symbol: 'ん / ン',
      hira: 'ん',
      kata: 'ン',
      name: '발음 (撥音 · 받침 소리)',
      romajiRule: '자음·어말 n / 모음·y 앞 nn / b·p·m 앞 m 호환',
      desc: '뒤에 오는 음에 따라 ㄴ(t·d·n 앞), ㅁ(b·p·m 앞), ㅇ(k·g 앞·어말)으로 소리 나며 항상 독립된 1박자입니다.',
      examples: [
        { expression: '新聞', kana: 'しんぶん', romaji: 'shinbun', ko: '신문 (심붕)' },
        { expression: '本', kana: 'ほん', romaji: 'hon', ko: '책 (홍)' }
      ]
    }
  ];

  var GOJUON_DATA = {
    headers: ['あ단 (a)', 'い단 (i)', 'う단 (u)', 'え단 (e)', 'お단 (o)'],
    yoonHeaders: ['ゃ단 (ya)', 'ゅ단 (yu)', 'ょ단 (yo)'],
    seion: SEION_ROWS,
    dakuon: DAKUON_ROWS,
    handakuon: HANDAKUON_ROWS,
    yoon: YOON_ROWS,
    specialRules: SPECIAL_RULES,
    seionFlat: flattenRows(SEION_ROWS),
    dakuonFlat: flattenRows(DAKUON_ROWS),
    handakuonFlat: flattenRows(HANDAKUON_ROWS),
    yoonFlat: flattenRows(YOON_ROWS),
    allCells: flattenRows(SEION_ROWS)
      .concat(flattenRows(DAKUON_ROWS))
      .concat(flattenRows(HANDAKUON_ROWS))
      .concat(flattenRows(YOON_ROWS))
  };

  function getGojuonData() {
    return GOJUON_DATA;
  }

  // ===========================================================================
  // 3. Safe Storage Wrapper (localStorage + In-Memory Fallback)
  // ===========================================================================
  var memoryFallbackStore = {};
  var storageAvailable = false;

  function detectLocalStorage() {
    try {
      if (typeof root.localStorage === 'undefined' || !root.localStorage) {
        return false;
      }
      var probeKey = '__prism_n5_probe__';
      root.localStorage.setItem(probeKey, '1');
      root.localStorage.removeItem(probeKey);
      return true;
    } catch (_) {
      return false;
    }
  }

  storageAvailable = detectLocalStorage();

  function readRawStorage(key) {
    try {
      if (storageAvailable && root.localStorage) {
        var val = root.localStorage.getItem(key);
        if (val !== null && val !== undefined) {
          return val;
        }
      }
    } catch (_) {
      storageAvailable = false;
    }
    return Object.prototype.hasOwnProperty.call(memoryFallbackStore, key)
      ? memoryFallbackStore[key]
      : null;
  }

  function writeRawStorage(key, value) {
    memoryFallbackStore[key] = value;
    try {
      if (storageAvailable && root.localStorage) {
        root.localStorage.setItem(key, value);
      }
    } catch (_) {
      storageAvailable = false;
    }
  }

  // ===========================================================================
  // 4. Date Helpers & Dynamic Curriculum Size Helpers
  // ===========================================================================
  function formatLocalDate(dateObj) {
    var d = dateObj instanceof Date ? dateObj : new Date();
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function diffCalendarDays(earlierYmd, laterYmd) {
    if (!earlierYmd || !laterYmd) return Infinity;
    var p1 = earlierYmd.split('-').map(Number);
    var p2 = laterYmd.split('-').map(Number);
    if (p1.length !== 3 || p2.length !== 3) return Infinity;
    var utc1 = Date.UTC(p1[0], p1[1] - 1, p1[2]);
    var utc2 = Date.UTC(p2[0], p2[1] - 1, p2[2]);
    return Math.round((utc2 - utc1) / 86400000);
  }

  function getWordsArray() {
    if (Array.isArray(N5App.WORDS_500) && N5App.WORDS_500.length > 0) {
      return N5App.WORDS_500;
    }
    if (Array.isArray(N5App.words) && N5App.words.length > 0) {
      return N5App.words;
    }
    if (Array.isArray(N5App.WORDS_800) && N5App.WORDS_800.length > 0) {
      return N5App.WORDS_800;
    }
    if (N5App.WordBank && typeof N5App.WordBank.getAllWords === 'function') {
      var list = N5App.WordBank.getAllWords();
      if (Array.isArray(list) && list.length > 0) return list;
    }
    return [];
  }

  function getRoundsArray() {
    if (Array.isArray(N5App.ROUNDS_50) && N5App.ROUNDS_50.length > 0) {
      return N5App.ROUNDS_50;
    }
    if (Array.isArray(N5App.ROUNDS_80) && N5App.ROUNDS_80.length > 0) {
      return N5App.ROUNDS_80;
    }
    if (N5App.WordBank && typeof N5App.WordBank.getAllRounds === 'function') {
      var rounds = N5App.WordBank.getAllRounds();
      if (Array.isArray(rounds) && rounds.length > 0) return rounds;
    }
    return [];
  }

  function getTotalWordsCount() {
    var list = getWordsArray();
    return list.length > 0 ? list.length : TOTAL_WORDS_DEFAULT;
  }

  function getTotalRoundsCount() {
    var rounds = getRoundsArray();
    if (rounds.length > 0) return rounds.length;
    var words = getWordsArray();
    if (words.length > 0) return Math.ceil(words.length / 10);
    return TOTAL_ROUNDS_DEFAULT;
  }

  function getLv1RoundNumbers() {
    var rounds = getRoundsArray();
    if (rounds.length > 0) {
      var lv1 = [];
      for (var i = 0; i < rounds.length; i++) {
        if (rounds[i] && Number(rounds[i].level) === 1) {
          lv1.push(Number(rounds[i].round));
        }
      }
      if (lv1.length > 0) return lv1;
    }
    var fallback = [];
    for (var r = 1; r <= 20; r++) fallback.push(r);
    return fallback;
  }

  // ===========================================================================
  // 5. Default State Factory & Sanitizer
  // ===========================================================================
  function normalizeTheme(themeStr) {
    if (themeStr === 'crystal-sakura-day' || themeStr === 'crystal-day' || themeStr === 'light') {
      return 'crystal-sakura-day';
    }
    if (themeStr === 'midnight-sakura' || themeStr === 'dark-aurora' || themeStr === 'dark') {
      return 'midnight-sakura';
    }
    return null;
  }

  function createDefaultSettings() {
    return {
      theme: 'midnight-sakura', // 'midnight-sakura' | 'crystal-sakura-day'
      memorizeSec: 45,          // 30 | 45 | 60
      muted: false,             // unified mute state for sfx + auto tts
      ttsEnabled: true,         // Web Speech TTS toggle
      ttsLang: 'ja-JP',         // Japanese voice target
      ttsRate: 1.0,             // 1.0 (normal) | 0.78 (slow clear listening)
      ttsSpeedMode: 'normal',   // 'normal' | 'slow'
      sfxVolume: 0.72           // master synth gain (0..1)
    };
  }

  function createDefaultState(preservedSettings) {
    return {
      version: SCHEMA_VERSION,
      words: {},        // { [wordId]: { box, correctCount, wrongCount, consecutiveCorrect, pinned, inWrongNote, lastSeen, lastWrongAt } }
      rounds: {},       // { [round]: { round, cleared, bestScore, bestRank, stars, playCount, bestCombo, bestAccuracy, lastPlayedAt } }
      badges: {},       // { [badgeId]: unlockedTimestamp }
      stats: {
        totalScore: 0,
        bestCombo: 0,
        survivalBestScore: 0,
        totalRoundsPlayed: 0,
        pinnedCorrectCount: 0,
        revengeCorrectCount: 0,
        earlyBirdSRankCount: 0,
        perfectRoundCount: 0,
        streakDays: 0,
        bestStreakDays: 0,
        lastStudyDate: null,
        todayDate: formatLocalDate(new Date()),
        todayStudiedCount: 0
      },
      settings: preservedSettings
        ? Object.assign(createDefaultSettings(), preservedSettings)
        : createDefaultSettings()
    };
  }

  var state = createDefaultState();
  var initialized = false;

  function sanitizeLoadedState(rawObj) {
    var base = createDefaultState();
    if (!rawObj || typeof rawObj !== 'object') {
      return base;
    }

    if (rawObj.words && typeof rawObj.words === 'object') {
      Object.keys(rawObj.words).forEach(function (k) {
        var id = Number(k);
        var w = rawObj.words[k];
        if (!Number.isFinite(id) || id <= 0 || !w || typeof w !== 'object') return;
        var box = Number(w.box);
        if (!Number.isFinite(box) || box < 0) box = 0;
        if (box > 3) box = 3;
        base.words[id] = {
          box: Math.floor(box),
          correctCount: Math.max(0, Math.floor(Number(w.correctCount) || 0)),
          wrongCount: Math.max(0, Math.floor(Number(w.wrongCount) || 0)),
          consecutiveCorrect: Math.max(0, Math.floor(Number(w.consecutiveCorrect) || 0)),
          pinned: Boolean(w.pinned),
          inWrongNote: Boolean(w.inWrongNote),
          lastSeen: w.lastSeen ? Number(w.lastSeen) : null,
          lastWrongAt: w.lastWrongAt ? Number(w.lastWrongAt) : null
        };
      });
    }

    if (rawObj.rounds && typeof rawObj.rounds === 'object') {
      Object.keys(rawObj.rounds).forEach(function (k) {
        var r = Number(k);
        var rec = rawObj.rounds[k];
        if (!Number.isFinite(r) || r < 1 || r > 100 || !rec || typeof rec !== 'object') return;
        base.rounds[r] = {
          round: r,
          cleared: Boolean(rec.cleared),
          bestScore: Math.max(0, Math.floor(Number(rec.bestScore) || 0)),
          bestRank: rec.bestRank && RANK_WEIGHT[rec.bestRank] ? rec.bestRank : null,
          stars: Math.max(0, Math.min(3, Math.floor(Number(rec.stars) || 0))),
          playCount: Math.max(0, Math.floor(Number(rec.playCount) || 0)),
          bestCombo: Math.max(0, Math.floor(Number(rec.bestCombo) || 0)),
          bestAccuracy: Math.max(0, Math.min(100, Number(rec.bestAccuracy) || 0)),
          lastPlayedAt: rec.lastPlayedAt ? Number(rec.lastPlayedAt) : null
        };
      });
    }

    if (rawObj.badges && typeof rawObj.badges === 'object') {
      Object.keys(rawObj.badges).forEach(function (badgeId) {
        if (rawObj.badges[badgeId]) {
          var normalizedId = badgeId === 'master_800' ? 'master_500' : badgeId;
          base.badges[normalizedId] = Number(rawObj.badges[badgeId]) || Date.now();
        }
      });
    }

    if (rawObj.stats && typeof rawObj.stats === 'object') {
      var s = rawObj.stats;
      base.stats.totalScore = Math.max(0, Math.floor(Number(s.totalScore) || 0));
      base.stats.bestCombo = Math.max(0, Math.floor(Number(s.bestCombo) || 0));
      base.stats.survivalBestScore = Math.max(0, Math.floor(Number(s.survivalBestScore) || 0));
      base.stats.totalRoundsPlayed = Math.max(0, Math.floor(Number(s.totalRoundsPlayed) || 0));
      base.stats.pinnedCorrectCount = Math.max(0, Math.floor(Number(s.pinnedCorrectCount) || 0));
      base.stats.revengeCorrectCount = Math.max(0, Math.floor(Number(s.revengeCorrectCount) || 0));
      base.stats.earlyBirdSRankCount = Math.max(0, Math.floor(Number(s.earlyBirdSRankCount) || 0));
      base.stats.perfectRoundCount = Math.max(0, Math.floor(Number(s.perfectRoundCount) || 0));
      base.stats.streakDays = Math.max(0, Math.floor(Number(s.streakDays) || 0));
      base.stats.bestStreakDays = Math.max(0, Math.floor(Number(s.bestStreakDays) || 0));
      base.stats.lastStudyDate = typeof s.lastStudyDate === 'string' ? s.lastStudyDate : null;
      base.stats.todayDate = typeof s.todayDate === 'string' ? s.todayDate : formatLocalDate(new Date());
      base.stats.todayStudiedCount = Math.max(0, Math.floor(Number(s.todayStudiedCount) || 0));
    }

    if (rawObj.settings && typeof rawObj.settings === 'object') {
      var st = rawObj.settings;
      var normTheme = normalizeTheme(st.theme);
      if (normTheme) {
        base.settings.theme = normTheme;
      }
      var memSec = Number(st.memorizeSec);
      if (memSec === 30 || memSec === 45 || memSec === 60) {
        base.settings.memorizeSec = memSec;
      }
      if (typeof st.muted === 'boolean') {
        base.settings.muted = st.muted;
      }
      if (typeof st.ttsEnabled === 'boolean') {
        base.settings.ttsEnabled = st.ttsEnabled;
      }
      if (typeof st.ttsLang === 'string' && st.ttsLang) {
        base.settings.ttsLang = st.ttsLang;
      }
      if (Number.isFinite(Number(st.ttsRate))) {
        var rVal = Math.max(0.5, Math.min(1.5, Number(st.ttsRate)));
        base.settings.ttsRate = rVal;
        base.settings.ttsSpeedMode = rVal <= 0.85 ? 'slow' : 'normal';
      }
      if (Number.isFinite(Number(st.sfxVolume))) {
        base.settings.sfxVolume = Math.max(0, Math.min(1, Number(st.sfxVolume)));
      }
    }

    return base;
  }

  function saveState() {
    try {
      writeRawStorage(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      // Never throw on serialization/storage failure
    }
  }

  function refreshDailyStreakOnLoad() {
    var today = formatLocalDate(new Date());
    if (state.stats.todayDate !== today) {
      state.stats.todayDate = today;
      state.stats.todayStudiedCount = 0;
    }
    if (state.stats.lastStudyDate) {
      var gap = diffCalendarDays(state.stats.lastStudyDate, today);
      if (gap > 1) {
        state.stats.streakDays = 0;
      }
    }
  }

  function touchDailyStudy(incrementWords) {
    var today = formatLocalDate(new Date());
    if (state.stats.todayDate !== today) {
      state.stats.todayDate = today;
      state.stats.todayStudiedCount = 0;
    }
    var count = Math.max(1, Math.floor(Number(incrementWords) || 1));
    state.stats.todayStudiedCount += count;

    var last = state.stats.lastStudyDate;
    if (last !== today) {
      var gap = last ? diffCalendarDays(last, today) : Infinity;
      if (gap === 1) {
        state.stats.streakDays = (state.stats.streakDays || 0) + 1;
      } else {
        state.stats.streakDays = 1;
      }
      state.stats.lastStudyDate = today;
    } else if (state.stats.streakDays < 1) {
      state.stats.streakDays = 1;
    }

    if (state.stats.streakDays > state.stats.bestStreakDays) {
      state.stats.bestStreakDays = state.stats.streakDays;
    }
  }

  // ===========================================================================
  // 6. Word Resolution Helpers
  // ===========================================================================
  var cachedWordMap = null;
  var cachedWordListRef = null;

  function resolveWord(wordOrId) {
    if (!wordOrId && wordOrId !== 0) return null;
    if (
      typeof wordOrId === 'object' &&
      (typeof wordOrId.expression === 'string' || typeof wordOrId.kana === 'string' || typeof wordOrId.word === 'string')
    ) {
      return wordOrId;
    }

    var targetId = typeof wordOrId === 'object' ? Number(wordOrId.id) : Number(wordOrId);
    if (!Number.isFinite(targetId)) {
      if (typeof wordOrId === 'string') {
        if (N5App.WordBank && typeof N5App.WordBank.getWordByText === 'function') {
          var byText = N5App.WordBank.getWordByText(wordOrId);
          if (byText) return byText;
        }
        var q = wordOrId.trim();
        var list = getWordsArray();
        for (var s = 0; s < list.length; s++) {
          var item = list[s];
          if (item && (item.expression === q || item.kana === q || item.romaji === q.toLowerCase())) {
            return item;
          }
        }
      }
      return null;
    }

    if (N5App.WordBank && typeof N5App.WordBank.getWordById === 'function') {
      var found = N5App.WordBank.getWordById(targetId);
      if (found) return found;
    }

    var words = getWordsArray();
    if (words.length > 0) {
      if (cachedWordListRef !== words || !cachedWordMap) {
        cachedWordListRef = words;
        cachedWordMap = {};
        for (var i = 0; i < words.length; i++) {
          if (words[i] && words[i].id != null) {
            cachedWordMap[Number(words[i].id)] = words[i];
          }
        }
      }
      return cachedWordMap[targetId] || null;
    }
    return null;
  }

  function extractWordId(wordOrId) {
    if (typeof wordOrId === 'number') return Math.floor(wordOrId);
    if (typeof wordOrId === 'object' && wordOrId !== null && wordOrId.id != null) {
      return Math.floor(Number(wordOrId.id));
    }
    var parsed = Number(wordOrId);
    if (Number.isFinite(parsed)) return Math.floor(parsed);
    var resolved = resolveWord(wordOrId);
    return resolved ? Number(resolved.id) : NaN;
  }

  function boxToStatus(box) {
    if (box >= 3) return 'mastered';
    if (box >= 1) return 'learning';
    return 'unseen';
  }

  function ensureWordEntry(wordId) {
    var id = Math.floor(Number(wordId));
    if (!Number.isFinite(id) || id <= 0) return null;
    if (!state.words[id]) {
      state.words[id] = {
        box: 0,
        correctCount: 0,
        wrongCount: 0,
        consecutiveCorrect: 0,
        pinned: false,
        inWrongNote: false,
        lastSeen: null,
        lastWrongAt: null
      };
    }
    return state.words[id];
  }

  // ===========================================================================
  // 7. Leitner Mastery (Box 0~3), Pin, Wrong Note & Revenge Selection
  // ===========================================================================
  function getWordProgress(wordOrId) {
    var id = extractWordId(wordOrId);
    if (!Number.isFinite(id) || id <= 0) {
      return {
        wordId: 0,
        box: 0,
        status: 'unseen',
        correctCount: 0,
        wrongCount: 0,
        consecutiveCorrect: 0,
        pinned: false,
        inWrongNote: false,
        lastSeen: null
      };
    }
    var w = state.words[id];
    if (!w) {
      return {
        wordId: id,
        box: 0,
        status: 'unseen',
        correctCount: 0,
        wrongCount: 0,
        consecutiveCorrect: 0,
        pinned: false,
        inWrongNote: false,
        lastSeen: null
      };
    }
    return {
      wordId: id,
      box: w.box,
      status: boxToStatus(w.box),
      correctCount: w.correctCount,
      wrongCount: w.wrongCount,
      consecutiveCorrect: w.consecutiveCorrect || 0,
      pinned: Boolean(w.pinned),
      inWrongNote: Boolean(w.inWrongNote),
      lastSeen: w.lastSeen || null
    };
  }

  function recordAttempt(wordOrId, isCorrect, meta) {
    var opts = meta && typeof meta === 'object' ? meta : {};
    var id = extractWordId(wordOrId);
    if (!Number.isFinite(id) || id <= 0) {
      return {
        wordId: 0,
        prevBox: 0,
        newBox: 0,
        box: 0,
        status: 'unseen',
        inWrongNote: false,
        unlockedBadges: []
      };
    }

    var entry = ensureWordEntry(id);
    var prevBox = entry.box;
    var wasInWrongNote = Boolean(entry.inWrongNote);
    var now = Date.now();
    entry.lastSeen = now;

    if (isCorrect) {
      entry.correctCount += 1;
      entry.consecutiveCorrect = (entry.consecutiveCorrect || 0) + 1;

      if (opts.usedHint) {
        entry.box = Math.max(1, prevBox);
      } else {
        entry.box = Math.min(3, prevBox + 1);
      }

      if (entry.inWrongNote && (entry.box >= 3 || (!opts.usedHint && entry.consecutiveCorrect >= 2))) {
        entry.inWrongNote = false;
      }

      if (opts.isPinned || entry.pinned) {
        state.stats.pinnedCorrectCount += 1;
      }
      if (opts.isRevenge || wasInWrongNote) {
        state.stats.revengeCorrectCount += 1;
      }
    } else {
      entry.wrongCount += 1;
      entry.consecutiveCorrect = 0;
      entry.box = 1;
      entry.inWrongNote = true;
      entry.lastWrongAt = now;
    }

    touchDailyStudy(1);
    var unlockedBadges = evaluateBadges();
    saveState();

    return {
      wordId: id,
      prevBox: prevBox,
      newBox: entry.box,
      box: entry.box,
      status: boxToStatus(entry.box),
      correctCount: entry.correctCount,
      wrongCount: entry.wrongCount,
      consecutiveCorrect: entry.consecutiveCorrect,
      pinned: Boolean(entry.pinned),
      inWrongNote: Boolean(entry.inWrongNote),
      unlockedBadges: unlockedBadges
    };
  }

  function getMasteryStats() {
    var total = getTotalWordsCount();
    var totalRounds = getTotalRoundsCount();

    var box1 = 0;
    var box2 = 0;
    var mastered = 0;
    var pinnedCount = 0;
    var wrongNoteCount = 0;

    Object.keys(state.words).forEach(function (k) {
      var id = Number(k);
      if (!Number.isFinite(id) || id < 1 || id > total) return;
      var w = state.words[k];
      if (!w) return;
      if (w.box === 1) box1 += 1;
      else if (w.box === 2) box2 += 1;
      else if (w.box >= 3) mastered += 1;

      if (w.pinned) pinnedCount += 1;
      if (w.inWrongNote) wrongNoteCount += 1;
    });

    var learning = box1 + box2;
    var unseen = Math.max(0, total - learning - mastered);

    var clearedRoundsCount = 0;
    var totalStars = 0;
    Object.keys(state.rounds).forEach(function (r) {
      var rNum = Number(r);
      if (!Number.isFinite(rNum) || rNum < 1 || rNum > totalRounds) return;
      var rec = state.rounds[r];
      if (rec && rec.cleared) {
        clearedRoundsCount += 1;
        totalStars += Number(rec.stars) || 0;
      }
    });

    return {
      total: total,
      totalRounds: totalRounds,
      unseen: unseen,
      learning: learning,
      box1: box1,
      box2: box2,
      mastered: mastered,
      pinnedCount: pinnedCount,
      wrongNoteCount: wrongNoteCount,
      clearedRoundsCount: clearedRoundsCount,
      totalStars: totalStars,
      maxStars: totalRounds * 3,
      totalScore: state.stats.totalScore,
      bestCombo: state.stats.bestCombo,
      streakDays: state.stats.streakDays,
      bestStreakDays: state.stats.bestStreakDays,
      todayStudiedWords: state.stats.todayStudiedCount,
      survivalBestScore: state.stats.survivalBestScore,
      unlockedBadgesCount: Object.keys(state.badges).length,
      totalBadgesCount: BADGE_DEFINITIONS.length
    };
  }

  function togglePin(wordOrId, forceState) {
    var id = extractWordId(wordOrId);
    if (!Number.isFinite(id) || id <= 0) return false;
    var entry = ensureWordEntry(id);
    entry.pinned = typeof forceState === 'boolean' ? forceState : !entry.pinned;
    saveState();
    return Boolean(entry.pinned);
  }

  function isPinned(wordOrId) {
    var id = extractWordId(wordOrId);
    if (!Number.isFinite(id) || id <= 0) return false;
    return Boolean(state.words[id] && state.words[id].pinned);
  }

  function getPinnedWordIds() {
    var total = getTotalWordsCount();
    var ids = [];
    Object.keys(state.words).forEach(function (k) {
      var id = Number(k);
      if (Number.isFinite(id) && id >= 1 && id <= total && state.words[k] && state.words[k].pinned) {
        ids.push(id);
      }
    });
    ids.sort(function (a, b) {
      return a - b;
    });
    return ids;
  }

  function getPinnedWords(limit) {
    var ids = getPinnedWordIds();
    var list = [];
    for (var i = 0; i < ids.length; i++) {
      var w = resolveWord(ids[i]);
      if (w) list.push(w);
      if (Number.isFinite(limit) && limit > 0 && list.length >= limit) break;
    }
    return list;
  }

  function getWrongWordIds() {
    var total = getTotalWordsCount();
    var entries = [];
    Object.keys(state.words).forEach(function (k) {
      var id = Number(k);
      var w = state.words[k];
      if (Number.isFinite(id) && id >= 1 && id <= total && w && w.inWrongNote) {
        entries.push({ id: id, data: w });
      }
    });

    entries.sort(function (a, b) {
      if (a.data.box !== b.data.box) return a.data.box - b.data.box;
      if (b.data.wrongCount !== a.data.wrongCount) return b.data.wrongCount - a.data.wrongCount;
      return (b.data.lastWrongAt || 0) - (a.data.lastWrongAt || 0);
    });

    return entries.map(function (item) {
      return item.id;
    });
  }

  function getWrongWords(limit) {
    var ids = getWrongWordIds();
    var list = [];
    for (var i = 0; i < ids.length; i++) {
      var w = resolveWord(ids[i]);
      if (w) list.push(w);
      if (Number.isFinite(limit) && limit > 0 && list.length >= limit) break;
    }
    return list;
  }

  function clearWrongWord(wordOrId) {
    var id = extractWordId(wordOrId);
    if (!Number.isFinite(id) || !state.words[id]) return false;
    state.words[id].inWrongNote = false;
    saveState();
    return true;
  }

  function getRevengeWords(currentRound, count) {
    var maxCount = Number.isFinite(Number(count)) && Number(count) > 0 ? Math.floor(Number(count)) : 2;
    var excludeRound = Number.isFinite(Number(currentRound)) && Number(currentRound) > 0
      ? Math.floor(Number(currentRound))
      : null;

    var candidates = [];
    var total = getTotalWordsCount();

    Object.keys(state.words).forEach(function (k) {
      var id = Number(k);
      var entry = state.words[k];
      if (!Number.isFinite(id) || id < 1 || id > total || !entry) return;
      var isWeak = entry.inWrongNote || entry.pinned || entry.box === 1;
      if (!isWeak) return;

      var wordObj = resolveWord(id);
      if (!wordObj) return;
      if (excludeRound !== null && Number(wordObj.round) === excludeRound) return;

      var priorityScore = 0;
      if (entry.inWrongNote && entry.pinned) priorityScore = 400;
      else if (entry.inWrongNote) priorityScore = 300;
      else if (entry.pinned) priorityScore = 200;
      else if (entry.box === 1) priorityScore = 100;

      priorityScore += Math.min(50, (entry.wrongCount || 0) * 8);

      candidates.push({
        word: wordObj,
        priority: priorityScore,
        lastSeen: entry.lastSeen || 0
      });
    });

    candidates.sort(function (a, b) {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.lastSeen - b.lastSeen;
    });

    return candidates.slice(0, maxCount).map(function (c) {
      return c.word;
    });
  }

  // ===========================================================================
  // 8. 3-Stage Japanese Smart Hint Generator (Generation Effect)
  // ===========================================================================
  function extractKoInitials(meaningStr) {
    if (!meaningStr || typeof meaningStr !== 'string') return '';
    var primary = meaningStr
      .replace(/\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .split(/[,;/]/)[0]
      .replace(/~/g, '')
      .trim();

    var out = '';
    for (var i = 0; i < primary.length; i++) {
      var code = primary.charCodeAt(i);
      if (code >= 0xac00 && code <= 0xd7a3) {
        var choseongIdx = Math.floor((code - 0xac00) / 588);
        out += CHOSEONG_LIST[choseongIdx] || '';
      } else if (primary[i] === ' ') {
        out += ' ';
      }
    }
    return out.replace(/\s+/g, ' ').trim();
  }

  function buildKanaSkeleton(kanaStr) {
    if (!kanaStr || typeof kanaStr !== 'string') return '';
    var morae = splitMorae(kanaStr);
    if (morae.length === 0) return '';
    if (morae.length === 1) return morae[0];

    var tokens = [morae[0]];
    for (var i = 1; i < morae.length; i++) {
      if (morae[i] === 'ー') tokens.push('ー');
      else if (morae[i] === 'っ' || morae[i] === 'ッ') tokens.push('っ');
      else tokens.push('◯');
    }
    return tokens.join(' ');
  }

  function buildClozeExample(wordObj, mask) {
    var maskToken = typeof mask === 'string' && mask ? mask : '［　　］';
    if (!wordObj) return '';
    if (N5App.WordBank && typeof N5App.WordBank.getBlankExample === 'function') {
      var fromBank = N5App.WordBank.getBlankExample(wordObj, maskToken);
      if (fromBank && fromBank.indexOf(maskToken) !== -1) {
        return fromBank;
      }
    }
    var ex = wordObj.example || '';
    if (!ex) return '';

    var expr = wordObj.expression || wordObj.kanji || '';
    var kana = wordObj.kana || '';
    if (expr && ex.indexOf(expr) !== -1) {
      return ex.split(expr).join(maskToken);
    }
    if (kana && ex.indexOf(kana) !== -1) {
      return ex.split(kana).join(maskToken);
    }
    // Verb/adjective stem fallback (strip final kana ending when Kanji stem is present)
    if (expr && expr.length >= 2 && /[\u4E00-\u9FFF]/.test(expr)) {
      var kanjiStem = expr.replace(/[\u3040-\u309F]+$/, '');
      if (kanjiStem && ex.indexOf(kanjiStem) !== -1) {
        return ex.replace(kanjiStem, maskToken);
      }
    }
    return ex + ' ' + maskToken;
  }

  function getHint(wordOrId, stage) {
    var wordObj = resolveWord(wordOrId);
    var stg = Math.max(1, Math.min(3, Math.floor(Number(stage) || 1)));

    if (!wordObj) {
      return {
        stage: stg,
        firstKana: '',
        moraCount: 0,
        kanaSkeleton: '',
        enSkeleton: '',
        koInitials: '',
        clozeExample: '',
        koPron: '',
        romaji: '',
        kana: '',
        phonetic: '',
        tip: '',
        emoji: '💡',
        text: '힌트를 불러올 수 없습니다.'
      };
    }

    var kana = wordObj.kana || wordObj.expression || '';
    var morae = splitMorae(kana);
    var firstKana = morae.length > 0 ? morae[0] : '';
    var moraCount = morae.length;
    var skeleton = buildKanaSkeleton(kana);
    var initials = extractKoInitials(wordObj.meaning);
    var cloze = buildClozeExample(wordObj, '［　　］');
    var emoji = wordObj.emoji || '💡';
    var tip = wordObj.tip || '';
    var koPron = wordObj.koPron || '';
    var romaji = wordObj.romaji || toRomaji(kana);
    var pos = wordObj.pos || '';
    var phoneticCompat = koPron ? koPron + ' (' + romaji + ')' : romaji;

    if (stg === 1) {
      return {
        stage: 1,
        firstKana: firstKana,
        moraCount: moraCount,
        length: moraCount,
        kanaSkeleton: skeleton,
        enSkeleton: skeleton,
        koInitials: initials,
        pos: pos,
        hasKanji: Boolean(wordObj.kanji),
        text: '가나 뼈대: ' + skeleton + ' (' + moraCount + '박' +
          (pos ? ', ' + pos : '') + ') · 뜻 초성: ' + initials
      };
    }

    if (stg === 2) {
      return {
        stage: 2,
        clozeExample: cloze,
        exampleReading: wordObj.exampleReading || '',
        exampleKo: wordObj.exampleKo || '',
        tip: tip,
        emoji: emoji,
        text: emoji + ' ' + (tip ? tip + ' | ' : '') + '예문: ' + cloze +
          (wordObj.exampleKo ? ' (' + wordObj.exampleKo + ')' : '')
      };
    }

    return {
      stage: 3,
      koPron: koPron,
      romaji: romaji,
      kana: kana,
      rubyHtml: wordObj.rubyHtml || wordObj.expression || kana,
      phonetic: phoneticCompat,
      tip: tip,
      emoji: emoji,
      kanaSkeleton: skeleton,
      koInitials: initials,
      ttsRate: 0.78,
      text: '🔊 발음 가이드: ' + (koPron ? '[' + koPron + '] ' : '') + '(' + romaji + ')' +
        (tip ? ' · ' + tip : '')
    };
  }

  // ===========================================================================
  // 9. Round Records, 14 JLPT N5 Achievements, Settings & Codex Helper
  // ===========================================================================
  function rankToDefaultStars(rank) {
    if (rank === 'S+' || rank === 'S') return 3;
    if (rank === 'A') return 2;
    if (rank === 'B' || rank === 'C') return 1;
    return 0;
  }

  function pickHigherRank(rankA, rankB) {
    var wA = rankA && RANK_WEIGHT[rankA] ? RANK_WEIGHT[rankA] : 0;
    var wB = rankB && RANK_WEIGHT[rankB] ? RANK_WEIGHT[rankB] : 0;
    if (wB >= wA) return rankB || rankA || null;
    return rankA || null;
  }

  function getRoundRecord(round) {
    var totalRounds = getTotalRoundsCount();
    var r = Math.max(1, Math.min(totalRounds, Math.floor(Number(round) || 1)));
    var rec = state.rounds[r];
    if (!rec) {
      return {
        round: r,
        cleared: false,
        bestScore: 0,
        bestRank: null,
        stars: 0,
        playCount: 0,
        bestCombo: 0,
        bestAccuracy: 0,
        lastPlayedAt: null
      };
    }
    return Object.assign({}, rec);
  }

  function getAllRoundRecords() {
    var totalRounds = getTotalRoundsCount();
    var all = {};
    for (var r = 1; r <= totalRounds; r++) {
      all[r] = getRoundRecord(r);
    }
    return all;
  }

  function evaluateBadges() {
    var newlyUnlocked = [];
    var statsSnap = getMasteryStats();
    var now = Date.now();

    function tryUnlock(badgeId, condition) {
      if (condition && !state.badges[badgeId]) {
        state.badges[badgeId] = now;
        var def = BADGE_DEFINITIONS.find(function (b) {
          return b.id === badgeId;
        });
        if (def) {
          newlyUnlocked.push({
            id: def.id,
            name: def.name,
            desc: def.desc,
            icon: def.icon,
            unlocked: true,
            unlockedAt: now
          });
        }
      }
    }

    tryUnlock('first_round', state.stats.totalRoundsPlayed >= 1 || statsSnap.clearedRoundsCount >= 1);
    tryUnlock('perfect_round', state.stats.perfectRoundCount >= 1);
    tryUnlock('early_bird', state.stats.earlyBirdSRankCount >= 1);
    tryUnlock('pin_sniper', state.stats.pinnedCorrectCount >= 10);
    tryUnlock('revenge_hunter', state.stats.revengeCorrectCount >= 10);
    tryUnlock('combo_15', state.stats.bestCombo >= 15);
    tryUnlock('combo_30', state.stats.bestCombo >= 30);
    tryUnlock('streak_3', state.stats.bestStreakDays >= 3 || state.stats.streakDays >= 3);
    tryUnlock('streak_7', state.stats.bestStreakDays >= 7 || state.stats.streakDays >= 7);
    tryUnlock('master_50', statsSnap.mastered >= 50);
    tryUnlock('master_200', statsSnap.mastered >= 200);
    tryUnlock('master_500', statsSnap.mastered >= statsSnap.total);

    var lv1Rounds = getLv1RoundNumbers();
    var lv1AllCleared = lv1Rounds.length > 0;
    for (var i = 0; i < lv1Rounds.length; i++) {
      var rNum = lv1Rounds[i];
      if (!state.rounds[rNum] || !state.rounds[rNum].cleared) {
        lv1AllCleared = false;
        break;
      }
    }
    tryUnlock('campaign_lv1', lv1AllCleared);
    tryUnlock('campaign_all', statsSnap.clearedRoundsCount >= statsSnap.totalRounds);

    return newlyUnlocked;
  }

  function recordRoundClear(resultSummary) {
    var sum = resultSummary && typeof resultSummary === 'object' ? resultSummary : {};
    var totalRounds = getTotalRoundsCount();
    var mode = sum.mode || 'campaign';
    var roundNum = Math.max(1, Math.min(totalRounds, Math.floor(Number(sum.round) || 1)));
    var score = Math.max(0, Math.floor(Number(sum.score) || 0));
    var rank = sum.rank && RANK_WEIGHT[sum.rank] ? sum.rank : 'B';
    var stars = Number.isFinite(Number(sum.stars))
      ? Math.max(0, Math.min(3, Math.floor(Number(sum.stars))))
      : rankToDefaultStars(rank);
    var maxCombo = Math.max(0, Math.floor(Number(sum.maxCombo) || 0));
    var accuracy = Math.max(0, Math.min(100, Number(sum.accuracy) || 0));
    var correctCount = Math.max(0, Math.floor(Number(sum.correctCount) || 0));
    var totalQuestions = Math.max(0, Math.floor(Number(sum.totalQuestions) || 0));
    var earlyBonusPoints = Math.max(0, Math.floor(Number(sum.earlyBonusPoints) || 0));
    var revengeClearedCount = Math.max(0, Math.floor(Number(sum.revengeClearedCount) || 0));

    state.stats.totalScore += score;
    state.stats.totalRoundsPlayed += 1;
    if (maxCombo > state.stats.bestCombo) {
      state.stats.bestCombo = maxCombo;
    }
    if (revengeClearedCount > 0) {
      state.stats.revengeCorrectCount += revengeClearedCount;
    }
    if (earlyBonusPoints > 0 && (rank === 'S+' || rank === 'S')) {
      state.stats.earlyBirdSRankCount += 1;
    }
    if (rank === 'S+' || accuracy >= 100 || (totalQuestions > 0 && correctCount >= totalQuestions)) {
      state.stats.perfectRoundCount += 1;
    }

    var prevBestScore = 0;
    var isNewBest = false;
    var roundRecord = getRoundRecord(roundNum);

    if (mode === 'survival') {
      prevBestScore = state.stats.survivalBestScore || 0;
      isNewBest = score > prevBestScore;
      if (isNewBest) {
        state.stats.survivalBestScore = score;
      }
    } else if (mode === 'campaign') {
      var existing = state.rounds[roundNum];
      prevBestScore = existing ? existing.bestScore || 0 : 0;
      isNewBest = !existing || !existing.cleared || score > prevBestScore;

      state.rounds[roundNum] = {
        round: roundNum,
        cleared: true,
        bestScore: Math.max(prevBestScore, score),
        bestRank: pickHigherRank(existing ? existing.bestRank : null, rank),
        stars: Math.max(existing ? existing.stars || 0 : 0, stars),
        playCount: (existing ? existing.playCount || 0 : 0) + 1,
        bestCombo: Math.max(existing ? existing.bestCombo || 0 : 0, maxCombo),
        bestAccuracy: Math.max(existing ? existing.bestAccuracy || 0 : 0, accuracy),
        lastPlayedAt: Date.now()
      };
      roundRecord = getRoundRecord(roundNum);
    } else {
      isNewBest = score > 0;
    }

    touchDailyStudy(Math.max(1, correctCount));
    var unlockedBadges = evaluateBadges();
    saveState();

    return {
      isNewBest: isNewBest,
      prevBestScore: prevBestScore,
      roundRecord: roundRecord,
      unlockedBadges: unlockedBadges
    };
  }

  function getBadges() {
    return BADGE_DEFINITIONS.map(function (def) {
      var ts = state.badges[def.id] || null;
      return {
        id: def.id,
        name: def.name,
        desc: def.desc,
        icon: def.icon,
        unlocked: Boolean(ts),
        unlockedAt: ts
      };
    });
  }

  function getSettings() {
    return Object.assign({}, state.settings);
  }

  function updateSettings(partial) {
    if (!partial || typeof partial !== 'object') {
      return getSettings();
    }
    if (partial.theme != null) {
      var normTheme = normalizeTheme(partial.theme);
      if (normTheme) {
        state.settings.theme = normTheme;
      }
    }
    if (partial.memorizeSec != null) {
      var sec = Number(partial.memorizeSec);
      if (sec === 30 || sec === 45 || sec === 60) {
        state.settings.memorizeSec = sec;
      }
    }
    if (typeof partial.muted === 'boolean') {
      state.settings.muted = partial.muted;
      if (partial.muted) {
        tts.stop();
      }
    }
    if (typeof partial.ttsEnabled === 'boolean') {
      state.settings.ttsEnabled = partial.ttsEnabled;
      if (!partial.ttsEnabled) {
        tts.stop();
      }
    }
    if (typeof partial.ttsLang === 'string' && partial.ttsLang) {
      state.settings.ttsLang = partial.ttsLang;
    }
    if (partial.ttsSpeedMode === 'slow' || partial.ttsSpeedMode === 'normal') {
      state.settings.ttsSpeedMode = partial.ttsSpeedMode;
      state.settings.ttsRate = partial.ttsSpeedMode === 'slow' ? 0.78 : 1.0;
    }
    if (partial.ttsRate != null && Number.isFinite(Number(partial.ttsRate))) {
      var r = Math.max(0.5, Math.min(1.5, Number(partial.ttsRate)));
      state.settings.ttsRate = r;
      state.settings.ttsSpeedMode = r <= 0.85 ? 'slow' : 'normal';
    }
    if (partial.sfxVolume != null && Number.isFinite(Number(partial.sfxVolume))) {
      state.settings.sfxVolume = Math.max(0, Math.min(1, Number(partial.sfxVolume)));
    }
    saveState();
    return getSettings();
  }

  function resetProgress(options) {
    var opts = options && typeof options === 'object' ? options : {};
    var keepSettings = opts.resetSettings ? null : state.settings;
    state = createDefaultState(keepSettings);
    saveState();
    return getMasteryStats();
  }

  function getWordsForCodex(options) {
    var opts = options && typeof options === 'object' ? options : {};
    var statusFilter = opts.status || 'all'; // 'all' | 'unseen' | 'learning' | 'mastered' | 'pinned' | 'wrong'
    var query = typeof opts.query === 'string' ? opts.query.trim() : '';
    var levelFilter = opts.level && opts.level !== 'all' ? Number(opts.level) : null;
    var roundFilter = opts.round && opts.round !== 'all' ? Number(opts.round) : null;
    var posFilter = opts.pos && opts.pos !== 'all' ? String(opts.pos).trim() : null;

    var allWords = getWordsArray();
    var results = [];

    for (var i = 0; i < allWords.length; i++) {
      var w = allWords[i];
      if (!w) continue;
      if (levelFilter && Number(w.level) !== levelFilter) continue;
      if (roundFilter && Number(w.round) !== roundFilter) continue;
      if (posFilter && w.pos !== posFilter) continue;

      var prog = getWordProgress(w.id);
      if (statusFilter === 'unseen' && prog.status !== 'unseen') continue;
      if (statusFilter === 'learning' && prog.status !== 'learning') continue;
      if (statusFilter === 'mastered' && prog.status !== 'mastered') continue;
      if (statusFilter === 'pinned' && !prog.pinned) continue;
      if (statusFilter === 'wrong' && !prog.inWrongNote) continue;

      if (query && !matchesQuery(w, query)) continue;

      results.push({
        word: w,
        progress: prog
      });
    }
    return results;
  }

  // ===========================================================================
  // 10. Zero-Asset Web Audio Japanese Sakura-Crystal Synthesizer (sfx)
  // ===========================================================================
  var audioCtx = null;
  var masterGain = null;

  function ensureAudioContext() {
    if (state.settings.muted) return null;
    try {
      if (!audioCtx) {
        var CtxClass = root.AudioContext || root.webkitAudioContext;
        if (typeof CtxClass !== 'function') return null;
        audioCtx = new CtxClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = state.settings.sfxVolume || 0.72;

        if (typeof audioCtx.createDynamicsCompressor === 'function') {
          var compressor = audioCtx.createDynamicsCompressor();
          compressor.threshold.value = -14;
          compressor.knee.value = 18;
          compressor.ratio.value = 6;
          compressor.attack.value = 0.003;
          compressor.release.value = 0.15;
          masterGain.connect(compressor);
          compressor.connect(audioCtx.destination);
        } else {
          masterGain.connect(audioCtx.destination);
        }
      }

      if (audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
        var resumePromise = audioCtx.resume();
        if (resumePromise && typeof resumePromise.catch === 'function') {
          resumePromise.catch(function () {});
        }
      }
      if (masterGain) {
        masterGain.gain.value = state.settings.muted ? 0 : (state.settings.sfxVolume || 0.72);
      }
      return audioCtx;
    } catch (_) {
      return null;
    }
  }

  function playTone(ctx, opts) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var start = opts.start != null ? opts.start : ctx.currentTime;
    var dur = opts.duration || 0.12;
    var peak = opts.gain != null ? opts.gain : 0.18;
    var attack = opts.attack != null ? opts.attack : 0.007;

    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.freq || 440, start);
    if (opts.endFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.endFreq), start + dur);
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + Math.min(attack, dur * 0.4));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(gain);
    gain.connect(masterGain || ctx.destination);

    osc.start(start);
    osc.stop(start + dur + 0.015);
  }

  var sfx = {
    unlock: function () {
      return Boolean(ensureAudioContext());
    },

    isMuted: function () {
      return Boolean(state.settings.muted);
    },

    setMuted: function (mutedBool) {
      updateSettings({ muted: Boolean(mutedBool) });
      if (masterGain && audioCtx) {
        try {
          masterGain.gain.setValueAtTime(
            state.settings.muted ? 0 : (state.settings.sfxVolume || 0.72),
            audioCtx.currentTime
          );
        } catch (_) {}
      }
      return state.settings.muted;
    },

    toggleMute: function () {
      return sfx.setMuted(!state.settings.muted);
    },

    flip: function () {
      if (state.settings.muted) return false;
      try {
        var ctx = ensureAudioContext();
        if (!ctx) return false;
        var t = ctx.currentTime;
        // Washi-crystal card glide (D5 -> A5 + delicate furin overtone)
        playTone(ctx, { type: 'sine', freq: 587.33, endFreq: 1174.66, start: t, duration: 0.068, gain: 0.11 });
        playTone(ctx, { type: 'triangle', freq: 880, endFreq: 1318.51, start: t + 0.014, duration: 0.055, gain: 0.07 });
        return true;
      } catch (_) {
        return false;
      }
    },

    click: function () {
      if (state.settings.muted) return false;
      try {
        var ctx = ensureAudioContext();
        if (!ctx) return false;
        playTone(ctx, { type: 'sine', freq: 987.77, endFreq: 1318.51, duration: 0.036, gain: 0.09 });
        return true;
      } catch (_) {
        return false;
      }
    },

    shardTap: function (stepIndex) {
      if (state.settings.muted) return false;
      try {
        var ctx = ensureAudioContext();
        if (!ctx) return false;
        var t = ctx.currentTime;
        // Japanese Yo-scale pentatonic crystal chime (D5, E5, G5, A5, B5, D6, E6)
        var yoScale = [587.33, 659.25, 783.99, 880.0, 987.77, 1174.66, 1318.51];
        var idx = Math.max(0, Math.floor(Number(stepIndex) || 0)) % yoScale.length;
        var f = yoScale[idx];
        playTone(ctx, { type: 'triangle', freq: f, start: t, duration: 0.11, gain: 0.13 });
        playTone(ctx, { type: 'sine', freq: f * 2, start: t + 0.008, duration: 0.08, gain: 0.05 });
        return true;
      } catch (_) {
        return false;
      }
    },

    correct: function () {
      if (state.settings.muted) return false;
      try {
        var ctx = ensureAudioContext();
        if (!ctx) return false;
        var t = ctx.currentTime;
        // Yonanuki major pentatonic sakura wind-chime (C5 - D5 - E5 - G5 - A5 - C6)
        var notes = [523.25, 659.25, 783.99, 880.0, 1046.5];
        for (var i = 0; i < notes.length; i++) {
          playTone(ctx, {
            type: 'triangle',
            freq: notes[i],
            start: t + i * 0.035,
            duration: 0.19,
            gain: 0.135
          });
          playTone(ctx, {
            type: 'sine',
            freq: notes[i] * 2,
            start: t + i * 0.035,
            duration: 0.13,
            gain: 0.042
          });
        }
        return true;
      } catch (_) {
        return false;
      }
    },

    combo: function (comboCount) {
      if (state.settings.muted) return false;
      try {
        var ctx = ensureAudioContext();
        if (!ctx) return false;
        var t = ctx.currentTime;
        var step = Math.max(0, Math.min(16, Math.floor(Number(comboCount) || 1) - 1));
        var rootFreq = 523.25 * Math.pow(2, step / 12);
        // Pentatonic fourth + fifth koto harmonic interval
        playTone(ctx, { type: 'triangle', freq: rootFreq, start: t, duration: 0.15, gain: 0.14 });
        playTone(ctx, { type: 'sine', freq: rootFreq * 1.2599, start: t + 0.028, duration: 0.17, gain: 0.12 });
        playTone(ctx, { type: 'sine', freq: rootFreq * 1.4983, start: t + 0.056, duration: 0.22, gain: 0.14 });
        return true;
      } catch (_) {
        return false;
      }
    },

    pinBonus: function () {
      if (state.settings.muted) return false;
      try {
        var ctx = ensureAudioContext();
        if (!ctx) return false;
        var t = ctx.currentTime;
        // Golden Kyoto Furin jackpot arpeggio (D5 - F#5 - A5 - B5 - D6 - F#6)
        var bells = [587.33, 739.99, 880.0, 987.77, 1174.66, 1479.98];
        for (var i = 0; i < bells.length; i++) {
          playTone(ctx, {
            type: 'sine',
            freq: bells[i],
            start: t + i * 0.038,
            duration: 0.25,
            gain: 0.135
          });
          playTone(ctx, {
            type: 'triangle',
            freq: bells[i] * 0.5,
            start: t + i * 0.038,
            duration: 0.21,
            gain: 0.075
          });
        }
        return true;
      } catch (_) {
        return false;
      }
    },

    fever: function () {
      if (state.settings.muted) return false;
      try {
        var ctx = ensureAudioContext();
        if (!ctx) return false;
        var t = ctx.currentTime;
        // SAKURA FEVER koto-glissando synth sweep
        var sweep = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1318.51, 1567.98];
        for (var i = 0; i < sweep.length; i++) {
          playTone(ctx, {
            type: 'sawtooth',
            freq: sweep[i] * 0.5,
            endFreq: sweep[i],
            start: t + i * 0.036,
            duration: 0.3,
            gain: 0.065
          });
          playTone(ctx, {
            type: 'triangle',
            freq: sweep[i],
            start: t + i * 0.036,
            duration: 0.34,
            gain: 0.115
          });
        }
        return true;
      } catch (_) {
        return false;
      }
    },

    wrong: function () {
      if (state.settings.muted) return false;
      try {
        var ctx = ensureAudioContext();
        if (!ctx) return false;
        var t = ctx.currentTime;
        playTone(ctx, { type: 'triangle', freq: 220, endFreq: 146.83, start: t, duration: 0.21, gain: 0.19 });
        playTone(ctx, { type: 'sine', freq: 196, endFreq: 130.81, start: t + 0.048, duration: 0.23, gain: 0.15 });
        return true;
      } catch (_) {
        return false;
      }
    },

    shieldBreak: function () {
      if (state.settings.muted) return false;
      try {
        var ctx = ensureAudioContext();
        if (!ctx) return false;
        var t = ctx.currentTime;
        var shards = [1760, 1318.51, 1174.66, 880.0, 659.25];
        for (var i = 0; i < shards.length; i++) {
          playTone(ctx, {
            type: 'sine',
            freq: shards[i],
            endFreq: shards[i] * 0.84,
            start: t + i * 0.028,
            duration: 0.14,
            gain: 0.12
          });
        }
        return true;
      } catch (_) {
        return false;
      }
    },

    hint: function () {
      if (state.settings.muted) return false;
      try {
        var ctx = ensureAudioContext();
        if (!ctx) return false;
        var t = ctx.currentTime;
        playTone(ctx, { type: 'sine', freq: 1174.66, start: t, duration: 0.15, gain: 0.11 });
        playTone(ctx, { type: 'sine', freq: 1760.0, start: t + 0.055, duration: 0.22, gain: 0.11 });
        return true;
      } catch (_) {
        return false;
      }
    },

    tick: function (urgent) {
      if (state.settings.muted) return false;
      try {
        var ctx = ensureAudioContext();
        if (!ctx) return false;
        var t = ctx.currentTime;
        if (urgent) {
          playTone(ctx, { type: 'triangle', freq: 1318.51, endFreq: 880, start: t, duration: 0.045, gain: 0.125 });
          playTone(ctx, { type: 'sine', freq: 1760, start: t + 0.052, duration: 0.035, gain: 0.08 });
        } else {
          playTone(ctx, { type: 'sine', freq: 1046.5, endFreq: 783.99, start: t, duration: 0.03, gain: 0.075 });
        }
        return true;
      } catch (_) {
        return false;
      }
    },

    roundStart: function () {
      if (state.settings.muted) return false;
      try {
        var ctx = ensureAudioContext();
        if (!ctx) return false;
        var t = ctx.currentTime;
        var launch = [440, 587.33, 659.25, 880];
        for (var i = 0; i < launch.length; i++) {
          playTone(ctx, {
            type: 'triangle',
            freq: launch[i],
            start: t + i * 0.042,
            duration: 0.18,
            gain: 0.13
          });
        }
        return true;
      } catch (_) {
        return false;
      }
    },

    roundClear: function () {
      if (state.settings.muted) return false;
      try {
        var ctx = ensureAudioContext();
        if (!ctx) return false;
        var t = ctx.currentTime;
        // Matsuri Sakura Fanfare (C5 - D5 - E5 - G5 - A5 - C6 + warm add9 chord)
        var melody = [
          { f: 523.25, s: 0.0, d: 0.11 },
          { f: 587.33, s: 0.09, d: 0.11 },
          { f: 659.25, s: 0.18, d: 0.11 },
          { f: 880.0, s: 0.27, d: 0.12 },
          { f: 1046.5, s: 0.38, d: 0.56 }
        ];
        for (var i = 0; i < melody.length; i++) {
          playTone(ctx, {
            type: 'triangle',
            freq: melody[i].f,
            start: t + melody[i].s,
            duration: melody[i].d,
            gain: 0.155
          });
        }
        var chord = [523.25, 659.25, 783.99, 880.0, 1174.66];
        for (var j = 0; j < chord.length; j++) {
          playTone(ctx, {
            type: 'sine',
            freq: chord[j],
            start: t + 0.38,
            duration: 0.62,
            gain: 0.095
          });
        }
        return true;
      } catch (_) {
        return false;
      }
    },

    play: function (type, param) {
      switch (type) {
        case 'flip':
          return sfx.flip();
        case 'click':
        case 'tap':
          return sfx.click();
        case 'shardTap':
        case 'shard':
        case 'kanaTap':
          return sfx.shardTap(param);
        case 'correct':
          return sfx.correct();
        case 'combo':
          return sfx.combo(param);
        case 'pinBonus':
        case 'revengeClear':
        case 'bossClear':
          return sfx.pinBonus();
        case 'fever':
          return sfx.fever();
        case 'wrong':
          return sfx.wrong();
        case 'shieldBreak':
          return sfx.shieldBreak();
        case 'hint':
          return sfx.hint();
        case 'tick':
          return sfx.tick(Boolean(param));
        case 'urgentTick':
          return sfx.tick(true);
        case 'earlyStart':
        case 'roundStart':
        case 'waveStart':
          return sfx.roundStart();
        case 'roundClear':
          return sfx.roundClear();
        default:
          return sfx.click();
      }
    }
  };

  sfx.tap = sfx.click;
  sfx.revengeClear = sfx.pinBonus;
  sfx.bossClear = sfx.pinBonus;
  sfx.urgentTick = function () {
    return sfx.tick(true);
  };
  sfx.earlyStart = sfx.roundStart;
  sfx.waveStart = sfx.roundStart;

  // ===========================================================================
  // 11. Web Speech API Japanese Pronunciation Engine (LearningSystem.tts)
  // ===========================================================================
  var cachedVoices = [];

  function refreshVoices() {
    try {
      if (root.speechSynthesis && typeof root.speechSynthesis.getVoices === 'function') {
        var v = root.speechSynthesis.getVoices();
        if (Array.isArray(v) && v.length > 0) {
          cachedVoices = v;
        }
      }
    } catch (_) {}
  }

  try {
    if (root.speechSynthesis) {
      refreshVoices();
      if ('onvoiceschanged' in root.speechSynthesis && typeof root.speechSynthesis.addEventListener === 'function') {
        root.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
      }
    }
  } catch (_) {}

  function pickBestJapaneseVoice(preferredLang) {
    refreshVoices();
    if (!cachedVoices || cachedVoices.length === 0) return null;
    var targetLang = (preferredLang || state.settings.ttsLang || 'ja-JP').toLowerCase();
    var exactMatches = cachedVoices.filter(function (v) {
      return v && v.lang && v.lang.toLowerCase().replace('_', '-') === targetLang;
    });
    var pool = exactMatches.length > 0
      ? exactMatches
      : cachedVoices.filter(function (v) {
          return v && v.lang && v.lang.toLowerCase().indexOf('ja') === 0;
        });

    if (pool.length === 0) return null;

    var natural = pool.find(function (v) {
      return /natural|google|nanami|keita|kyoko|otoya|haruka|ayumi|ichiro|sayaka|ren/i.test(v.name || '');
    });
    return natural || pool[0];
  }

  var tts = {
    isSupported: function () {
      return Boolean(
        root.speechSynthesis &&
        typeof root.speechSynthesis.speak === 'function' &&
        typeof root.SpeechSynthesisUtterance === 'function'
      );
    },

    isEnabled: function () {
      return Boolean(state.settings.ttsEnabled);
    },

    setEnabled: function (enabledBool) {
      updateSettings({ ttsEnabled: Boolean(enabledBool) });
      return state.settings.ttsEnabled;
    },

    toggleEnabled: function () {
      return tts.setEnabled(!state.settings.ttsEnabled);
    },

    getLang: function () {
      return state.settings.ttsLang || 'ja-JP';
    },

    setLang: function (lang) {
      updateSettings({ ttsLang: lang || 'ja-JP' });
      return state.settings.ttsLang;
    },

    // Compatibility aliases
    getAccent: function () {
      return tts.getLang();
    },

    setAccent: function (lang) {
      return tts.setLang(lang);
    },

    getRate: function () {
      return Number(state.settings.ttsRate) || 1.0;
    },

    setRate: function (rate) {
      var r = Number(rate);
      if (!Number.isFinite(r)) r = 1.0;
      updateSettings({ ttsRate: r });
      return state.settings.ttsRate;
    },

    isSlowMode: function () {
      return tts.getRate() <= 0.85;
    },

    setSlowMode: function (slowBool) {
      return tts.setRate(slowBool ? 0.78 : 1.0);
    },

    toggleSpeed: function () {
      var nextRate = tts.isSlowMode() ? 1.0 : 0.78;
      return tts.setRate(nextRate);
    },

    toggleSpeedMode: function () {
      return tts.toggleSpeed();
    },

    stop: function () {
      try {
        if (root.speechSynthesis && typeof root.speechSynthesis.cancel === 'function') {
          root.speechSynthesis.cancel();
        }
      } catch (_) {}
    },

    speak: function (text, opts) {
      var options = opts && typeof opts === 'object' ? opts : {};
      var cleanText = typeof text === 'string' ? text.trim() : '';

      return new Promise(function (resolve) {
        if (!cleanText) {
          resolve(false);
          return;
        }
        if (!options.ignoreMute && (state.settings.muted || !state.settings.ttsEnabled)) {
          resolve(false);
          return;
        }
        if (!tts.isSupported()) {
          resolve(false);
          return;
        }

        var settled = false;
        var finish = function (ok) {
          if (settled) return;
          settled = true;
          resolve(Boolean(ok));
        };

        var guardTimer = setTimeout(function () {
          finish(false);
        }, 3500);

        try {
          root.speechSynthesis.cancel();
          var utter = new root.SpeechSynthesisUtterance(cleanText);
          var lang = options.lang || state.settings.ttsLang || 'ja-JP';
          utter.lang = lang;
          utter.rate = Number.isFinite(Number(options.rate))
            ? Math.max(0.5, Math.min(1.5, Number(options.rate)))
            : (state.settings.ttsRate || 1.0);
          utter.pitch = Number.isFinite(Number(options.pitch)) ? Number(options.pitch) : 1.02;
          utter.volume = Number.isFinite(Number(options.volume)) ? Number(options.volume) : 1.0;

          var voice = pickBestJapaneseVoice(lang);
          if (voice) {
            utter.voice = voice;
          }

          utter.onend = function () {
            clearTimeout(guardTimer);
            finish(true);
          };
          utter.onerror = function () {
            clearTimeout(guardTimer);
            finish(false);
          };

          root.speechSynthesis.speak(utter);
        } catch (_) {
          clearTimeout(guardTimer);
          finish(false);
        }
      });
    },

    speakKana: function (kanaChar, opts) {
      if (!kanaChar) return Promise.resolve(false);
      var text = typeof kanaChar === 'object' ? (kanaChar.hira || kanaChar.kata || '') : String(kanaChar);
      return tts.speak(text, opts);
    },

    speakWord: function (wordOrId, opts) {
      var options = opts && typeof opts === 'object' ? opts : {};
      if (typeof wordOrId === 'string' && !/^\d+$/.test(wordOrId.trim())) {
        var maybeWord = resolveWord(wordOrId);
        if (maybeWord) {
          var targetStr = options.preferKanji
            ? (maybeWord.expression || maybeWord.kana)
            : (maybeWord.kana || maybeWord.expression);
          return tts.speak(targetStr, options);
        }
        return tts.speak(wordOrId, options);
      }
      var w = resolveWord(wordOrId);
      if (!w) return Promise.resolve(false);
      // Speak `w.kana` by default so single-Kanji homographs (e.g. 生, 上, 下, 一日, 方) never misread
      var textToSpeak = options.preferKanji
        ? (w.expression || w.kana || w.word)
        : (w.kana || w.expression || w.word);
      if (!textToSpeak) return Promise.resolve(false);
      return tts.speak(textToSpeak, options);
    },

    speakExample: function (wordOrId, opts) {
      var w = resolveWord(wordOrId);
      if (!w || !w.example) {
        if (typeof wordOrId === 'string') return tts.speak(wordOrId, opts);
        return Promise.resolve(false);
      }
      return tts.speak(w.example, opts);
    }
  };

  // ===========================================================================
  // 12. Initialization & Public API Export
  // ===========================================================================
  function init() {
    try {
      var raw = readRawStorage(STORAGE_KEY);
      if (!raw) {
        raw = readRawStorage(LEGACY_STORAGE_KEY);
      }
      if (raw) {
        var parsed = JSON.parse(raw);
        state = sanitizeLoadedState(parsed);
      } else if (!initialized) {
        state = createDefaultState();
      }
    } catch (_) {
      state = createDefaultState();
    }

    refreshDailyStreakOnLoad();
    initialized = true;
    saveState();
    return getMasteryStats();
  }

  init();

  var LearningSystem = {
    STORAGE_KEY: STORAGE_KEY,

    // Core Lifecycle & Leitner Mastery (3.2.A)
    init: init,
    recordAttempt: recordAttempt,
    getWordProgress: getWordProgress,
    getWordMastery: getWordProgress,
    getMasteryStats: getMasteryStats,
    getWordsForCodex: getWordsForCodex,

    // Pin, Revenge, Wrong Note & 3-Stage Japanese Smart Hints (3.2.B)
    togglePin: togglePin,
    isPinned: isPinned,
    getPinnedWordIds: getPinnedWordIds,
    getPinnedWords: getPinnedWords,
    getRevengeWords: getRevengeWords,
    getWrongWordIds: getWrongWordIds,
    getWrongWords: getWrongWords,
    clearWrongWord: clearWrongWord,
    getHint: getHint,
    extractKoInitials: extractKoInitials,
    buildKanaSkeleton: buildKanaSkeleton,
    buildClozeExample: buildClozeExample,

    // Romaji Smart Bridge & Gojuon Chart Data (3.2.C)
    RomajiHelper: RomajiHelper,
    GOJUON_DATA: GOJUON_DATA,
    getGojuonData: getGojuonData,

    // Round Clear Records, 14 Achievements, Settings & Reset (3.2.D)
    recordRoundClear: recordRoundClear,
    getRoundRecord: getRoundRecord,
    getAllRoundRecords: getAllRoundRecords,
    getBadges: getBadges,
    getSettings: getSettings,
    updateSettings: updateSettings,
    resetProgress: resetProgress,

    // Unified Sakura-Crystal Audio & ja-JP Speech Engines (3.2.D)
    sfx: sfx,
    tts: tts,

    // Top-level convenience aliases
    playSfx: function (type, param) {
      return sfx.play(type, param);
    },
    speakWord: function (wordOrId, opts) {
      return tts.speakWord(wordOrId, opts);
    },
    speakKana: function (kanaChar, opts) {
      return tts.speakKana(kanaChar, opts);
    },
    speakExample: function (wordOrId, opts) {
      return tts.speakExample(wordOrId, opts);
    },
    toggleMute: function () {
      return sfx.toggleMute();
    },
    isMuted: function () {
      return sfx.isMuted();
    }
  };

  N5App.LearningSystem = LearningSystem;
  N5App.RomajiHelper = RomajiHelper;
  N5App.GOJUON_DATA = GOJUON_DATA;
})(typeof window !== 'undefined' ? window : globalThis);
