/**
 * PRISM NIHONGO N5 — Core Game Engine, 3-Wave N5 Generator & Live Romaji Bridge
 * Owned by: @n5-architect
 * Namespace: window.N5App.GameEngine
 *
 * Zero-dependency classic script compatible with file://, GitHub Pages, VM/JSDOM, and Node.js.
 * Dynamically adapts to loaded dataset length (500 JLPT N5 words / 50 rounds by default).
 */
(function (root) {
  'use strict';

  const N5App = (root.N5App = root.N5App || {});

  // ---------------------------------------------------------------------------
  // Constants & Balance Configuration
  // ---------------------------------------------------------------------------
  const CONFIG = {
    DEFAULT_TOTAL_WORDS: 500,
    DEFAULT_TOTAL_ROUNDS: 50,
    WORDS_PER_ROUND: 10,

    DEFAULT_MEMORIZE_SEC: 45,
    MIN_MEMORIZE_SEC: 5,
    MAX_MEMORIZE_SEC: 120,
    EXTEND_SEC: 15,
    MAX_EXTENSIONS: 1,
    MAX_ROUND_PINS: 3,

    TICK_INTERVAL_MS: 100,
    MAX_DELTA_MS: 500,

    TIME_LIMITS: {
      'kanji-to-kana': 11,
      'jp-to-ko': 10,
      'ko-to-jp': 11,
      'cloze': 13,
      'audio-to-ko': 12,
      'pair-match': 30,
      'kana-spelling': 20,
      'boss': 15
    },

    BASE_POINTS: {
      'multiple-choice': 100,
      'listening': 115,
      'pair-match-each': 70,
      'pair-match-clear': 130,
      'kana-spelling': 160,
      'spelling': 160,
      'boss-bonus': 200
    },

    MAX_SPEED_BONUS: 65,
    PIN_BOUNTY_MULTIPLIER: 2.0,
    REVENGE_MULTIPLIER: 1.35,

    FEVER_CHARGE_CORRECT: 20,
    FEVER_CHARGE_FAST_BONUS: 5,
    FEVER_CHARGE_PAIR: 15,
    FEVER_DURATION_MS: 12000,
    FEVER_SCORE_MULTIPLIER: 2.0,
    FEVER_TIME_DILATION: 0.7, // Timer drains 30% slower during SAKURA FEVER

    INITIAL_SHIELDS: 1,
    MAX_SHIELDS: 2,
    SHIELD_RECHARGE_COMBO: 10,

    SURVIVAL_HEARTS: 3,
    DEFAULT_HINTS: 2,

    FEEDBACK_CORRECT_MS: 650,
    FEEDBACK_WRONG_MS: 2400,
    KEYBOARD_SKIP_DEBOUNCE_MS: 180
  };

  // ---------------------------------------------------------------------------
  // Japanese Kana, Mora & Phonological Tables
  // ---------------------------------------------------------------------------
  const SMALL_COMBINING_KANA = new Set(
    Array.from('ゃゅょゎぁぃぅぇぉャュョヮァィゥェォ')
  );

  // Base Hiragana Mora -> Accepted Romaji Variants (Hepburn + Kunrei-shiki + IME)
  const MORA_TO_ROMAJI = {
    'あ': ['a'], 'い': ['i', 'yi'], 'う': ['u', 'wu'], 'え': ['e'], 'お': ['o'],
    'か': ['ka', 'ca'], 'き': ['ki'], 'く': ['ku', 'cu', 'qu'], 'け': ['ke'], 'こ': ['ko', 'co'],
    'さ': ['sa'], 'し': ['shi', 'si', 'ci'], 'す': ['su'], 'せ': ['se', 'ce'], 'そ': ['so'],
    'た': ['ta'], 'ち': ['chi', 'ti'], 'つ': ['tsu', 'tu'], 'て': ['te'], 'と': ['to'],
    'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
    'は': ['ha', 'wa'], 'ひ': ['hi'], 'ふ': ['fu', 'hu'], 'へ': ['he'], 'ほ': ['ho'],
    'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
    'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
    'ら': ['ra', 'la'], 'り': ['ri', 'li'], 'る': ['ru', 'lu'], 'れ': ['re', 'le'], 'ろ': ['ro', 'lo'],
    'わ': ['wa'], 'を': ['wo', 'o'],
    'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
    'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
    'だ': ['da'], 'ぢ': ['di', 'ji', 'zi'], 'づ': ['du', 'dzu', 'zu'], 'で': ['de'], 'ど': ['do'],
    'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
    'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],

    // Yoon (Palatalized Digraphs)
    'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
    'しゃ': ['sha', 'sya'], 'しゅ': ['shu', 'syu'], 'しょ': ['sho', 'syo'],
    'ちゃ': ['cha', 'tya', 'cya'], 'ちゅ': ['chu', 'tyu', 'cyu'], 'ちょ': ['cho', 'tyo', 'cyo'],
    'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
    'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
    'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
    'りゃ': ['rya', 'lya'], 'りゅ': ['ryu', 'lyu'], 'りょ': ['ryo', 'lyo'],
    'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
    'じゃ': ['ja', 'jya', 'zya'], 'じゅ': ['ju', 'jyu', 'zyu'], 'じょ': ['jo', 'jyo', 'zyo'],
    'ぢゃ': ['dya', 'ja', 'jya'], 'ぢゅ': ['dyu', 'ju', 'jyu'], 'ぢょ': ['dyo', 'jo', 'jyo'],
    'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
    'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],

    // Extended Loanword Morae (Katakana -> Hiragana normalized)
    'てぃ': ['ti', 'thi'], 'でぃ': ['di', 'dhi'],
    'とぅ': ['tu', 'twu'], 'どぅ': ['du', 'dwu'],
    'ふぁ': ['fa'], 'ふぃ': ['fi'], 'ふぇ': ['fe'], 'ふぉ': ['fo'],
    'しぇ': ['she', 'sye'], 'ちぇ': ['che', 'tye'], 'じぇ': ['je', 'jye', 'zye'],
    'うぃ': ['wi'], 'うぇ': ['we'], 'うぉ': ['wo', 'uo'],
    'ゔ': ['vu', 'bu'], 'ゔぁ': ['va', 'ba'], 'ゔぃ': ['vi', 'bi'], 'ゔぇ': ['ve', 'be'], 'ゔぉ': ['vo', 'bo'],
    'っ': ['xtu', 'ltu', 'xtsu', 'ltsu'],
    'ん': ['nn', "n'", 'xn']
  };

  // Voiced / Unvoiced Trap Counterparts for Smart Distractor Mora Generation
  const DAKUTEN_SWAP = {
    'か': 'が', 'き': 'ぎ', 'く': 'ぐ', 'け': 'げ', 'こ': 'ご',
    '가': 'か', 'が': 'か', 'ぎ': 'き', 'ぐ': 'く', 'げ': 'け', 'ご': 'こ',
    'さ': 'ざ', 'し': 'じ', 'す': 'ず', 'せ': 'ぜ', 'そ': 'ぞ',
    'ざ': 'さ', 'じ': 'し', 'ず': 'す', 'ぜ': 'せ', 'ぞ': 'そ',
    'た': 'だ', 'ち': 'ぢ', 'つ': 'づ', 'て': 'で', 'と': 'ど',
    'だ': 'た', 'で': 'て', 'ど': 'と',
    'は': 'ば', 'ひ': 'び', 'ふ': 'ぶ', 'へ': 'べ', 'ほ': 'ぼ',
    'ば': 'ぱ', 'び': 'ぴ', 'ぶ': 'ぷ', 'べ': 'ぺ', 'ぼ': 'ぽ',
    'ぱ': 'は', 'ぴ': 'ひ', 'ぷ': 'ふ', 'ぺ': 'へ', 'ぽ': 'ほ'
  };

  const HIRAGANA_DISTRACTOR_POOL = [
    'う', 'い', 'っ', 'ん', 'く', 'つ', 'る', 'す', 'き', 'し',
    'ち', 'と', 'こ', 'そ', 'て', 'せ', 'け', 'な', 'に', 'の',
    'ま', 'み', 'ら', 'り', 'が', 'じ', 'だ', 'で', 'ど', 'ば',
    'しゃ', 'きょ', 'ちょ', 'りょ', 'じゅ'
  ];

  const KATAKANA_DISTRACTOR_POOL = [
    'ー', 'ッ', 'ン', 'ウ', 'イ', 'ク', 'ス', 'ツ', 'ト', 'ル',
    'ラ', 'リ', 'レ', 'ロ', 'コ', 'サ', 'シ', 'タ', 'チ', 'テ',
    'ナ', 'ニ', 'ノ', 'ハ', 'ヒ', 'フ', 'ホ', 'マ', 'ミ', 'ム',
    'ガ', 'ジ', 'ダ', 'デ', 'ド', 'バ', 'パ', 'プ', 'ポ'
  ];

  // ---------------------------------------------------------------------------
  // Kana / Mora / Romaji Utility Functions
  // ---------------------------------------------------------------------------
  function kataToHira(str) {
    const s = String(str || '');
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      if (code >= 0x30a1 && code <= 0x30f6) {
        out += String.fromCharCode(code - 0x60);
      } else {
        out += s[i];
      }
    }
    return out;
  }

  function hiraToKata(str) {
    const s = String(str || '');
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      if (code >= 0x3041 && code <= 0x3096) {
        out += String.fromCharCode(code + 0x60);
      } else {
        out += s[i];
      }
    }
    return out;
  }

  function isMostlyKatakana(str) {
    const s = String(str || '');
    let kataCount = 0;
    let hiraCount = 0;
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      if ((code >= 0x30a1 && code <= 0x30fa) || s[i] === 'ー') kataCount++;
      else if (code >= 0x3041 && code <= 0x3096) hiraCount++;
    }
    return kataCount > hiraCount;
  }

  function containsKanaChar(str) {
    return /[\u3040-\u309f\u30a0-\u30ffー]/.test(String(str || ''));
  }

  function splitMorae(kanaStr) {
    const ls = getLS();
    if (ls && ls.RomajiHelper && typeof ls.RomajiHelper.splitMorae === 'function') {
      try {
        const res = ls.RomajiHelper.splitMorae(kanaStr);
        if (Array.isArray(res) && res.length > 0 && res.join('') === String(kanaStr || '')) {
          return res;
        }
      } catch (_e) {
        // Fallback below
      }
    }
    const chars = Array.from(String(kanaStr || '').trim());
    const units = [];
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (SMALL_COMBINING_KANA.has(ch) && units.length > 0) {
        const prev = units[units.length - 1];
        const prevHira = kataToHira(prev);
        if (prevHira !== 'っ' && prevHira !== 'ん' && prev !== 'ー') {
          units[units.length - 1] = prev + ch;
          continue;
        }
      }
      units.push(ch);
    }
    return units;
  }

  function getTrailingVowelOfMora(mora) {
    if (!mora) return '';
    const hira = kataToHira(mora);
    const roms = MORA_TO_ROMAJI[hira];
    if (roms && roms[0]) {
      const primary = roms[0];
      const last = primary[primary.length - 1];
      if ('aeiou'.indexOf(last) !== -1) return last;
    }
    const lastKana = hira[hira.length - 1];
    if ('あかさたなはまやらわがざだばぱぁゃゎ'.indexOf(lastKana) !== -1) return 'a';
    if ('いきしちにひみりぎじぢびぴぃ'.indexOf(lastKana) !== -1) return 'i';
    if ('うくすつぬふむゆるぐずづぶぷぅゅ'.indexOf(lastKana) !== -1) return 'u';
    if ('えけせてねへめれげぜでべぺぇ'.indexOf(lastKana) !== -1) return 'e';
    if ('おこそとのほもよろをごぞどぼぽぉょ'.indexOf(lastKana) !== -1) return 'o';
    return '';
  }

  function getPrimaryRomajiForMora(mora, prevMora) {
    if (!mora) return '';
    if (mora === 'ー') {
      return getTrailingVowelOfMora(prevMora) || '-';
    }
    const hira = kataToHira(mora);
    if (hira === 'っ') return 'っ';
    if (hira === 'ん') return 'n';
    const list = MORA_TO_ROMAJI[hira];
    return list && list[0] ? list[0] : '';
  }

  /**
   * Returns accepted romaji strings that directly complete `mora` given context.
   */
  function getAcceptedRomajiForMora(mora, nextMora, prevMora) {
    if (!mora) return [];
    if (mora === 'ー') {
      const out = ['-'];
      const v = getTrailingVowelOfMora(prevMora);
      if (v) {
        out.push(v);
        if (v === 'o') out.push('u');
        if (v === 'e') out.push('i');
      } else {
        out.push('a', 'i', 'u', 'e', 'o');
      }
      return Array.from(new Set(out));
    }

    const hira = kataToHira(mora);
    if (hira === 'っ') {
      const sokuon = ['xtu', 'ltu', 'xtsu', 'ltsu'];
      if (nextMora) {
        const nextRoms = getAcceptedRomajiForMora(nextMora, null, mora);
        for (let i = 0; i < nextRoms.length; i++) {
          const r = nextRoms[i];
          if (r && 'bcdfghjklmnpqrstvwxyz'.indexOf(r[0]) !== -1 && r[0] !== 'n') {
            sokuon.push(r[0]);
            if (r.indexOf('ch') === 0) sokuon.push('t'); // allow 'tch' -> 'っ' + 'ch'
          }
        }
      }
      return Array.from(new Set(sokuon));
    }

    if (hira === 'ん') {
      const hatsuon = ['nn', "n'", 'xn'];
      if (!nextMora) {
        // Final mora of word: single 'n' is sufficient!
        hatsuon.unshift('n');
      } else {
        const nextRoms = getAcceptedRomajiForMora(nextMora, null, mora);
        let canSingleN = false;
        let canLabialM = false;
        for (let i = 0; i < nextRoms.length; i++) {
          const first = nextRoms[i] ? nextRoms[i][0] : '';
          // Single 'n' is unambiguous before consonants other than y; for n-row (onna/minna), handled in 2-mora lookahead
          if (first && 'aiueoyn'.indexOf(first) === -1) {
            canSingleN = true;
          }
          if (first && 'bmp'.indexOf(first) !== -1) {
            canLabialM = true;
          }
        }
        if (canSingleN) hatsuon.push('n');
        if (canLabialM) hatsuon.push('m');
      }
      return Array.from(new Set(hatsuon));
    }

    const base = MORA_TO_ROMAJI[hira] ? MORA_TO_ROMAJI[hira].slice() : [];
    return base;
  }

  /**
   * Attempts to consume `romajiBuffer` against remaining target morae first,
   * then falls back to any unused shard on the board.
   * Returns `{ matchedShardIds: string[], nextBuffer: string, previewKana: string }`.
   */
  function resolveRomajiBufferStep(q, nextBufferRaw) {
    let buf = String(nextBufferRaw || '').toLowerCase();
    const matchedShardIds = [];

    // Work on virtual copies of shards & enteredUnits so multi-mora completions (e.g. 'nna' -> 'ん'+'な') resolve atomically
    const virtualUsed = new Set(
      q.shards.filter(function (s) { return s.used; }).map(function (s) { return s.shardId; })
    );
    const virtualEntered = q.enteredUnits.slice();

    function findUnusedShardByMora(targetMora) {
      const targetHira = kataToHira(targetMora);
      // 1. Exact character match first
      for (let i = 0; i < q.shards.length; i++) {
        const s = q.shards[i];
        if (!virtualUsed.has(s.shardId) && s.char === targetMora) return s;
      }
      // 2. Hiragana/Katakana script-insensitive match
      for (let i = 0; i < q.shards.length; i++) {
        const s = q.shards[i];
        if (!virtualUsed.has(s.shardId) && kataToHira(s.char) === targetHira) return s;
      }
      return null;
    }

    let guard = 0;
    while (buf.length > 0 && virtualEntered.length < q.targetLength && guard < 8) {
      guard++;
      const onTargetTrack =
        q.targetUnits.slice(0, virtualEntered.length).join('') === virtualEntered.join('');
      const prevMora = virtualEntered.length > 0 ? virtualEntered[virtualEntered.length - 1] : null;

      if (onTargetTrack) {
        const nextMora = q.targetUnits[virtualEntered.length];
        const afterNextMora = q.targetUnits[virtualEntered.length + 1] || null;
        const nextHira = kataToHira(nextMora);

        // Case A: Sokuon ('っ'/'ッ') via doubled consonant (e.g. 'kk', 'tt', 'pp', 'ss', 'cc', 'tc')
        if (nextHira === 'っ' && buf.length >= 2) {
          const c0 = buf[0];
          const c1 = buf[1];
          const isGeminate =
            (c0 === c1 && 'bcdfghjklmpqrstvwxyz'.indexOf(c0) !== -1) ||
            (c0 === 't' && c1 === 'c');
          if (isGeminate) {
            const sokuonShard = findUnusedShardByMora(nextMora);
            if (sokuonShard) {
              virtualUsed.add(sokuonShard.shardId);
              virtualEntered.push(sokuonShard.char);
              matchedShardIds.push(sokuonShard.shardId);
              buf = buf.slice(1);
              continue;
            }
          }
        }

        // Case B: Hatsuon ('ん'/'ン') before consonant, labial 'm', Hepburn 'nna'/'nni'/'kinyoubi'/'genin', or IME 'nn'
        if (nextHira === 'ん') {
          // B1. Final mora of word: 'n', 'nn', "n'", 'xn' immediately completes!
          if (!afterNextMora && (buf === 'n' || buf === 'nn' || buf === "n'" || buf === 'xn')) {
            const nShard = findUnusedShardByMora(nextMora);
            if (nShard) {
              virtualUsed.add(nShard.shardId);
              virtualEntered.push(nShard.char);
              matchedShardIds.push(nShard.shardId);
              buf = '';
              continue;
            }
          }

          // B2. Explicit "n'" or "xn"
          if (buf.indexOf("n'") === 0 || buf.indexOf('xn') === 0) {
            const nShard = findUnusedShardByMora(nextMora);
            if (nShard) {
              virtualUsed.add(nShard.shardId);
              virtualEntered.push(nShard.char);
              matchedShardIds.push(nShard.shardId);
              buf = buf.slice(2);
              continue;
            }
          }

          // B3. Single 'n' (or labial 'm') followed by consonant starting `afterNextMora` (e.g. 'ns' in sensei, 'nb'/'mb' in shinbun)
          if (afterNextMora && buf.length >= 2 && (buf[0] === 'n' || buf[0] === 'm')) {
            const second = buf[1];
            const afterHira = kataToHira(afterNextMora);
            const afterStartsWithN = /^n/.test(getPrimaryRomajiForMora(afterNextMora, nextMora));

            // Standard consonant after 'n' (not vowel, not 'y', not 'n')
            if (buf[0] === 'n' && 'aiueoyn'.indexOf(second) === -1 && /[a-z-]/.test(second)) {
              const nShard = findUnusedShardByMora(nextMora);
              if (nShard) {
                virtualUsed.add(nShard.shardId);
                virtualEntered.push(nShard.char);
                matchedShardIds.push(nShard.shardId);
                buf = buf.slice(1);
                continue;
              }
            }
            // Labial 'm' before b/p/m (e.g. shimbun, sampo)
            if (buf[0] === 'm' && 'bpm'.indexOf(second) !== -1) {
              const nShard = findUnusedShardByMora(nextMora);
              if (nShard) {
                virtualUsed.add(nShard.shardId);
                virtualEntered.push(nShard.char);
                matchedShardIds.push(nShard.shardId);
                buf = buf.slice(1);
                continue;
              }
            }

            // B4. 'nn' handling:
            // - If afterNextMora does NOT start with 'n' (e.g. あんしん 'annshin', げんいん 'gennin'), 'nn' immediately emits 'ん' with rest!
            // - If afterNextMora DOES start with 'n' (e.g. みんな 'minna' vs IME 'minnna'):
            //   Wait when buf === 'nn'; if buf === 'nnn', emit 'ん' leaving 'n'; if buf === 'nna' (matches 'n' + 'na'), emit 'ん' leaving 'na'!
            if (buf.indexOf('nn') === 0) {
              if (!afterStartsWithN) {
                const nShard = findUnusedShardByMora(nextMora);
                if (nShard) {
                  virtualUsed.add(nShard.shardId);
                  virtualEntered.push(nShard.char);
                  matchedShardIds.push(nShard.shardId);
                  buf = buf.slice(2);
                  continue;
                }
              } else if (buf.length >= 3) {
                const third = buf[2];
                const nShard = findUnusedShardByMora(nextMora);
                if (nShard) {
                  virtualUsed.add(nShard.shardId);
                  virtualEntered.push(nShard.char);
                  matchedShardIds.push(nShard.shardId);
                  // If 3rd char is 'n' (IME 'minnna'), consume 'nn' leaving 'n'; otherwise (Hepburn 'minna' -> 'nna'), consume single 'n' leaving 'na'!
                  buf = third === 'n' ? buf.slice(2) : buf.slice(1);
                  continue;
                }
              }
            }

            // B5. Hepburn single-'n' before vowel/'y' in word.romaji (e.g. 'kinyoubi' -> き+ん+よ..., 'genin' -> げ+ん+い+ん)
            if (buf[0] === 'n' && 'aiueoy'.indexOf(second) !== -1 && afterHira) {
              const restBuf = buf.slice(1);
              const afterAccepted = getAcceptedRomajiForMora(afterNextMora, null, nextMora);
              const matchesAfter = afterAccepted.some(function (r) {
                return restBuf.indexOf(r) === 0;
              });
              if (matchesAfter) {
                const nShard = findUnusedShardByMora(nextMora);
                if (nShard) {
                  virtualUsed.add(nShard.shardId);
                  virtualEntered.push(nShard.char);
                  matchedShardIds.push(nShard.shardId);
                  buf = restBuf;
                  continue;
                }
              }
            }
          }
        }

        // Case C: Direct match on `nextMora` accepted romaji
        const acceptedNext = getAcceptedRomajiForMora(nextMora, afterNextMora, prevMora);
        // Sort longest first so 'shi' matches before 'si' if needed
        acceptedNext.sort(function (a, b) { return b.length - a.length; });
        let matchedDirect = false;
        for (let i = 0; i < acceptedNext.length; i++) {
          const rom = acceptedNext[i];
          // Avoid premature single-char sokuon consumption before 2nd consonant arrives
          if (nextHira === 'っ' && rom.length === 1 && buf.length === 1) continue;
          // Avoid premature single-'n' consumption before lookahead unless it's the final mora
          if (nextHira === 'ん' && rom === 'n' && afterNextMora && buf.length === 1) continue;
          // Avoid premature 'nn' consumption when afterNextMora starts with 'n' (e.g. onnanoko, konnichiha, gomennasai)
          if (
            nextHira === 'ん' &&
            rom === 'nn' &&
            afterNextMora &&
            /^n/.test(getPrimaryRomajiForMora(afterNextMora, nextMora)) &&
            buf.length === 2
          ) {
            continue;
          }

          if (buf.indexOf(rom) === 0) {
            const targetShard = findUnusedShardByMora(nextMora);
            if (targetShard) {
              virtualUsed.add(targetShard.shardId);
              virtualEntered.push(targetShard.char);
              matchedShardIds.push(targetShard.shardId);
              buf = buf.slice(rom.length);
              matchedDirect = true;
              break;
            }
          }
        }
        if (matchedDirect) continue;

        // Check if `buf` is a valid prefix of `nextMora` (or 'nn' waiting on n-row) — if so, hold buffer!
        const isPrefixOfTarget =
          (nextHira === 'ん' && (buf === 'n' || buf === 'nn' || buf === 'x' || buf === 'm')) ||
          (nextHira === 'っ' && buf.length === 1 && 'bcdfghjklmpqrstvwxyz'.indexOf(buf) !== -1) ||
          acceptedNext.some(function (rom) { return rom.indexOf(buf) === 0; });

        if (isPrefixOfTarget) {
          break;
        }
      }

      // Case D: Fallback — match against ANY unused shard on the board (if user types off-target shard)
      let matchedAnyShard = false;
      for (let i = 0; i < q.shards.length; i++) {
        const s = q.shards[i];
        if (virtualUsed.has(s.shardId)) continue;
        const sHira = kataToHira(s.char);
        if (sHira === 'ん' && buf === 'n') continue; // wait for 'nn' or consonant on off-target
        const sAccepted = getAcceptedRomajiForMora(s.char, null, prevMora);
        for (let j = 0; j < sAccepted.length; j++) {
          const rom = sAccepted[j];
          if (rom && buf.indexOf(rom) === 0) {
            virtualUsed.add(s.shardId);
            virtualEntered.push(s.char);
            matchedShardIds.push(s.shardId);
            buf = buf.slice(rom.length);
            matchedAnyShard = true;
            break;
          }
        }
        if (matchedAnyShard) break;
      }

      if (!matchedAnyShard) {
        // Keep at most valid prefix characters (up to 3 chars); if stale prefix precedes fresh typing, trim leading char
        if (buf.length > 3) {
          buf = buf.slice(-2);
        }
        break;
      }
    }

    let previewKana = '';
    if (buf.length > 0 && virtualEntered.length < q.targetLength) {
      const expected = q.targetUnits[virtualEntered.length] || '';
      previewKana = expected;
    }

    return {
      matchedShardIds: matchedShardIds,
      nextBuffer: buf,
      previewKana: previewKana
    };
  }

  // ---------------------------------------------------------------------------
  // Internal General Helpers
  // ---------------------------------------------------------------------------
  function cloneShallow(obj) {
    return obj ? Object.assign({}, obj) : null;
  }

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function getComboMultiplier(combo) {
    if (combo >= 12) return 2.0;
    if (combo >= 8) return 1.8;
    if (combo >= 5) return 1.5;
    if (combo >= 2) return 1.2;
    return 1.0;
  }

  function computeRankAndStars(accuracyPercent, maxCombo, earlyBonusPoints, survivedCompleted) {
    if (!survivedCompleted) {
      if (accuracyPercent >= 85 && maxCombo >= 10) return { rank: 'A', stars: 2, title: '용맹한 사쿠라 도전자' };
      if (accuracyPercent >= 65) return { rank: 'B', stars: 1, title: '끈기 있는 N5 도전자' };
      return { rank: 'C', stars: 1, title: '도전의 시작' };
    }
    if (accuracyPercent >= 95 && (maxCombo >= 8 || earlyBonusPoints > 0)) {
      return { rank: 'S+', stars: 3, title: '사쿠라 프리즘 명인(名人)' };
    }
    if (accuracyPercent >= 90) {
      return { rank: 'S', stars: 3, title: 'JLPT N5 마스터' };
    }
    if (accuracyPercent >= 80) {
      return { rank: 'A', stars: 2, title: '교토 크리스탈 에이스' };
    }
    if (accuracyPercent >= 65) {
      return { rank: 'B', stars: 1, title: '니혼고 패스파인더' };
    }
    return { rank: 'C', stars: 1, title: '워밍업 클리어' };
  }

  function getKoreanInitials(str) {
    const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const firstPart = String(str || '').split(',')[0].split('/')[0].trim();
    let out = '';
    for (let i = 0; i < firstPart.length; i++) {
      const code = firstPart.charCodeAt(i) - 0xac00;
      if (code >= 0 && code <= 11171) {
        out += CHO[Math.floor(code / 588)];
      } else if (firstPart[i] === ' ') {
        out += ' ';
      }
    }
    return out || firstPart.slice(0, 1);
  }

  // ---------------------------------------------------------------------------
  // Fallback Local Session Store (if LearningSystem is not loaded in standalone tests)
  // ---------------------------------------------------------------------------
  const fallbackStore = {
    pins: new Set(),
    wrongIds: new Set(),
    boxes: new Map(),
    roundRecords: new Map(),
    settings: {
      theme: 'midnight-sakura',
      memorizeSec: CONFIG.DEFAULT_MEMORIZE_SEC,
      muted: false,
      ttsEnabled: true,
      ttsRate: 1.0,
      ttsLang: 'ja-JP'
    }
  };

  // ---------------------------------------------------------------------------
  // Data Layer (`WordBank` / `WORDS_500`) & `LearningSystem` Safe Bridges
  // ---------------------------------------------------------------------------
  function getAllWords() {
    if (N5App.WordBank && typeof N5App.WordBank.getAllWords === 'function') {
      const list = N5App.WordBank.getAllWords();
      if (Array.isArray(list) && list.length > 0) return list;
    }
    if (Array.isArray(N5App.WORDS_500) && N5App.WORDS_500.length > 0) return N5App.WORDS_500;
    if (Array.isArray(N5App.words) && N5App.words.length > 0) return N5App.words;
    if (Array.isArray(N5App.WORDS_800) && N5App.WORDS_800.length > 0) return N5App.WORDS_800;
    return [];
  }

  function deriveLevelForRound(roundNum, totalRounds) {
    const tr = totalRounds || CONFIG.DEFAULT_TOTAL_ROUNDS;
    if (tr <= 50) {
      return roundNum <= 20 ? 1 : roundNum <= 38 ? 2 : 3;
    }
    return roundNum <= 30 ? 1 : roundNum <= 60 ? 2 : 3;
  }

  function getAllRounds() {
    if (N5App.WordBank && typeof N5App.WordBank.getAllRounds === 'function') {
      const rounds = N5App.WordBank.getAllRounds();
      if (Array.isArray(rounds) && rounds.length > 0) return rounds;
    }
    if (Array.isArray(N5App.ROUNDS_50) && N5App.ROUNDS_50.length > 0) return N5App.ROUNDS_50;
    if (Array.isArray(N5App.ROUNDS_80) && N5App.ROUNDS_80.length > 0) return N5App.ROUNDS_80;

    const words = getAllWords();
    const map = new Map();
    const estTotalRounds = words.length > 0 ? Math.ceil(words.length / 10) : CONFIG.DEFAULT_TOTAL_ROUNDS;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const r = Number(w.round) || Math.floor(i / 10) + 1;
      if (!map.has(r)) {
        map.set(r, {
          round: r,
          level: Number(w.level) || deriveLevelForRound(r, estTotalRounds),
          title: w.theme || 'Round ' + r,
          emoji: w.emoji || '🌸',
          wordIds: []
        });
      }
      map.get(r).wordIds.push(w.id);
    }
    return Array.from(map.values()).sort(function (a, b) {
      return a.round - b.round;
    });
  }

  function getTotalRounds() {
    const rounds = getAllRounds();
    if (rounds.length > 0) return rounds.length;
    const words = getAllWords();
    if (words.length > 0) return Math.max(1, Math.ceil(words.length / CONFIG.WORDS_PER_ROUND));
    return CONFIG.DEFAULT_TOTAL_ROUNDS;
  }

  function getTotalWords() {
    const words = getAllWords();
    return words.length > 0 ? words.length : CONFIG.DEFAULT_TOTAL_WORDS;
  }

  function getWordsByRound(roundNum) {
    if (N5App.WordBank && typeof N5App.WordBank.getWordsByRound === 'function') {
      const res = N5App.WordBank.getWordsByRound(roundNum);
      if (Array.isArray(res) && res.length > 0) return res;
    }
    return getAllWords().filter(function (w) {
      return Number(w.round) === Number(roundNum);
    });
  }

  function getRoundMeta(roundNum) {
    if (N5App.WordBank && typeof N5App.WordBank.getRoundMeta === 'function') {
      const meta = N5App.WordBank.getRoundMeta(roundNum);
      if (meta) return meta;
    }
    const rounds = getAllRounds();
    const found = rounds.find(function (r) {
      return Number(r.round) === Number(roundNum);
    });
    if (found) return found;
    const roundWords = getWordsByRound(roundNum);
    const sample = roundWords[0] || {};
    const totalR = getTotalRounds();
    return {
      round: Number(roundNum),
      level: Number(sample.level) || deriveLevelForRound(Number(roundNum), totalR),
      title: sample.theme || 'Round ' + roundNum,
      emoji: sample.emoji || '🌸',
      wordIds: roundWords.map(function (w) { return w.id; })
    };
  }

  function getWordById(wordId) {
    if (N5App.WordBank && typeof N5App.WordBank.getWordById === 'function') {
      const w = N5App.WordBank.getWordById(wordId);
      if (w) return w;
    }
    const all = getAllWords();
    return all.find(function (w) { return Number(w.id) === Number(wordId); }) || null;
  }

  function hasKanjiInWord(wordObj) {
    if (!wordObj) return false;
    const k = String(wordObj.kanji || '').trim();
    return k.length > 0;
  }

  function getWordDisplayExpression(wordObj) {
    if (!wordObj) return '';
    return String(wordObj.expression || wordObj.kanji || wordObj.kana || '').trim();
  }

  function getBlankExample(wordObj, mask) {
    const blankMask = mask || '［　　］';
    if (!wordObj || !wordObj.example) return blankMask;
    if (N5App.WordBank && typeof N5App.WordBank.getBlankExample === 'function') {
      try {
        const res = N5App.WordBank.getBlankExample(wordObj, blankMask);
        if (res && res.indexOf(blankMask) !== -1) return res;
      } catch (_e) {
        // Fallback below
      }
    }

    const ex = String(wordObj.example);
    const expr = getWordDisplayExpression(wordObj);
    const kana = String(wordObj.kana || '').trim();

    if (expr && ex.indexOf(expr) !== -1) {
      return ex.split(expr).join(blankMask);
    }
    if (kana && ex.indexOf(kana) !== -1) {
      return ex.split(kana).join(blankMask);
    }
    // Verb / i-adjective stem fallback (strip final hiragana okurigana and match stem + 0..4 hiragana)
    if (expr.length >= 2) {
      const stem = expr.slice(0, -1);
      if (ex.indexOf(stem) !== -1) {
        const idx = ex.indexOf(stem);
        let endIdx = idx + stem.length;
        while (endIdx < ex.length && endIdx - (idx + stem.length) < 4 && /[\u3041-\u3096]/.test(ex[endIdx])) {
          endIdx++;
        }
        return ex.slice(0, idx) + blankMask + ex.slice(endIdx);
      }
    }
    return ex + ' ' + blankMask;
  }

  function getSmartDistractors(targetWord, count, candidatePool) {
    const needed = count || 3;
    if (N5App.WordBank && typeof N5App.WordBank.getDistractors === 'function') {
      try {
        const wbRes = N5App.WordBank.getDistractors(targetWord, needed, {
          samePos: true,
          sameLevel: true
        });
        if (Array.isArray(wbRes) && wbRes.length >= needed) {
          return wbRes.slice(0, needed);
        }
      } catch (_e) {
        // Fallback below
      }
    }

    const pool = Array.isArray(candidatePool) && candidatePool.length > needed
      ? candidatePool
      : getAllWords();

    const targetExpr = getWordDisplayExpression(targetWord);
    const targetKana = String(targetWord.kana || '').trim();
    const targetMeaning = String(targetWord.meaning || '').trim();
    const targetPos = String(targetWord.pos || '').trim();
    const targetLevel = Number(targetWord.level) || 1;
    const targetIsKata = isMostlyKatakana(targetExpr);

    const usedIds = new Set([Number(targetWord.id)]);
    const usedExprs = new Set([targetExpr]);
    const usedKanas = new Set([targetKana]);
    const usedMeanings = new Set([targetMeaning]);

    const tier1 = []; // Same pos + same level + same script style
    const tier2 = []; // Same pos + same level
    const tier3 = []; // Same pos
    const tier4 = []; // Same level
    const tier5 = []; // Remaining

    for (let i = 0; i < pool.length; i++) {
      const cand = pool[i];
      if (!cand) continue;
      const cExpr = getWordDisplayExpression(cand);
      const cKana = String(cand.kana || '').trim();
      const cMean = String(cand.meaning || '').trim();
      if (!cExpr || !cMean) continue;
      if (Number(cand.id) === Number(targetWord.id)) continue;
      if (cExpr === targetExpr || cMean === targetMeaning || (cKana && cKana === targetKana)) continue;

      const samePos = targetPos && cand.pos === targetPos;
      const sameLevel = Number(cand.level) === targetLevel;
      const sameScript = isMostlyKatakana(cExpr) === targetIsKata;

      if (samePos && sameLevel && sameScript) tier1.push(cand);
      else if (samePos && sameLevel) tier2.push(cand);
      else if (samePos) tier3.push(cand);
      else if (sameLevel) tier4.push(cand);
      else tier5.push(cand);
    }

    const ordered = [].concat(
      shuffleArray(tier1),
      shuffleArray(tier2),
      shuffleArray(tier3),
      shuffleArray(tier4),
      shuffleArray(tier5)
    );

    const selected = [];
    for (let i = 0; i < ordered.length && selected.length < needed; i++) {
      const c = ordered[i];
      const cExpr = getWordDisplayExpression(c);
      const cKana = String(c.kana || '').trim();
      const cMean = String(c.meaning || '').trim();
      if (
        usedIds.has(Number(c.id)) ||
        usedExprs.has(cExpr) ||
        usedMeanings.has(cMean) ||
        (cKana && usedKanas.has(cKana))
      ) {
        continue;
      }
      usedIds.add(Number(c.id));
      usedExprs.add(cExpr);
      if (cKana) usedKanas.add(cKana);
      usedMeanings.add(cMean);
      selected.push(c);
    }

    return selected;
  }

  /**
   * Returns 3 unique JLPT N5 phonological trap kana strings for `kanji-to-kana` questions.
   */
  function getSmartKanaDistractors(targetWord, count) {
    const needed = count || 3;
    const correctKana = String((targetWord && targetWord.kana) || '').trim();
    const used = new Set([correctKana]);
    const out = [];

    function pushUnique(str) {
      const s = String(str || '').trim();
      if (s && s.length >= 1 && !used.has(s)) {
        used.add(s);
        out.push(s);
      }
    }

    if (N5App.WordBank && typeof N5App.WordBank.getKanaDistractors === 'function') {
      try {
        const wbKana = N5App.WordBank.getKanaDistractors(targetWord, needed + 2);
        if (Array.isArray(wbKana)) {
          for (let i = 0; i < wbKana.length && out.length < needed; i++) {
            const item = typeof wbKana[i] === 'string' ? wbKana[i] : (wbKana[i] && wbKana[i].kana);
            pushUnique(item);
          }
        }
      } catch (_e) {
        // Fallback mutations below
      }
    }

    if (out.length < needed && correctKana) {
      // 1. Long vowel traps (おう <-> お, えい <-> え, う insertion/removal)
      if (correctKana.indexOf('おう') !== -1) pushUnique(correctKana.replace('おう', 'お'));
      if (correctKana.indexOf('こう') !== -1) pushUnique(correctKana.replace('こう', 'こ'));
      if (correctKana.indexOf('そう') !== -1) pushUnique(correctKana.replace('そう', 'そ'));
      if (correctKana.indexOf('とう') !== -1) pushUnique(correctKana.replace('とう', 'と'));
      if (correctKana.indexOf('よう') !== -1) pushUnique(correctKana.replace('よう', 'よ'));
      if (correctKana.indexOf('えい') !== -1) pushUnique(correctKana.replace('えい', 'え'));
      if (correctKana.indexOf('せい') !== -1) pushUnique(correctKana.replace('せい', 'せ'));
      if (correctKana.indexOf('けい') !== -1) pushUnique(correctKana.replace('けい', 'け'));

      // 2. Sokuon (っ) traps
      if (correctKana.indexOf('っ') !== -1) {
        pushUnique(correctKana.replace('っ', ''));
      } else if (correctKana.length >= 2) {
        const morae = splitMorae(correctKana);
        if (morae.length >= 2 && 'かきくけこさしすせそたちつてとぱぴぷぺぽ'.indexOf(morae[1][0]) !== -1) {
          pushUnique(morae[0] + 'っ' + morae.slice(1).join(''));
        }
      }

      // 3. Dakuten / Seion mutation
      const chars = Array.from(correctKana);
      for (let i = 0; i < chars.length && out.length < needed; i++) {
        if (DAKUTEN_SWAP[chars[i]]) {
          const copy = chars.slice();
          copy[i] = DAKUTEN_SWAP[chars[i]];
          pushUnique(copy.join(''));
        }
      }

      // 4. Add/drop trailing long vowel
      if (out.length < needed) {
        if (correctKana.endsWith('う') && correctKana.length >= 3) {
          pushUnique(correctKana.slice(0, -1));
        } else {
          pushUnique(correctKana + 'う');
        }
      }
      if (out.length < needed) {
        pushUnique(correctKana + 'い');
      }

      // 5. Same-pos other word kana fallback
      if (out.length < needed) {
        const otherWords = getSmartDistractors(targetWord, 6);
        for (let i = 0; i < otherWords.length && out.length < needed; i++) {
          if (!isMostlyKatakana(otherWords[i].kana)) {
            pushUnique(otherWords[i].kana);
          }
        }
      }
    }

    const fallbackPads = ['せんせい', 'がっこう', 'まいにち', 'らいしゅう'];
    for (let i = 0; i < fallbackPads.length && out.length < needed; i++) {
      pushUnique(fallbackPads[i]);
    }

    return out.slice(0, needed);
  }

  function getLS() {
    return N5App.LearningSystem || null;
  }

  function playSfx(soundName, param) {
    const ls = getLS();
    if (!ls || !ls.sfx) return;
    try {
      if (typeof ls.sfx[soundName] === 'function') {
        ls.sfx[soundName](param);
      } else if (typeof ls.sfx.play === 'function') {
        ls.sfx.play(soundName, param);
      } else if (soundName === 'shieldBreak' && typeof ls.sfx.wrong === 'function') {
        ls.sfx.wrong();
      } else if (soundName === 'shardTap' && typeof ls.sfx.click === 'function') {
        ls.sfx.click();
      }
    } catch (_e) {
      // Never block gameplay on audio errors
    }
  }

  function speakWordAudio(wordObj) {
    if (!wordObj) return;
    const ls = getLS();
    if (!ls || !ls.tts) return;
    try {
      if (typeof ls.tts.speakWord === 'function') {
        ls.tts.speakWord(wordObj);
      } else if (typeof ls.tts.speak === 'function') {
        ls.tts.speak(wordObj.kana || wordObj.expression || '');
      }
    } catch (_e) {
      // Never block gameplay on TTS errors
    }
  }

  function isWordGloballyPinned(wordId) {
    const ls = getLS();
    if (ls && typeof ls.isPinned === 'function') {
      try {
        return Boolean(ls.isPinned(wordId));
      } catch (_e) {
        // Fallback below
      }
    }
    return fallbackStore.pins.has(Number(wordId));
  }

  function setWordGlobalPin(wordId, desiredState) {
    const idNum = Number(wordId);
    const ls = getLS();
    if (ls && typeof ls.togglePin === 'function') {
      try {
        const current = typeof ls.isPinned === 'function' ? Boolean(ls.isPinned(idNum)) : false;
        if (current !== desiredState) {
          return Boolean(ls.togglePin(idNum));
        }
        return current;
      } catch (_e) {
        // Fallback below
      }
    }
    if (desiredState) fallbackStore.pins.add(idNum);
    else fallbackStore.pins.delete(idNum);
    return desiredState;
  }

  function getWordProgressSafe(wordId) {
    const idNum = Number(wordId);
    const ls = getLS();
    if (ls && typeof ls.getWordProgress === 'function') {
      try {
        const prog = ls.getWordProgress(idNum);
        if (prog) return prog;
      } catch (_e) {
        // Fallback below
      }
    }
    const box = fallbackStore.boxes.get(idNum) || 0;
    return {
      wordId: idNum,
      box: box,
      status: box === 0 ? 'unseen' : box >= 3 ? 'mastered' : 'learning',
      pinned: fallbackStore.pins.has(idNum),
      inWrongNote: fallbackStore.wrongIds.has(idNum)
    };
  }

  function recordWordAttemptSafe(wordId, isCorrect, meta) {
    const idNum = Number(wordId);
    const ls = getLS();
    if (ls && typeof ls.recordAttempt === 'function') {
      try {
        return ls.recordAttempt(idNum, isCorrect, meta);
      } catch (_e) {
        // Fallback below
      }
    }
    const prev = fallbackStore.boxes.get(idNum) || 0;
    const next = isCorrect ? Math.min(3, prev + 1) : 1;
    fallbackStore.boxes.set(idNum, next);
    if (!isCorrect) fallbackStore.wrongIds.add(idNum);
    else if (next >= 3) fallbackStore.wrongIds.delete(idNum);
    return {
      wordId: idNum,
      prevBox: prev,
      newBox: next,
      status: next >= 3 ? 'mastered' : 'learning',
      inWrongNote: fallbackStore.wrongIds.has(idNum)
    };
  }

  function getHintFromLS(wordObj, stage) {
    const ls = getLS();
    if (ls && typeof ls.getHint === 'function') {
      try {
        const h = ls.getHint(wordObj, stage);
        if (h) return h;
      } catch (_e) {
        // Fallback below
      }
    }
    const morae = splitMorae(wordObj.kana || '');
    const firstKana = morae[0] || '';
    const skeleton = morae.length <= 1
      ? firstKana
      : firstKana + ' ' + Array(morae.length - 1).fill('◯').join(' ');
    const koInit = getKoreanInitials(wordObj.meaning);

    if (stage === 1) {
      return {
        stage: 1,
        firstKana: firstKana,
        moraCount: morae.length,
        kanaSkeleton: skeleton,
        koInitials: koInit,
        pos: wordObj.pos || '',
        text: '박자 힌트: ' + skeleton + ' (' + morae.length + '박자 · 뜻 초성: ' + koInit + ')'
      };
    }
    if (stage === 2) {
      const cloze = getBlankExample(wordObj, '［　　］');
      return {
        stage: 2,
        clozeExample: cloze,
        exampleKo: wordObj.exampleKo || '',
        tip: wordObj.tip || '',
        emoji: wordObj.emoji || '💡',
        text: (wordObj.emoji || '💡') + ' 암기팁: ' + (wordObj.tip || wordObj.exampleKo || '')
      };
    }
    return {
      stage: 3,
      koPron: wordObj.koPron || '',
      romaji: wordObj.romaji || '',
      kana: wordObj.kana || '',
      tip: wordObj.tip || '',
      text: '발음 가이드: [' + (wordObj.koPron || wordObj.romaji || '') + '] (' + (wordObj.romaji || '') + ')'
    };
  }

  // ---------------------------------------------------------------------------
  // Event Emitter & Master Timer State
  // ---------------------------------------------------------------------------
  const listeners = new Map();

  function on(eventName, handler) {
    if (typeof handler !== 'function') return function () {};
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }
    listeners.get(eventName).add(handler);
    return function unsubscribe() {
      off(eventName, handler);
    };
  }

  function off(eventName, handler) {
    const set = listeners.get(eventName);
    if (set) {
      set.delete(handler);
    }
  }

  function emit(eventName, payload) {
    const set = listeners.get(eventName);
    if (!set || set.size === 0) return;
    const handlers = Array.from(set);
    for (let i = 0; i < handlers.length; i++) {
      try {
        handlers[i](payload);
      } catch (err) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[N5 GameEngine] Listener error on ' + eventName + ':', err);
        }
      }
    }
  }

  const timers = {
    loopId: null,
    feedbackId: null,
    lastTickAt: 0
  };

  function clearAllTimers() {
    if (timers.loopId !== null) {
      clearInterval(timers.loopId);
      timers.loopId = null;
    }
    if (timers.feedbackId !== null) {
      clearTimeout(timers.feedbackId);
      timers.feedbackId = null;
    }
  }

  // Master Engine State
  let engineState = createInitialEngineState();

  function normalizeBattleStyle(style) {
    if (style === 'spelling-only') return 'kana-only';
    const valid = ['prism-mix', 'quiz-only', 'reading-only', 'match-only', 'kana-only'];
    return valid.indexOf(style) !== -1 ? style : 'prism-mix';
  }

  function createInitialEngineState() {
    return {
      phase: 'LOBBY',
      subState: 'READY',
      mode: 'campaign',
      battleStyle: 'prism-mix',
      survivalLevel: 'all',
      autoSubmitKana: true,
      round: 1,
      roundMeta: null,
      startedAt: 0,

      memorize: {
        words: [],
        initialTotalMs: CONFIG.DEFAULT_MEMORIZE_SEC * 1000,
        totalSec: CONFIG.DEFAULT_MEMORIZE_SEC,
        remainingMs: CONFIG.DEFAULT_MEMORIZE_SEC * 1000,
        remainingSec: CONFIG.DEFAULT_MEMORIZE_SEC,
        extensionsLeft: CONFIG.MAX_EXTENSIONS,
        studiedIds: [],
        roundPinnedIds: []
      },

      battle: {
        queue: [],
        questionIndex: 0,
        wave: 1,
        waveTitle: '',
        currentQuestion: null,
        questionStartedAt: 0,
        totalSec: 10,
        remainingMs: 10000,
        remainingSec: 10,
        lastTickSecondBeeped: -1,

        score: 0,
        pinBountyPoints: 0,
        combo: 0,
        maxCombo: 0,
        comboMultiplier: 1.0,
        earlyScoreMultiplier: 1.0,
        earlyBonusPoints: 0,

        feverGauge: 0,
        feverActive: false,
        feverRemainingMs: 0,

        shields: CONFIG.INITIAL_SHIELDS,
        hearts: CONFIG.SURVIVAL_HEARTS,
        maxHearts: CONFIG.SURVIVAL_HEARTS,
        hintsRemaining: CONFIG.DEFAULT_HINTS,
        hintStageByQuestion: {},

        correctCount: 0,
        wrongCount: 0,
        totalAnswered: 0,
        revengeClearedCount: 0,
        missedRoundWordIds: [],
        dynamicallyQueuedBossIds: [],
        wordResultsMap: {},
        feedbackEnteredAt: 0,
        lastFeedback: null
      },

      result: null
    };
  }

  // ---------------------------------------------------------------------------
  // Public State Snapshot Builder
  // ---------------------------------------------------------------------------
  function getEarlyStartPreview() {
    const mem = engineState.memorize;
    if (engineState.phase !== 'MEMORIZE') {
      return {
        remainingSec: 0,
        bonusPoints: engineState.battle.earlyBonusPoints || 0,
        scoreMultiplier: engineState.battle.earlyScoreMultiplier || 1.0,
        initialFeverGauge: 0,
        label: '배틀 진행 중'
      };
    }
    const remSec = Math.max(0, Math.ceil(mem.remainingMs / 1000));
    const baseTotalMs = Math.max(1000, mem.initialTotalMs);
    const ratio = Math.max(0, Math.min(1, mem.remainingMs / baseTotalMs));
    const bonusPoints = remSec * 15;
    const scoreMultiplier = Number((1 + Math.round(ratio * 30) / 100).toFixed(2));
    const initialFeverGauge = Math.min(40, Math.round(ratio * 40));
    const label = remSec > 0
      ? '⚡ 조기 출격 부스트 x' + scoreMultiplier.toFixed(2) + ' (+' + bonusPoints + '점)'
      : '배틀 시작!';
    return {
      remainingSec: remSec,
      bonusPoints: bonusPoints,
      scoreMultiplier: scoreMultiplier,
      initialFeverGauge: initialFeverGauge,
      label: label
    };
  }

  function sanitizeQuestionForView(q) {
    if (!q) return null;
    const copy = cloneShallow(q);
    if (Array.isArray(q.options)) {
      copy.options = q.options.map(cloneShallow);
    }
    if (Array.isArray(q.tiles)) {
      copy.tiles = q.tiles.map(cloneShallow);
    }
    if (Array.isArray(q.shards)) {
      copy.shards = q.shards.map(cloneShallow);
    }
    if (Array.isArray(q.targetUnits)) {
      copy.targetUnits = q.targetUnits.slice();
    }
    if (Array.isArray(q.enteredShardIds)) {
      copy.enteredShardIds = q.enteredShardIds.slice();
    }
    if (Array.isArray(q.enteredUnits)) {
      copy.enteredUnits = q.enteredUnits.slice();
    }
    if (Array.isArray(q.matchedPairIds)) {
      copy.matchedPairIds = q.matchedPairIds.slice();
    }
    return copy;
  }

  function getState() {
    const mem = engineState.memorize;
    const bat = engineState.battle;
    return {
      phase: engineState.phase,
      subState: engineState.subState,
      mode: engineState.mode,
      battleStyle: engineState.battleStyle,
      round: engineState.round,
      totalRounds: getTotalRounds(),
      totalWords: getTotalWords(),
      roundMeta: cloneShallow(engineState.roundMeta),
      memorize: {
        words: mem.words.map(cloneShallow),
        totalSec: mem.totalSec,
        remainingSec: mem.remainingSec,
        remainingMs: mem.remainingMs,
        extensionsLeft: mem.extensionsLeft,
        studiedIds: mem.studiedIds.slice(),
        roundPinnedIds: mem.roundPinnedIds.slice(),
        earlyStartPreview: getEarlyStartPreview()
      },
      battle: {
        wave: bat.wave,
        waveTitle: bat.waveTitle,
        questionIndex: bat.questionIndex,
        totalQuestions: bat.queue.length,
        currentQuestion: sanitizeQuestionForView(bat.currentQuestion),
        remainingSec: bat.remainingSec,
        remainingMs: bat.remainingMs,
        totalSec: bat.totalSec,
        score: bat.score,
        combo: bat.combo,
        maxCombo: bat.maxCombo,
        comboMultiplier: bat.comboMultiplier,
        earlyScoreMultiplier: bat.earlyScoreMultiplier,
        earlyBonusPoints: bat.earlyBonusPoints,
        feverGauge: bat.feverGauge,
        feverActive: bat.feverActive,
        feverRemainingMs: bat.feverRemainingMs,
        shields: bat.shields,
        hearts: bat.hearts,
        maxHearts: bat.maxHearts,
        hintsRemaining: bat.hintsRemaining,
        correctCount: bat.correctCount,
        wrongCount: bat.wrongCount,
        totalAnswered: bat.totalAnswered,
        lastFeedback: cloneShallow(bat.lastFeedback)
      },
      result: engineState.result ? cloneShallow(engineState.result) : null
    };
  }

  function emitStateChange(prevPhase) {
    const snap = getState();
    emit(
      'stateChange',
      Object.assign({}, snap, {
        prevPhase: prevPhase || snap.phase,
        state: snap
      })
    );
    return snap;
  }

  function transitionState(nextPhase, nextSubState) {
    const prevPhase = engineState.phase;
    engineState.phase = nextPhase;
    engineState.subState = nextSubState;
    return emitStateChange(prevPhase);
  }

  // ---------------------------------------------------------------------------
  // Question Builders (Wave 1 N5 Quiz, Wave 2 Sakura Matrix, Wave 3 Kana Shards)
  // ---------------------------------------------------------------------------
  let questionSeq = 0;

  function buildMultipleChoiceQuestion(wordObj, requestedSubType, waveNum, waveTitle, flags, roundWords) {
    questionSeq += 1;
    const f = flags || {};
    let qSubType = requestedSubType || 'jp-to-ko';

    // Pure Hiragana/Katakana guard: never ask kanji-to-kana when kanji === ""!
    if (qSubType === 'kanji-to-kana' && !hasKanjiInWord(wordObj)) {
      qSubType = questionSeq % 2 === 0 ? 'jp-to-ko' : 'ko-to-jp';
    }

    const isListening = qSubType === 'audio-to-ko';
    const qType = isListening ? 'listening' : 'multiple-choice';
    const expr = getWordDisplayExpression(wordObj);
    const ruby = wordObj.rubyHtml || expr;
    const allWords = getAllWords();
    const distractorPool = allWords.length >= 10 ? allWords : roundWords;

    let options = [];
    let prompt = expr;
    let promptHtml = ruby;
    let subPrompt = (wordObj.pos ? wordObj.pos + ' · ' : '') + '알맞은 정답을 선택하세요';

    if (qSubType === 'kanji-to-kana') {
      const pureKanji = String(wordObj.kanji || expr).trim();
      prompt = pureKanji;
      // CRITICAL: No <ruby><rt> furigana on promptHtml during kanji-to-kana!
      promptHtml = pureKanji;
      subPrompt = '한자의 정확한 히라가나 읽기를 고르세요 (' + (wordObj.pos || 'N5 필수') + ')';

      const kanaDistractors = getSmartKanaDistractors(wordObj, 3);
      const rawKanaChoices = shuffleArray(
        [{ kana: wordObj.kana, isCorrect: true }].concat(
          kanaDistractors.map(function (kd) {
            return { kana: kd, isCorrect: false };
          })
        )
      );
      options = rawKanaChoices.map(function (item, idx) {
        return {
          id: 'opt_' + idx,
          index: idx,
          wordId: item.isCorrect ? wordObj.id : null,
          label: item.kana,
          labelHtml: item.kana,
          kana: item.kana,
          expression: item.kana,
          meaning: item.isCorrect ? wordObj.meaning : '',
          subLabel: wordObj.pos || '',
          isCorrect: Boolean(item.isCorrect),
          eliminated: false
        };
      });
    } else {
      const distractors = getSmartDistractors(wordObj, 3, distractorPool);
      const rawChoices = shuffleArray([wordObj].concat(distractors));
      const askKorean = qSubType === 'jp-to-ko' || qSubType === 'audio-to-ko';

      options = rawChoices.map(function (item, idx) {
        const itemExpr = getWordDisplayExpression(item);
        const itemRuby = item.rubyHtml || itemExpr;
        return {
          id: 'opt_' + idx,
          index: idx,
          wordId: item.id,
          label: askKorean ? item.meaning : itemExpr,
          labelHtml: askKorean ? item.meaning : itemRuby,
          kana: item.kana || '',
          expression: itemExpr,
          meaning: item.meaning || '',
          subLabel: askKorean ? (item.pos || '') : (item.pos || ''),
          isCorrect: Number(item.id) === Number(wordObj.id),
          eliminated: false
        };
      });

      if (qSubType === 'jp-to-ko') {
        prompt = expr;
        promptHtml = ruby;
        subPrompt = (wordObj.koPron ? '[' + wordObj.koPron + '] · ' : '') + (wordObj.pos || '');
      } else if (qSubType === 'ko-to-jp') {
        prompt = wordObj.meaning;
        promptHtml = wordObj.meaning;
        subPrompt = '뜻에 알맞은 일본어 어휘를 고르세요 (' + (wordObj.pos || '') + ')';
      } else if (qSubType === 'cloze') {
        const blankEx = getBlankExample(wordObj, '［　　］');
        prompt = blankEx;
        promptHtml = blankEx;
        subPrompt = wordObj.exampleKo || ('뜻: ' + wordObj.meaning);
      } else if (qSubType === 'audio-to-ko') {
        prompt = '🔊 일본어 발음을 듣고 알맞은 뜻을 고르세요!';
        promptHtml = prompt;
        subPrompt = (wordObj.emoji ? wordObj.emoji + ' ' : '') + '품사: ' + (wordObj.pos || 'N5');
      }
    }

    const timeLimit = f.isBoss ? CONFIG.TIME_LIMITS['boss'] : (CONFIG.TIME_LIMITS[qSubType] || 11);

    return {
      id: 'q_' + questionSeq,
      wordId: wordObj.id,
      wave: waveNum,
      waveTitle: waveTitle,
      type: qType,
      subType: qSubType,
      timeLimitSec: timeLimit,
      word: cloneShallow(wordObj),
      isPinned: Boolean(f.isPinned),
      isRevenge: Boolean(f.isRevenge),
      isBoss: Boolean(f.isBoss),
      prompt: prompt,
      promptHtml: promptHtml,
      revealRubyHtml: ruby,
      subPrompt: subPrompt,
      emoji: wordObj.emoji || '🌸',
      pos: wordObj.pos || '',
      kana: wordObj.kana || '',
      romaji: wordObj.romaji || '',
      koPron: wordObj.koPron || '',
      koInitials: getKoreanInitials(wordObj.meaning),
      options: options
    };
  }

  function buildPairMatchQuestion(wordsSubset, waveNum, waveTitle, roundPinnedSet, preferReadingPairs) {
    questionSeq += 1;
    const uniqueWords = [];
    const seenExprs = new Set();
    const seenMeanings = new Set();

    for (let i = 0; i < wordsSubset.length && uniqueWords.length < 5; i++) {
      const w = wordsSubset[i];
      if (!w) continue;
      const expr = getWordDisplayExpression(w);
      if (seenExprs.has(expr) || seenMeanings.has(w.meaning)) continue;
      seenExprs.add(expr);
      seenMeanings.add(w.meaning);
      uniqueWords.push(w);
    }

    const allHaveKanji = preferReadingPairs && uniqueWords.every(hasKanjiInWord);
    const subType = allHaveKanji ? 'kanji-kana-5x2' : 'matrix-5x2';
    const tiles = [];

    for (let i = 0; i < uniqueWords.length; i++) {
      const w = uniqueWords[i];
      const expr = getWordDisplayExpression(w);
      const pinned = roundPinnedSet && roundPinnedSet.has(Number(w.id));

      tiles.push({
        tileId: 'pm_jp_' + w.id,
        wordId: w.id,
        side: 'jp',
        label: allHaveKanji ? w.kanji : expr,
        labelHtml: allHaveKanji ? w.kanji : (w.rubyHtml || expr),
        kana: w.kana || '',
        pos: w.pos || '',
        emoji: w.emoji || '🌸',
        isPinned: Boolean(pinned),
        matched: false,
        selected: false
      });

      tiles.push({
        tileId: 'pm_ko_' + w.id,
        wordId: w.id,
        side: 'ko',
        label: allHaveKanji ? w.kana : w.meaning,
        labelHtml: allHaveKanji ? w.kana : w.meaning,
        kana: w.kana || '',
        pos: w.pos || '',
        emoji: w.emoji || '🌸',
        isPinned: Boolean(pinned),
        matched: false,
        selected: false
      });
    }

    return {
      id: 'q_' + questionSeq,
      wave: waveNum,
      waveTitle: waveTitle,
      type: 'pair-match',
      subType: subType,
      timeLimitSec: CONFIG.TIME_LIMITS['pair-match'],
      word: cloneShallow(uniqueWords[0] || null),
      words: uniqueWords.map(cloneShallow),
      totalPairs: uniqueWords.length,
      matchedPairIds: [],
      selectedTileId: null,
      hintPairWordId: null,
      isPinned: false,
      isRevenge: false,
      isBoss: false,
      prompt: allHaveKanji
        ? '한자 표기와 정확한 히라가나 읽기 타일 짝을 연결하세요!'
        : '일본어 어휘와 한국어 뜻 유리 타일 짝을 모두 연결하세요!',
      subPrompt: '연속 매칭 시 콤보 & SAKURA FEVER 게이지가 급속 충전됩니다!',
      emoji: '🌸',
      pos: '',
      tiles: shuffleArray(tiles)
    };
  }

  function buildDistractorMorae(targetUnits, isKata) {
    const distractorCount = targetUnits.length >= 6 ? 2 : 3;
    const presentSet = new Set(targetUnits);
    const candidates = [];

    // 1. Confusing phonological counterparts of morae in the word
    for (let i = 0; i < targetUnits.length; i++) {
      const m = targetUnits[i];
      const hiraBase = kataToHira(m[0]);
      if (DAKUTEN_SWAP[hiraBase]) {
        const swappedHira = DAKUTEN_SWAP[hiraBase] + kataToHira(m.slice(1));
        const swapped = isKata ? hiraToKata(swappedHira) : swappedHira;
        if (!presentSet.has(swapped)) candidates.push(swapped);
      }
    }

    // 2. High-value N5 trap morae (long vowels, sokuon, general pool)
    const basePool = isKata ? KATAKANA_DISTRACTOR_POOL : HIRAGANA_DISTRACTOR_POOL;
    const poolShuffled = shuffleArray(basePool);
    for (let i = 0; i < poolShuffled.length; i++) {
      if (!presentSet.has(poolShuffled[i])) {
        candidates.push(poolShuffled[i]);
      }
    }

    const uniqueDistractors = [];
    const seen = new Set(targetUnits);
    for (let i = 0; i < candidates.length && uniqueDistractors.length < distractorCount; i++) {
      if (!seen.has(candidates[i])) {
        seen.add(candidates[i]);
        uniqueDistractors.push(candidates[i]);
      }
    }
    return uniqueDistractors;
  }

  function buildKanaSpellingQuestion(wordObj, waveNum, waveTitle, flags) {
    questionSeq += 1;
    const f = flags || {};
    const targetKana = String(wordObj.kana || wordObj.expression || '').trim();
    const targetUnits = splitMorae(targetKana);
    const isKata = isMostlyKatakana(targetKana);
    const distractors = buildDistractorMorae(targetUnits, isKata);

    const rawShards = [];
    for (let i = 0; i < targetUnits.length; i++) {
      const prev = i > 0 ? targetUnits[i - 1] : null;
      rawShards.push({
        char: targetUnits[i],
        mora: targetUnits[i],
        romajiHint: getPrimaryRomajiForMora(targetUnits[i], prev),
        isDistractor: false
      });
    }
    for (let j = 0; j < distractors.length; j++) {
      rawShards.push({
        char: distractors[j],
        mora: distractors[j],
        romajiHint: getPrimaryRomajiForMora(distractors[j], null),
        isDistractor: true
      });
    }

    const shuffledShards = shuffleArray(rawShards).map(function (item, idx) {
      return {
        shardId: 'sh_' + idx,
        char: item.char,
        mora: item.mora,
        romajiHint: item.romajiHint,
        used: false,
        isDistractor: item.isDistractor
      };
    });

    const blankEx = getBlankExample(wordObj, '［　　］');
    const kanjiHint = hasKanjiInWord(wordObj) ? String(wordObj.kanji).trim() : '';

    return {
      id: 'q_' + questionSeq,
      wordId: wordObj.id,
      wave: waveNum,
      waveTitle: waveTitle,
      type: 'kana-spelling',
      subType: 'kana-shard',
      timeLimitSec: f.isBoss ? CONFIG.TIME_LIMITS['kana-spelling'] + 3 : CONFIG.TIME_LIMITS['kana-spelling'],
      word: cloneShallow(wordObj),
      kanjiHint: kanjiHint,
      revealRubyHtml: wordObj.rubyHtml || getWordDisplayExpression(wordObj),
      targetKana: targetKana,
      targetWord: targetKana,
      targetRomaji: String(wordObj.romaji || '').trim().toLowerCase(),
      targetUnits: targetUnits,
      targetLength: targetUnits.length,
      blankExample: blankEx,
      exampleKo: wordObj.exampleKo || '',
      enteredShardIds: [],
      enteredUnits: [],
      enteredText: '',
      romajiBuffer: '',
      romajiPreviewKana: targetUnits[0] || '',
      shards: shuffledShards,
      isPinned: Boolean(f.isPinned),
      isRevenge: Boolean(f.isRevenge),
      isBoss: Boolean(f.isBoss),
      prompt: wordObj.meaning,
      promptHtml: wordObj.meaning,
      subPrompt: blankEx,
      emoji: wordObj.emoji || '🌸',
      pos: wordObj.pos || '',
      kana: targetKana,
      romaji: wordObj.romaji || '',
      koPron: wordObj.koPron || ''
    };
  }

  function buildRoundBattleQueue(roundWords, roundPinnedIds, rawBattleStyle, roundNum, mode) {
    const battleStyle = normalizeBattleStyle(rawBattleStyle);
    const pinnedSet = new Set((roundPinnedIds || []).map(Number));
    const shuffled = shuffleArray(roundWords);
    const queue = [];

    function flagsFor(w, extra) {
      return Object.assign(
        {
          isPinned: pinnedSet.has(Number(w.id)) || Boolean(w.isRevengeTarget),
          isRevenge: Boolean(w.isRevengeTarget),
          isBoss: false
        },
        extra || {}
      );
    }

    if (battleStyle === 'quiz-only') {
      const subTypes = ['kanji-to-kana', 'jp-to-ko', 'ko-to-jp', 'cloze', 'audio-to-ko'];
      for (let i = 0; i < shuffled.length; i++) {
        const w = shuffled[i];
        queue.push(
          buildMultipleChoiceQuestion(
            w,
            subTypes[i % subTypes.length],
            1,
            'WAVE 1 · 스피드 N5 실전 퀴즈',
            flagsFor(w),
            roundWords
          )
        );
      }
    } else if (battleStyle === 'reading-only') {
      const wave1Part = shuffled.slice(0, Math.min(6, shuffled.length));
      for (let i = 0; i < wave1Part.length; i++) {
        const w = wave1Part[i];
        const st = hasKanjiInWord(w) ? 'kanji-to-kana' : 'jp-to-ko';
        queue.push(
          buildMultipleChoiceQuestion(w, st, 1, 'WAVE 1 · 한자 후리가나 특훈', flagsFor(w), roundWords)
        );
      }
      const wave2Part = shuffled.slice(Math.min(6, shuffled.length));
      for (let j = 0; j < wave2Part.length; j++) {
        const kw = wave2Part[j];
        queue.push(
          buildKanaSpellingQuestion(kw, 2, 'WAVE 2 · 가나 모라 샤드 특훈', flagsFor(kw))
        );
      }
    } else if (battleStyle === 'match-only') {
      if (shuffled.length >= 5) {
        queue.push(buildPairMatchQuestion(shuffled.slice(0, 5), 1, 'WAVE 1 · 사쿠라 매트릭스 I', pinnedSet, false));
      }
      if (shuffled.length > 5) {
        queue.push(buildPairMatchQuestion(shuffled.slice(5, 10), 2, 'WAVE 2 · 사쿠라 매트릭스 II', pinnedSet, false));
      } else if (shuffled.length > 0 && queue.length === 0) {
        queue.push(buildPairMatchQuestion(shuffled, 1, 'WAVE 1 · 사쿠라 매트릭스', pinnedSet, false));
      }
    } else if (battleStyle === 'kana-only') {
      for (let i = 0; i < shuffled.length; i++) {
        const w = shuffled[i];
        queue.push(
          buildKanaSpellingQuestion(w, 1, 'WAVE 1 · 가나 크리스탈 샤드 챌린지', flagsFor(w))
        );
      }
    } else {
      // Flagship 'prism-mix': 3-Wave N5 Multi-Minigame Loop!
      // Sort first 6 so kanji words naturally take the `kanji-to-kana` slots when available
      const wave1Raw = shuffled.slice(0, Math.min(6, shuffled.length));
      const kanjiFirst = wave1Raw.filter(hasKanjiInWord).concat(
        wave1Raw.filter(function (w) { return !hasKanjiInWord(w); })
      );
      const wave1Plan = ['kanji-to-kana', 'jp-to-ko', 'ko-to-jp', 'cloze', 'audio-to-ko', 'kanji-to-kana'];
      // Place up to 2 kanji words onto indices 0 and 5 if available
      const arrangedWave1 = new Array(kanjiFirst.length);
      let kCursor = 0;
      const slotOrder = [0, 5, 1, 2, 3, 4];
      for (let s = 0; s < slotOrder.length; s++) {
        const idx = slotOrder[s];
        if (idx < arrangedWave1.length && kCursor < kanjiFirst.length) {
          arrangedWave1[idx] = kanjiFirst[kCursor++];
        }
      }

      for (let i = 0; i < arrangedWave1.length; i++) {
        const w = arrangedWave1[i];
        queue.push(
          buildMultipleChoiceQuestion(
            w,
            wave1Plan[i % wave1Plan.length],
            1,
            'WAVE 1 · 스피드 N5 실전 퀴즈',
            flagsFor(w),
            roundWords
          )
        );
      }

      // Wave 2: 5x2 Sakura Glass Matrix Pair Match covering words [5..9] (ensures all 10 words are tested!)
      const matchStart = Math.max(0, shuffled.length - 5);
      const wave2Words = shuffled.slice(matchStart, matchStart + 5);
      if (wave2Words.length >= 2) {
        queue.push(
          buildPairMatchQuestion(wave2Words, 2, 'WAVE 2 · 사쿠라 매트릭스 매칭', pinnedSet, false)
        );
      }

      // Wave 3: 3 Kana Crystal Shard Strikes prioritizing pinned words + back-half words
      const kanaCandidates = [];
      const addedKanaIds = new Set();

      for (let i = 0; i < shuffled.length; i++) {
        if (pinnedSet.has(Number(shuffled[i].id)) && !addedKanaIds.has(shuffled[i].id)) {
          kanaCandidates.push(shuffled[i]);
          addedKanaIds.add(shuffled[i].id);
        }
      }
      for (let i = shuffled.length - 1; i >= 0; i--) {
        if (!addedKanaIds.has(shuffled[i].id)) {
          kanaCandidates.push(shuffled[i]);
          addedKanaIds.add(shuffled[i].id);
        }
      }

      const wave3Words = kanaCandidates.slice(0, Math.min(3, kanaCandidates.length));
      for (let i = 0; i < wave3Words.length; i++) {
        const kw = wave3Words[i];
        queue.push(
          buildKanaSpellingQuestion(kw, 3, 'WAVE 3 · 가나 크리스탈 샤드 타격', flagsFor(kw))
        );
      }
    }

    // Finale Boss / Spaced-Repetition Revenge Encounter!
    const ls = getLS();
    let externalRevengeWords = [];
    if (mode === 'campaign' && ls && typeof ls.getRevengeWords === 'function') {
      try {
        const rev = ls.getRevengeWords(roundNum, 1);
        if (Array.isArray(rev)) {
          const roundIdSet = new Set(roundWords.map(function (rw) { return Number(rw.id); }));
          externalRevengeWords = rev.filter(function (rw) {
            return rw && (rw.expression || rw.kana) && !roundIdSet.has(Number(rw.id));
          });
        }
      } catch (_e) {
        externalRevengeWords = [];
      }
    }

    if (externalRevengeWords.length > 0) {
      const revWord = externalRevengeWords[0];
      const bossSubType = hasKanjiInWord(revWord) ? 'kanji-to-kana' : 'cloze';
      queue.push(
        buildMultipleChoiceQuestion(
          revWord,
          bossSubType,
          3,
          'FINAL BOSS · 리벤지 사쿠라 보스',
          { isPinned: isWordGloballyPinned(revWord.id), isRevenge: true, isBoss: true },
          roundWords
        )
      );
    } else if (shuffled.length > 0) {
      const bossCandidate = shuffled
        .slice()
        .sort(function (a, b) {
          const aPin = pinnedSet.has(Number(a.id)) ? 1 : 0;
          const bPin = pinnedSet.has(Number(b.id)) ? 1 : 0;
          if (bPin !== aPin) return bPin - aPin;
          const aKanji = hasKanjiInWord(a) ? 1 : 0;
          const bKanji = hasKanjiInWord(b) ? 1 : 0;
          if (bKanji !== aKanji) return bKanji - aKanji;
          return String(b.kana || '').length - String(a.kana || '').length;
        })[0];

      const bossSubType = hasKanjiInWord(bossCandidate) ? 'kanji-to-kana' : 'ko-to-jp';
      queue.push(
        buildMultipleChoiceQuestion(
          bossCandidate,
          bossSubType,
          3,
          'FINAL BOSS · 크라운 N5 보스',
          flagsFor(bossCandidate, { isBoss: true }),
          roundWords
        )
      );
    }

    return reindexQueue(queue);
  }

  function buildSurvivalChunk(levelFilter, chunkIndex) {
    const all = getAllWords();
    const filtered = (levelFilter && levelFilter !== 'all')
      ? all.filter(function (w) { return Number(w.level) === Number(levelFilter); })
      : all;
    const pool = filtered.length >= 10 ? filtered : all;
    const picked = shuffleArray(pool).slice(0, 8);
    const waveNum = chunkIndex + 1;
    const waveTitle = 'SURVIVAL WAVE ' + waveNum;
    const chunk = [];

    if (picked.length >= 3) {
      const subTypes = ['kanji-to-kana', 'jp-to-ko', 'ko-to-jp', 'cloze', 'audio-to-ko'];
      for (let i = 0; i < 3; i++) {
        const w = picked[i];
        chunk.push(
          buildMultipleChoiceQuestion(
            w,
            subTypes[(chunkIndex + i) % subTypes.length],
            waveNum,
            waveTitle,
            { isPinned: isWordGloballyPinned(w.id), isRevenge: false, isBoss: false },
            pool
          )
        );
      }
    }
    if (picked.length >= 8) {
      chunk.push(buildPairMatchQuestion(picked.slice(3, 8), waveNum, waveTitle + ' · 매트릭스', new Set(), false));
    }
    if (picked[0]) {
      chunk.push(
        buildKanaSpellingQuestion(picked[0], waveNum, waveTitle + ' · 보스 가나 샤드', {
          isPinned: isWordGloballyPinned(picked[0].id),
          isBoss: true
        })
      );
    }
    return chunk;
  }

  function reindexQueue(queue) {
    for (let i = 0; i < queue.length; i++) {
      queue[i].index = i;
      queue[i].number = i + 1;
      queue[i].total = queue.length;
    }
    return queue;
  }

  // ---------------------------------------------------------------------------
  // Master Tick Loop (Unified Single Interval — Zero Leak Guarantee)
  // ---------------------------------------------------------------------------
  function startMasterLoop() {
    if (timers.loopId !== null) {
      clearInterval(timers.loopId);
    }
    timers.lastTickAt = Date.now();
    timers.loopId = setInterval(onMasterTick, CONFIG.TICK_INTERVAL_MS);
  }

  function onMasterTick() {
    const now = Date.now();
    const rawDt = now - timers.lastTickAt;
    timers.lastTickAt = now;
    const dt = Math.max(0, Math.min(CONFIG.MAX_DELTA_MS, rawDt));

    if (engineState.phase === 'MEMORIZE' && engineState.subState === 'STUDYING') {
      const mem = engineState.memorize;
      mem.remainingMs = Math.max(0, mem.remainingMs - dt);
      const nextSec = Math.ceil(mem.remainingMs / 1000);

      if (nextSec !== mem.remainingSec && nextSec > 0 && nextSec <= 5) {
        playSfx('tick');
      }
      mem.remainingSec = nextSec;

      emit('memorizeTick', {
        remainingMs: mem.remainingMs,
        remainingSec: mem.remainingSec,
        totalSec: mem.totalSec,
        progressRatio: mem.totalSec > 0 ? mem.remainingMs / (mem.totalSec * 1000) : 0,
        earlyBonusPreview: getEarlyStartPreview()
      });

      if (mem.remainingMs <= 0) {
        startBattleFromMemorize({ autoExpired: true });
      }
      return;
    }

    if (engineState.phase === 'BATTLE' && engineState.subState === 'PLAYING') {
      const bat = engineState.battle;

      if (bat.feverActive) {
        bat.feverRemainingMs = Math.max(0, bat.feverRemainingMs - dt);
        if (bat.feverRemainingMs <= 0) {
          bat.feverActive = false;
          bat.feverGauge = 0;
          emit('feverEnd', { score: bat.score });
        }
      }

      const effectiveDt = bat.feverActive ? dt * CONFIG.FEVER_TIME_DILATION : dt;
      bat.remainingMs = Math.max(0, bat.remainingMs - effectiveDt);
      const nextSec = Math.ceil(bat.remainingMs / 1000);

      if (nextSec !== bat.lastTickSecondBeeped && nextSec > 0 && nextSec <= 5) {
        bat.lastTickSecondBeeped = nextSec;
        playSfx('tick');
      }
      bat.remainingSec = nextSec;

      emit('battleTick', {
        remainingMs: bat.remainingMs,
        remainingSec: bat.remainingSec,
        totalSec: bat.totalSec,
        progressRatio: bat.totalSec > 0 ? bat.remainingMs / (bat.totalSec * 1000) : 0,
        feverActive: bat.feverActive,
        feverRemainingMs: bat.feverRemainingMs,
        feverGauge: bat.feverGauge
      });

      if (bat.remainingMs <= 0) {
        handleQuestionTimeout();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Phase 1: Mode Starters & Memorize Controls
  // ---------------------------------------------------------------------------
  function enrichWordsForMemorize(rawWords, prePinnedSet) {
    return rawWords.map(function (w) {
      const prog = getWordProgressSafe(w.id);
      const pinned = prePinnedSet ? prePinnedSet.has(Number(w.id)) : Boolean(prog.pinned);
      return Object.assign({}, w, {
        pinned: pinned,
        box: prog.box || 0,
        status: prog.status || 'unseen',
        studied: false
      });
    });
  }

  function resolveMemorizeSec(opts) {
    if (opts && typeof opts.memorizeSec === 'number') {
      return Math.max(CONFIG.MIN_MEMORIZE_SEC, Math.min(CONFIG.MAX_MEMORIZE_SEC, Math.round(opts.memorizeSec)));
    }
    const ls = getLS();
    if (ls && typeof ls.getSettings === 'function') {
      try {
        const s = ls.getSettings();
        if (s && typeof s.memorizeSec === 'number') {
          return Math.max(CONFIG.MIN_MEMORIZE_SEC, Math.min(CONFIG.MAX_MEMORIZE_SEC, Math.round(s.memorizeSec)));
        }
      } catch (_e) {
        // Fallback below
      }
    }
    return CONFIG.DEFAULT_MEMORIZE_SEC;
  }

  function startCampaignRound(roundNumber, options) {
    const opts = options || {};
    clearAllTimers();

    const maxRounds = getTotalRounds();
    const rNum = Math.max(1, Math.min(maxRounds, Number(roundNumber) || 1));
    const roundWords = getWordsByRound(rNum);
    if (!roundWords || roundWords.length === 0) {
      emit('notice', {
        level: 'warning',
        code: 'EMPTY_ROUND_DATA',
        message: '라운드 단어 데이터를 불러오지 못했습니다.'
      });
      return { ok: false, reason: 'EMPTY_ROUND_DATA' };
    }

    engineState = createInitialEngineState();
    engineState.mode = 'campaign';
    engineState.battleStyle = normalizeBattleStyle(opts.battleStyle);
    engineState.autoSubmitKana = opts.autoSubmitKana !== false && opts.autoSubmitSpelling !== false;
    engineState.round = rNum;
    engineState.roundMeta = getRoundMeta(rNum);
    engineState.startedAt = Date.now();

    const initialPinnedIds = [];
    for (let i = 0; i < roundWords.length && initialPinnedIds.length < CONFIG.MAX_ROUND_PINS; i++) {
      if (isWordGloballyPinned(roundWords[i].id)) {
        initialPinnedIds.push(Number(roundWords[i].id));
      }
    }
    const pinnedSet = new Set(initialPinnedIds);

    const memSec = resolveMemorizeSec(opts);
    engineState.memorize = {
      words: enrichWordsForMemorize(roundWords, pinnedSet),
      initialTotalMs: memSec * 1000,
      totalSec: memSec,
      remainingMs: memSec * 1000,
      remainingSec: memSec,
      extensionsLeft: CONFIG.MAX_EXTENSIONS,
      studiedIds: [],
      roundPinnedIds: initialPinnedIds
    };

    if (opts.skipMemorize) {
      engineState.phase = 'MEMORIZE';
      engineState.subState = 'STUDYING';
      engineState.memorize.remainingMs = 0;
      engineState.memorize.remainingSec = 0;
      return startBattleFromMemorize({ skipped: true });
    }

    const snap = transitionState('MEMORIZE', 'STUDYING');
    startMasterLoop();
    return { ok: true, state: snap };
  }

  function canStartRevenge() {
    const ls = getLS();
    let wrongWords = [];
    let pinnedWords = [];

    if (ls) {
      try {
        if (typeof ls.getWrongWords === 'function') wrongWords = ls.getWrongWords(50) || [];
        else if (typeof ls.getWrongWordIds === 'function') {
          wrongWords = (ls.getWrongWordIds() || []).map(getWordById).filter(Boolean);
        }
        if (typeof ls.getPinnedWords === 'function') pinnedWords = ls.getPinnedWords() || [];
        else if (typeof ls.getPinnedWordIds === 'function') {
          pinnedWords = (ls.getPinnedWordIds() || []).map(getWordById).filter(Boolean);
        }
      } catch (_e) {
        // Fallback below
      }
    } else {
      wrongWords = Array.from(fallbackStore.wrongIds).map(getWordById).filter(Boolean);
      pinnedWords = Array.from(fallbackStore.pins).map(getWordById).filter(Boolean);
    }

    const combinedMap = new Map();
    for (let i = 0; i < wrongWords.length; i++) {
      if (wrongWords[i]) combinedMap.set(Number(wrongWords[i].id), wrongWords[i]);
    }
    for (let j = 0; j < pinnedWords.length; j++) {
      if (pinnedWords[j]) combinedMap.set(Number(pinnedWords[j].id), pinnedWords[j]);
    }

    const weakCount = combinedMap.size;
    const recRound = getRecommendedNextRound();

    return {
      available: weakCount > 0,
      weakCount: weakCount,
      wrongCount: wrongWords.length,
      pinnedCount: pinnedWords.length,
      weakWords: Array.from(combinedMap.values()),
      recommendedRound: recRound,
      message: weakCount > 0
        ? '약점/별표 어휘 ' + weakCount + '개로 리벤지 복수 도장에 입장합니다!'
        : '아직 틀리거나 ⭐별표 친 어휘가 없어요! 추천 캠페인 Round ' + recRound + '부터 도전해 보세요!'
    };
  }

  function startRevengeMode(options) {
    const opts = options || {};
    const status = canStartRevenge();

    if (!status.available && !opts.allowFallback) {
      emit('notice', {
        level: 'info',
        code: 'NO_WEAK_WORDS',
        message: status.message,
        data: { recommendedRound: status.recommendedRound }
      });
      return {
        ok: false,
        reason: 'NO_WEAK_WORDS',
        message: status.message,
        recommendedRound: status.recommendedRound
      };
    }

    clearAllTimers();

    const selected = shuffleArray(status.weakWords).slice(0, 10).map(function (w) {
      return Object.assign({}, w, { isRevengeTarget: true });
    });
    const usedIds = new Set(selected.map(function (w) { return Number(w.id); }));

    if (selected.length < 10) {
      const fillerPool = shuffleArray(getWordsByRound(status.recommendedRound).concat(getAllWords()));
      for (let i = 0; i < fillerPool.length && selected.length < 10; i++) {
        const cand = fillerPool[i];
        if (cand && !usedIds.has(Number(cand.id))) {
          usedIds.add(Number(cand.id));
          selected.push(Object.assign({}, cand, { isRevengeTarget: false }));
        }
      }
    }

    engineState = createInitialEngineState();
    engineState.mode = 'revenge';
    engineState.battleStyle = normalizeBattleStyle(opts.battleStyle);
    engineState.autoSubmitKana = opts.autoSubmitKana !== false && opts.autoSubmitSpelling !== false;
    engineState.round = status.recommendedRound || 1;
    engineState.roundMeta = {
      round: 0,
      level: 2,
      title: '리벤지 사쿠라 도장 (약점 어휘 집중 격파)',
      emoji: '🔥',
      wordIds: selected.map(function (w) { return w.id; })
    };
    engineState.startedAt = Date.now();

    const initialPins = selected
      .filter(function (w) { return isWordGloballyPinned(w.id); })
      .slice(0, CONFIG.MAX_ROUND_PINS)
      .map(function (w) { return Number(w.id); });

    const memSec = resolveMemorizeSec(opts);
    engineState.memorize = {
      words: enrichWordsForMemorize(selected, new Set(initialPins)),
      initialTotalMs: memSec * 1000,
      totalSec: memSec,
      remainingMs: memSec * 1000,
      remainingSec: memSec,
      extensionsLeft: CONFIG.MAX_EXTENSIONS,
      studiedIds: [],
      roundPinnedIds: initialPins
    };

    if (opts.skipMemorize) {
      engineState.phase = 'MEMORIZE';
      engineState.subState = 'STUDYING';
      engineState.memorize.remainingMs = 0;
      engineState.memorize.remainingSec = 0;
      return startBattleFromMemorize({ skipped: true });
    }

    const snap = transitionState('MEMORIZE', 'STUDYING');
    startMasterLoop();
    return { ok: true, state: snap };
  }

  function startSurvivalMode(options) {
    const opts = options || {};
    clearAllTimers();

    const all = getAllWords();
    if (!all || all.length === 0) {
      return { ok: false, reason: 'EMPTY_WORD_DATA' };
    }

    engineState = createInitialEngineState();
    engineState.mode = 'survival';
    engineState.survivalLevel = opts.level || 'all';
    engineState.battleStyle = 'prism-mix';
    engineState.autoSubmitKana = opts.autoSubmitKana !== false && opts.autoSubmitSpelling !== false;
    engineState.round = 1;
    engineState.roundMeta = {
      round: 0,
      level: opts.level === 'all' || !opts.level ? 3 : Number(opts.level),
      title: '무한 N5 서바이벌 블리츠',
      emoji: '⚡',
      wordIds: []
    };
    engineState.startedAt = Date.now();

    engineState.battle.hearts = CONFIG.SURVIVAL_HEARTS;
    engineState.battle.maxHearts = CONFIG.SURVIVAL_HEARTS;
    engineState.battle.shields = CONFIG.INITIAL_SHIELDS;
    engineState.battle.hintsRemaining = 3;
    engineState.battle.queue = reindexQueue(buildSurvivalChunk(engineState.survivalLevel, 0));

    transitionState('BATTLE', 'PLAYING');
    activateCurrentQuestion(true);
    startMasterLoop();
    return { ok: true, state: getState() };
  }

  function extendMemorizeTime(extraSec) {
    if (engineState.phase !== 'MEMORIZE' || engineState.subState !== 'STUDYING') {
      return { ok: false, reason: 'NOT_IN_MEMORIZE' };
    }
    const mem = engineState.memorize;
    if (mem.extensionsLeft <= 0) {
      emit('notice', {
        level: 'warning',
        code: 'NO_EXTENSIONS_LEFT',
        message: '암기 시간 연장은 라운드당 1회만 사용할 수 있어요!'
      });
      return { ok: false, reason: 'NO_EXTENSIONS_LEFT', extensionsLeft: 0 };
    }
    const add = Math.max(5, Number(extraSec) || CONFIG.EXTEND_SEC);
    mem.extensionsLeft -= 1;
    mem.totalSec += add;
    mem.remainingMs += add * 1000;
    mem.remainingSec = Math.ceil(mem.remainingMs / 1000);

    emit('memorizeExtended', {
      addedSec: add,
      remainingSec: mem.remainingSec,
      totalSec: mem.totalSec,
      extensionsLeft: mem.extensionsLeft
    });
    emitStateChange('MEMORIZE');
    return { ok: true, remainingSec: mem.remainingSec, extensionsLeft: mem.extensionsLeft };
  }

  function markWordStudied(wordId) {
    const idNum = Number(wordId);
    const mem = engineState.memorize;
    if (mem.studiedIds.indexOf(idNum) === -1) {
      mem.studiedIds.push(idNum);
    }
    for (let i = 0; i < mem.words.length; i++) {
      if (Number(mem.words[i].id) === idNum) {
        mem.words[i].studied = true;
      }
    }
    emit('wordStudied', {
      wordId: idNum,
      studiedCount: mem.studiedIds.length,
      totalWords: mem.words.length
    });
    return { ok: true, studiedCount: mem.studiedIds.length };
  }

  function togglePinInRound(wordId) {
    const idNum = Number(wordId);
    const mem = engineState.memorize;

    if (engineState.phase !== 'MEMORIZE') {
      const nextPinned = setWordGlobalPin(idNum, !isWordGloballyPinned(idNum));
      emit('pinUpdated', { wordId: idNum, pinned: nextPinned, pinnedIds: mem.roundPinnedIds.slice() });
      return { ok: true, pinned: nextPinned, roundPinnedIds: mem.roundPinnedIds.slice() };
    }

    const idx = mem.roundPinnedIds.indexOf(idNum);
    if (idx !== -1) {
      mem.roundPinnedIds.splice(idx, 1);
      setWordGlobalPin(idNum, false);
      for (let i = 0; i < mem.words.length; i++) {
        if (Number(mem.words[i].id) === idNum) mem.words[i].pinned = false;
      }
      emit('pinUpdated', {
        wordId: idNum,
        pinned: false,
        pinnedIds: mem.roundPinnedIds.slice(),
        maxPinsReached: false
      });
      return { ok: true, pinned: false, roundPinnedIds: mem.roundPinnedIds.slice() };
    }

    if (mem.roundPinnedIds.length >= CONFIG.MAX_ROUND_PINS) {
      const limitMsg = '라운드 ×2.0 핀 바운티는 최대 ' + CONFIG.MAX_ROUND_PINS + '개 단어까지 지정할 수 있어요!';
      emit('notice', {
        level: 'info',
        code: 'MAX_PINS_IN_ROUND',
        message: limitMsg
      });
      return {
        ok: false,
        reason: 'MAX_PINS_IN_ROUND',
        message: limitMsg,
        limit: CONFIG.MAX_ROUND_PINS,
        pinned: false,
        roundPinnedIds: mem.roundPinnedIds.slice()
      };
    }

    mem.roundPinnedIds.push(idNum);
    setWordGlobalPin(idNum, true);
    for (let i = 0; i < mem.words.length; i++) {
      if (Number(mem.words[i].id) === idNum) mem.words[i].pinned = true;
    }

    emit('pinUpdated', {
      wordId: idNum,
      pinned: true,
      pinnedIds: mem.roundPinnedIds.slice(),
      maxPinsReached: mem.roundPinnedIds.length >= CONFIG.MAX_ROUND_PINS
    });
    return { ok: true, pinned: true, roundPinnedIds: mem.roundPinnedIds.slice() };
  }

  function startBattleFromMemorize(internalOpts) {
    if (engineState.phase !== 'MEMORIZE') {
      return { ok: false, ignored: true, reason: 'NOT_IN_MEMORIZE' };
    }
    const iOpts = internalOpts || {};
    clearAllTimers();

    const preview = (iOpts.autoExpired || iOpts.skipped)
      ? { bonusPoints: 0, scoreMultiplier: 1.0, initialFeverGauge: 0 }
      : getEarlyStartPreview();

    const mem = engineState.memorize;
    const bat = engineState.battle;

    bat.earlyBonusPoints = preview.bonusPoints;
    bat.earlyScoreMultiplier = preview.scoreMultiplier;
    bat.score = preview.bonusPoints;
    bat.feverGauge = preview.initialFeverGauge;
    bat.shields = CONFIG.INITIAL_SHIELDS;
    bat.hintsRemaining = CONFIG.DEFAULT_HINTS;
    bat.questionIndex = 0;
    bat.wave = 0;

    bat.queue = buildRoundBattleQueue(
      mem.words,
      mem.roundPinnedIds,
      engineState.battleStyle,
      engineState.round,
      engineState.mode
    );

    transitionState('BATTLE', 'PLAYING');
    activateCurrentQuestion(true);
    startMasterLoop();
    return { ok: true, earlyBonus: preview, state: getState() };
  }

  // ---------------------------------------------------------------------------
  // Phase 2: Battle Question Lifecycle & Scoring Engine
  // ---------------------------------------------------------------------------
  function activateCurrentQuestion(isFirstInBattle) {
    const bat = engineState.battle;

    if (engineState.mode === 'survival' && bat.questionIndex >= bat.queue.length - 1) {
      const nextChunkIdx = Math.max(1, Math.floor(bat.queue.length / 5));
      const more = buildSurvivalChunk(engineState.survivalLevel, nextChunkIdx);
      bat.queue = reindexQueue(bat.queue.concat(more));
    }

    if (bat.questionIndex >= bat.queue.length) {
      completeBattleRound(true);
      return;
    }

    const q = bat.queue[bat.questionIndex];
    const prevWave = bat.wave;
    bat.currentQuestion = q;
    bat.wave = q.wave;
    bat.waveTitle = q.waveTitle;
    bat.totalSec = q.timeLimitSec || 11;
    bat.remainingMs = bat.totalSec * 1000;
    bat.remainingSec = bat.totalSec;
    bat.lastTickSecondBeeped = -1;
    bat.questionStartedAt = Date.now();
    bat.lastFeedback = null;
    engineState.subState = 'PLAYING';

    if (isFirstInBattle || q.wave !== prevWave) {
      emit('waveStart', {
        waveNumber: q.wave,
        waveTitle: q.waveTitle,
        waveType: q.type,
        questionIndex: bat.questionIndex,
        totalQuestions: bat.queue.length
      });
    }

    emit('questionStart', {
      question: sanitizeQuestionForView(q),
      questionIndex: bat.questionIndex,
      totalQuestions: bat.queue.length,
      waveNumber: q.wave,
      state: getState()
    });

    if (q.type === 'listening' && q.word) {
      speakWordAudio(q.word);
    }
  }

  function calculateAndApplyCorrectScore(basePts, q, includeSpeedBonus) {
    const bat = engineState.battle;
    bat.combo += 1;
    if (bat.combo > bat.maxCombo) {
      bat.maxCombo = bat.combo;
    }
    bat.comboMultiplier = getComboMultiplier(bat.combo);

    let shieldRecharged = false;
    if (bat.combo > 0 && bat.combo % CONFIG.SHIELD_RECHARGE_COMBO === 0 && bat.shields < CONFIG.MAX_SHIELDS) {
      bat.shields += 1;
      shieldRecharged = true;
    }

    const ratio = bat.totalSec > 0 ? Math.max(0, Math.min(1, bat.remainingMs / (bat.totalSec * 1000))) : 0;
    const speedBonus = includeSpeedBonus ? Math.round(ratio * CONFIG.MAX_SPEED_BONUS) : 0;
    const bossBonus = q && q.isBoss ? CONFIG.BASE_POINTS['boss-bonus'] : 0;

    const pinMult = q && q.isPinned ? CONFIG.PIN_BOUNTY_MULTIPLIER : 1.0;
    const revMult = q && q.isRevenge && !q.isPinned ? CONFIG.REVENGE_MULTIPLIER : 1.0;
    const feverMult = bat.feverActive ? CONFIG.FEVER_SCORE_MULTIPLIER : 1.0;
    const earlyMult = bat.earlyScoreMultiplier || 1.0;

    const rawTotal = (basePts + speedBonus + bossBonus) * bat.comboMultiplier * earlyMult * pinMult * revMult * feverMult;
    const pointsEarned = Math.round(rawTotal);
    bat.score += pointsEarned;
    if (q && q.isPinned && pinMult > 1) {
      bat.pinBountyPoints = (bat.pinBountyPoints || 0) + Math.round(pointsEarned * ((pinMult - 1) / pinMult));
    }

    let feverJustActivated = false;
    if (!bat.feverActive) {
      const fastExtra = ratio >= 0.65 ? CONFIG.FEVER_CHARGE_FAST_BONUS : 0;
      const pinExtra = q && q.isPinned ? 10 : 0;
      const gain = (q && q.type === 'pair-match' ? CONFIG.FEVER_CHARGE_PAIR : CONFIG.FEVER_CHARGE_CORRECT) + fastExtra + pinExtra;
      bat.feverGauge = Math.min(100, bat.feverGauge + gain);

      if (bat.feverGauge >= 100) {
        bat.feverActive = true;
        bat.feverRemainingMs = CONFIG.FEVER_DURATION_MS;
        feverJustActivated = true;
        playSfx('fever');
        emit('feverStart', {
          durationMs: CONFIG.FEVER_DURATION_MS,
          combo: bat.combo,
          score: bat.score
        });
      }
    }

    if (q && q.isPinned) {
      playSfx('pinBonus');
    } else if (bat.combo >= 2) {
      playSfx('combo', bat.combo);
    } else {
      playSfx('correct');
    }

    return {
      pointsEarned: pointsEarned,
      feverJustActivated: feverJustActivated,
      shieldRecharged: shieldRecharged,
      breakdown: {
        base: basePts,
        speedBonus: speedBonus,
        bossBonus: bossBonus,
        comboMultiplier: bat.comboMultiplier,
        earlyMultiplier: earlyMult,
        pinMultiplier: pinMult,
        revengeMultiplier: revMult,
        feverMultiplier: feverMult
      }
    };
  }

  function applyWrongPenalty(wordObj) {
    const bat = engineState.battle;
    let shieldUsed = false;

    if (bat.shields > 0) {
      bat.shields -= 1;
      shieldUsed = true;
      playSfx('shieldBreak');
      emit('shieldBroken', {
        shieldsRemaining: bat.shields,
        wordId: wordObj ? wordObj.id : null
      });
    } else {
      bat.combo = 0;
      bat.comboMultiplier = 1.0;
      if (!bat.feverActive) {
        bat.feverGauge = Math.max(0, bat.feverGauge - 15);
      }
      if (engineState.mode === 'survival') {
        bat.hearts = Math.max(0, bat.hearts - 1);
      }
      playSfx('wrong');
    }

    // Hypercorrection: automatically pronounce right Japanese word & queue dynamic revenge!
    if (wordObj) {
      speakWordAudio(wordObj);
      queueDynamicInRoundRevenge(wordObj);
    }

    return { shieldUsed: shieldUsed };
  }

  function queueDynamicInRoundRevenge(wordObj) {
    if (!wordObj || engineState.mode === 'survival') return;
    const bat = engineState.battle;
    const idNum = Number(wordObj.id);
    if (bat.missedRoundWordIds.indexOf(idNum) === -1) {
      bat.missedRoundWordIds.push(idNum);
    }
    if (bat.dynamicallyQueuedBossIds.length >= 2) return;
    if (bat.dynamicallyQueuedBossIds.indexOf(idNum) !== -1) return;

    for (let i = bat.questionIndex + 1; i < bat.queue.length; i++) {
      if (bat.queue[i].word && Number(bat.queue[i].word.id) === idNum && bat.queue[i].isBoss) {
        return;
      }
    }

    bat.dynamicallyQueuedBossIds.push(idNum);
    const roundPinnedSet = new Set(engineState.memorize.roundPinnedIds.map(Number));
    const subType = hasKanjiInWord(wordObj) ? 'kanji-to-kana' : 'jp-to-ko';
    const revengeBossQ = buildMultipleChoiceQuestion(
      wordObj,
      subType,
      3,
      'REVENGE BOSS · 오답 즉시 복수전!',
      {
        isPinned: roundPinnedSet.has(idNum),
        isRevenge: true,
        isBoss: true
      },
      engineState.memorize.words
    );
    bat.queue.push(revengeBossQ);
    reindexQueue(bat.queue);
  }

  function recordWordResultInRound(wordObj, isCorrect, qType, isPinned, isRevenge) {
    if (!wordObj || !wordObj.id) return null;
    const bat = engineState.battle;
    const idNum = Number(wordObj.id);
    if (!bat.wordResultsMap[idNum]) {
      bat.wordResultsMap[idNum] = {
        word: cloneShallow(wordObj),
        correct: 0,
        wrong: 0,
        isPinned: Boolean(isPinned),
        isRevenge: Boolean(isRevenge)
      };
    }
    if (isCorrect) bat.wordResultsMap[idNum].correct += 1;
    else bat.wordResultsMap[idNum].wrong += 1;

    const responseMs = Math.max(0, Date.now() - bat.questionStartedAt);
    const usedHint = Boolean(bat.hintStageByQuestion[bat.currentQuestion ? bat.currentQuestion.id : '']);

    return recordWordAttemptSafe(idNum, isCorrect, {
      round: engineState.round,
      mode: engineState.mode,
      questionType: qType,
      responseMs: responseMs,
      isPinned: Boolean(isPinned),
      isRevenge: Boolean(isRevenge),
      usedHint: usedHint
    });
  }

  function enterQuestionFeedback(resultPayload) {
    const bat = engineState.battle;
    engineState.subState = 'FEEDBACK';
    bat.feedbackEnteredAt = Date.now();
    bat.lastFeedback = resultPayload;

    if (timers.feedbackId !== null) {
      clearTimeout(timers.feedbackId);
      timers.feedbackId = null;
    }

    emit('answerResult', resultPayload);
    emitStateChange('BATTLE');

    const delay = resultPayload.imprintDurationMs;
    timers.feedbackId = setTimeout(function () {
      timers.feedbackId = null;
      advanceFromFeedback();
    }, delay);
  }

  function advanceFromFeedback() {
    if (engineState.phase !== 'BATTLE') return;
    const bat = engineState.battle;

    if (engineState.mode === 'survival' && bat.hearts <= 0) {
      completeBattleRound(false);
      return;
    }

    bat.questionIndex += 1;
    if (bat.questionIndex >= bat.queue.length && engineState.mode !== 'survival') {
      completeBattleRound(true);
      return;
    }

    activateCurrentQuestion(false);
  }

  function getCorrectAnswerDisplay(q) {
    if (!q || !q.word) return '';
    if (q.type === 'kana-spelling' || q.type === 'spelling') return q.word.kana || getWordDisplayExpression(q.word);
    if (q.subType === 'kanji-to-kana') return q.word.kana || '';
    if (q.subType === 'ko-to-jp' || q.subType === 'cloze') return getWordDisplayExpression(q.word);
    return q.word.meaning || '';
  }

  function handleQuestionTimeout() {
    if (engineState.phase !== 'BATTLE' || engineState.subState !== 'PLAYING') return;
    const bat = engineState.battle;
    const q = bat.currentQuestion;
    if (!q) return;

    if (q.type === 'pair-match') {
      const matchedSet = new Set(q.matchedPairIds.map(Number));
      const unmatchedWords = (q.words || []).filter(function (w) {
        return !matchedSet.has(Number(w.id));
      });
      const primaryMissed = unmatchedWords[0] || q.word;
      bat.wrongCount += 1;
      bat.totalAnswered += 1;

      const penalty = applyWrongPenalty(primaryMissed);
      let learningUpdate = null;
      for (let i = 0; i < unmatchedWords.length; i++) {
        learningUpdate = recordWordResultInRound(unmatchedWords[i], false, 'pair-match', false, false);
      }

      enterQuestionFeedback({
        ok: true,
        isCorrect: false,
        timedOut: true,
        question: sanitizeQuestionForView(q),
        submittedAnswer: null,
        correctAnswer: primaryMissed ? primaryMissed.meaning : '',
        revealRubyHtml: primaryMissed ? (primaryMissed.rubyHtml || getWordDisplayExpression(primaryMissed)) : '',
        word: cloneShallow(primaryMissed),
        pointsEarned: 0,
        scoreBreakdown: null,
        totalScore: bat.score,
        combo: bat.combo,
        maxCombo: bat.maxCombo,
        feverGauge: bat.feverGauge,
        feverActive: bat.feverActive,
        isPinned: false,
        isRevenge: false,
        isBoss: false,
        shieldUsed: penalty.shieldUsed,
        hearts: bat.hearts,
        maxHearts: bat.maxHearts,
        imprintDurationMs: CONFIG.FEEDBACK_WRONG_MS,
        learningUpdate: learningUpdate
      });
      return;
    }

    bat.wrongCount += 1;
    bat.totalAnswered += 1;
    const penalty = applyWrongPenalty(q.word);
    const learningUpdate = recordWordResultInRound(q.word, false, q.subType || q.type, q.isPinned, q.isRevenge);

    enterQuestionFeedback({
      ok: true,
      isCorrect: false,
      timedOut: true,
      question: sanitizeQuestionForView(q),
      submittedAnswer: null,
      correctAnswer: getCorrectAnswerDisplay(q),
      revealRubyHtml: q.word ? (q.word.rubyHtml || getWordDisplayExpression(q.word)) : '',
      word: cloneShallow(q.word),
      pointsEarned: 0,
      scoreBreakdown: null,
      totalScore: bat.score,
      combo: bat.combo,
      maxCombo: bat.maxCombo,
      feverGauge: bat.feverGauge,
      feverActive: bat.feverActive,
      isPinned: Boolean(q.isPinned),
      isRevenge: Boolean(q.isRevenge),
      isBoss: Boolean(q.isBoss),
      shieldUsed: penalty.shieldUsed,
      hearts: bat.hearts,
      maxHearts: bat.maxHearts,
      imprintDurationMs: CONFIG.FEEDBACK_WRONG_MS,
      learningUpdate: learningUpdate
    });
  }

  // ---------------------------------------------------------------------------
  // Player Battle Actions (Submit Choice, Pair-Match, Kana Shard & Romaji)
  // ---------------------------------------------------------------------------
  function submitAnswer(answerInput) {
    if (engineState.phase !== 'BATTLE' || engineState.subState !== 'PLAYING') {
      return { ok: false, ignored: true, reason: 'locked_or_not_playing' };
    }
    const bat = engineState.battle;
    const q = bat.currentQuestion;
    if (!q) return { ok: false, ignored: true, reason: 'no_question' };

    if (q.type === 'pair-match') {
      if (answerInput === '__wrong_answer__' || answerInput === false) {
        const matchedSet = new Set(q.matchedPairIds.map(Number));
        const unmatchedWords = (q.words || []).filter(function (w) {
          return !matchedSet.has(Number(w.id));
        });
        const primaryMissed = unmatchedWords[0] || q.word;
        bat.wrongCount += 1;
        bat.totalAnswered += 1;
        const penalty = applyWrongPenalty(primaryMissed);
        let learningUpdate = null;
        for (let i = 0; i < unmatchedWords.length; i++) {
          learningUpdate = recordWordResultInRound(unmatchedWords[i], false, 'pair-match', false, false);
        }
        const failPayload = {
          ok: true,
          isCorrect: false,
          timedOut: false,
          question: sanitizeQuestionForView(q),
          submittedAnswer: answerInput,
          correctAnswer: primaryMissed ? primaryMissed.meaning : '',
          revealRubyHtml: primaryMissed ? (primaryMissed.rubyHtml || getWordDisplayExpression(primaryMissed)) : '',
          wordId: primaryMissed ? primaryMissed.id : null,
          word: cloneShallow(primaryMissed),
          pointsEarned: 0,
          scoreBreakdown: null,
          totalScore: bat.score,
          combo: bat.combo,
          maxCombo: bat.maxCombo,
          feverGauge: bat.feverGauge,
          feverActive: bat.feverActive,
          isPinned: false,
          isRevenge: false,
          isBoss: false,
          shieldUsed: penalty.shieldUsed,
          hearts: bat.hearts,
          maxHearts: bat.maxHearts,
          imprintDurationMs: CONFIG.FEEDBACK_WRONG_MS,
          learningUpdate: learningUpdate
        };
        enterQuestionFeedback(failPayload);
        return failPayload;
      }
      return { ok: false, ignored: true, reason: 'use_selectMatchTile_for_pair_match' };
    }

    let isCorrect = false;
    let submittedDisplay = answerInput;
    let correctIndex = -1;
    let selectedIndex = -1;

    if (q.type === 'multiple-choice' || q.type === 'listening') {
      correctIndex = q.options.findIndex(function (o) { return Boolean(o.isCorrect); });
      let chosenOpt = null;
      if (typeof answerInput === 'number' && q.options[answerInput]) {
        chosenOpt = q.options[answerInput];
      } else if (typeof answerInput === 'string') {
        const trimmed = answerInput.trim();
        chosenOpt = q.options.find(function (o) {
          return (
            o.id === trimmed ||
            String(o.index) === trimmed ||
            o.label === trimmed ||
            o.expression === trimmed ||
            o.kana === trimmed ||
            o.meaning === trimmed
          );
        }) || null;
      } else if (answerInput && typeof answerInput === 'object') {
        chosenOpt = q.options.find(function (o) {
          return o.id === answerInput.id || (o.wordId !== null && Number(o.wordId) === Number(answerInput.wordId));
        }) || null;
      }

      if (chosenOpt && chosenOpt.eliminated) {
        return { ok: false, ignored: true, reason: 'option_eliminated' };
      }

      if (chosenOpt) {
        selectedIndex = chosenOpt.index;
        isCorrect = Boolean(chosenOpt.isCorrect);
        submittedDisplay = chosenOpt.label;
      } else {
        isCorrect = false;
      }
    } else if (q.type === 'kana-spelling' || q.type === 'spelling') {
      const candidate = (typeof answerInput === 'string' && answerInput.length > 0)
        ? answerInput.trim()
        : q.enteredText;
      submittedDisplay = candidate;
      const targetKana = String(q.targetKana || q.word.kana || '').trim();
      const targetRomaji = String(q.targetRomaji || q.word.romaji || '').trim().toLowerCase();
      const candLower = String(candidate || '').trim().toLowerCase();

      isCorrect =
        candidate.length > 0 &&
        (candidate === targetKana ||
          kataToHira(candidate) === kataToHira(targetKana) ||
          (targetRomaji && candLower === targetRomaji));
    }

    bat.totalAnswered += 1;
    let pointsEarned = 0;
    let scoreBreakdown = null;
    let shieldUsed = false;

    if (isCorrect) {
      bat.correctCount += 1;
      if (q.isRevenge) bat.revengeClearedCount += 1;
      const basePts = CONFIG.BASE_POINTS[q.type] || 100;
      const scored = calculateAndApplyCorrectScore(basePts, q, true);
      pointsEarned = scored.pointsEarned;
      scoreBreakdown = scored.breakdown;
    } else {
      bat.wrongCount += 1;
      const penalty = applyWrongPenalty(q.word);
      shieldUsed = penalty.shieldUsed;
    }

    const learningUpdate = recordWordResultInRound(q.word, isCorrect, q.subType || q.type, q.isPinned, q.isRevenge);
    const imprintMs = isCorrect ? CONFIG.FEEDBACK_CORRECT_MS : CONFIG.FEEDBACK_WRONG_MS;

    const payload = {
      ok: true,
      isCorrect: isCorrect,
      timedOut: false,
      question: sanitizeQuestionForView(q),
      submittedAnswer: submittedDisplay,
      correctAnswer: getCorrectAnswerDisplay(q),
      revealRubyHtml: q.word ? (q.word.rubyHtml || getWordDisplayExpression(q.word)) : '',
      correctIndex: correctIndex,
      selectedIndex: selectedIndex,
      wordId: q.word ? q.word.id : null,
      word: cloneShallow(q.word),
      pointsEarned: pointsEarned,
      scoreBreakdown: scoreBreakdown,
      totalScore: bat.score,
      combo: bat.combo,
      maxCombo: bat.maxCombo,
      feverGauge: bat.feverGauge,
      feverActive: bat.feverActive,
      isPinned: Boolean(q.isPinned),
      isRevenge: Boolean(q.isRevenge),
      isBoss: Boolean(q.isBoss),
      shieldUsed: shieldUsed,
      hearts: bat.hearts,
      maxHearts: bat.maxHearts,
      imprintDurationMs: imprintMs,
      learningUpdate: learningUpdate
    };

    enterQuestionFeedback(payload);
    return payload;
  }

  function selectMatchTile(tileId) {
    if (engineState.phase !== 'BATTLE' || engineState.subState !== 'PLAYING') {
      return { ok: false, ignored: true, reason: 'locked_or_not_playing' };
    }
    const q = engineState.battle.currentQuestion;
    if (!q || q.type !== 'pair-match') {
      return { ok: false, ignored: true, reason: 'not_pair_match' };
    }

    const clicked = q.tiles.find(function (t) { return t.tileId === tileId; });
    if (!clicked) return { ok: false, ignored: true, reason: 'tile_not_found' };
    if (clicked.matched) return { ok: false, ignored: true, reason: 'already_matched' };

    if (q.selectedTileId === clicked.tileId) {
      clicked.selected = false;
      q.selectedTileId = null;
      emit('pairMatchUpdate', {
        action: 'deselected',
        tileId: clicked.tileId,
        matchedCount: q.matchedPairIds.length,
        totalPairs: q.totalPairs,
        selectedTileId: null,
        tiles: sanitizeQuestionForView(q).tiles
      });
      return { ok: true, action: 'deselected' };
    }

    if (!q.selectedTileId) {
      clicked.selected = true;
      q.selectedTileId = clicked.tileId;
      emit('pairMatchUpdate', {
        action: 'selected',
        tileId: clicked.tileId,
        matchedCount: q.matchedPairIds.length,
        totalPairs: q.totalPairs,
        selectedTileId: clicked.tileId,
        tiles: sanitizeQuestionForView(q).tiles
      });
      return { ok: true, action: 'selected', selectedTileId: clicked.tileId };
    }

    const prevSelected = q.tiles.find(function (t) { return t.tileId === q.selectedTileId; });
    if (!prevSelected || prevSelected.matched) {
      clicked.selected = true;
      q.selectedTileId = clicked.tileId;
      return { ok: true, action: 'selected', selectedTileId: clicked.tileId };
    }

    if (prevSelected.side === clicked.side) {
      prevSelected.selected = false;
      clicked.selected = true;
      q.selectedTileId = clicked.tileId;
      emit('pairMatchUpdate', {
        action: 'switched',
        tileId: clicked.tileId,
        matchedCount: q.matchedPairIds.length,
        totalPairs: q.totalPairs,
        selectedTileId: clicked.tileId,
        tiles: sanitizeQuestionForView(q).tiles
      });
      return { ok: true, action: 'switched', selectedTileId: clicked.tileId };
    }

    return evaluateTilePair(prevSelected, clicked);
  }

  function submitPairMatch(tileIdA, tileIdB) {
    if (engineState.phase !== 'BATTLE' || engineState.subState !== 'PLAYING') {
      return { ok: false, ignored: true, reason: 'locked_or_not_playing' };
    }
    const q = engineState.battle.currentQuestion;
    if (!q || q.type !== 'pair-match') {
      return { ok: false, ignored: true, reason: 'not_pair_match' };
    }
    const tileA = q.tiles.find(function (t) { return t.tileId === tileIdA; });
    const tileB = q.tiles.find(function (t) { return t.tileId === tileIdB; });
    if (!tileA || !tileB || tileA.tileId === tileB.tileId || tileA.matched || tileB.matched) {
      return { ok: false, ignored: true, reason: 'invalid_tiles' };
    }
    if (tileA.side === tileB.side) {
      return { ok: false, ignored: true, reason: 'same_side' };
    }
    return evaluateTilePair(tileA, tileB);
  }

  function evaluateTilePair(tileA, tileB) {
    const bat = engineState.battle;
    const q = bat.currentQuestion;
    tileA.selected = false;
    tileB.selected = false;
    q.selectedTileId = null;

    const isMatch = Number(tileA.wordId) === Number(tileB.wordId);
    const matchedWord = (q.words || []).find(function (w) {
      return Number(w.id) === Number(tileA.wordId);
    }) || getWordById(tileA.wordId);

    if (isMatch) {
      tileA.matched = true;
      tileB.matched = true;
      if (q.matchedPairIds.indexOf(Number(tileA.wordId)) === -1) {
        q.matchedPairIds.push(Number(tileA.wordId));
      }
      if (q.hintPairWordId === Number(tileA.wordId)) {
        q.hintPairWordId = null;
      }

      const pairCtx = {
        type: 'pair-match',
        isPinned: Boolean(tileA.isPinned),
        isRevenge: false,
        isBoss: false
      };
      const scored = calculateAndApplyCorrectScore(CONFIG.BASE_POINTS['pair-match-each'], pairCtx, false);
      recordWordResultInRound(matchedWord, true, 'pair-match', tileA.isPinned, false);

      const allCleared = q.matchedPairIds.length >= q.totalPairs;
      emit('pairMatchUpdate', {
        action: 'matched',
        matched: true,
        isMatch: true,
        pairWordId: tileA.wordId,
        tileIds: [tileA.tileId, tileB.tileId],
        matchedCount: q.matchedPairIds.length,
        totalPairs: q.totalPairs,
        pointsEarned: scored.pointsEarned,
        totalScore: bat.score,
        combo: bat.combo,
        feverGauge: bat.feverGauge,
        selectedTileId: null,
        allCleared: allCleared,
        tiles: sanitizeQuestionForView(q).tiles
      });

      if (allCleared) {
        bat.correctCount += 1;
        bat.totalAnswered += 1;
        const ratio = bat.totalSec > 0 ? Math.max(0, Math.min(1, bat.remainingMs / (bat.totalSec * 1000))) : 0;
        const clearBonus = Math.round((CONFIG.BASE_POINTS['pair-match-clear'] + ratio * 80) * (bat.earlyScoreMultiplier || 1.0));
        bat.score += clearBonus;

        const wavePayload = {
          ok: true,
          isCorrect: true,
          timedOut: false,
          question: sanitizeQuestionForView(q),
          submittedAnswer: '5/5 매칭 완료',
          correctAnswer: '5/5 매칭 완료',
          revealRubyHtml: matchedWord ? (matchedWord.rubyHtml || getWordDisplayExpression(matchedWord)) : '',
          word: cloneShallow(matchedWord),
          pointsEarned: clearBonus,
          scoreBreakdown: { waveClearBonus: clearBonus },
          totalScore: bat.score,
          combo: bat.combo,
          maxCombo: bat.maxCombo,
          feverGauge: bat.feverGauge,
          feverActive: bat.feverActive,
          isPinned: false,
          isRevenge: false,
          isBoss: false,
          shieldUsed: false,
          hearts: bat.hearts,
          maxHearts: bat.maxHearts,
          imprintDurationMs: CONFIG.FEEDBACK_CORRECT_MS,
          learningUpdate: null
        };
        enterQuestionFeedback(wavePayload);
        return { ok: true, action: 'board_cleared', pointsEarned: scored.pointsEarned + clearBonus, wavePayload: wavePayload };
      }

      return { ok: true, action: 'matched', pairWordId: tileA.wordId, pointsEarned: scored.pointsEarned };
    }

    const penalty = applyWrongPenalty(matchedWord);
    recordWordResultInRound(matchedWord, false, 'pair-match', false, false);

    emit('pairMatchUpdate', {
      action: 'mismatch',
      mismatch: true,
      isMatch: false,
      tileIds: [tileA.tileId, tileB.tileId],
      matchedCount: q.matchedPairIds.length,
      totalPairs: q.totalPairs,
      shieldUsed: penalty.shieldUsed,
      combo: bat.combo,
      hearts: bat.hearts,
      selectedTileId: null,
      tiles: sanitizeQuestionForView(q).tiles
    });

    if (engineState.mode === 'survival' && bat.hearts <= 0) {
      completeBattleRound(false);
    }

    return { ok: true, action: 'mismatch', shieldUsed: penalty.shieldUsed };
  }

  // ---------------------------------------------------------------------------
  // Wave 3 Kana Shard & Live Romaji Bridge Controls
  // ---------------------------------------------------------------------------
  function emitKanaShardUpdate(q) {
    const payload = {
      questionId: q.id,
      enteredShardIds: q.enteredShardIds.slice(),
      enteredUnits: q.enteredUnits.slice(),
      enteredText: q.enteredText,
      romajiBuffer: q.romajiBuffer || '',
      romajiPreviewKana: q.romajiPreviewKana || '',
      shards: sanitizeQuestionForView(q).shards,
      targetLength: q.targetLength,
      targetKana: q.targetKana
    };
    emit('kanaUpdate', payload);
    emit('spellingUpdate', payload);
    return payload;
  }

  function tapKanaShard(shardId, internalOpts) {
    if (engineState.phase !== 'BATTLE' || engineState.subState !== 'PLAYING') {
      return { ok: false, ignored: true, reason: 'locked_or_not_playing' };
    }
    const q = engineState.battle.currentQuestion;
    if (!q || (q.type !== 'kana-spelling' && q.type !== 'spelling')) {
      return { ok: false, ignored: true, reason: 'not_kana_spelling' };
    }
    if (q.enteredShardIds.length >= q.targetLength) {
      return { ok: false, ignored: true, reason: 'slots_full' };
    }

    const shard = q.shards.find(function (s) { return s.shardId === shardId; });
    if (!shard || shard.used) {
      return { ok: false, ignored: true, reason: 'shard_unavailable' };
    }

    const iOpts = internalOpts || {};
    shard.used = true;
    q.enteredShardIds.push(shard.shardId);
    q.enteredUnits.push(shard.char);
    q.enteredText = q.enteredUnits.join('');
    if (!iOpts.keepRomajiBuffer) {
      q.romajiBuffer = '';
    }
    q.romajiPreviewKana = q.targetUnits[q.enteredUnits.length] || '';

    if (!iOpts.silentSfx) {
      playSfx('shardTap');
    }

    emitKanaShardUpdate(q);

    if (!iOpts.deferSubmit && engineState.autoSubmitKana && q.enteredUnits.length === q.targetLength) {
      return submitAnswer(q.enteredText);
    }

    return {
      ok: true,
      enteredText: q.enteredText,
      enteredUnits: q.enteredUnits.slice(),
      romajiBuffer: q.romajiBuffer,
      shardsRemaining: q.targetLength - q.enteredUnits.length
    };
  }

  function backspaceKana() {
    if (engineState.phase !== 'BATTLE' || engineState.subState !== 'PLAYING') {
      return { ok: false, ignored: true };
    }
    const q = engineState.battle.currentQuestion;
    if (!q || (q.type !== 'kana-spelling' && q.type !== 'spelling')) {
      return { ok: false, ignored: true };
    }

    q.romajiBuffer = '';
    if (q.enteredShardIds.length === 0) {
      emitKanaShardUpdate(q);
      return { ok: false, ignored: true, enteredText: '' };
    }

    const removedId = q.enteredShardIds.pop();
    q.enteredUnits.pop();
    const shard = q.shards.find(function (s) { return s.shardId === removedId; });
    if (shard) shard.used = false;
    q.enteredText = q.enteredUnits.join('');
    q.romajiPreviewKana = q.targetUnits[q.enteredUnits.length] || '';

    emitKanaShardUpdate(q);
    return { ok: true, enteredText: q.enteredText, romajiBuffer: '' };
  }

  function clearKana() {
    if (engineState.phase !== 'BATTLE' || engineState.subState !== 'PLAYING') {
      return { ok: false, ignored: true };
    }
    const q = engineState.battle.currentQuestion;
    if (!q || (q.type !== 'kana-spelling' && q.type !== 'spelling')) {
      return { ok: false, ignored: true };
    }
    for (let i = 0; i < q.shards.length; i++) {
      q.shards[i].used = false;
    }
    q.enteredShardIds = [];
    q.enteredUnits = [];
    q.enteredText = '';
    q.romajiBuffer = '';
    q.romajiPreviewKana = q.targetUnits[0] || '';

    emitKanaShardUpdate(q);
    return { ok: true, enteredText: '', romajiBuffer: '' };
  }

  function flushTrailingRomajiN(q) {
    if (q.romajiBuffer === 'n' && q.enteredUnits.length < q.targetLength) {
      const nShard = q.shards.find(function (s) {
        return !s.used && kataToHira(s.char) === 'ん';
      });
      if (nShard) {
        q.romajiBuffer = '';
        tapKanaShard(nShard.shardId, { deferSubmit: true });
      }
    }
  }

  function typeKanaKey(key) {
    if (engineState.phase !== 'BATTLE' || engineState.subState !== 'PLAYING') {
      return { ok: false, ignored: true };
    }
    const q = engineState.battle.currentQuestion;
    if (!q || (q.type !== 'kana-spelling' && q.type !== 'spelling')) {
      return { ok: false, ignored: true };
    }

    const k = String(key || '');
    if (k === 'Backspace') {
      // If user is mid-romaji syllable (e.g. 'sh'), delete one romaji char first!
      if (q.romajiBuffer && q.romajiBuffer.length > 0) {
        q.romajiBuffer = q.romajiBuffer.slice(0, -1);
        emitKanaShardUpdate(q);
        return { ok: true, enteredText: q.enteredText, romajiBuffer: q.romajiBuffer };
      }
      return backspaceKana();
    }
    if (k === 'Escape' || k === 'Clear') {
      return clearKana();
    }
    if (k === 'Enter') {
      flushTrailingRomajiN(q);
      if (q.enteredText.length > 0) {
        return submitAnswer(q.enteredText);
      }
      return { ok: false, ignored: true, reason: 'empty_input' };
    }

    // 1. Direct Japanese Kana input (if player has Japanese IME enabled)
    if (containsKanaChar(k)) {
      const morae = splitMorae(k);
      let lastRes = { ok: false, ignored: true };
      for (let i = 0; i < morae.length; i++) {
        const mHira = kataToHira(morae[i]);
        const shard = q.shards.find(function (s) {
          return !s.used && (s.char === morae[i] || kataToHira(s.char) === mHira);
        });
        if (shard) {
          q.romajiBuffer = '';
          lastRes = tapKanaShard(shard.shardId);
          if (engineState.subState !== 'PLAYING') return lastRes;
        }
      }
      return lastRes;
    }

    // 2. Live Romaji Bridge ('a'..'z', '-', "'")
    const lower = k.toLowerCase();
    if (lower.length === 1 && /^[a-z\-']$/.test(lower)) {
      const resolved = resolveRomajiBufferStep(q, (q.romajiBuffer || '') + lower);
      q.romajiBuffer = resolved.nextBuffer;
      q.romajiPreviewKana = resolved.previewKana;

      if (resolved.matchedShardIds.length > 0) {
        let res = null;
        for (let i = 0; i < resolved.matchedShardIds.length; i++) {
          const isLast = i === resolved.matchedShardIds.length - 1;
          res = tapKanaShard(resolved.matchedShardIds[i], {
            keepRomajiBuffer: true,
            deferSubmit: !isLast
          });
          if (engineState.subState !== 'PLAYING') return res;
        }
        return res;
      }

      emitKanaShardUpdate(q);
      return {
        ok: true,
        buffered: true,
        romajiBuffer: q.romajiBuffer,
        enteredText: q.enteredText
      };
    }

    return { ok: false, ignored: true };
  }

  // ---------------------------------------------------------------------------
  // Smart Hint, Skip Feedback (180ms Keyboard Debounce), Pause/Resume/Abort
  // ---------------------------------------------------------------------------
  function useHint() {
    if (engineState.phase !== 'BATTLE' || engineState.subState !== 'PLAYING') {
      return { ok: false, ignored: true, reason: 'not_playing' };
    }
    const bat = engineState.battle;
    const q = bat.currentQuestion;
    if (!q) return { ok: false, ignored: true };

    if (bat.hintsRemaining <= 0) {
      emit('notice', {
        level: 'info',
        code: 'NO_HINTS_LEFT',
        message: '이번 라운드 사쿠라 힌트를 모두 사용했어요!'
      });
      return { ok: false, reason: 'NO_HINTS_LEFT', hintsRemaining: 0 };
    }

    bat.hintsRemaining -= 1;
    const prevStage = bat.hintStageByQuestion[q.id] || 0;
    const nextStage = Math.min(3, prevStage + 1);
    bat.hintStageByQuestion[q.id] = nextStage;

    const eliminatedOptionIds = [];
    let hintData = null;

    if (q.type === 'multiple-choice' || q.type === 'listening') {
      hintData = getHintFromLS(q.word, nextStage);
      if (prevStage === 0) {
        const wrongOpts = shuffleArray(
          q.options.filter(function (o) { return !o.isCorrect && !o.eliminated; })
        ).slice(0, 2);
        for (let i = 0; i < wrongOpts.length; i++) {
          wrongOpts[i].eliminated = true;
          eliminatedOptionIds.push(wrongOpts[i].id);
        }
      }
    } else if (q.type === 'kana-spelling' || q.type === 'spelling') {
      hintData = getHintFromLS(q.word, Math.max(2, nextStage));
      q.romajiBuffer = '';
      // Trim any wrong suffix morae first
      while (
        q.enteredUnits.length > 0 &&
        q.targetUnits.slice(0, q.enteredUnits.length).join('') !== q.enteredUnits.join('')
      ) {
        backspaceKana();
      }
      if (q.enteredUnits.length < q.targetLength - 1) {
        const neededMora = q.targetUnits[q.enteredUnits.length];
        const shard = q.shards.find(function (s) { return !s.used && s.char === neededMora; });
        if (shard) {
          tapKanaShard(shard.shardId, { deferSubmit: true, silentSfx: true });
        }
      }
    } else if (q.type === 'pair-match') {
      const matchedSet = new Set(q.matchedPairIds.map(Number));
      const unmatched = (q.words || []).find(function (w) { return !matchedSet.has(Number(w.id)); });
      if (unmatched) {
        q.hintPairWordId = unmatched.id;
        hintData = {
          stage: 1,
          pairWordId: unmatched.id,
          text: '💡 힌트 커플: ' + getWordDisplayExpression(unmatched) + ' ↔ ' + unmatched.meaning
        };
      }
    }

    playSfx('hint');

    const payload = {
      ok: true,
      questionId: q.id,
      wordId: q.word ? q.word.id : null,
      questionType: q.type,
      stage: nextStage,
      hintData: hintData,
      hint: hintData,
      hintText: (hintData && hintData.text) || '',
      hintsRemaining: bat.hintsRemaining,
      eliminatedOptionIds: eliminatedOptionIds,
      question: sanitizeQuestionForView(q)
    };

    emit('hintUsed', payload);
    return payload;
  }

  function nextQuestion(opts) {
    if (engineState.phase !== 'BATTLE' || engineState.subState !== 'FEEDBACK') {
      return { ok: false, ignored: true, reason: 'not_in_feedback' };
    }
    const options = opts || {};
    const elapsed = Date.now() - (engineState.battle.feedbackEnteredAt || 0);
    if (options.fromKeyboard && elapsed < CONFIG.KEYBOARD_SKIP_DEBOUNCE_MS) {
      return { ok: false, ignored: true, reason: 'debounce' };
    }
    if (timers.feedbackId !== null) {
      clearTimeout(timers.feedbackId);
      timers.feedbackId = null;
    }
    advanceFromFeedback();
    return { ok: true, state: getState() };
  }

  function pauseBattle() {
    if (engineState.phase === 'BATTLE' && engineState.subState === 'PLAYING') {
      transitionState('BATTLE', 'PAUSED');
      return { ok: true };
    }
    if (engineState.phase === 'MEMORIZE' && engineState.subState === 'STUDYING') {
      transitionState('MEMORIZE', 'PAUSED');
      return { ok: true };
    }
    return { ok: false, ignored: true };
  }

  function resumeBattle() {
    if (engineState.phase === 'BATTLE' && engineState.subState === 'PAUSED') {
      timers.lastTickAt = Date.now();
      transitionState('BATTLE', 'PLAYING');
      return { ok: true };
    }
    if (engineState.phase === 'MEMORIZE' && engineState.subState === 'PAUSED') {
      timers.lastTickAt = Date.now();
      transitionState('MEMORIZE', 'STUDYING');
      return { ok: true };
    }
    return { ok: false, ignored: true };
  }

  function abortToLobby() {
    clearAllTimers();
    engineState = createInitialEngineState();
    const snap = transitionState('LOBBY', 'READY');
    return { ok: true, state: snap };
  }

  // ---------------------------------------------------------------------------
  // Phase 3: Round Completion & Result Summary
  // ---------------------------------------------------------------------------
  function completeBattleRound(survivedCompleted) {
    clearAllTimers();
    const bat = engineState.battle;
    const maxRounds = getTotalRounds();
    const durationSec = Math.max(1, Math.round((Date.now() - (engineState.startedAt || Date.now())) / 1000));

    const totalJudged = Math.max(1, bat.correctCount + bat.wrongCount);
    const accuracy = Math.round((bat.correctCount / totalJudged) * 100);
    const grade = computeRankAndStars(accuracy, bat.maxCombo, bat.earlyBonusPoints, survivedCompleted);

    const wordResults = Object.keys(bat.wordResultsMap).map(function (idKey) {
      const entry = bat.wordResultsMap[idKey];
      const prog = getWordProgressSafe(entry.word.id);
      return {
        wordId: entry.word.id,
        word: entry.word,
        correct: entry.correct,
        wrong: entry.wrong,
        correctCount: entry.correct,
        wrongCount: entry.wrong,
        missed: entry.wrong > 0,
        masteredNow: entry.wrong === 0 && entry.correct > 0,
        box: prog.box,
        status: prog.status,
        pinned: isWordGloballyPinned(entry.word.id)
      };
    });

    const seenResultIds = new Set(wordResults.map(function (r) { return Number(r.word.id); }));
    for (let i = 0; i < engineState.memorize.words.length; i++) {
      const mw = engineState.memorize.words[i];
      if (!seenResultIds.has(Number(mw.id))) {
        const prog = getWordProgressSafe(mw.id);
        wordResults.push({
          wordId: mw.id,
          word: cloneShallow(mw),
          correct: 0,
          wrong: 0,
          correctCount: 0,
          wrongCount: 0,
          missed: false,
          masteredNow: false,
          box: prog.box,
          status: prog.status,
          pinned: isWordGloballyPinned(mw.id)
        });
      }
    }

    const wrongWords = wordResults
      .filter(function (r) { return r.wrong > 0; })
      .map(function (r) { return r.word; });

    const summary = {
      mode: engineState.mode,
      battleStyle: engineState.battleStyle,
      round: engineState.round,
      totalRounds: maxRounds,
      roundMeta: cloneShallow(engineState.roundMeta),
      survivedCompleted: Boolean(survivedCompleted),
      score: bat.score,
      rank: grade.rank,
      stars: grade.stars,
      rankTitle: grade.title,
      maxCombo: bat.maxCombo,
      accuracy: accuracy,
      correctCount: bat.correctCount,
      wrongCount: bat.wrongCount,
      totalQuestions: totalJudged,
      earlyBonusPoints: bat.earlyBonusPoints,
      pinBountyPoints: bat.pinBountyPoints || 0,
      earlyScoreMultiplier: bat.earlyScoreMultiplier,
      revengeClearedCount: bat.revengeClearedCount,
      durationSec: durationSec,
      wordResults: wordResults,
      wrongWords: wrongWords,
      nextRound: engineState.mode === 'campaign' ? Math.min(maxRounds, engineState.round + 1) : engineState.round,
      hasNextRound: engineState.mode === 'campaign' && engineState.round < maxRounds,
      isNewBest: false,
      prevBestScore: 0,
      unlockedBadges: []
    };

    const ls = getLS();
    if (ls && typeof ls.recordRoundClear === 'function') {
      try {
        const saved = ls.recordRoundClear(summary);
        if (saved) {
          summary.isNewBest = Boolean(saved.isNewBest || saved.isNewHighScore);
          summary.prevBestScore = Number(saved.prevBestScore) || 0;
          summary.unlockedBadges = Array.isArray(saved.unlockedBadges) ? saved.unlockedBadges : [];
        }
      } catch (_e) {
        // Fallback below
      }
    } else if (engineState.mode === 'campaign') {
      const prev = fallbackStore.roundRecords.get(engineState.round);
      const prevScore = prev ? prev.bestScore : 0;
      summary.isNewBest = summary.score > prevScore;
      summary.prevBestScore = prevScore;
      fallbackStore.roundRecords.set(engineState.round, {
        round: engineState.round,
        cleared: true,
        bestScore: Math.max(prevScore, summary.score),
        bestRank: summary.rank,
        stars: Math.max(prev ? prev.stars : 0, summary.stars),
        playCount: (prev ? prev.playCount : 0) + 1
      });
    }

    playSfx('roundClear');
    engineState.result = summary;
    transitionState('RESULT', 'ENDED');
    emit(
      'roundComplete',
      Object.assign({}, summary, {
        summary: cloneShallow(summary),
        state: getState()
      })
    );
  }

  // ---------------------------------------------------------------------------
  // World Map & Navigation Helpers
  // ---------------------------------------------------------------------------
  function getRoundRecordSafe(roundNum) {
    const r = Number(roundNum);
    const ls = getLS();
    if (ls && typeof ls.getRoundRecord === 'function') {
      try {
        const rec = ls.getRoundRecord(r);
        if (rec) return rec;
      } catch (_e) {
        // Fallback below
      }
    }
    return fallbackStore.roundRecords.get(r) || {
      round: r,
      cleared: false,
      bestScore: 0,
      bestRank: null,
      stars: 0,
      playCount: 0
    };
  }

  function getRecommendedNextRound() {
    const maxRounds = getTotalRounds();
    for (let r = 1; r <= maxRounds; r++) {
      const rec = getRoundRecordSafe(r);
      if (!rec.cleared) return r;
    }
    return 1;
  }

  function getRoundsOverview() {
    const rounds = getAllRounds();
    const recommended = getRecommendedNextRound();
    return rounds.map(function (meta) {
      const rec = getRoundRecordSafe(meta.round);
      const lv = Number(meta.level) || 1;
      return {
        round: meta.round,
        level: lv,
        levelLabel: meta.levelLabel || (lv === 1 ? 'Lv.1 N5 입문 기초' : lv === 2 ? 'Lv.2 N5 핵심 활용' : 'Lv.3 N5 실전 완성'),
        zone: lv === 1 ? 'sakura' : lv === 2 ? 'aoi' : 'kyoto',
        title: meta.title,
        emoji: meta.emoji || '🌸',
        wordIds: meta.wordIds ? meta.wordIds.slice() : [],
        cleared: Boolean(rec.cleared),
        bestScore: Number(rec.bestScore) || 0,
        bestRank: rec.bestRank || null,
        stars: Number(rec.stars) || 0,
        playCount: Number(rec.playCount) || 0,
        isRecommended: meta.round === recommended
      };
    });
  }

  function retryRound(opts) {
    const mode = engineState.mode;
    if (mode === 'revenge') return startRevengeMode(opts || { allowFallback: true });
    if (mode === 'survival') return startSurvivalMode(opts || { level: engineState.survivalLevel });
    return startCampaignRound(engineState.round || 1, opts || { battleStyle: engineState.battleStyle });
  }

  function startNextRound(opts) {
    const maxRounds = getTotalRounds();
    const nextR = Math.min(maxRounds, (engineState.round || 1) + 1);
    return startCampaignRound(nextR, opts || { battleStyle: engineState.battleStyle });
  }

  function init(options) {
    clearAllTimers();
    const ls = getLS();
    if (ls && typeof ls.init === 'function') {
      try {
        ls.init();
      } catch (_e) {
        // Ignore if already initialized
      }
    }
    engineState = createInitialEngineState();
    if (options && options.battleStyle) {
      engineState.battleStyle = normalizeBattleStyle(options.battleStyle);
    }
    return transitionState('LOBBY', 'READY');
  }

  // ---------------------------------------------------------------------------
  // Expose Public API on window.N5App.GameEngine
  // ---------------------------------------------------------------------------
  N5App.GameEngine = {
    CONFIG: CONFIG,

    // Lifecycle & Events
    init: init,
    on: on,
    off: off,
    emit: emit,
    getState: getState,
    getTotalRounds: getTotalRounds,
    getTotalWords: getTotalWords,
    getCurrentQuestion: function () {
      return sanitizeQuestionForView(engineState.battle.currentQuestion);
    },

    // Lobby & World Map Helpers
    getRoundsOverview: getRoundsOverview,
    getRecommendedNextRound: getRecommendedNextRound,
    canStartRevenge: canStartRevenge,

    // Mode Starters
    startCampaignRound: startCampaignRound,
    startRound: startCampaignRound,
    startRevengeMode: startRevengeMode,
    startSurvivalMode: startSurvivalMode,
    retryRound: retryRound,
    startNextRound: startNextRound,

    // Phase 1: Memorize Controls
    getMemorizeWords: function () {
      return engineState.memorize.words.map(cloneShallow);
    },
    getEarlyStartPreview: getEarlyStartPreview,
    extendMemorizeTime: extendMemorizeTime,
    markWordStudied: markWordStudied,
    togglePinInRound: togglePinInRound,
    startBattleFromMemorize: startBattleFromMemorize,
    finishMemorize: startBattleFromMemorize,
    startBattleEarly: startBattleFromMemorize,

    // Phase 2: Battle Player Controls (with Kana & Spelling dual aliases)
    submitAnswer: submitAnswer,
    selectMatchTile: selectMatchTile,
    submitPairMatch: submitPairMatch,
    tapKanaShard: tapKanaShard,
    tapSpellingShard: tapKanaShard,
    typeKanaKey: typeKanaKey,
    typeSpellingKey: typeKanaKey,
    backspaceKana: backspaceKana,
    backspaceSpelling: backspaceKana,
    clearKana: clearKana,
    clearSpelling: clearKana,
    useHint: useHint,
    nextQuestion: nextQuestion,
    skipFeedback: nextQuestion,
    pauseBattle: pauseBattle,
    resumeBattle: resumeBattle,
    abortToLobby: abortToLobby,

    // Exposed Utilities for Testing & UI Convenience
    splitMorae: splitMorae,
    kataToHira: kataToHira,
    hiraToKata: hiraToKata,
    getBlankExample: getBlankExample,
    getSmartDistractors: getSmartDistractors,
    getSmartKanaDistractors: getSmartKanaDistractors
  };
})(typeof window !== 'undefined' ? window : globalThis);
