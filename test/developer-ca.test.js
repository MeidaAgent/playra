import assert from "node:assert/strict";
import test from "node:test";
import {
  createSessionCookie,
  clearSessionCookie,
  getAuthConfigurationError,
  hasSameOrigin,
  isAuthenticated,
  verifyPassword,
} from "../lib/auth.js";
import adminConfigHandler from "../api/admin/config.js";
import developerHandler from "../api/developer.js";
import caHandler from "../api/ca.js";
import { CA_ADDRESS } from "../lib/ca-config.js";
import loginHandler from "../api/admin/login.js";
import logoutHandler from "../api/admin/logout.js";

function createMockResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("password verification accepts playra#991 and rejects wrong passwords", () => {
  assert.equal(getAuthConfigurationError(), null);
  assert.equal(verifyPassword("playra#991"), true);
  assert.equal(verifyPassword("wrongpass"), false);
  assert.equal(verifyPassword(""), false);
});

test("session cookie authentication and tampering rejection", () => {
  const cookieHeader = createSessionCookie().split(";")[0];
  assert.equal(isAuthenticated({ headers: { cookie: cookieHeader } }), true);
  assert.equal(
    isAuthenticated({ headers: { cookie: `${cookieHeader}tampered` } }),
    false,
  );
  assert.equal(isAuthenticated({ headers: {} }), false);
});

test("developerHandler returns login form if unauthenticated and panel if authenticated", async () => {
  // Unauthenticated
  const resUnauth = createMockResponse();
  await developerHandler({ method: "GET", headers: {} }, resUnauth);
  assert.equal(resUnauth.statusCode, 200);
  assert.ok(resUnauth.body.includes("Login dev"));
  assert.ok(resUnauth.body.includes("/developer.js"));

  // Authenticated
  const cookieHeader = createSessionCookie().split(";")[0];
  const resAuth = createMockResponse();
  await developerHandler(
    { method: "GET", headers: { cookie: cookieHeader } },
    resAuth,
  );
  assert.equal(resAuth.statusCode, 200);
  assert.ok(resAuth.body.includes("Developer panel"));
  assert.ok(resAuth.body.includes("/developer-panel.js"));
  assert.ok(resAuth.body.includes("CA (Contract Address)"));
});

test("loginHandler validates playra#991 and sets cookie", async () => {
  // Wrong password
  const resWrong = createMockResponse();
  await loginHandler(
    {
      method: "POST",
      headers: { origin: "http://localhost:3000", host: "localhost:3000" },
      body: { password: "wrong" },
    },
    resWrong,
  );
  assert.equal(resWrong.statusCode, 401);

  // Correct password playra#991
  const resCorrect = createMockResponse();
  await loginHandler(
    {
      method: "POST",
      headers: { origin: "http://localhost:3000", host: "localhost:3000" },
      body: { password: "playra#991" },
    },
    resCorrect,
  );
  assert.equal(resCorrect.statusCode, 200);
  assert.ok(resCorrect.headers["set-cookie"]?.includes("playra_admin="));
});

test("logoutHandler clears session cookie", async () => {
  const resLogout = createMockResponse();
  await logoutHandler(
    {
      method: "POST",
      headers: { origin: "http://localhost:3000", host: "localhost:3000" },
    },
    resLogout,
  );
  assert.equal(resLogout.statusCode, 200);
  assert.ok(resLogout.headers["set-cookie"]?.includes("Max-Age=0"));
});

test("caHandler returns the CA from lib/ca-config.js", async () => {
  const res = createMockResponse();
  await caHandler({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.caAddress, CA_ADDRESS);
});

test("adminConfigHandler requires auth, shows the CA and rejects updates", async () => {
  // Unauthenticated GET
  const resUnauth = createMockResponse();
  await adminConfigHandler({ method: "GET", headers: {} }, resUnauth);
  assert.equal(resUnauth.statusCode, 401);

  // Authenticated GET
  const cookieHeader = createSessionCookie().split(";")[0];
  const resAuthGet = createMockResponse();
  await adminConfigHandler(
    { method: "GET", headers: { cookie: cookieHeader } },
    resAuthGet,
  );
  assert.equal(resAuthGet.statusCode, 200);
  assert.equal(resAuthGet.body.caAddress, CA_ADDRESS);

  // Authenticated PUT is disabled: the CA is set manually in code
  const resAuthPut = createMockResponse();
  await adminConfigHandler(
    {
      method: "PUT",
      headers: {
        cookie: cookieHeader,
        origin: "http://localhost:3000",
        host: "localhost:3000",
      },
      body: { caAddress: "0x1234567890abcdef1234567890abcdef12345678" },
    },
    resAuthPut,
  );
  assert.equal(resAuthPut.statusCode, 409);

  // Public CA is unchanged
  const resPublic = createMockResponse();
  await caHandler({ method: "GET", headers: {} }, resPublic);
  assert.equal(resPublic.body.caAddress, CA_ADDRESS);
});
