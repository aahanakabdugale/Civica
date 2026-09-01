# Citizen-facing UI — PS02

Covers the three items from your list:

1. Complaint submission form (text, location picker via map, optional photo)
2. Citizen status tracking page (lookup by complaint ID)
3. Multi-language UI (English + Hindi included; adding more is one file)

## Install

Drop the `src/` contents into your Vite + React project, then:

```bash
npm install react-leaflet leaflet
```

No CSS framework required — plain CSS with a small set of design tokens in
`src/styles/tokens.css`. No UI kit dependency, so it won't fight your
teammates' styling choices.

## Where things live

```
src/
  styles/tokens.css       # colors, type, spacing — edit these to reskin everything
  i18n/index.jsx          # lightweight translation context (no external lib)
  i18n/locales/en.json    # English strings
  i18n/locales/hi.json    # Hindi strings — copy this file to add another language
  components/
    ComplaintForm.jsx     # 4-step wizard: issue -> location -> photo -> review
    LocationPicker.jsx    # Leaflet map, draggable pin + "use my location"
    StatusTracker.jsx     # search by ID, shows status + priority + timeline
    LanguageSwitcher.jsx  # dropdown, persists choice in localStorage
  App.jsx                 # wires the two pages + the two backend calls
```

## Wiring to your backend

Everything backend-specific is isolated to two functions at the top of
`App.jsx`:

```js
async function submitComplaint(formData) { ... }   // POST /complaints
async function lookupComplaint(id) { ... }         // GET /complaints/:id
```

Set `VITE_API_BASE` in a `.env` file to point at your backend
(`VITE_API_BASE=http://localhost:8000`).

### Expected request — `POST /complaints`

Sent as `multipart/form-data` (so the optional photo can ride along):

| field | type | notes |
|---|---|---|
| `category` | string | one of `roads`, `water`, `electricity`, `sanitation`, `streetlight`, `other` |
| `description` | string | free text, any language |
| `latitude`, `longitude` | string (parseable float) | from the map |
| `contact` | string | optional, phone number |
| `photo` | file | optional |

Expected response: `{ "id": "NGS-24601" }` — whatever ID format your backend
generates works, it's just displayed and used for lookup.

### Expected response — `GET /complaints/:id`

```json
{
  "id": "NGS-24601",
  "category": "roads",
  "description": "Large pothole near the bus stop, been there 2 weeks.",
  "status": "in_progress",
  "priority": "high",
  "filedOn": "2026-08-20T09:12:00Z",
  "department": "Roads & Infrastructure",
  "duplicateOf": null,
  "timeline": [
    { "status": "open", "label": "Complaint filed", "timestamp": "2026-08-20T09:12:00Z" },
    { "status": "in_progress", "label": "Assigned to field team", "timestamp": "2026-08-21T11:00:00Z", "note": "Team dispatched" }
  ]
}
```

`status` must be one of: `open`, `in_progress`, `resolved`, `rejected`,
`duplicate` — these map to translated labels automatically. Same for
`priority`: `low`, `medium`, `high`, `critical`.

Return a 404 for an unknown ID — the component shows the "not found" message
correctly in whichever language is active.

## Adding a language

1. Copy `src/i18n/locales/hi.json` to e.g. `mr.json`, translate the values
   (keep the keys identical).
2. In `src/i18n/index.jsx`, import it and add it to `DICTIONARIES` and
   `LANGUAGES`.

That's it — every component reads through `t()`, so nothing else changes.

## Notes for the demo

- The map defaults to New Delhi (`DEFAULT_CENTER` in `LocationPicker.jsx`) —
  change this to your seed data's city so the map opens in the right place.
- The form validates step-by-step so nobody reaches "submit" with a missing
  location — worth mentioning if judges ask about data quality feeding the
  duplicate-detection model.
- `StatusTracker` accepts a `?id=` query param (`/track?id=NGS-24601`) so the
  "Track this complaint" link after a successful submission works without
  any extra state management.
