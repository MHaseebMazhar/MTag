const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// Serve static files from build folder
app.use(express.static(path.join(__dirname, "build")));

// SPA support - all routes go to index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).send("Server error occurred");
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Frontend server running:`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Network: http://119.159.147.162:${PORT}`);
  console.log(`   Serving: ${path.join(__dirname, "build")}`);
});
