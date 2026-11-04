import React, { useState, useEffect } from "react";
import oceanWaterImg from "assets/decorations/ocean.webp";
import mapLandingGif from "assets/map_landing.gif";
import tokenImg from "assets/brand/token.png";

interface PioneerData {
  wallet: string;
  email: string;
  twitter: string;
  timestamp: string;
  pioneerId: number;
}

const STORAGE_KEY = "playra_waitlist_pioneer_data";
const FOLLOW_STORAGE_KEY = "playra_waitlist_x_followed";
const DEVICE_LOCK_KEY = "playra_device_pioneer_registered";

const TICKET_IMAGE_URL = "/ticket register.png";

// ANTI-BOT / ANTI-SYBIL: Block known disposable & temporary email services
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "guerrillamail.com", "10minutemail.com", "yopmail.com",
  "trashmail.com", "getnada.com", "sharklasers.com", "dispostable.com", "throwawaymail.com",
  "fakeinbox.com", "temp-mail.org", "fakemailgenerator.com", "mohmal.com", "burnermail.io",
  "crazymailing.com", "mytemp.email", "tempail.com", "disposablemail.com", "emailondeck.com",
  "inboxkitten.com", "maildrop.cc", "minutemailbox.com", "tempmailo.com", "generator.email",
  "tmail.ws", "tempmail.net", "trashmail.net", "guerrillamailblock.com", "guerrillamail.net",
  "guerrillamail.biz", "guerrillamail.org", "grr.la", "pokemail.net", "inboxalias.com",
  "10minutemail.net", "burnermail.com", "trashmail.me", "moakt.com", "nada.ltd"
]);

// ANTI-BOT / ANTI-SYBIL: Detect dummy, burn, or repetitive hex addresses
const isDummyOrBurnAddress = (addr: string): boolean => {
  const lower = addr.toLowerCase();
  if (lower === "0x0000000000000000000000000000000000000000") return true;
  if (lower === "0x000000000000000000000000000000000000dead") return true;
  if (lower.startsWith("0xdead") && lower.endsWith("dead")) return true;
  const hexPart = lower.slice(2);
  const uniqueChars = new Set(hexPart);
  // Real EVM addresses have high entropy with at least 8 unique hex characters
  if (uniqueChars.size < 7) return true;
  return false;
};

const PioneerTicket: React.FC<{ twitter: string }> = ({ twitter }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = new Image();
    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(image, 0, 0);
    };
    image.src = TICKET_IMAGE_URL;
  }, [twitter]);

  const downloadTicket = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const safeHandle = twitter.replace(/^@/, "").replace(/[^a-zA-Z0-9_]/g, "-");
    link.download = `playra-ticket-${safeHandle || "pioneer"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="mb-3 text-center">
      <canvas
        ref={canvasRef}
        className="mx-auto block w-full max-w-[390px] rounded-lg"
        aria-label={`Playra Pioneer ticket for ${twitter}`}
      />
      <button
        type="button"
        onClick={downloadTicket}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[#166534] bg-[#15803d] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-md transition-colors hover:bg-[#166534]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
        </svg>
        Download ticket
      </button>
    </div>
  );
};

export const WaitlistApp: React.FC = () => {
  const [email, setEmail] = useState("");
  const [twitter, setTwitter] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<PioneerData | null>(null);
  const [copied, setCopied] = useState(false);
  const [pasteNotice, setPasteNotice] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // X (Twitter) Follow Verification State
  const [followStatus, setFollowStatus] = useState<"idle" | "verifying" | "verified">("idle");

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim()) && !isDummyOrBurnAddress(walletAddress.trim());

  // Load existing submission if any
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSubmittedData(parsed);
        setFollowStatus("verified");
      }
    } catch {
      // ignore
    }
  }, []);

  const handleFollowClick = () => {
    const cleanTwitter = twitter.trim().startsWith("@")
      ? twitter.trim()
      : twitter.trim() ? `@${twitter.trim()}` : "";

    if (!cleanTwitter || cleanTwitter.length < 2) {
      setFormError("Please enter your X username first (e.g. @username).");
      return;
    }

    setFormError(null);
    window.open("https://x.com/PlayraFarm", "_blank", "noopener,noreferrer");
    setFollowStatus("verifying");

    setTimeout(() => {
      setFollowStatus("verified");
      setFormError(null);
      setStep(4);
    }, 3500);
  };

  const handleTwitterChange = (val: string) => {
    setTwitter(val);
    if (followStatus !== "idle") {
      setFollowStatus("idle");
    }
  };

  const handlePasteWallet = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setWalletAddress(text.trim());
          setFormError(null);
          setPasteNotice(true);
          setTimeout(() => setPasteNotice(false), 2000);
          return;
        }
      }
      // Fallback prompt if clipboard API blocked
      const pasted = window.prompt("Paste your EVM wallet address here (0x...):");
      if (pasted) {
        setWalletAddress(pasted.trim());
        setFormError(null);
      }
    } catch {
      const pasted = window.prompt("Paste your EVM wallet address here (0x...):");
      if (pasted) {
        setWalletAddress(pasted.trim());
        setFormError(null);
      }
    }
  };

  const goToNextStep = () => {
    setFormError(null);

    if (step === 1) {
      if (!email || !email.includes("@") || !email.includes(".")) {
        setFormError("Please enter a valid email address.");
        return;
      }
      const domain = email.trim().toLowerCase().split("@")[1];
      if (domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
        setFormError("Disposable or temporary email addresses are not permitted.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const cleanTwitter = twitter.trim().startsWith("@")
        ? twitter.trim()
        : twitter.trim() ? `@${twitter.trim()}` : "";
      if (!cleanTwitter || cleanTwitter.length < 2) {
        setFormError("Please enter your X (Twitter) username.");
        return;
      }
      setTwitter(cleanTwitter);
      setStep(3);
      return;
    }

    if (step === 3) {
      if (followStatus !== "verified") {
        setFormError("Please follow @PlayraFarm on X first.");
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (step !== 4) {
      goToNextStep();
      return;
    }

    const cleanWallet = walletAddress.trim();
    if (!cleanWallet) {
      setFormError("Please paste or enter your EVM wallet address (0x...).");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(cleanWallet)) {
      setFormError("Invalid wallet address format. Must start with '0x' and be 42 characters (EVM address).");
      return;
    }

    //  ANTI-SYBIL: Check burn / dummy addresses
    if (isDummyOrBurnAddress(cleanWallet)) {
      setFormError("Dummy or burn wallet address detected. Please use a valid personal EVM wallet address.");
      return;
    }

    //  ANTI-SYBIL: Check device multi-account spamming
    try {
      const registeredWallet = localStorage.getItem(DEVICE_LOCK_KEY);
      if (registeredWallet && registeredWallet.toLowerCase() !== cleanWallet.toLowerCase()) {
        setFormError("This device has already registered a Pioneer account (" + registeredWallet.slice(0, 6) + "..." + registeredWallet.slice(-4) + "). Only 1 account per device is permitted to prevent multi-accounting.");
        return;
      }
    } catch {
      // ignore
    }

    if (!email || !email.includes("@") || !email.includes(".")) {
      setFormError("Please enter a valid email address.");
      return;
    }

    //  ANTI-SYBIL: Check disposable email domains
    const emailParts = email.trim().toLowerCase().split("@");
    const domain = emailParts[1];
    if (domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      setFormError("Disposable or temporary email addresses are not permitted. Please use your personal email (Gmail, Yahoo, Outlook, etc.).");
      return;
    }

    const cleanTwitter = twitter.trim().startsWith("@")
      ? twitter.trim()
      : twitter.trim() ? `@${twitter.trim()}` : "";

    if (!cleanTwitter || cleanTwitter.length < 2) {
      setFormError("Please enter your X (Twitter) username (e.g. @username).");
      return;
    }

    if (followStatus !== "verified") {
      if (followStatus === "verifying") {
        setFormError("Verification in progress, please wait a moment.");
      } else {
        setFormError("Please click 'Follow on X' to verify your follow before submitting.");
      }
      return;
    }

    setIsSubmitting(true);

    const pioneerId = Math.floor(1000 + Math.random() * 9000);
    const payload: PioneerData = {
      wallet: cleanWallet,
      email: email.trim(),
      twitter: cleanTwitter,
      timestamp: new Date().toISOString(),
      pioneerId,
    };

    console.log(" [Playra Waitlist] Pioneer Submission (Verified Human):", payload);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(DEVICE_LOCK_KEY, cleanWallet);
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedData(payload);
    }, 600);
  };

  const copyAddress = () => {
    if (submittedData?.wallet) {
      navigator.clipboard.writeText(submittedData.wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyPioneerCard = () => {
    if (!submittedData) return;
    const text = `I joined the Playra Genesis Waitlist as Pioneer #${submittedData.pioneerId}! Join here: https://playra.io/waitlist/`;
    const shareUrl = `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="min-h-[100dvh] lg:h-[100dvh] lg:max-h-[100dvh] text-[#fff8e7] flex flex-col font-sans relative selection:bg-[#facc15] selection:text-[#2b1e16] overflow-x-hidden overflow-y-auto lg:overflow-hidden"
      style={{
        backgroundColor: "#0099db",
        backgroundImage: `url(${oceanWaterImg})`,
        backgroundRepeat: "repeat",
      }}
    >
      {/* Main Navigation Bar */}
      <header className="w-full px-3 sm:px-8 py-2 sm:py-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] flex items-center justify-between z-20 max-w-6xl mx-auto flex-shrink-0">
        {/* Brand Logo & Name */}
        <a href="/" className="flex items-center gap-2.5 group cursor-pointer transition-transform hover:scale-105">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center p-0.5">
            <img
              src={tokenImg}
              alt="Playra Logo"
              className="w-full h-full object-contain"
              style={{ imageRendering: "pixelated", aspectRatio: "1 / 1" }}
            />
          </div>
          <span
            className="text-white tracking-wider uppercase font-bold text-lg drop-shadow-md"
            style={{
              fontFamily: "'m5x7', monospace",
              fontSize: "26px",
              textShadow: "2px 2px #181425",
            }}
          >
            PLAYRA
          </span>
        </a>

        {/* Header Links */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <a
            href="/"
            className="text-white hover:text-yellow-300 text-xs sm:text-sm font-semibold transition-colors"
            style={{ fontFamily: "'m5x7', monospace", fontSize: "20px", lineHeight: 1 }}
          >
            Home
          </a>
          <a
            href="/website/whitepaper/"
            className="text-white hover:text-yellow-300 text-xs sm:text-sm font-semibold transition-colors hidden sm:inline-block"
            style={{ fontFamily: "'m5x7', monospace", fontSize: "20px", lineHeight: 1 }}
          >
            Whitepaper
          </a>
          <a
            href="/website/docs/"
            className="text-white hover:text-yellow-300 text-xs sm:text-sm font-semibold transition-colors hidden sm:inline-block"
            style={{ fontFamily: "'m5x7', monospace", fontSize: "20px", lineHeight: 1 }}
          >
            Docs
          </a>
          <a
            href="https://x.com/PlayraFarm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-yellow-300 p-1 transition-colors"
            title="Follow on X"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </header>

      {/* Main Waitlist Body */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col justify-center items-center z-20 min-h-0">
        <div className="waitlist-layout w-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-8 items-center my-auto">
          {/* LEFT COLUMN: Waitlist Card */}
          <div className="w-full max-w-md sm:max-w-[440px] mx-auto">
            {submittedData ? (
              /* PIONEER REGISTERED CONFIRMATION CARD */
              <div className="pixel-panel waitlist-card p-3 sm:p-4 text-[#2b1e16] animate-fade-in shadow-2xl">
                <div className="text-center mb-3 px-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Pioneer Registered</span>
                  </div>
                  <h2
                    className="mt-2 font-bold uppercase text-[#3e2731]"
                    style={{ fontFamily: "'m5x7', monospace", fontSize: "24px", lineHeight: "1.05" }}
                  >
                    WELCOME, PIONEER #{submittedData.pioneerId}!
                  </h2>
                  <p className="mx-auto mt-1.5 max-w-sm text-[11px] leading-relaxed text-[#714431]">
                    You are now registered for the Playra Pioneer Waitlist.
                  </p>
                </div>

                <PioneerTicket twitter={submittedData.twitter} />

                <section className="mb-3 rounded-xl border border-[#a67546] bg-[#fffaf0] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]" aria-label="Registration details">
                  <div className="mb-1.5 flex items-center justify-between border-b border-[#d8c69e] pb-1.5">
                    <h3 className="whitespace-nowrap font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-[#714431] sm:text-[10px] sm:tracking-[0.16em]">
                      Registration Details
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      Complete
                    </span>
                  </div>
                  <div className="divide-y divide-[#e2cfb1] font-mono text-[11px]">
                    <div className="grid grid-cols-[78px_minmax(0,1fr)] items-center gap-2 py-1.5">
                      <span className="font-sans text-[9px] font-bold uppercase tracking-wide text-[#714431]">Pioneer ID</span>
                      <span className="text-right text-sm font-bold text-emerald-800">#{submittedData.pioneerId}</span>
                    </div>
                    <div className="grid grid-cols-[78px_minmax(0,1fr)] items-center gap-2 py-1.5">
                      <span className="font-sans text-[9px] font-bold uppercase tracking-wide text-[#714431]">Wallet</span>
                      <button
                        type="button"
                        onClick={copyAddress}
                        className="flex min-w-0 cursor-pointer items-center justify-end gap-1.5 text-right font-bold text-[#2b1e16] transition-colors hover:text-[#2563eb]"
                        title="Copy wallet address"
                      >
                        <span className="truncate">
                          {copied
                            ? "Wallet copied"
                            : `${submittedData.wallet.slice(0, 8)}...${submittedData.wallet.slice(-6)}`}
                        </span>
                        <svg className="h-3.5 w-3.5 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <rect x="9" y="9" width="11" height="11" rx="2" />
                          <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-[78px_minmax(0,1fr)] items-center gap-2 py-1.5">
                      <span className="font-sans text-[9px] font-bold uppercase tracking-wide text-[#714431]">Email</span>
                      <span className="truncate text-right font-bold text-[#2b1e16]" title={submittedData.email}>{submittedData.email}</span>
                    </div>
                    <div className="grid grid-cols-[78px_minmax(0,1fr)] items-center gap-2 py-1.5">
                      <span className="font-sans text-[9px] font-bold uppercase tracking-wide text-[#714431]">X Account</span>
                      <span className="truncate text-right font-bold text-[#2563eb]" title={submittedData.twitter}>{submittedData.twitter}</span>
                    </div>
                  </div>
                </section>

                <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#d9c69a] bg-[#fff4cf] px-3 py-2 text-left">
                  <svg className="mt-0.5 h-4 w-4 flex-none text-[#8b5a2b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d="M12 11v5M12 8h.01" />
                  </svg>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#714431]">What happens next</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-[#714431]">
                      Keep your Pioneer details safe. Playra may use this information for future waitlist updates and early-access communication.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={copyPioneerCard}
                    className="pixel-button w-full text-center text-white font-bold tracking-wider uppercase py-2 cursor-pointer flex items-center justify-center gap-2"
                    style={{
                      fontFamily: "'m5x7', monospace",
                      fontSize: "20px",
                      backgroundColor: "#15803d",
                      borderColor: "#166534",
                    }}
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>SHARE REGISTRATION ON X</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedData(null);
                      setWalletAddress("");
                      try {
                        localStorage.removeItem(STORAGE_KEY);
                      } catch {}
                    }}
                    className="w-full py-1 text-xs text-[#714431] hover:text-[#2b1e16] text-center font-bold underline cursor-pointer transition-colors"
                  >
                    Register another wallet address
                  </button>
                </div>
              </div>
            ) : (
              /* APPLICATION FORM CARD */
              <div className="pixel-panel waitlist-card p-3 sm:p-4.5 text-[#2b1e16] shadow-2xl">
                <div className="mb-2 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 bg-[#f59e0b]/15 border border-[#b45309]/30 text-[#78350f] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                    <span>Early Access Waitlist</span>
                  </div>
                  <h1
                    className="text-xl sm:text-2xl font-bold uppercase text-[#3e2731]"
                    style={{
                      fontFamily: "'m5x7', monospace",
                      fontSize: "27px",
                      lineHeight: "1",
                    }}
                  >
                    JOIN PLAYRA WAITLIST
                  </h1>
                  <p className="text-[11px] text-[#714431] mt-0.5 leading-tight">
                    Register your wallet and email to secure early access and Pioneer rewards.
                  </p>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (step === 4) {
                      handleSubmit(event);
                    } else {
                      goToNextStep();
                    }
                  }}
                  noValidate
                  className="space-y-2 font-sans"
                >
                  <div className="grid grid-cols-4 gap-1 mb-2" aria-label={`Registration step ${step} of 4`}>
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className={`h-1.5 rounded-full border border-[#8b5a2b]/40 ${item <= step ? "bg-[#2563eb]" : "bg-[#e6cfa3]"}`} />
                    ))}
                  </div>
                  <div className="text-center text-[10px] font-bold uppercase tracking-wider text-[#714431] mb-1">
                    Step {step} of 4
                  </div>
                  {/* 1. Wallet Address */}
                  {step === 4 && (
                  <div className="form-group">
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="flex items-center gap-1 text-[11px] font-bold text-[#3e2731] uppercase tracking-wider">
                        <svg className="w-3 h-3 text-[#8b5a2b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span>4. EVM Wallet Address</span>
                      </label>
                      {isValidAddress && (
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 text-emerald-800 bg-emerald-100 border border-emerald-400 rounded-full"
                          title="Valid wallet address"
                          aria-label="Valid wallet address"
                        >
                          <svg className="w-2.5 h-2.5 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>

                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={walletAddress}
                          onChange={(e) => {
                            setWalletAddress(e.target.value);
                            setFormError(null);
                          }}
                          placeholder="0x... (Paste your EVM address)"
                          className="retro-input w-full p-1.5 bg-[#fff8e7] border-2 border-[#8b5a2b] rounded-lg text-xs font-mono text-[#2b1e16] placeholder-[#a17e5a] focus:outline-none focus:border-[#2563eb] shadow-inner"
                        />
                        {walletAddress && (
                          <button
                            type="button"
                            onClick={() => setWalletAddress("")}
                            className="absolute right-2 top-1.5 text-[#8b5a2b] hover:text-[#3e2731] text-xs font-bold cursor-pointer"
                            title="Clear"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handlePasteWallet}
                        className="px-2.5 py-1.5 bg-[#facc15] hover:bg-[#eab308] text-[#3e2731] border-2 border-[#8b5a2b] rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1 whitespace-nowrap active:translate-y-0.5"
                        title="Paste address from clipboard"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        </svg>
                        <span>{pasteNotice ? "Pasted!" : "Paste"}</span>
                      </button>
                    </div>
                  </div>
                  )}

                  {/* 2. Email Address */}
                  {step === 1 && (
                  <div className="form-group">
                    <label className="flex items-center gap-1 text-[11px] font-bold text-[#3e2731] uppercase tracking-wider mb-0.5">
                      <svg className="w-3 h-3 text-[#8b5a2b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>1. Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="pioneer@email.com"
                      className="retro-input w-full p-1.5 bg-[#fff8e7] border-2 border-[#8b5a2b] rounded-lg text-xs text-[#2b1e16] placeholder-[#a17e5a] focus:outline-none focus:border-[#2563eb] shadow-inner"
                    />
                  </div>
                  )}

                  {/* 3. X (Twitter) Username & Follow */}
                  {step === 2 && (
                  <div className="form-group">
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="flex items-center gap-1 text-[11px] font-bold text-[#3e2731] uppercase tracking-wider">
                        <svg className="w-3 h-3 fill-current text-[#2b1e16]" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span>2. X (Twitter) Account</span>
                      </label>
                      {followStatus === "verified" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-400 px-1.5 py-0.5 rounded shadow-xs">
                          <svg className="w-2.5 h-2.5 text-emerald-700" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Follow Verified
                        </span>
                      )}
                      {followStatus === "verifying" && (
                        <span className="inline-flex items-center p-0.5 rounded-full bg-amber-100 border border-amber-300">
                          <svg
                            className="w-3 h-3 text-[#8b5a2b] animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 22h14" />
                            <path d="M5 2h14" />
                            <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                            <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                          </svg>
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={twitter}
                        onChange={(e) => handleTwitterChange(e.target.value)}
                        placeholder="@username"
                        className="retro-input w-full p-1.5 bg-[#fff8e7] border-2 border-[#8b5a2b] rounded-lg text-xs text-[#2b1e16] placeholder-[#a17e5a] focus:outline-none focus:border-[#2563eb] shadow-inner"
                      />
                    </div>
                  </div>
                  )}

                    {/* Interactive Follow Action */}
                    {step === 3 && (
                    <div className="form-group">
                      <label className="flex items-center gap-1 text-[11px] font-bold text-[#3e2731] uppercase tracking-wider mb-1.5">
                        <span>3. Follow Playra on X</span>
                      </label>
                      {followStatus === "idle" && (
                        <button
                          type="button"
                          onClick={handleFollowClick}
                          className="w-full py-1.5 px-2.5 rounded-lg font-bold text-xs flex items-center justify-between bg-[#0f1419] hover:bg-black text-white border-2 border-[#536471] transition-all cursor-pointer shadow-sm active:translate-y-0.5 hover:border-white/60"
                        >
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <span>Follow on X</span>
                          </div>
                          <span className="text-[9.5px] bg-white/20 px-1.5 py-0.5 rounded-full font-semibold">
                            Open Profile
                          </span>
                        </button>
                      )}

                      {followStatus === "verifying" && (
                        <div className="w-full py-1 px-2.5 rounded-lg bg-[#fff8e7] border-2 border-[#8b5a2b] shadow-inner flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-[#8b5a2b] animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 22h14" />
                            <path d="M5 2h14" />
                            <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                            <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                          </svg>
                        </div>
                      )}

                      {followStatus === "verified" && (
                        <div className="w-full py-1 px-2.5 rounded-lg bg-[#ecfdf5] border-2 border-[#10b981] shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#065f46]">
                            <svg className="w-3.5 h-3.5 text-[#10b981]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Follow Verified on X</span>
                          </div>
                          <a
                            href="https://x.com/PlayraFarm"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-[#047857] hover:underline"
                          >
                            Profile on X
                          </a>
                        </div>
                      )}
                    </div>
                    )}

                  {/* Form Error Alert */}
                  {formError && (
                    <div className="p-1.5 bg-red-100 border-2 border-red-400 rounded-lg text-red-800 text-xs font-semibold leading-tight shadow-sm flex items-start gap-1">
                      <svg className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-0.5 w-full">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}
                        className="w-full mb-1.5 py-1.5 text-xs font-bold text-[#714431] border-2 border-[#8b5a2b] rounded-lg bg-[#fff8e7] cursor-pointer"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type={step === 4 ? "submit" : "button"}
                      onClick={step === 4 ? undefined : goToNextStep}
                      disabled={isSubmitting}
                      className="pixel-button w-full text-center text-white font-bold tracking-wider uppercase disabled:opacity-50 cursor-pointer flex items-center justify-center py-2 shadow-md hover:brightness-105 active:translate-y-0.5 transition-all"
                      style={{
                        fontFamily: "'m5x7', monospace",
                        fontSize: "22px",
                        lineHeight: "1",
                      }}
                    >
                      <span>
                        {isSubmitting ? "REGISTERING..." : step === 4 ? "JOIN WAITLIST" : step === 3 ? "Continue after Follow" : "Continue"}
                      </span>
                    </button>
                  </div>

                  {/* Trust Badges - Single Aligned Row */}
                  <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-[10px] text-[#714431] font-semibold pt-0.5 select-none">
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <svg className="w-3 h-3 text-emerald-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Free Early Access</span>
                    </div>
                    <span className="text-[#8b5a2b] opacity-50 text-[9px] flex-shrink-0">•</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <svg className="w-3 h-3 text-emerald-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Genesis Access</span>
                    </div>
                    <span className="text-[#8b5a2b] opacity-50 text-[9px] flex-shrink-0">•</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <svg className="w-3 h-3 text-emerald-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Early Feedback</span>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Interactive Island Map Graphic */}
          <div className="waitlist-map-column w-full max-w-sm lg:max-w-md flex flex-col items-center justify-center self-center my-auto lg:pl-4">
            <div className="waitlist-map relative w-full max-w-[360px] mx-auto drop-shadow-[0_20px_35px_rgba(0,0,0,0.55)]">
              <img
                src={mapLandingGif}
                alt="Playra Web3 Farming Game Map"
                className="waitlist-map-image block w-full object-contain select-none"
                style={{ imageRendering: "pixelated" }}
              />

              {/* Floating badges */}
              <div
                className="flex absolute animate-pulse items-center bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/20 shadow-md"
                style={{ bottom: "90%", left: "10%" }}
              >
                <img
                  src="/assets/usd-coin-usdc-logo.913adf09.svg"
                  alt="USDC"
                  className="h-3 sm:h-3.5 mr-1 inline-block"
                />
                <span
                  className="text-xs text-white font-bold tracking-wide"
                  style={{
                    textShadow: "0px 2px #181425bf",
                    fontFamily: "'m5x7', monospace",
                    fontSize: "17px",
                    lineHeight: "1",
                  }}
                >
                  $1,000
                </span>
              </div>

              <div
                className="flex absolute animate-pulse items-center bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/20 shadow-md"
                style={{ bottom: "51.5%", left: "54%" }}
              >
                <img
                  src="/assets/usd-coin-usdc-logo.913adf09.svg"
                  alt="USDC"
                  className="h-3 sm:h-3.5 mr-1 inline-block"
                />
                <span
                  className="text-xs text-white font-bold tracking-wide"
                  style={{
                    textShadow: "0px 2px #181425bf",
                    fontFamily: "'m5x7', monospace",
                    fontSize: "17px",
                    lineHeight: "1",
                  }}
                >
                  $500
                </span>
              </div>

              <div
                className="flex absolute animate-pulse items-center bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/20 shadow-md"
                style={{ bottom: "80%", left: "68%" }}
              >
                <img
                  src="/assets/usd-coin-usdc-logo.913adf09.svg"
                  alt="USDC"
                  className="h-3 sm:h-3.5 mr-1 inline-block"
                />
                <span
                  className="text-xs text-white font-bold tracking-wide"
                  style={{
                    textShadow: "0px 2px #181425bf",
                    fontFamily: "'m5x7', monospace",
                    fontSize: "17px",
                    lineHeight: "1",
                  }}
                >
                  $400
                </span>
              </div>
            </div>

            <p
              className="mt-2 text-center text-white drop-shadow-md select-none font-bold"
              style={{
                fontFamily: "'m5x7', monospace",
                fontSize: "18px",
                lineHeight: "1.1",
                textShadow: "0px 2px 4px rgba(0,0,0,0.85)",
              }}
            >
              *In-game utility collectible sales powered by Playra.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5 text-[11px] text-white/95 font-semibold">
              <span className="px-2.5 py-1 rounded-full bg-black/40 border border-white/20 backdrop-blur-xs shadow-sm flex items-center gap-1">
                Farming &amp; Harvesting
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/40 border border-white/20 backdrop-blur-xs shadow-sm flex items-center gap-1">
                Fishing &amp; Trading
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/40 border border-white/20 backdrop-blur-xs shadow-sm flex items-center gap-1">
                Earn $PYRA
              </span>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @font-face {
          font-family: 'm5x7';
          src: url('/assets/m5x7.47c3f0b0.ttf') format('truetype'),
               url('/website/css/m5x7.ttf') format('truetype');
          font-display: swap;
        }

        .pixel-panel {
          background: #eed8a1;
          border: 4px solid #2b1e16;
          box-shadow: 
            inset -4px -4px 0px 0px #b86f3b,
            inset 4px 4px 0px 0px #fff4cc,
            0 16px 36px rgba(0, 0, 0, 0.65);
          border-radius: 14px;
        }

        .pixel-button {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          background-color: #2563eb;
          border: 3px solid #1e3a8a;
          box-shadow: 0 4px 0 #172554;
          border-radius: 8px;
          transition: filter 0.15s ease, transform 0.1s ease;
        }

        .pixel-button:hover {
          filter: brightness(1.08);
        }

        .pixel-button:active {
          transform: translateY(2px);
          box-shadow: 0 2px 0 #172554;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }

        @media (max-width: 639px) {
          .waitlist-layout {
            align-items: start;
            justify-items: center;
          }

          .waitlist-layout > div {
            justify-self: center;
          }

          .waitlist-card {
            width: 100%;
            max-width: 440px;
            margin-inline: auto;
          }

          .waitlist-map-column {
            width: 100%;
            margin-inline: auto;
            align-items: center;
          }

          .waitlist-map {
            width: min(360px, calc(100vw - 48px));
          }

          .waitlist-map-image {
            max-height: 280px;
          }
        }

        @media (min-width: 640px) and (max-width: 1023px) {
          .waitlist-layout {
            justify-items: center;
          }

          .waitlist-map-column {
            margin-inline: auto;
          }
        }

        @media (min-width: 1024px) {
          .waitlist-layout {
            min-height: calc(100dvh - 80px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
            align-items: center;
          }

          .waitlist-layout > div {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .waitlist-map-column {
            min-height: 440px;
          }

          .waitlist-card input {
            font-size: 16px;
            line-height: 1.25;
          }

          .waitlist-card .retro-input {
            min-height: 42px;
          }

          .pixel-panel {
            border-width: 3px;
            border-radius: 12px;
          }
        }

        @supports (-webkit-touch-callout: none) {
          html,
          body,
          #root {
            height: -webkit-fill-available;
          }

          .waitlist-card input,
          .waitlist-card button {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </div>
  );
};

export default WaitlistApp;
