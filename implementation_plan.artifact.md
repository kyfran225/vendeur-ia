# Fix WhatsApp Authentication Error and Add Mock Mode

The logs show a `Meta Authentication Error (code 190)` when sending a Magic Link via WhatsApp. This indicates that the `WHATSAPP_ACCESS_TOKEN` has expired or is invalid.

## Proposed Changes

### 1. Documentation & Diagnosis
- Confirm that Error 190 means the Meta Access Token is expired.
- Instruct the user to update the token in `apps/api/.env` or via the Admin Dashboard (`PATCH /api/admin/settings`).

### 2. [WhatsApp Service](file:///C:/Users/Franck/web-apps/vendeur-ia/apps/api/src/modules/whatsapp/whatsapp.service.ts)
- Implement `AI_MOCK_MODE` support in `sendAuthMagicLink`, `sendMetaMessage`, and `sendMetaAudio`.
- This allows developers to work on the onboarding flow without needing a valid Meta WhatsApp Business API token.
- When `AI_MOCK_MODE` is enabled, the magic link and OTP code will be logged to the console instead of calling the Meta API.

## Verification Plan

### Automated Tests
- Run existing WhatsApp tests to ensure no regressions.
- `pnpm -C apps/api test src/modules/whatsapp/whatsapp.test.ts`

### Manual Verification
- Set `AI_MOCK_MODE=true` in `apps/api/.env`.
- Trigger a login request.
- Verify that the console logs the Magic Link and OTP code.
- Verify that the API response still contains the OTP code in development mode.
