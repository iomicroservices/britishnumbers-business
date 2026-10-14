# Airtable proxy (Cloudflare Pages Functions)

These Functions recreate WeWeb’s `/ww/cms_data_sets/...` Airtable endpoints so the exported frontend can read/write Airtable on Cloudflare Pages.

## Required secret

In **Cloudflare Dashboard → Workers & Pages → your project → Settings → Environment variables**:

| Name | Type | Environments |
|------|------|----------------|
| `AIRTABLE_TOKEN` | Secret | Production and Preview |

Use your Airtable personal access token with at least:

- `data.records:read`
- `data.records:write`
- `schema.bases:read` (optional but useful)

Do **not** commit the token. Base/table IDs are already in `functions/_lib/airtable.js`.

After adding the secret, trigger a new deployment (redeploy or push a commit) so Functions pick it up.

## Endpoints

| Method | Path |
|--------|------|
| `POST` | `/ww/cms_data_sets/:collectionId/fetch` |
| `POST` | `/ww/cms_data_sets/:collectionId/airtable/record` |
| `GET` | `/ww/cms_data_sets/:collectionId/airtable/record/:recordId` |
| `PATCH` | `/ww/cms_data_sets/:collectionId/airtable/record/:recordId` |
| `DELETE` | `/ww/cms_data_sets/:collectionId/airtable/record/:recordId` |

## Smoke test after deploy

Replace `BASE` with your Pages URL:

```bash
# List sessions
curl -s -X POST "$BASE/ww/cms_data_sets/dd07e718-03fb-46e0-b759-042f6654659a/fetch?limit=5&offset=0" \
  -H "content-type: application/json" \
  -d "{}"

# Create a session
curl -s -X POST "$BASE/ww/cms_data_sets/dd07e718-03fb-46e0-b759-042f6654659a/airtable/record" \
  -H "content-type: application/json" \
  -d "{\"data\":{\"type\":\"mobile\",\"is_auth\":false}}"
```

Expect JSON with `type: "collection"` for fetch, and `{ "data": { "id": "rec..." } }` for create. Confirm the new row in Airtable.
