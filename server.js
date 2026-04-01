/**
 * Local server: static site + POST /api/upload for product photos & icons.
 * Run: npm install && npm start → http://localhost:3847
 * Admin: http://localhost:3847/admin.html
 */
const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "products-data.json");
const UPLOAD_ROOT = path.join(ROOT, "site-assets");

const PORT = process.env.PORT || 3847;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "biomed-admin";

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function safeResolveRel(rel) {
  if (!rel || typeof rel !== "string") return null;
  const full = path.join(ROOT, rel.split("/").join(path.sep));
  const norm = path.normalize(full);
  const rootNorm = path.normalize(ROOT);
  if (!norm.startsWith(rootNorm)) return null;
  if (!norm.startsWith(path.join(rootNorm, "site-assets"))) return null;
  return norm;
}

function checkToken(req) {
  const h = req.headers.authorization || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  return bearer || (req.body && req.body.token) || req.query.token;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }
});

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, admin: "/admin.html", tokenHint: "Use ADMIN_TOKEN env or default biomed-admin" });
});

app.get("/api/catalog", (req, res) => {
  try {
    const data = loadData();
    res.json({
      products: (data.products || []).map((p) => ({
        id: p.id,
        name: p.name,
        line: p.line,
        image: p.image,
        icons: p.icons,
        gameFallingImage: p.gameFallingImage
      })),
      extensions: (data.extensions || []).map((e) => ({
        id: e.id,
        name: e.name,
        image: e.image,
        icons: e.icons,
        bannerHome: e.bannerHome
      })),
      gameIcons: data.gameIcons || []
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

function writeBuffer(targetAbs, buffer) {
  fs.mkdirSync(path.dirname(targetAbs), { recursive: true });
  fs.writeFileSync(targetAbs, buffer);
}

/**
 * POST /api/upload
 * multipart: file, token (or Bearer), kind = main | icon | banner | gameIcon | gameFalling
 * scope = product | extension
 * id = item id
 * iconIndex = 0..5 for kind icon
 * gameIconIndex = 0..3 for kind gameIcon
 */
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (checkToken(req) !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized. Token: default biomed-admin or ADMIN_TOKEN env" });
  }
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: "No file (field name: file)" });
  }
  const kind = (req.body.kind || "").trim();
  const scope = (req.body.scope || "").trim();
  const id = (req.body.id || "").trim();

  let relPath = null;

  try {
    const data = loadData();

    if (kind === "gameIcon") {
      const idx = parseInt(req.body.gameIconIndex, 10);
      if (!Array.isArray(data.gameIcons) || idx < 0 || idx >= data.gameIcons.length) {
        return res.status(400).json({ error: "Invalid gameIconIndex" });
      }
      relPath = data.gameIcons[idx];
    } else if (kind === "main" || kind === "icon" || kind === "banner" || kind === "gameFalling") {
      const list = scope === "extension" ? data.extensions : data.products;
      const item = (list || []).find((x) => x.id === id);
      if (!item) return res.status(404).json({ error: "Item not found: " + id });

      if (kind === "main") relPath = item.image;
      else if (kind === "banner") {
        if (scope !== "extension" || !item.bannerHome) {
          return res.status(400).json({ error: "Banner only for extensions with bannerHome" });
        }
        relPath = item.bannerHome;
      } else if (kind === "gameFalling") {
        if (scope !== "product" || !item.gameFallingImage) {
          return res.status(400).json({ error: "gameFalling only for products with gameFallingImage" });
        }
        relPath = item.gameFallingImage;
      } else if (kind === "icon") {
        const idx = parseInt(req.body.iconIndex, 10);
        if (!Array.isArray(item.icons) || idx < 0 || idx >= item.icons.length) {
          return res.status(400).json({ error: "Invalid iconIndex (0–5)" });
        }
        relPath = item.icons[idx];
      }
    } else {
      return res.status(400).json({ error: "Invalid kind (main, icon, banner, gameIcon, gameFalling)" });
    }

    const abs = safeResolveRel(relPath);
    if (!abs) return res.status(400).json({ error: "Could not resolve safe path" });

    writeBuffer(abs, req.file.buffer);
    res.json({ ok: true, saved: relPath, bytes: req.file.size });
  } catch (err) {
    res.status(500).json({ error: String(err.message) });
  }
});

app.use(express.static(ROOT, { index: "BIOMED_Molecular_White_demo.html" }));

app.listen(PORT, () => {
  console.log(`BIOMED site  → http://localhost:${PORT}/`);
  console.log(`Admin upload → http://localhost:${PORT}/admin.html`);
  console.log(`Token: ${ADMIN_TOKEN} (set ADMIN_TOKEN env to change)`);
});
