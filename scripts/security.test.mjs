// Security regression checks: comment avatars may only be loaded from our own
// Supabase storage. A forged/stale profile_image must not become a tracking
// pixel. Run: npm test
import assert from "node:assert/strict";
import { trustedStorageImageUrl } from "../src/utils/image.js";

const BASE = "https://proj.supabase.co";
const storage = `${BASE}/storage/v1/object/public/cv-documents/avatar.png`;

assert.equal(trustedStorageImageUrl(storage, BASE), storage, "own storage URL allowed");
assert.equal(trustedStorageImageUrl("https://evil.example/pixel.gif", BASE), null, "third-party host blocked");
assert.equal(trustedStorageImageUrl("https://proj.supabase.co.evil.example/storage/v1/x.png", BASE), null, "lookalike host blocked");
assert.equal(trustedStorageImageUrl(`${BASE}/functions/v1/submit-comment`, BASE), null, "non-storage path blocked");
assert.equal(trustedStorageImageUrl("javascript:alert(1)", BASE), null, "javascript: blocked");
assert.equal(trustedStorageImageUrl("data:image/svg+xml,<svg onload=alert(1)>", BASE), null, "data: blocked");
assert.equal(trustedStorageImageUrl("", BASE), null, "empty blocked");
assert.equal(trustedStorageImageUrl(storage, undefined), null, "no configured project fails closed");

console.log("ok - comment avatar URL allowlist (8 checks)");
