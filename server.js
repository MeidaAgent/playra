import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon",
};

// Route handlers for serverless functions
const apiRoutes = {
  "/developer": () => import("./api/developer.js"),
  "/developer/": () => import("./api/developer.js"),
  "/api/developer": () => import("./api/developer.js"),
  "/api/ca": () => import("./api/ca.js"),
  "/api/admin/login": () => import("./api/admin/login.js"),
  "/api/admin/config": () => import("./api/admin/config.js"),
  "/api/admin/logout": () => import("./api/admin/logout.js"),
};

function enhanceResponse(res) {
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (data) {
    this.setHeader("Content-Type", "application/json; charset=utf-8");
    this.end(JSON.stringify(data));
    return this;
  };
  res.send = function (data) {
    if (typeof data === "object" && !Buffer.isBuffer(data)) {
      return this.json(data);
    }
    this.end(data);
    return this;
  };
}

async function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        req.body = {};
        return resolve();
      }
      const contentType = req.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        try {
          req.body = JSON.parse(body);
        } catch {
          req.body = body;
        }
      } else {
        req.body = body;
      }
      resolve();
    });
  });
}

function serveStaticFile(req, res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("404 Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Length": stats.size,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  enhanceResponse(res);

  const url = new URL(req.url, `http://${req.headers.host || "localhost:3000"}`);
  let pathname = decodeURIComponent(url.pathname);

  // Check API & developer routes
  if (apiRoutes[pathname]) {
    await parseBody(req);
    try {
      const module = await apiRoutes[pathname]();
      const handler = module.default;
      return await handler(req, res);
    } catch (error) {
      console.error(`API Error on ${pathname}:`, error);
      res.statusCode = 500;
      return res.json({ error: "Internal Server Error" });
    }
  }

  // Handle static files
  if (pathname === "/") {
    pathname = "/website/index.html";
  }

  // Check public directory first, then root
  let safePath = path.normalize(path.join(__dirname, "public", pathname));
  if (!fs.existsSync(safePath)) {
    safePath = path.normalize(path.join(__dirname, pathname));
  }

  if (!safePath.startsWith(__dirname)) {
    res.statusCode = 403;
    return res.end("Access Denied");
  }

  serveStaticFile(req, res, safePath);
});

server.listen(PORT, () => {
  console.log(`\n🚀 Playra server is running at: http://localhost:${PORT}`);
  console.log(`   - Homepage:  http://localhost:${PORT}/`);
  console.log(`   - Developer: http://localhost:${PORT}/developer\n`);
});

