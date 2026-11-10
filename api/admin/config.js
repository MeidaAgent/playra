import { readCaAddress, writeCaAddress } from "../../lib/blob-store.js";
import {
  getAuthConfigurationError,
  hasSameOrigin,
  isAuthenticated,
} from "../../lib/auth.js";

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
    try {
      const caAddress = await readCaAddress();
      return res.status(200).json({ caAddress });
    } catch (error) {
      console.error("Could not load admin CA configuration:", error);
      return res.status(503).json({ error: "Konfigurasi CA tidak dapat dimuat." });
    }
  }

  const caAddress = req.body?.caAddress;
  if (typeof caAddress !== "string" || caAddress.length > 256) {
    return res.status(400).json({ error: "Alamat CA tidak valid." });
  }

  try {
    const finalCa = caAddress.trim() || "-";
    await writeCaAddress(finalCa);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Could not save admin CA configuration:", error);
    return res.status(503).json({ error: "CA gagal disimpan." });
  }
}

