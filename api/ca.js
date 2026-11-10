import { CA_ADDRESS } from "../lib/ca-config.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  return res.status(200).json({ caAddress: CA_ADDRESS });
}
