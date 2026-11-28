import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  OFFICIAL_ANTICHEATS,
  HEARTBEAT_INTERVAL_MS,
  canonicalHeartbeatMessage,
  signHeartbeatHmac,
  sendSignedAcHeartbeat,
} = require("../apps/desktop/shieldHeartbeat.js");

test("VANTS PC detector incluye Riot Vanguard (vgc/vgk) y FACEIT AC (FACEITService/faceit) con ciclo de 30s", () => {
  assert.equal(HEARTBEAT_INTERVAL_MS, 30_000);
  const vg = OFFICIAL_ANTICHEATS.find((a: any) => a.id === "vanguard");
  const fc = OFFICIAL_ANTICHEATS.find((a: any) => a.id === "faceit");
  assert.ok(vg && vg.procs.includes("vgc.exe") && vg.services.includes("vgk"));
  assert.ok(fc && fc.procs.includes("faceitservice.exe") && fc.services.includes("FACEITService"));
});

test("sendSignedAcHeartbeat solicita challenge, firma con HMAC VANTS_PC_AC_SECRET y reporta Vanguard/FACEIT AC ON", async () => {
  const calls: Array<{ url: string; method: string; sig?: string | null; body?: any }> = [];
  const secret = "test-vants-pc-ac-secret-32chars-xyz";

  const mockFetch = async (url: string, init: any) => {
    const method = init?.method || "GET";
    const body = init?.body ? JSON.parse(init.body) : undefined;
    const sig = init?.headers?.["X-Vants-AC-Signature"] || null;
    calls.push({ url, method, sig, body });

    if (url.endsWith("/ai/anticheat/challenge")) {
      return new Response(
        JSON.stringify({ ok: true, nonce: "nonce-abc-123", user_sub: "google-oauth2|player-42", expires_in: 60 }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (url.endsWith("/ai/anticheat/heartbeat")) {
      const expectedMsg = canonicalHeartbeatMessage({
        nonce: body.nonce,
        userSub: "google-oauth2|player-42",
        ts: body.ts,
        hwid: body.hwid,
        vanguardOn: body.vanguard_on,
        faceitAcOn: body.faceit_ac_on,
        hardFlags: body.hard_flags,
      });
      const expectedSig = signHeartbeatHmac(secret, expectedMsg);
      assert.equal(sig, expectedSig);
      return new Response(
        JSON.stringify({ ok: true, ttl: 60, ac: { badge: "Vanguard ON · FACEIT AC ON", vanguard_on: true, faceit_ac_on: true } }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    return new Response("not found", { status: 404 });
  };

  const res = await sendSignedAcHeartbeat({
    accessToken: "jwt-player-token",
    acSecret: secret,
    shieldReport: {
      status: "clean",
      appVersion: "1.2.0",
      activeAntiCheats: [
        { id: "vanguard", name: "Riot Vanguard" },
        { id: "faceit", name: "FACEIT Anti-Cheat" },
      ],
      flaggedTools: [],
    },
    hwid: "hwid-test-01",
    fetchImpl: mockFetch,
  });

  assert.equal(res.ok, true);
  assert.equal(res.ttl, 60);
  assert.equal(res.ac.vanguard_on, true);
  assert.equal(res.ac.faceit_ac_on, true);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /\/ai\/anticheat\/challenge$/);
  assert.match(calls[1].url, /\/ai\/anticheat\/heartbeat$/);
});
