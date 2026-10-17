# Catalog API contract

## C1 1.0.0

```http
GET /v1/catalog
Accept: application/json
```

HTTP 200, `Content-Type: application/json` (charset allowed):

```json
{ "items": [{ "id": "item-1", "title": "Example item" }] }
```

Items must be an array; id/title are strings containing something other than ASCII
whitespace (U+0009–U+000D, U+0020). Preserve original strings and order. IDs are opaque,
unique and case-sensitive. Unknown fields are allowed. Missing/null/wrong types, blank
fields, duplicate IDs or malformed JSON fail the whole response. Empty items is success.
No detail endpoint, pagination, authentication or mutation is defined.

Local fixtures live in `contracts/catalog`. The demo is an in-memory provider with six
sample objects; fixture conformance alone is not evidence of a real backend integration.

## Environment and resource limits

- DATA_MODE defaults to demo. Only demo/live are valid.
- Live requires API_BASE_URL: HTTPS origin only, with no credentials/path/query/fragment.
- Invalid configuration fails during build/start; live failures never switch to demo.
- `STARTER_E2E=1` permits HTTP loopback solely for the owned test harness. Never set it in
  a deployment. It exposes no scenario controls in the app; controls exist only on the mock.
- Upstream path is fixed, redirects are rejected, and no caller-supplied target URL is used.
- Server deadline: 15 seconds. Browser deadline: 20 seconds. Both include body consumption.
- JSON body limit: 1 MiB. UTF-8/content type/body shape are validated before domain mapping.
- Abort signals cancel fetch/body reads. Caller cancellation propagates; deadline expiry
  becomes TIMEOUT. No detached background jobs or automatic retries exist.

## Result and errors

Domain uses `AppResult<T>`: success has `value`, failure has `error`. AppError contains code,
retryable, optional upstream status and optional retryAfterSeconds. It has no raw message,
headers, stack trace or credentials. Only NETWORK, TIMEOUT, SERVER and RATE_LIMITED permit
manual retry; rate limit retry also requires its wait to expire.

| Upstream/input                            | Code                                 | Handler HTTP status          |
| ----------------------------------------- | ------------------------------------ | ---------------------------- |
| 401 / 403 / 404                           | UNAUTHORIZED / FORBIDDEN / NOT_FOUND | Same upstream status         |
| Other 4xx except 429                      | BAD_REQUEST                          | Same upstream status         |
| 429                                       | RATE_LIMITED                         | 429                          |
| 5xx                                       | SERVER                               | Same upstream status         |
| Transport failure                         | NETWORK                              | 502                          |
| Deadline                                  | TIMEOUT                              | 504                          |
| Invalid 200 response or other 2xx         | DECODING                             | 502                          |
| Redirect                                  | BAD_REQUEST                          | 502                          |
| Unexpected defect at application boundary | UNKNOWN                              | 500                          |
| Caller abort                              | Control flow                         | No fabricated error envelope |

Retry-After accepts integer seconds or IMF-fixdate. Past dates become zero, malformed values
create no wait. The clock is injected in transport tests; client retry checks the absolute
receipt-based deadline again on click. Numeric overflow is rejected.

## Internal browser adapter

`GET /api/catalog` returns success `{ "ok": true, "items": [...] }` or failure
`{ "ok": false, "error": { "code": "...", "retryable": true } }` with optional error
fields described above. It shares the server repository and uses `Cache-Control: no-store`.
Browser fetch also uses no-store and decodes the envelope for non-200 HTTP responses.
Invalid envelopes or inconsistent HTTP/envelope pairs become DECODING. `error.status`
always describes the upstream, so it can be 200 while the handler returns 502.

The endpoint is publicly reachable; “internal” refers to application ownership, not access
control. Product authentication/authorization must be designed explicitly before sensitive
data or mutations are added. See [Next.js BFF guidance](https://nextjs.org/docs/app/guides/backend-for-frontend).

The server page uses a serializable domain result directly, avoiding an unnecessary JSON
round trip. UI text comes from feature presentation; API titles render as plain text.

## Changes

C1, starter and token versions are tracked independently in integration-manifest.json.
Additive unknown fields are compatible. Changed types/meaning or removed fields require a
new major contract or endpoint with an explicit migration. Update adapters, fixtures and
browser tests when replacing this sample with a real product API.
