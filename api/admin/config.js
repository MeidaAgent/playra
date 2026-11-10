import { CA_ADDRESS } from "../../lib/ca-config.js";
import {
  getAuthConfigurationError,
  hasSameOrigin,
  isAuthenticated,
} from "../../lib/auth.js";

// The CA is now set manually in lib/ca-config.js and shipped with a deploy.
// The panel can still show it, but saving from the panel is disabled.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (!["GET", "PUT"].includes(req.method)) {
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed." });
  }
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: "Silakan login kembali." });
  }
  if (req.method === "PUT" && !hasSameOrigin(req)) {
    return res.status(403).json({ error: "Permintaan tidak diizinkan." });
  }
  if (getAuthConfigurationError()) {
    return res.status(503).json({ error: "Login admin belum dikonfigurasi." });
  }

  if (req.method === "GET") {
    return res.status(200).json({ caAddress: CA_ADDRESS });
  }

  return res.status(409).json({
    error:
      "CA sekarang diatur manual lewat kode (lib/ca-config.js), tidak bisa diubah dari panel.",
  });
}
