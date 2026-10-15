# Cloudflare Pages Functions

Proxies that replace WeWeb microservices so the exported frontend can run on Cloudflare Pages.

## Required env (Cloudflare Pages)

In **Workers & Pages → your project → Settings → Environment variables** (Production + Preview):

| Name | Type | Purpose |
|------|------|---------|
| `AIRTABLE_TOKEN` | Secret | Airtable personal access token |
| `SESSION_TTL_DAYS` | Plain text (optional) | Session lifetime in days (default `7`) |
| `COMPANIES_HOUSE_API_KEY` | Secret | Companies House API key (username only; password empty) |
| `MAKE_LANDLINE_WEBHOOK_URL` | Secret | Full Make.com webhook URL for landline search |
| `MAKE_CHECKOUT_WEBHOOK_URL` | Secret | Full Make.com webhook URL for checkout / lead submit |

Airtable token scopes needed:

- `data.records:read`
- `data.records:write`
- `schema.bases:read` (optional)

Do **not** commit secrets. Airtable base/table IDs live in `functions/_lib/airtable.js`.

Redeploy after changing secrets/env.

## Security model

- `POST /ww/session/ensure` — validate existing session or create one (TTL via Airtable `createdTime`)
- Direct create on the sessions collection is **blocked**
- Listing sessions via `/fetch` is **blocked**
- `basket_items` / `companies` / `leads` fetch requires `sessionId` and is filtered server-side
- Creating basket/companies/leads requires a linked session field (`session_id` or `session`)

Expired sessions are treated as invalid on ensure/GET; rows are not deleted automatically yet.

## Endpoints

| Method | Path |
|--------|------|
| `GET` / `POST` | `/api/companies-house?q=...` |
| `GET` / `POST` | `/api/make/landline?areaCode=...&grade=...` |
| `POST` | `/api/make/checkout` |
| `POST` | `/ww/session/ensure` |
| `POST` | `/ww/cms_data_sets/:collectionId/fetch` |
| `POST` | `/ww/cms_data_sets/:collectionId/airtable/record` |
| `GET` | `/ww/cms_data_sets/:collectionId/airtable/record/:recordId` |
| `PATCH` | `/ww/cms_data_sets/:collectionId/airtable/record/:recordId` |
| `DELETE` | `/ww/cms_data_sets/:collectionId/airtable/record/:recordId` |

### Companies House

Frontend collection `companiesHouse` calls same-origin `/api/companies-house` (no API key in the browser). The Function adds Basic auth and forwards to Companies House search.

### Make.com

Webhook URLs stay in Cloudflare secrets (not in page JSON). Frontend calls:

- Collection `apiLandline` → `GET /api/make/landline` (forwards `areaCode`, `grade`)
- Workflow action `send to make` → `POST /api/make/checkout` (forwards JSON body)

## Smoke test after deploy

Replace `BASE` with your Pages URL:

```bash
# Ensure (create) a session
curl -s -X POST "$BASE/ww/session/ensure" \
  -H "content-type: application/json" \
  -d "{\"type\":\"mobile\",\"is_auth\":false}"

# Reuse / validate that session (paste id from previous response)
curl -s -X POST "$BASE/ww/session/ensure" \
  -H "content-type: application/json" \
  -d "{\"sessionId\":\"recXXXX\",\"type\":\"mobile\",\"is_auth\":false}"

# Unfiltered sessions list should 403
curl -s -o - -w "\nHTTP %{http_code}\n" -X POST \
  "$BASE/ww/cms_data_sets/dd07e718-03fb-46e0-b759-042f6654659a/fetch" \
  -H "content-type: application/json" -d "{}"

# Basket fetch requires sessionId
curl -s -X POST \
  "$BASE/ww/cms_data_sets/f307c3b2-c35c-4fda-8eeb-8519409853ea/fetch?sessionId=recXXXX" \
  -H "content-type: application/json" -d "{}"
```

### Companies House smoke test

```bash
curl.exe -s "$BASE/api/companies-house?q=british+numbers"
```

Expect a JSON payload with an `items` array.

### Make.com smoke tests

```bash
# Landline search (use a real areaCode/grade your scenario expects)
curl.exe -s "$BASE/api/make/landline?areaCode=020&grade=gold"

# Checkout / lead submit
curl.exe -s -X POST "$BASE/api/make/checkout" \
  -H "content-type: application/json" \
  -d "{\"email\":\"test@example.com\",\"type\":\"mobile\",\"source\":\"smoke-test\"}"
```


Expect JSON (or `{ ok: true, message: "Accepted" }` if Make returns plain text). Missing secrets return `500` with a clear error.

## Manual UI checks

1. Fresh browser on Mobile Numbers: one session created; reload keeps the same id
2. Delete that Airtable session row (or wait past TTL): reload creates a new id
3. Add to basket still works
4. Network tab: no open `/fetch` dumping full sessions/basket tables
5. Company search returns Companies House results (no WeWeb/`data.weweb.io` calls)
6. Telephone Numbers landline search hits `/api/make/landline` (not `hook.eu1.make.com`)
7. Checkout / send-to-make on mobile, telephone, special hits `/api/make/checkout`
