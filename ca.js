async function fetchCaAddress() {
  try {
    const response = await fetch("/api/ca", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("CA could not be loaded");
    }
    const { caAddress } = await response.json();
    return typeof caAddress === "string" && caAddress.trim()
      ? caAddress.trim()
      : null;
  } catch (error) {
    console.error("Error loading CA:", error);
    return null;
  }
}

function isValidContractAddress(addr) {
  if (!addr || typeof addr !== "string") return false;
  const clean = addr.trim();
  return clean.length > 0 && clean !== "-" && clean !== "none";
}

function setupCopyAction(button, getText, statusElement, buttonTextElement) {
  if (!button) return;
  button.onclick = async () => {
    const text = typeof getText === "function" ? getText() : getText;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (buttonTextElement) {
        const originalText = buttonTextElement.textContent;
        buttonTextElement.textContent = "✓ Tersalin!";
        setTimeout(() => {
          buttonTextElement.textContent = originalText;
        }, 2000);
      } else {
        const originalText = button.textContent;
        button.textContent = "Copied!";
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
      if (statusElement) {
        statusElement.textContent = "Copied!";
        setTimeout(() => {
          statusElement.textContent = "";
        }, 2000);
      }
    } catch (err) {
      console.error("Unable to copy CA:", err);
      if (buttonTextElement) {
        buttonTextElement.textContent = "Gagal";
      } else {
        button.textContent = "Copy failed";
      }
      if (statusElement) {
        statusElement.textContent = "Copy failed";
      }
    }
  };
}

function updatePlayraCa(caAddress) {
  const valid = isValidContractAddress(caAddress);

  // Playra contract address sections
  const pyraContainers = document.querySelectorAll(
    '[aria-label="PYRA contract address"]',
  );
  pyraContainers.forEach((container) => {
    const codeEl = container.querySelector("code");
    const copyBtn = container.querySelector("[data-pyra-contract-copy]");
    const statusEl = container.querySelector("[data-pyra-contract-status]");
    const pendingEl = container.querySelector("[data-pyra-contract-pending]");

    if (valid) {
      if (codeEl) {
        codeEl.textContent = caAddress;
        codeEl.style.display = "";
      }
      if (copyBtn) {
        copyBtn.dataset.contractAddress = caAddress;
        copyBtn.hidden = false;
        copyBtn.disabled = false;
        copyBtn.style.display = "";
        setupCopyAction(copyBtn, () => caAddress, statusEl);
      }
      if (pendingEl) {
        pendingEl.hidden = true;
        pendingEl.style.display = "none";
      }
    } else {
      if (codeEl) {
        codeEl.textContent = "-";
      }
      if (copyBtn) {
        copyBtn.hidden = true;
        copyBtn.style.display = "none";
      }
      if (pendingEl) {
        pendingEl.hidden = true;
        pendingEl.style.display = "none";
      }
    }
  });

  // Terminal-style selectors
  const heroAddressEl = document.querySelector("#hero-ca-address");
  const heroCopyBtn = document.querySelector("#hero-ca-copy-btn");
  const heroBtnText = document.querySelector("#hero-ca-btn-text");
  const heroStatus = document.querySelector("#hero-ca-status");
  if (heroAddressEl) {
    if (valid) {
      heroAddressEl.textContent = caAddress;
      if (heroCopyBtn) {
        heroCopyBtn.disabled = false;
        heroCopyBtn.style.cursor = "pointer";
        heroCopyBtn.style.opacity = "1";
        setupCopyAction(heroCopyBtn, () => caAddress, heroStatus, heroBtnText);
      }
    } else {
      heroAddressEl.textContent = "-";
      if (heroCopyBtn) {
        heroCopyBtn.disabled = true;
        heroCopyBtn.style.cursor = "not-allowed";
        heroCopyBtn.style.opacity = "0.4";
      }
    }
  }

  const dexLink = document.querySelector("#dex-link");
  const pumpLink = document.querySelector("#pump-link");
  if (dexLink && valid) {
    dexLink.href = `https://dexscreener.com/search?q=${encodeURIComponent(caAddress)}`;
    dexLink.classList.remove("hidden");
  }
  if (pumpLink && valid) {
    if (
      caAddress.endsWith("pump") ||
      (caAddress.length >= 32 && !caAddress.startsWith("0x"))
    ) {
      pumpLink.href = `https://pump.fun/${encodeURIComponent(caAddress)}`;
      pumpLink.classList.remove("hidden");
    }
  }
}

async function init() {
  const caAddress = await fetchCaAddress();
  updatePlayraCa(caAddress);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

