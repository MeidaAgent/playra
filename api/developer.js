import { isAuthenticated } from "../lib/auth.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed.");
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  );

  const adminPanel = isAuthenticated(req);
  const pageContent = adminPanel
    ? `<section>
        <form id="address-form">
          <label for="ca-input">CA (Contract Address)</label>
          <input id="ca-input" name="caAddress" type="text" maxlength="256" autocomplete="off" spellcheck="false" placeholder="Tempel alamat CA di sini">
          <div class="actions">
            <button id="logout-button" type="button">Logout</button>
            <button type="submit">Simpan CA</button>
          </div>
          <p id="panel-status" role="status" aria-live="polite"></p>
        </form>
      </section>`
    : `<form id="login-form">
        <label for="admin-password">Password dev</label>
        <input id="admin-password" name="password" type="password" autocomplete="current-password" required>
        <div class="actions"><span></span><button type="submit">Masuk</button></div>
        <p id="login-status" role="status" aria-live="polite"></p>
      </form>`;
  const pageScript = adminPanel ? "/developer-panel.js" : "/developer.js";
  const pageTitle = adminPanel ? "Developer panel" : "Login dev";

  return res.status(200).send(`<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>${pageTitle} | Playra</title>
    <style>
      :root { color-scheme: dark; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #101010; color: #e8e8e8; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      main { width: min(100%, 480px); border: 1px solid #333; background: #171717; padding: 28px; border-radius: 6px; }
      h1 { margin: 0 0 8px; font-size: 18px; font-weight: 500; }
      p { color: #999; font-size: 12px; line-height: 1.7; }
      label { display: block; margin: 22px 0 8px; color: #bbb; font-size: 12px; }
      input { width: 100%; border: 1px solid #444; background: #101010; color: #eee; padding: 12px; font: inherit; font-size: 13px; border-radius: 4px; }
      input:focus { outline: none; border-color: #ffe09a; }
      button { border: 1px solid #555; background: #222; color: #eee; padding: 10px 14px; font: inherit; font-size: 12px; cursor: pointer; border-radius: 4px; }
      button:hover { border-color: #ffe09a; color: #ffe09a; }
      form { margin-top: 20px; }
      .actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 18px; }
      [role="status"] { min-height: 18px; margin-top: 14px; color: #aaa; }
      [hidden] { display: none !important; }
      a { color: #ffe09a; font-size: 12px; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </style>
    <script src="${pageScript}" defer></script>
  </head>
  <body>
    <main>
      <a href="/">← Kembali ke Playra</a>
      <h1 style="margin-top: 24px">${pageTitle}</h1>
      <p>${adminPanel ? "Kelola alamat CA (Contract Address) yang ditampilkan di halaman publik Playra." : "Masuk untuk membuka pengaturan dev."}</p>
      ${pageContent}
    </main>
  </body>
</html>`);
}

