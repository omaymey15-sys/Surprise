import express from "express";
import pg from "pg";
import crypto from "crypto";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

await pool.query(`
  CREATE TABLE IF NOT EXISTS surprises (
    code       CHAR(14) PRIMARY KEY,
    lat        DOUBLE PRECISION NOT NULL,
    lon        DOUBLE PRECISION NOT NULL,
    hint       TEXT NOT NULL DEFAULT '',
    msg        TEXT NOT NULL DEFAULT '',
    photos     JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "5mb" }));

// Anti force-brute : 30 requêtes / minute / IP
const hits = new Map();
setInterval(() => hits.clear(), 60_000).unref();
app.use((req, res, next) => {
  const n = (hits.get(req.ip) ?? 0) + 1;
  hits.set(req.ip, n);
  if (n > 30) return res.status(429).json({ error: "trop de requêtes" });
  next();
});

const newCode = () => Array.from({ length: 14 }, () => crypto.randomInt(0, 10)).join("");

app.get("/health", (_req, res) => res.send("ok"));

app.post("/surprises", async (req, res) => {
  const { lat, lon, hint = "", msg = "", photos } = req.body ?? {};
  const okPhotos =
    Array.isArray(photos) && photos.length >= 1 && photos.length <= 5 &&
    photos.every((p) => typeof p === "string" && p.length < 600_000);
  if (typeof lat !== "number" || typeof lon !== "number" || !okPhotos)
    return res.status(400).json({ error: "données invalides" });

  try {
    for (let i = 0; i < 10; i++) {
      const code = newCode();
      const r = await pool.query(
        `INSERT INTO surprises (code, lat, lon, hint, msg, photos)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
        [code, lat, lon, String(hint).slice(0, 500), String(msg).slice(0, 2000), JSON.stringify(photos)]
      );
      if (r.rowCount === 1) return res.status(201).json({ code });
    }
    res.status(500).json({ error: "génération du code impossible" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "erreur serveur" });
  }
});

app.get("/surprises/:code", async (req, res) => {
  if (!/^\d{14}$/.test(req.params.code)) return res.status(404).json({ error: "introuvable" });
  try {
    const r = await pool.query(
      "SELECT lat, lon, hint, msg, photos FROM surprises WHERE code = $1",
      [req.params.code]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: "introuvable" });
    res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "erreur serveur" });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Surprise API prête"));
