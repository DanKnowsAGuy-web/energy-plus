# Energy+ Overspend Calculator (app)

Static, no build step. Open index.html through any web server (file:// works for everything except the deferred ZIP files in some browsers).

## Files

| File | What it is | Who edits it |
|---|---|---|
| index.html | The page: styles, both registers, the flow, the results | build |
| engine.js | The math. Pure functions, no DOM. Reads window.EP | build |
| constants.js | Every number the engine uses, with source and grade | Dan and build, one row at a time |
| copy.en.js | Every buyer facing sentence, keyed by moment | Dan, freely. Keep the {placeholders} |
| copy.es.js | Spanish mirror, same keys | translator |
| zip/zip-index.js | ZIP to [state, utility index], 39,130 ZIPs, OpenEI 2020 crosswalk | refresh yearly |
| zip/utilities.js | 936 utilities with 2020 commercial rate (used for name and matching only) | refresh yearly |
| zip/zip3-index.js | three digit fallback | refresh yearly |
| print.css | the one pager | build |
| assets/ | wordmark, ink and paper versions | brand |

Copy mirror for editing: ../copy/REVEAL-SENTENCES.md (regenerated from copy.en.js).

## Configuration

Readings go to two places: the FormSubmit inbox (LEAD_ENDPOINT) and a Google Sheet through an Apps Script web app (SHEET_ENDPOINT). The script and its five step setup are in ../backend/apps-script.gs.

Top of the inline script in index.html:

```
const CTA_BOOK_URL = "https://book.slashyourenergycost.com/";   // booking scheduler
const CTA_TEXT_NUMBER = "";     // optional sms number
```

For local testing, override the book link without touching the constant:
`localStorage.setItem('ep_book_url', 'http://localhost:8792/')` in the browser console. `bookURL()` checks that key first and falls back to `CTA_BOOK_URL` when it is not set.

## Hand-off to the scheduler

The book button (result screen and contact section) builds a URL to the scheduler with the visitor's answers so it can skip questions it already has: `src=calc`, `f` (facility key), `b` (monthly bill), `n` (locations), `z`/`st` (ZIP or state), `est_lo`/`est_hi` (annual overspend range), `s`/`o`/`h`/`w`/`a`/`util` (season, occupancy, heat, hours per week, unit age chip, utility name), `lang`, and `name`/`phone` when the contact fields are filled. All values are omitted when empty and URL encoded.

## Deep links

Every completed reading writes its state to the URL hash, for example:
`/overspend-calculator/#z=33401&f=hotel&b=25000&s=summer&o=typical&h=hp&w=168&xage=12`
The forward and text buttons carry that link.

## Deploy

Copy this folder to `ENERGY SAVINGS/Main Template/overspend-calculator/` and push the `usersite` remote (DanKnowsAGuy-web.github.io). Live path: /overspend-calculator/.

## Rate note

The ZIP crosswalk carries 2020 utility rates. The page shows the state's June 2026 EIA commercial average and names the utility; demand rates and tariff clauses come from constants.js for the sourced utilities only (FPL, Duke FL, TECO, Georgia Power, Con Edison, and others listed there).
