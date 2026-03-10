// serve-frontend.js
const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "build")));

// SPA support - sab routes index.html par bhejo
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Frontend server running:`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Network: http://119.159.147.162:${PORT}`);
});
