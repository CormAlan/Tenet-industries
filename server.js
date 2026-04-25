const http = require("http");
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "public");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split("?")[0];

  // Default route
  if (urlPath === "/") {
    urlPath = "/index1.html";
  }

  let filePath = path.join(publicDir, urlPath);

  // Prevent path traversal
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      // If it's a folder → serve index.html inside it
      const indexPath = path.join(filePath, "index.html");
      return serveFile(indexPath, res);
    }

    if (!err && stats.isFile()) {
      return serveFile(filePath, res);
    }

    // Try adding .html automatically (optional nice feature)
    const htmlPath = filePath + ".html";
    fs.stat(htmlPath, (err2, stats2) => {
      if (!err2 && stats2.isFile()) {
        return serveFile(htmlPath, res);
      }

      res.writeHead(404);
      res.end("Not found");
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});