# English Lookup Autofill — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When adding a new card, user types only the English word, the app queries jisho.org and shows a dropdown of Japanese matches to auto-fill Japanese and Romaji fields.

**Architecture:** English input triggers a debounced fetch to jisho.org's free API. Results are shown in a styled dropdown. Selecting a result fills the Japanese and Romaji fields. A built-in kana→romaji mapping table handles the conversion. If no results or offline, the form falls back to full manual entry.

**Tech Stack:** Vanilla JS, jisho.org API (`https://jisho.org/api/v1/search/words`), inline CSS

---

### Task 1: Add kana-to-romaji converter

**Files:**
- Modify: `index.html` (insert new function before `loadVocabulary()` at line ~2026)

**Step 1: Add the kana→romaji mapping function**

Insert before the `// ─── LOAD VOCABULARY FROM JSON ───` comment (line 2026):

```javascript
// ─── KANA TO ROMAJI ───
function kanaToRomaji(str) {
  const map = {
    'きゃ':'kya','きゅ':'kyu','きょ':'kyo','しゃ':'sha','しゅ':'shu','しょ':'sho',
    'ちゃ':'cha','ちゅ':'chu','ちょ':'cho','にゃ':'nya','にゅ':'nyu','にょ':'nyo',
    'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','みゃ':'mya','みゅ':'myu','みょ':'myo',
    'りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
    'じゃ':'ja','じゅ':'ju','じょ':'jo','びゃ':'bya','びゅ':'byu','びょ':'byo',
    'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
    'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
    'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
    'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do',
    'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
    'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
    'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
    'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
    'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
    'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
    'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
    'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
    'や':'ya','ゆ':'yu','よ':'yo',
    'わ':'wa','ゐ':'wi','ゑ':'we','を':'wo',
    'あ':'a','い':'i','う':'u','え':'e','お':'o',
    'ん':'n',
    'ゃ':'ya','ゅ':'yu','ょ':'yo',
    'っ':'',
    'ー':'-',
    // katakana
    'キャ':'kya','キュ':'kyu','キョ':'kyo','シャ':'sha','シュ':'shu','ショ':'sho',
    'チャ':'cha','チュ':'chu','チョ':'cho','ニャ':'nya','ニュ':'nyu','ニョ':'nyo',
    'ヒャ':'hya','ヒュ':'hyu','ヒョ':'hyo','ミャ':'mya','ミュ':'myu','ミョ':'myo',
    'リャ':'rya','リュ':'ryu','リョ':'ryo','ギャ':'gya','ギュ':'gyu','ギョ':'gyo',
    'ジャ':'ja','ジュ':'ju','ジョ':'jo','ビャ':'bya','ビュ':'byu','ビョ':'byo',
    'ピャ':'pya','ピュ':'pyu','ピョ':'pyo',
    'ガ':'ga','ギ':'gi','グ':'gu','ゲ':'ge','ゴ':'go',
    'ザ':'za','ジ':'ji','ズ':'zu','ゼ':'ze','ゾ':'zo',
    'ダ':'da','ヂ':'ji','ヅ':'zu','デ':'de','ド':'do',
    'バ':'ba','ビ':'bi','ブ':'bu','ベ':'be','ボ':'bo',
    'パ':'pa','ピ':'pi','プ':'pu','ペ':'pe','ポ':'po',
    'カ':'ka','キ':'ki','ク':'ku','ケ':'ke','コ':'ko',
    'サ':'sa','シ':'shi','ス':'su','セ':'se','ソ':'so',
    'タ':'ta','チ':'chi','ツ':'tsu','テ':'te','ト':'to',
    'ナ':'na','ニ':'ni','ヌ':'nu','ネ':'ne','ノ':'no',
    'ハ':'ha','ヒ':'hi','フ':'fu','ヘ':'he','ホ':'ho',
    'マ':'ma','ミ':'mi','ム':'mu','メ':'me','モ':'mo',
    'ラ':'ra','リ':'ri','ル':'ru','レ':'re','ロ':'ro',
    'ヤ':'ya','ユ':'yu','ヨ':'yo',
    'ワ':'wa','ヰ':'wi','ヱ':'we','ヲ':'wo',
    'ア':'a','イ':'i','ウ':'u','エ':'e','オ':'o',
    'ン':'n',
    'ャ':'ya','ュ':'yu','ョ':'yo',
    'ッ':'',
    'ヴ':'vu',
    'ファ':'fa','フィ':'fi','フェ':'fe','フォ':'fo',
    'ティ':'ti','ディ':'di',
  };
  let result = '';
  let i = 0;
  while (i < str.length) {
    // Check for sokuon (っ/ッ) — doubles the next consonant
    if (str[i] === 'っ' || str[i] === 'ッ') {
      // Look ahead for the next kana's romaji to double its first consonant
      const next2 = str.substring(i + 1, i + 3);
      const next1 = str.substring(i + 1, i + 2);
      const nextRomaji = map[next2] || map[next1];
      if (nextRomaji && nextRomaji.length > 0) {
        result += nextRomaji[0]; // double the consonant
      }
      i++;
      continue;
    }
    // Try 2-char match first (for combo kana like きゃ)
    if (i + 1 < str.length && map[str.substring(i, i + 2)]) {
      result += map[str.substring(i, i + 2)];
      i += 2;
    } else if (map[str[i]]) {
      result += map[str[i]];
      i++;
    } else {
      result += str[i]; // pass through non-kana (kanji, punctuation, etc.)
      i++;
    }
  }
  return result;
}
```

**Step 2: Verify it works**

Open `index.html` in browser, open dev console, test:
- `kanaToRomaji('こんにちは')` → `"konnichiwa"` (note: は→wa not ha in this context — the function maps は→ha which is technically correct by character)
- `kanaToRomaji('だいじょうぶ')` → `"daijoubu"`
- `kanaToRomaji('カタカナ')` → `"katakana"`

**Step 3: Commit**

```bash
git add index.html
git commit -m "Add kana-to-romaji converter function"
```

---

### Task 2: Add jisho.org lookup function with debounce

**Files:**
- Modify: `index.html` (insert after kanaToRomaji function, before `loadVocabulary()`)

**Step 1: Add lookup state variables and API function**

Insert after the `kanaToRomaji` function:

```javascript
// ─── JISHO LOOKUP ───
let lookupResults = [];
let lookupLoading = false;
let lookupDebounceTimer = null;
let selectedLookupIndex = -1;

function searchJisho(query) {
  if (!query || query.trim().length < 2) {
    lookupResults = [];
    lookupLoading = false;
    renderLookupDropdown();
    return;
  }
  lookupLoading = true;
  renderLookupDropdown();

  fetch(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(query.trim())}`)
    .then(res => res.json())
    .then(data => {
      lookupResults = (data.data || []).slice(0, 5).map(entry => {
        const jp = entry.japanese[0] || {};
        const word = jp.word || jp.reading || '';
        const reading = jp.reading || '';
        const romaji = kanaToRomaji(reading);
        const meanings = (entry.senses || [])
          .slice(0, 2)
          .map(s => s.english_definitions.join(', '))
          .join('; ');
        return { japanese: word, reading, romaji, english: meanings };
      });
      lookupLoading = false;
      selectedLookupIndex = -1;
      renderLookupDropdown();
    })
    .catch(() => {
      lookupResults = [];
      lookupLoading = false;
      renderLookupDropdown();
    });
}

function debouncedLookup() {
  const input = document.getElementById('input-english');
  if (!input) return;
  clearTimeout(lookupDebounceTimer);
  lookupDebounceTimer = setTimeout(() => searchJisho(input.value), 500);
  updateAddPreview();
}

function selectLookupResult(index) {
  const result = lookupResults[index];
  if (!result) return;
  const jpInput = document.getElementById('input-japanese');
  const rmInput = document.getElementById('input-romaji');
  if (jpInput) jpInput.value = result.japanese;
  if (rmInput) rmInput.value = result.romaji;
  lookupResults = [];
  selectedLookupIndex = -1;
  renderLookupDropdown();
  updateAddPreview();
}

function renderLookupDropdown() {
  const container = document.getElementById('lookup-dropdown');
  if (!container) return;
  if (lookupLoading) {
    container.innerHTML = '<div class="lookup-loading">Searching...</div>';
    container.style.display = 'block';
    return;
  }
  if (lookupResults.length === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }
  container.innerHTML = lookupResults.map((r, i) => `
    <div class="lookup-item${i === selectedLookupIndex ? ' lookup-item-active' : ''}" onclick="selectLookupResult(${i})">
      <div class="lookup-item-jp">${esc(r.japanese)} <span class="lookup-item-reading">${esc(r.reading)} / ${esc(r.romaji)}</span></div>
      <div class="lookup-item-en">${esc(r.english)}</div>
    </div>
  `).join('');
  container.style.display = 'block';
}
```

**Step 2: Verify the API works**

Open browser dev console and run:
```javascript
searchJisho('hello')
```
Check that `lookupResults` populates with results after ~1 second.

**Step 3: Commit**

```bash
git add index.html
git commit -m "Add jisho.org API lookup with debounce"
```

---

### Task 3: Add CSS for the lookup dropdown

**Files:**
- Modify: `index.html` (insert after `.form-success` styles, around line 575)

**Step 1: Add dropdown styles**

Insert after the `.form-success` CSS block (after line 575):

```css
  .lookup-dropdown {
    position: relative;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 10px;
    margin-top: 4px;
    overflow: hidden;
    display: none;
    z-index: 10;
  }

  .lookup-item {
    padding: 10px 14px;
    cursor: pointer;
    border-bottom: 1px solid var(--border);
    transition: background 0.1s;
  }

  .lookup-item:last-child { border-bottom: none; }

  .lookup-item:hover, .lookup-item-active {
    background: var(--accent-soft);
  }

  .lookup-item-jp {
    font-family: 'Noto Sans JP', sans-serif;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .lookup-item-reading {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-weight: 400;
    color: var(--text-dim);
  }

  .lookup-item-en {
    font-size: 12px;
    color: var(--text-dim);
  }

  .lookup-loading {
    padding: 10px 14px;
    font-size: 12px;
    color: var(--text-faint);
  }
```

**Step 2: Commit**

```bash
git add index.html
git commit -m "Add lookup dropdown styles"
```

---

### Task 4: Restructure the Add Card form

**Files:**
- Modify: `index.html` — `renderAddPanel()` function (lines 1963-2011)
- Modify: `index.html` — `saveNewCard()` function (lines 1933-1961)

**Step 1: Update `renderAddPanel()` to put English first and add dropdown**

Replace the current `renderAddPanel()` (lines 1963-2011) with:

```javascript
function renderAddPanel() {
  if (!addPanelOpen) return '';
  const allCategories = Object.keys(vocabulary);
  return `
    <div class="add-panel-overlay" onclick="if(event.target===this)closeAddPanel()">
      <div class="add-panel">
        <div class="add-panel-header">
          <div class="add-panel-title">Add New Card</div>
          <button class="add-panel-close" onclick="closeAddPanel()">&times;</button>
        </div>
        ${addFormSuccess ? '<div class="form-success">Card added successfully!</div>' : ''}
        <div class="form-group">
          <label class="form-label" for="input-english">English <span class="form-label-hint">— type to search Japanese translations</span></label>
          <input type="text" id="input-english" class="form-input" placeholder="e.g. hello, thank you, cat..." oninput="debouncedLookup()" autocomplete="off">
          <div class="lookup-dropdown" id="lookup-dropdown"></div>
        </div>
        <div class="form-group">
          <label class="form-label" for="input-japanese">Japanese <span class="form-label-hint">— auto-filled from lookup</span></label>
          <input type="text" id="input-japanese" class="form-input input-japanese" placeholder="こんにちは" oninput="updateAddPreview()">
        </div>
        <div class="form-group">
          <label class="form-label" for="input-romaji">Romaji <span class="form-label-hint">— auto-filled from lookup</span></label>
          <input type="text" id="input-romaji" class="form-input input-romaji" placeholder="konnichiwa" oninput="updateAddPreview()">
        </div>
        <div class="form-group">
          <label class="form-label" for="select-category">Category</label>
          <select id="select-category" class="form-select">
            ${allCategories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
            ${!allCategories.includes('My Words') ? '<option value="My Words">My Words</option>' : ''}
          </select>
        </div>
        <div class="form-preview" id="add-preview">
          <div class="form-preview-label">Preview</div>
          <div class="form-preview-jp" id="preview-jp">—</div>
          <div class="form-preview-romaji" id="preview-rm">—</div>
          <div class="form-preview-en" id="preview-en">—</div>
          <button class="form-preview-audio" onclick="previewCustomAudio()" title="Test pronunciation">
            <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
        </div>
        <div class="form-actions">
          <button class="btn-add-save" onclick="saveNewCard()">Add Card</button>
        </div>
        <div class="custom-count">
          <b>${getCustomCardCount()}</b> custom card${getCustomCardCount() !== 1 ? 's' : ''} added
        </div>
      </div>
    </div>
  `;
}
```

**Step 2: Update `saveNewCard()` to clear form and focus English field**

Replace the current `saveNewCard()` (lines 1933-1961) with:

```javascript
function saveNewCard() {
  const jp = document.getElementById('input-japanese').value.trim();
  const rm = document.getElementById('input-romaji').value.trim();
  const en = document.getElementById('input-english').value.trim();
  const cat = document.getElementById('select-category').value;

  if (!jp || !rm || !en) return;

  addCustomCard({
    japanese: jp,
    romaji: rm,
    english: en,
    category: cat,
  });

  addFormSuccess = true;
  render();
  setTimeout(() => {
    const inp = document.getElementById('input-english');
    if (inp) {
      document.getElementById('input-japanese').value = '';
      document.getElementById('input-romaji').value = '';
      document.getElementById('input-english').value = '';
      lookupResults = [];
      renderLookupDropdown();
      inp.focus();
    }
    addFormSuccess = false;
    render();
  }, 1500);
}
```

**Step 3: Test the full flow**

1. Open `index.html` in browser
2. Click "Add Card"
3. Type "hello" in the English field
4. Wait ~500ms — dropdown should appear with results like こんにちは
5. Click a result — Japanese and Romaji fields fill in
6. Pick a category, hit "Add Card"
7. Verify card was saved
8. Test fallback: type gibberish — no results, fields remain editable for manual entry
9. Test offline: disconnect network, type a word — no dropdown, manual entry works

**Step 4: Commit**

```bash
git add index.html
git commit -m "Restructure add-card form: English-first with jisho.org lookup"
```
