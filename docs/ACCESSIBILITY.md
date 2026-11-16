# Accessibility

Goal: WCAG 2.2 level AA.

## What is in place

- **Keyboard**: every control is reachable and operable; a *Skip to main content* link is the first tab stop; the sidebar also opens on focus; tooltips open on focus; the detective game moves focus to the question and then to the explanation.
- **Structure**: one `h1` per page, ordered headings, landmarks (`header`, `nav`, `main`), distinct page titles, the document `lang` follows the interface language.
- **Names and roles**: labelled form controls, the map exposed as a named region, the carousel with valid roles and a unique label, live regions for loading, errors and the mode-change message.
- **Charts and maps**: the time series has a text summary and a collapsible data table; the map has a *Table* view with every state and its value.
- **Colour**: information is never carried by colour alone (answers use icons and text; trend states have text badges; hatched pattern for no data). Palette direction is also named in text ("Low / High").
- **Motion**: with *reduce motion* enabled, transitions and animations are removed, the home video is paused on a still frame and the map does not fly between places.
- **Targets**: interactive elements are at least 24 × 24 px (most are 44 px).
- **Language**: full English and Spanish interface.

## How it was checked

`axe-core` (a dev dependency) was run in the browser with the rules `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice` on: home, explorer (panels open), detective (intro, question and feedback), My place and More information. Result: **no violations** after the fixes below.

Fixed after the first audit: invalid roles on the hero video and carousel slides, duplicate landmark names, an unlabelled zone selector, a map container with focusable children marked as an image, a missing page-level heading, and 18 px carousel dots.

## Run the audit yourself

```bash
cd web && npm run dev
```

then, in the browser console on any page:

```js
const s = document.createElement('script'); s.src = '/node_modules/axe-core/axe.min.js'; document.head.append(s)
// after it loads:
axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'] }).then(r => console.table(r.violations.map(v => [v.id, v.nodes.length])))
```

## Still to do

- Manual pass with a screen reader (NVDA or VoiceOver) and with the keyboard only.
- Lighthouse accessibility score on the deployed URL.
- Zoom to 200% and 400% on a small screen for every page.
