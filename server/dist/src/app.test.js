"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
describe("Playra API routes", () => {
    test("wallet challenge is issued and waitlist is idempotent", async () => {
        const app = await (0, app_1.buildApp)({ jwtSecret: "test-only-secret-not-for-production" });
        const challenge = await app.inject({ method: "POST", url: "/auth/challenge", payload: { address: "0x0000000000000000000000000000000000000001" } });
        expect(challenge.statusCode).toBe(200);
        expect(challenge.json().challenge).toContain("Playra login");
        const waitlist = await app.inject({ method: "POST", url: "/waitlist", payload: { address: "0x0000000000000000000000000000000000000001" } });
        expect(waitlist.statusCode).toBe(200);
        expect(waitlist.json()).toEqual({ joined: true });
        await app.close();
    });
    test("health and economy config expose caps without secrets", async () => {
        const app = await (0, app_1.buildApp)({ jwtSecret: "test-only-secret-not-for-production" });
        const health = await app.inject({ method: "GET", url: "/health" });
        expect(health.statusCode).toBe(200);
        expect(health.json()).not.toHaveProperty("JWT_SECRET");
        const config = await app.inject({ method: "GET", url: "/economy/config" });
        expect(config.json()).toMatchObject({ GEM_TO_COIN_RATIO: 50, WITHDRAW_QUEUE: "robinhood" });
        await app.close();
    });
    test("autosave requires a bearer token and transaction id", async () => {
        const app = await (0, app_1.buildApp)({ jwtSecret: "test-only-secret-not-for-production" });
        const result = await app.inject({ method: "POST", url: "/autosave/1", payload: { actions: [{ type: "seed.planted" }] } });
        expect(result.statusCode).toBe(401);
        await app.close();
    });
});
