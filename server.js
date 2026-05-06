const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const port = Number(process.env.PORT || 43987);
const root = __dirname;
const exportDir = path.join(root, "exports");
const homeDir = process.env.HOME || process.env.USERPROFILE || root;
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".csv", "text/csv; charset=utf-8"],
]);

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, status, body) {
  setCors(res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function safeFilename(value) {
  const name = path.basename(String(value || "oncall-schedule.csv"))
    .replace(/[^\w.\-\u3040-\u30ff\u3400-\u9fff]/g, "_")
    .replace(/_+/g, "_");
  return name.toLowerCase().endsWith(".csv") ? name : `${name}.csv`;
}

function resolveExportDir(value) {
  const raw = String(value || "").trim();
  if (!raw) return exportDir;
  const expanded = raw === "~" || raw.startsWith("~/")
    ? path.join(homeDir, raw.slice(2))
    : raw;
  return path.resolve(expanded);
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 10 * 1024 * 1024) throw new Error("request too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function saveCsv(req, res) {
  try {
    const body = await readJsonBody(req);
    const csvText = String(body.csvText || "");
    if (!csvText.length) {
      sendJson(res, 400, { ok: false, error: "CSV body is empty" });
      return;
    }

    const targetDir = resolveExportDir(body.directory);
    await fs.mkdir(targetDir, { recursive: true });
    const filename = safeFilename(body.filename);
    const filePath = path.join(targetDir, filename);
    await fs.writeFile(filePath, csvText, "utf8");
    const stat = await fs.stat(filePath);
    sendJson(res, 200, {
      ok: true,
      filename,
      path: filePath,
      directory: targetDir,
      bytes: stat.size,
    });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message || String(error) });
  }
}

async function serveStatic(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
    const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
    const filePath = path.normalize(path.join(root, requested));
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const content = await fs.readFile(filePath);
    const type = mimeTypes.get(path.extname(filePath)) || "application/octet-stream";
    setCors(res);
    res.writeHead(200, { "Content-Type": type });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url?.startsWith("/api/save-csv")) {
    await saveCsv(req, res);
    return;
  }

  if (req.method === "GET") {
    await serveStatic(req, res);
    return;
  }

  res.writeHead(405);
  res.end("Method not allowed");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`当直シフトメーカー: http://127.0.0.1:${port}`);
  console.log(`CSV保存先（未指定時）: ${exportDir}`);
});
