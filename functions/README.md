# Airtable proxy (Cloudflare Pages Functions)

These Functions recreate WeWeb’s `/ww/cms_data_sets/...` Airtable endpoints and add session ensure, so the exported frontend can read/write Airtable on Cloudflare Pages without WeWeb microservices.

## Required env (Cloudflare Pages)

In **Workers & Pages → your project → Settings → Environment variables** (Production + Preview):

| Name | Type | Purpose |
|------|------|---------|
| `AIRTABLE_TOKEN` | Secret | Airtable personal access token |
| `SESSION_TTL_DAYS` | Plain text (optional) | Session lifetime in days (default `7`) |

Token scopes needed:

- `data.records:read`
- `data.records:write`
- `schema.bases:read` (optional)

Do **not** commit the token. Base/table IDs live in `functions/_lib/airtable.js`.

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
| `POST` | `/ww/session/ensure` |
| `POST` | `/ww/cms_data_sets/:collectionId/fetch` |
| `POST` | `/ww/cms_data_sets/:collectionId/airtable/record` |
| `GET` | `/ww/cms_data_sets/:collectionId/airtable/record/:recordId` |
| `PATCH` | `/ww/cms_data_sets/:collectionId/airtable/record/:recordId` |
| `DELETE` | `/ww/cms_data_sets/:collectionId/airtable/record/:recordId` |

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

## Manual UI checks

1. Fresh browser on Mobile Numbers: one session created; reload keeps the same id  
2. Delete that Airtable session row (or wait past TTL): reload creates a new id  
3. Add to basket still works  
4. Network tab: no open `/fetch` dumping full sessions/basket tables
