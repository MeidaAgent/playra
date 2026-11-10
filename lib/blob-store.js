import fs from "node:fs/promises";
import path from "node:path";

const CONFIG_PATH = "site-config/ca.json";
const LOCAL_STORAGE_PATH = path.resolve(".ca-local.json");
const DEFAULT_CA = "-";

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
      const data = await fs.readFile(LOCAL_STORAGE_PATH, "utf8");
      const config = JSON.parse(data);
      return typeof config.caAddress === "string" ? config.caAddress : DEFAULT_CA;
    } catch {
      return DEFAULT_CA;
    }
  }

  try {
    const blob = await getBlobModule();
    if (!blob) {
      return DEFAULT_CA;
    }
    const result = await blob.get(CONFIG_PATH, { access: "private" });
    if (!result || result.statusCode === 404) {
      return DEFAULT_CA;
    }
    if (result.statusCode !== 200) {
      throw new Error(`Could not read CA configuration (${result.statusCode}).`);
    }

    const text = await new Response(result.stream).text();
    const config = JSON.parse(text);
    return typeof config.caAddress === "string" ? config.caAddress : DEFAULT_CA;
  } catch (error) {
    console.error("Blob read error:", error);
    try {
      const data = await fs.readFile(LOCAL_STORAGE_PATH, "utf8");
      const config = JSON.parse(data);
      return typeof config.caAddress === "string" ? config.caAddress : DEFAULT_CA;
    } catch {
      return DEFAULT_CA;
    }
  }
}

export async function writeCaAddress(caAddress) {
  if (!hasBlobConfiguration()) {
    await fs.writeFile(
      LOCAL_STORAGE_PATH,
      JSON.stringify({ caAddress }),
      "utf8",
    );
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
    await fs.writeFile(
      LOCAL_STORAGE_PATH,
      JSON.stringify({ caAddress }),
      "utf8",
    );
  }
}

