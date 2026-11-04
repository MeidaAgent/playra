import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { minifyHtml, injectHtml } from "vite-plugin-html";
import { VitePWA } from "vite-plugin-pwa";
import preload from "vite-plugin-preload";
import mkcert from "vite-plugin-mkcert";

const getPortFromCLI = () => {
  const portIndex = process.argv.findIndex((arg) => arg === "--port");
  if (portIndex !== -1 && process.argv[portIndex + 1]) {
    return Number(process.argv[portIndex + 1]);
  }
  return 3000; // Default port
};

const websiteRoutingPlugin = () => ({
  name: "website-routing-plugin",
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url === "/api/log-client-error" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => { body += chunk; });
        req.on("end", () => {
          console.error("\n>>> [BROWSER CLIENT ERROR] >>>\n", body, "\n<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n");
          try {
            const fs = require("fs");
            const path = require("path");
            const scratchDir = path.resolve(__dirname, "scratch");
            if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir);
            fs.writeFileSync(path.resolve(scratchDir, "client_error.log"), body + "\n", { flag: "a" });
          } catch (e) {}
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        });
        return;
      }
      const url = req.url ? req.url.split("?")[0] : "";
      if (url === "/play" || url === "/play/") {
        req.url = "/play/index.html";
      } else if (url.startsWith("/play/") && !url.startsWith("/play/index.html")) {
        req.url = req.url.replace(/^\/play/, "");
      } else if (url === "/" || url === "/index.html") {
        req.url = "/website/index.html";
      } else if (url === "/about" || url === "/about/") {
        res.writeHead(301, { Location: "/docs/" });
        res.end();
        return;
      } else if (url === "/docs" || url === "/docs/") {
        req.url = "/website/docs/index.html";
      } else if (url === "/roadmap" || url === "/roadmap/") {
        req.url = "/website/roadmap/index.html";
      } else if (url === "/whitepaper" || url === "/whitepaper/") {
        req.url = "/website/whitepaper/index.html";
      } else if (url === "/terms-of-service" || url === "/terms-of-service/") {
        req.url = "/website/terms-of-service/index.html";
      } else if (url === "/privacy-policy" || url === "/privacy-policy/") {
        req.url = "/website/privacy-policy/index.html";
      } else if (url === "/waitlist" || url === "/waitlist/") {
        req.url = "/waitlist/index.html";
      }
      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const port = getPortFromCLI();
  const isProduction = mode === "production" || command === "build";

  return {
    server: {
      port,
      host: true,
      warmup: {
        clientFiles: [
          "./src/main.tsx",
          "./src/App.tsx",
          "./src/Navigation.tsx",
          "./src/features/game/expansion/LandExpansion.tsx",
          "./src/features/game/expansion/Game.tsx",
          "./src/features/game/expansion/Land.tsx",
        ],
      },
      watch: {
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/public/**",
          "**/dist/**",
          "**/scratch/**",
          "**/dev-dist/**",
          "**/*.zip",
          "**/*.rartemp",
          "**/*.tmp",
          "**/__rzi_*",
        ],
      },
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react-router",
        "xstate",
        "@xstate/react",
        "decimal.js-light",
        "classnames",
        "wagmi",
        "@wagmi/core",
        "@wagmi/connectors",
        "@tanstack/react-query",
        "phaser",
        "events",
        "buffer",
        "process",
        "util",
        "howler",
        "canvas-confetti",
        "react-indiana-drag-scroll",
      ],
      esbuildOptions: {
        target: "esnext",
      },
    },
    plugins: [
      websiteRoutingPlugin(),
      react(
        isProduction
          ? {
              babel: {
                plugins: ["babel-plugin-react-compiler"],
              },
            }
          : undefined,
      ),
      ...(isProduction ? [preload(), minifyHtml()] : []),
      tsconfigPaths(),
      injectHtml({
        // TODO with API environment variables
        injectData: {},
      }),
      ...(port === 443
        ? [
            mkcert({
              hosts: ["https://127.0.0.1"],
            }),
          ]
        : []),
      VitePWA({
        devOptions: {
          enabled: false,
          type: "module",
          navigateFallback: "offline.html",
        },
        srcDir: "src",
        strategies: "injectManifest",
        includeManifestIcons: false,
        includeAssets: [
          "world/*",
          "pwa/**/*",
          "farms/*",
          "offline/*",
          "offline.html",
        ],
        injectManifest: {
          maximumFileSizeToCacheInBytes: 15000000,
          // wasm: the request-token module must be available offline so the
          // PWA can still initialise sessions.
          globPatterns: ["assets/*.{jpg,mp3,svg,gif,png,webp,wasm}"],
          globIgnores: ["**/*.{js,css,html}"],
        },
        filename: "sw.ts",
        manifest: {
          name: "Playra",
          id: "io.playra",
          description:
            "Install our app for a more seamless farming experience. Enjoy full-screen action, easy access, and exclusive features!",
          short_name: "Playra",
          start_url: process.env.VITE_NETWORK === "mainnet" ? "/play/" : "/",
          theme_color: "#303443",
          display: "standalone",
          background_color: "#0099dc",
          orientation: "portrait",
          icons: [
            {
              src: "pwa/icons/pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "pwa/icons/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa/icons/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "pwa/icons/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
          screenshots: [
            {
              src: "pwa/screenshots/1.jpg",
              sizes: "900x1680",
              type: "image/jpg",
              form_factor: "narrow",
            },
            {
              src: "pwa/screenshots/2.jpg",
              sizes: "900x1680",
              type: "image/jpg",
              form_factor: "narrow",
            },
          ],
        },
      }),
    ],
    // Addresses web3 issue
    resolve: {
      alias: {
        process: "process/browser",
        stream: "stream-browserify",
        zlib: "browserify-zlib",
        util: "util",
      },
    },
    css: {
      modules: {},
    },
    base: process.env.VERCEL ? "/" : "./",
    build: {
      chunkSizeWarningLimit: 1000,
      assetsDir: "assets",
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
          play: resolve(__dirname, "play/index.html"),
          about: resolve(__dirname, "website/about/index.html"),
          docs: resolve(__dirname, "website/docs/index.html"),
          whitepaper: resolve(__dirname, "website/whitepaper/index.html"),
          terms: resolve(__dirname, "website/terms-of-service/index.html"),
          privacy: resolve(__dirname, "website/privacy-policy/index.html"),
          roadmap: resolve(__dirname, "website/roadmap/index.html"),
          waitlist: resolve(__dirname, "waitlist/index.html"),
        },
        output: {
          manualChunks: {
            phaser: ["phaser"],
          },
        },
      },
    },
  };
});
