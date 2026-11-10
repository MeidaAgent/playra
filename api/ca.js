import { readCaAddress } from "../lib/blob-store.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const caAddress = await readCaAddress();
    return res.status(200).json({ caAddress });
  } catch (error) {
    console.error("Could not load public CA configuration:", error);
    return res.status(503).json({ error: "CA configuration is unavailable." });
  }
}

