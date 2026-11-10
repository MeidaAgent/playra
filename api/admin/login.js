import {
  createSessionCookie,
  getAuthConfigurationError,
  hasSameOrigin,
  verifyPassword,
} from "../../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (!hasSameOrigin(req)) {
    return res.status(403).json({ error: "Permintaan tidak diizinkan." });
  }

  const configurationError = getAuthConfigurationError();
  if (configurationError) {
    console.error(configurationError);
    return res.status(503).json({ error: "Login admin belum dikonfigurasi." });
  }
  if (!verifyPassword(req.body?.password)) {
    return res.status(401).json({ error: "Password tidak cocok." });
  }

  res.setHeader("Set-Cookie", createSessionCookie());
  return res.status(200).json({ ok: true });
}

