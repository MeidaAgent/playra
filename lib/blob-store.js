import { get, put } from "./blob-sdk.js";
import fs from "node:fs/promises";
import path from "node:path";

const CONFIG_PATH = "site-config/ca.json";
const DEFAULT_CA = "-";
let inMemoryCa = null;

function getLocalStoragePath() {
  if (process.env.VERCEL) {
    return path.resolve("/tmp", ".ca-local.json");
  }
  return path.resolve(".ca-local.json");
}

function hasBlobConfiguration() {
  return (
    Boolean(process.env.BLOB_READ_WRITE_TOKEN) ||
    Boolean(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
  );
}

export async function readCaAddress() {
  if (hasBlobConfiguration()) {
    // Try public access first, then private access
    for (const access of ["public", "private"]) {
      try {
        const result = await get(CONFIG_PATH, { access, useCache: false });
        if (result && result.statusCode === 200 && result.stream) {
          const text = await new Response(result.stream).text();
          const config = JSON.parse(text);
          if (typeof config.caAddress === "string" && config.caAddress.trim()) {
            inMemoryCa = config.caAddress.trim();
            return inMemoryCa;
          }
        }
      } catch (blobErr) {
        // Continue to fallback
      }
    }
  }

  // Fallback to local storage (for local dev or temporary fallback)
  try {
    const data = await fs.readFile(getLocalStoragePath(), "utf8");
    const config = JSON.parse(data);
    if (typeof config.caAddress === "string" && config.caAddress.trim()) {
      inMemoryCa = config.caAddress.trim();
      return inMemoryCa;
    }
  } catch {
    try {
      const data = await fs.readFile(path.resolve(".ca-local.json"), "utf8");
      const config = JSON.parse(data);
      if (typeof config.caAddress === "string" && config.caAddress.trim()) {
        inMemoryCa = config.caAddress.trim();
        return inMemoryCa;
      }
    } catch {
      // Fallback to in-memory or default
    }
  }

  return inMemoryCa || DEFAULT_CA;
}

export async function writeCaAddress(caAddress) {
  const finalCa =
    typeof caAddress === "string" && caAddress.trim()
      ? caAddress.trim()
      : DEFAULT_CA;
  inMemoryCa = finalCa;

  // On Vercel, /tmp is per-instance and wiped often: saving only there looks
  // successful but other instances keep serving the old CA. Fail loudly instead.
  if (process.env.VERCEL && !hasBlobConfiguration()) {
    throw new Error(
      "Vercel Blob belum dikonfigurasi (BLOB_READ_WRITE_TOKEN kosong).",
    );
  }

  // Always write to local storage as fallback
  try {
    await fs.writeFile(
      getLocalStoragePath(),
      JSON.stringify({ caAddress: finalCa }),
      "utf8",
    );
  } catch (err) {
    console.error("Local write error:", err);
  }

  if (hasBlobConfiguration()) {
    let saved = false;
    let lastError = null;

    for (const access of ["public", "private"]) {
      try {
        await put(CONFIG_PATH, JSON.stringify({ caAddress: finalCa }), {
          access,
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: "application/json",
        });
        saved = true;
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!saved && lastError) {
      console.error("Vercel Blob write error:", lastError);
      throw lastError;
    }
  }
}
