import { clearSessionCookie, hasSameOrigin } from "../../lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (!hasSameOrigin(req)) {
    return res.status(403).json({ error: "Permintaan tidak diizinkan." });
  }

  res.setHeader("Set-Cookie", clearSessionCookie());
  return res.status(200).json({ ok: true });
}

