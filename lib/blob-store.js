import { head, put } from "./blob-sdk.js";
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

// The SDK derives the store id by splitting BLOB_READ_WRITE_TOKEN on "_",
// which only works for the legacy "vercel_blob_rw_<store>_<secret>" format.
// Newer tokens (base64 JSON, "eyJ...") yield an empty store id, so the SDK's
// get() always throws. Prefer BLOB_STORE_ID, which Vercel sets alongside.
function getStoreId() {
  const fromEnv = (process.env.BLOB_STORE_ID || "").trim();
  if (fromEnv) {
    return fromEnv.startsWith("store_") ? fromEnv.slice(6) : fromEnv;
  }
  const [, , , fromToken = ""] = (process.env.BLOB_READ_WRITE_TOKEN || "").split("_");
  return fromToken;
}

function parseCa(text) {
  const config = JSON.parse(text);
  return typeof config.caAddress === "string" && config.caAddress.trim()
    ? config.caAddress.trim()
    : null;
}

async function fetchBlobText(url) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const target = new URL(url);
  target.searchParams.set("cache", "0");
  const response = await fetch(target, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Blob fetch failed: ${response.status}`);
  }
  return response.text();
}

async function readFromBlob() {
  const errors = [];
  const storeId = getStoreId();

  if (storeId) {
    for (const access of ["public", "private"]) {
      try {
        const text = await fetchBlobText(
          `https://${storeId}.${access}.blob.vercel-storage.com/${CONFIG_PATH}`,
        );
        if (text !== null) return parseCa(text);
      } catch (err) {
        errors.push(`${access}: ${err.message}`);
      }
    }
  }

  // Fallback: ask the Blob API for the URL (does not need the store id).
  try {
    const meta = await head(CONFIG_PATH);
    if (meta?.url) {
      const text = await fetchBlobText(meta.url);
      if (text !== null) return parseCa(text);
    }
  } catch (err) {
    if (err?.constructor?.name !== "BlobNotFoundError") {
      errors.push(`head: ${err.message}`);
    }
  }

  if (errors.length) {
    console.error("Vercel Blob read error:", errors.join(" | "));
  }
  return null;
}

export async function readCaAddress() {
  if (hasBlobConfiguration()) {
    const ca = await readFromBlob();
    if (ca) {
      inMemoryCa = ca;
      return ca;
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
