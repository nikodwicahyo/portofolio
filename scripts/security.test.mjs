// Security regression checks: comment avatars may only be loaded from our own
// Supabase storage, and comment intake is plain text only. Run: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { trustedStorageImageUrl } from "../src/utils/image.js";
import { checkComment, MAX_BODY, MAX_NAME } from "../supabase/functions/submit-comment/rules.mjs";

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

const check = (name, content) => checkComment({ userName: name, content });
const rejects = (name, content, why) => assert.ok(check(name, content).error, why);
const accepts = (name, content, why) => assert.equal(check(name, content).error, null, why);

// Accepted: plain text, including the things a naive /[<>]/ filter would break.
assert.deepEqual(check("  Ana  ", "  hello world  "), { name: "Ana", body: "hello world", error: null }, "plain text accepted and trimmed");
accepts("Ana", "love it <3", "<3 is text, not a tag");
accepts("Ana", "5 < 6 and 7 > 2", "comparisons are text");
accepts("Ana", "metadata: not a URL scheme", "word-start scheme check");
accepts("Ana", "a https://x.y b https://z.w", "two links allowed");

// Rejected: every tag form, in either field, plus URL schemes and spam links.
rejects("Ana", "<b>hi</b>", "<b> rejected");
rejects("Ana", "</script >", "closing tag rejected");
rejects("Ana", "<!-- x -->", "comment form rejected");
rejects("Ana", "< img src=x onerror=alert(1)>", "tag with leading space rejected");
rejects("<b>", "hi", "markup in the name field rejected");
rejects("Ana", "javascript:alert(1)", "javascript: rejected");
rejects("Ana", "javascript: alert(1)", "javascript: with space rejected");
rejects("Ana", "DATA:text/html,<b>x", "data: rejected case-insensitively");
rejects("Ana", "https://a.b https://c.d https://e.f", "third link rejected");

// Length and emptiness caps match the function + DB constraints.
rejects("", "hi", "empty name rejected");
rejects("Ana", "   ", "blank message rejected");
rejects("x".repeat(MAX_NAME + 1), "hi", "long name rejected");
rejects("Ana", "x".repeat(MAX_BODY + 1), "long message rejected");
accepts("x".repeat(MAX_NAME), "x".repeat(MAX_BODY), "exact caps accepted");

// --- Storage / retention invariants (audit findings F1, F5, F6, F7) ----------
// These guard the layers that cannot be exercised from Node: the edge function's
// secret handling, the SQL retention triggers and the storage policy roles.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const fn = read("supabase/functions/submit-comment/index.ts");
assert.match(fn, /COMMENT_HASH_SALT/, "IP pepper comes from a secret");
assert.doesNotMatch(fn, /comment-v1::"\s*\+/, "no constant-only salt");
assert.match(fn, /rate ledger write failed/, "ledger write failure is not ignored");
assert.match(fn, /turnstile/, "CAPTCHA path present");

const retention = read("supabase/migrations/20261024_privacy_retention.sql");
assert.match(retention, /comment_rate_limits_prune[\s\S]*SECURITY DEFINER/, "IP ledger pruned as definer (RLS would no-op it)");
assert.match(retention, /portfolio_events_prune[\s\S]*SECURITY DEFINER/, "analytics pruned as definer");
assert.match(retention, /FOR SELECT TO anon, authenticated/, "listing lockdown covers signed-in users too");
assert.match(retention, /allowed_mime_types/, "bucket MIME allowlists are enforced");

console.log("ok - comment avatar URL allowlist + comment rules (27 checks)");
console.log("ok - storage + retention invariants (8 checks)");
