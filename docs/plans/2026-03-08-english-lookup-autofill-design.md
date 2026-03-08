# Auto-populate Japanese/Romaji from English Lookup

## Problem

Adding a new word requires manually typing all three fields (Japanese, Romaji, English). This is tedious and error-prone, especially for users who may not know the correct Japanese or romaji spelling.

## Solution

Change the add-word form so the user types only the English word. The app queries jisho.org's free API and presents a dropdown of Japanese matches. Selecting a match auto-fills the Japanese and Romaji fields.

## Flow

1. User opens "Add Card" and types an English word/phrase
2. After a 500ms debounce, the app queries jisho.org's API
3. A dropdown appears showing up to 5 matches, each displaying: `大丈夫 (だいじょうぶ / daijoubu) — "all right, okay"`
4. User taps a match — Japanese and Romaji fields auto-fill
5. User picks a category from the existing dropdown
6. User hits Save — same flow as today

## No Results Fallback

If jisho.org returns no results, the form reverts to current manual-entry behavior with all fields editable.

## Technical Approach

- **API:** `https://jisho.org/api/v1/search/words?keyword=<english>` — free, no API key required
- **Debounce:** 500ms after user stops typing in the English field
- **Kana to Romaji:** Built-in hiragana/katakana to romaji character mapping table (no external library)
- **Dropdown:** Styled dropdown below the English input showing up to 5 results with Japanese, kana reading, romaji, and English gloss
- **All changes in `index.html`** — no new files needed

## What Stays the Same

- Category picker (manual selection)
- Card preview
- Save mechanism and localStorage storage
- Offline functionality for everything else
