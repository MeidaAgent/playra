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

async function getBlobModule() {
  try {
    return await import("@vercel/blob");
  } catch {
    return null;
  }
}

export async function readCaAddress() {
  if (!hasBlobConfiguration()) {
    try {
      const data = await fs.readFile(getLocalStoragePath(), "utf8");
      const config = JSON.parse(data);
      if (typeof config.caAddress === "string") {
        inMemoryCa = config.caAddress;
        return config.caAddress;
      }
    } catch {
      try {
        const data = await fs.readFile(path.resolve(".ca-local.json"), "utf8");
        const config = JSON.parse(data);
        if (typeof config.caAddress === "string") {
          inMemoryCa = config.caAddress;
          return config.caAddress;
        }
      } catch {
        // Fallback to in-memory or default
      }
    }
    return inMemoryCa || DEFAULT_CA;
  }

  try {
    const blob = await getBlobModule();
    if (!blob) {
      return inMemoryCa || DEFAULT_CA;
    }
    const result = await blob.get(CONFIG_PATH, { access: "private" });
    if (!result || result.statusCode === 404) {
      return inMemoryCa || DEFAULT_CA;
    }
    if (result.statusCode !== 200) {
      throw new Error(`Could not read CA configuration (${result.statusCode}).`);
    }

    const text = await new Response(result.stream).text();
    const config = JSON.parse(text);
    const addr = typeof config.caAddress === "string" ? config.caAddress : DEFAULT_CA;
    inMemoryCa = addr;
    return addr;
  } catch (error) {
    console.error("Blob read error:", error);
    try {
      const data = await fs.readFile(getLocalStoragePath(), "utf8");
      const config = JSON.parse(data);
      if (typeof config.caAddress === "string") {
        inMemoryCa = config.caAddress;
        return config.caAddress;
      }
    } catch {}
    return inMemoryCa || DEFAULT_CA;
  }
}

export async function writeCaAddress(caAddress) {
  inMemoryCa = caAddress;

  if (!hasBlobConfiguration()) {
    try {
      await fs.writeFile(
        getLocalStoragePath(),
        JSON.stringify({ caAddress }),
        "utf8",
      );
    } catch (err) {
      console.error("Local write error:", err);
    }
    return;
  }

  const blob = await getBlobModule();
  if (blob) {
    await blob.put(CONFIG_PATH, JSON.stringify({ caAddress }), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
  } else {
    try {
      await fs.writeFile(
        getLocalStoragePath(),
        JSON.stringify({ caAddress }),
        "utf8",
      );
    } catch (err) {
      console.error("Local write error:", err);
    }
  }
}
