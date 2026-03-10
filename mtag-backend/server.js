const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://119.159.147.162:3000',
    'http://192.168.0.0/24',  // Aapke local network ka IP range
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));
app.options('*', cors());
app.use(express.json());

const db = new sqlite3.Database("./database.sqlite");

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

db.serialize(() => {
  // Drop existing tables if they exist (for clean setup)
  db.run(`DROP TABLE IF EXISTS verifications`);
  db.run(`DROP TABLE IF EXISTS reports`);
  db.run(`DROP TABLE IF EXISTS reviews`);
  db.run(`DROP TABLE IF EXISTS announcements`);
  db.run(`DROP TABLE IF EXISTS requirements`);
  db.run(`DROP TABLE IF EXISTS centers`);

  // Centers table with more fields
  db.run(`CREATE TABLE centers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    area TEXT,
    city TEXT DEFAULT 'Islamabad',
    category TEXT CHECK(category IN ('toll_plaza', 'park', 'check_post', 'commercial', 'roadside', 'excise_office', 'interchange')),
    hours TEXT NOT NULL,
    is_24hours INTEGER DEFAULT 0,
    is_extended_hours INTEGER DEFAULT 0,
    vehicle_type TEXT DEFAULT 'both',
    contact TEXT,
    landmark TEXT,
    latitude REAL,
    longitude REAL,
    description TEXT,
    peak_hours TEXT,
    best_time TEXT
  )`);

  // Requirements table
  db.run(`CREATE TABLE requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT,
    priority INTEGER DEFAULT 0
  )`);

  // Reports table
  db.run(`CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    center_id INTEGER NOT NULL,
    crowd_level TEXT CHECK(crowd_level IN ('quiet','moderate','busy','very_busy')) NOT NULL,
    wait_time INTEGER NOT NULL,
    reporter_name TEXT,
    vehicle_type TEXT DEFAULT 'motorcycle',
    verified INTEGER DEFAULT 0,
    verification_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
  )`);

  // Verifications table
  db.run(`CREATE TABLE verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    verifier_ip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
  )`);

  // Announcements table - fixed datetime syntax
  db.run(`CREATE TABLE announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    expires_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Center reviews table
  db.run(`CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    center_id INTEGER NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    user_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
  )`);

  // Insert all centers
  const insertCenters = db.prepare(`
    INSERT INTO centers (
      name, address, area, category, hours, is_24hours, 
      is_extended_hours, vehicle_type, contact, landmark, 
      description, peak_hours, best_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // ============ 24/7 CENTERS (ROUND THE CLOCK) ============
  insertCenters.run(
    "26 Number Chungi",
    "26 Number Chungi Toll Plaza, Islamabad",
    "Chungi",
    "toll_plaza",
    "24/7",
    1,
    0,
    "both",
    "051-1234567",
    "Near Chungi No. 26",
    "Main toll plaza on Islamabad Highway. Multiple counters available.",
    "5 PM - 9 PM",
    "12 AM - 4 AM",
  );

  insertCenters.run(
    "Phulgran (17 Meel)",
    "Phulgran Toll Plaza (17 Meel), Islamabad",
    "Phulgran",
    "toll_plaza",
    "24/7",
    1,
    0,
    "both",
    "051-1234568",
    "Near Phulgran Village",
    "Toll plaza on Islamabad Highway. Also known as 17 Meel or 18 Meel.",
    "6 PM - 8 PM",
    "1 AM - 4 AM",
  );

  insertCenters.run(
    "F-9 Park (Jinnah Park)",
    "F-9 Jinnah Park, Islamabad",
    "F-9",
    "park",
    "24/7",
    1,
    0,
    "both",
    "051-1234570",
    "Main entrance of Jinnah Park",
    "Urban park center. Open 24/7 for M-Tag installation.",
    "4 PM - 8 PM",
    "10 PM - 6 AM",
  );

  insertCenters.run(
    "Faizabad Interchange",
    "Faizabad Interchange, Islamabad",
    "Faizabad",
    "interchange",
    "24/7",
    1,
    0,
    "both",
    "051-1234569",
    "Near Faizabad Bridge",
    "Major interchange between Islamabad and Rawalpindi.",
    "5 PM - 9 PM",
    "11 PM - 4 AM",
  );

  // ============ 12-HOUR EXTENDED CENTERS (RAMADAN) ============
  insertCenters.run(
    "Rawat T-Cross",
    "Rawat T-Cross/Rawat Check Post, Islamabad",
    "Rawat",
    "check_post",
    "12 hours (8 AM - 8 PM)",
    0,
    1,
    "both",
    "051-1234576",
    "Rawat Check Post",
    "Extended hours during Ramadan. Located at entry point of Islamabad.",
    "10 AM - 2 PM, 5 PM - 7 PM",
    "8 AM - 9 AM, 1 PM - 3 PM",
  );

  insertCenters.run(
    "G-14 Police Check Post",
    "Police Check Post G-14, Islamabad",
    "G-14",
    "check_post",
    "12 hours (8 AM - 8 PM)",
    0,
    1,
    "both",
    "051-1234579",
    "Near G-14 Sabzi Mandi",
    "Police check post with M-Tag installation facility.",
    "9 AM - 11 AM, 4 PM - 7 PM",
    "8 AM - 9 AM, 12 PM - 2 PM",
  );

  insertCenters.run(
    "9th Avenue I-9",
    "9th Avenue I-9, Islamabad",
    "I-9",
    "check_post",
    "12 hours (8 AM - 8 PM)",
    0,
    1,
    "both",
    "051-1234577",
    "9th Avenue Check Post",
    "Major check post on 9th Avenue.",
    "8 AM - 10 AM, 5 PM - 7 PM",
    "11 AM - 3 PM",
  );

  insertCenters.run(
    "Wheat Godown (Sabzi Mandi)",
    "Wheat Godown Naka, Near Sabzi Mandi Police Station, G-14",
    "G-14",
    "check_post",
    "12 hours (8 AM - 8 PM)",
    0,
    1,
    "both",
    "051-1234571",
    "Near Sabzi Mandi",
    "Located near vegetable market. Extended hours during Ramadan.",
    "7 AM - 10 AM, 4 PM - 7 PM",
    "11 AM - 3 PM",
  );

  insertCenters.run(
    "Daman-e-Koh",
    "Daman-e-Koh (Murree Road side), Islamabad",
    "Daman-e-Koh",
    "park",
    "12 hours (8 AM - 8 PM)",
    0,
    1,
    "both",
    "051-1234574",
    "Viewpoint entrance",
    "Popular viewpoint with M-Tag installation facility.",
    "4 PM - 7 PM",
    "9 AM - 11 AM",
  );

  insertCenters.run(
    "Tulip Hotel",
    "Tulip Hotel, Murree Road, Islamabad",
    "Murree Road",
    "roadside",
    "12 hours (8 AM - 8 PM)",
    0,
    1,
    "both",
    "051-1234575",
    "Tulip Naka",
    "Hotel location with M-Tag center. Extended Ramadan hours.",
    "5 PM - 8 PM",
    "9 AM - 12 PM",
  );

  insertCenters.run(
    "Gulberg Greens",
    "Gulberg Greens, Islamabad",
    "Gulberg",
    "commercial",
    "12 hours (8 AM - 8 PM)",
    0,
    1,
    "both",
    "051-1234573",
    "Main Gulberg area",
    "Residential/commercial area with M-Tag facility.",
    "5 PM - 8 PM",
    "9 AM - 12 PM",
  );

  insertCenters.run(
    "Millpur (Malpur)",
    "Millpur/Malpur area, Islamabad",
    "Malpur",
    "commercial",
    "12 hours (8 AM - 8 PM)",
    0,
    1,
    "both",
    "051-1234572",
    "Millpur Village",
    "Village area with M-Tag installation center.",
    "4 PM - 7 PM",
    "9 AM - 12 PM",
  );

  insertCenters.run(
    "Margalla Avenue",
    "Margalla Avenue Check Post, Islamabad",
    "Margalla",
    "check_post",
    "12 hours (8 AM - 8 PM)",
    0,
    1,
    "both",
    "051-1234578",
    "Margalla Avenue",
    "Check post on Margalla Avenue.",
    "8 AM - 10 AM, 5 PM - 7 PM",
    "11 AM - 3 PM",
  );

  // ============ ADDITIONAL CENTERS ============
  insertCenters.run(
    "Kachnar Park",
    "Kachnar Park, Sector I-8, Islamabad",
    "I-8",
    "park",
    "9 AM - 5 PM",
    0,
    0,
    "both",
    "051-1234581",
    "I-8 Sector",
    "Previously operated until midnight. Now regular hours.",
    "5 PM - 8 PM",
    "9 AM - 11 AM",
  );

  insertCenters.run(
    "I-8 Exchange",
    "I-8 Exchange/Markaz, Islamabad",
    "I-8",
    "commercial",
    "9 AM - 5 PM",
    0,
    0,
    "both",
    "051-1234580",
    "I-8 Markaz",
    "Commercial area center. Regular business hours.",
    "12 PM - 3 PM, 5 PM - 7 PM",
    "9 AM - 11 AM",
  );

  insertCenters.run(
    "Excise Office",
    "Excise and Taxation Department Office, Islamabad",
    "Secretariat",
    "excise_office",
    "9 AM - 4 PM (Mon-Fri)",
    0,
    0,
    "both",
    "051-1234582",
    "Near Civil Secretariat",
    "Main Excise office. Weekdays only.",
    "10 AM - 2 PM",
    "9 AM - 10 AM",
  );

  insertCenters.run(
    "Millat Pur",
    "Millat Pur area, Islamabad",
    "Millat Pur",
    "commercial",
    "9 AM - 5 PM",
    0,
    0,
    "both",
    "051-1234583",
    "Millat Pur",
    "Residential area with M-Tag facility.",
    "4 PM - 7 PM",
    "9 AM - 12 PM",
  );

  // ============ MOTORWAY TOLL PLAZAS ============
  insertCenters.run(
    "New Islamabad International Airport",
    "New Islamabad International Airport Toll Plaza",
    "Airport",
    "toll_plaza",
    "24/7",
    1,
    0,
    "both",
    "051-1234584",
    "Airport entrance",
    "Toll plaza at airport entrance. Open 24/7.",
    "Varies with flight schedules",
    "Late night",
  );

  insertCenters.run(
    "M-1 Motorway Toll Plaza",
    "M-1 Motorway Toll Plaza (Islamabad End)",
    "M-1",
    "toll_plaza",
    "24/7",
    1,
    0,
    "both",
    "051-1234585",
    "M-1 Motorway",
    "Motorway toll plaza. Every motorway toll plaza has M-Tag office.",
    "Peak travel times",
    "Late night",
  );

  insertCenters.run(
    "M-2 Motorway Toll Plaza",
    "M-2 Motorway Toll Plaza (Islamabad End)",
    "M-2",
    "toll_plaza",
    "24/7",
    1,
    0,
    "both",
    "051-1234586",
    "M-2 Motorway",
    "Motorway toll plaza with M-Tag installation.",
    "Peak travel times",
    "Late night",
  );

  insertCenters.finalize();

  // Insert requirements
  const insertRequirements = db.prepare(
    "INSERT INTO requirements (title, description, icon, priority) VALUES (?, ?, ?, ?)",
  );
  insertRequirements.run(
    "Original CNIC",
    "Bring your original Computerized National Identity Card",
    "id-card",
    1,
  );
  insertRequirements.run(
    "Registration Book",
    "Original registration book or smart card of your motorcycle",
    "book",
    2,
  );
  insertRequirements.run(
    "Motorcycle",
    "Your bike must be present for tag installation",
    "bike",
    3,
  );
  insertRequirements.run(
    "Mounting Point",
    "Speedometer/visor is required for tag mounting",
    "mount",
    4,
  );
  insertRequirements.run(
    "Fee: Rs. 250",
    "Payment required for tag issuance (exact change recommended)",
    "rupee",
    5,
  );
  insertRequirements.run(
    "Number Plate",
    "Official Excise-issued number plates required",
    "plate",
    6,
  );
  insertRequirements.run(
    "Owner Presence",
    "Registered owner must be present",
    "user",
    7,
  );
  insertRequirements.finalize();

  // Insert announcements - fixed date format
  const insertAnnouncements = db.prepare(
    "INSERT INTO announcements (title, message, priority, expires_at) VALUES (?, ?, ?, ?)",
  );

  // Current announcement - 3 months from now
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 3);

  insertAnnouncements.run(
    "⚠️ M-Tag Now Mandatory for Motorcycles",
    "As of March 1, 2026, all motorcycles entering Islamabad must have M-Tag installed. Traffic police are actively enforcing. Visit any 24/7 center immediately. Fines and impoundment apply for non-compliance.",
    "high",
    expiryDate.toISOString().split("T")[0], // Store only date part
  );

  // Extended hours announcement
  const ramadanExpiry = new Date("2026-04-30");
  insertAnnouncements.run(
    "🌙 Extended Ramadan Hours",
    "During Ramadan, select centers are open 12 hours daily (8 AM - 8 PM): Rawat T-Cross, G-14 Check Post, 9th Avenue, Wheat Godown, Daman-e-Koh, Tulip Hotel, Gulberg Greens, Millpur, and Margalla Avenue.",
    "medium",
    ramadanExpiry.toISOString().split("T")[0],
  );

  insertAnnouncements.finalize();

  console.log("Database initialized successfully with all centers");
});

// ==================== API ENDPOINTS ====================

// Get all centers with filters
app.get("/api/centers", (req, res) => {
  try {
    const { vehicle_type, is_24hours, is_extended_hours, category, area } =
      req.query;
    let query = "SELECT * FROM centers";
    const params = [];
    const conditions = [];

    if (vehicle_type && vehicle_type !== "all") {
      conditions.push("(vehicle_type = ? OR vehicle_type = 'both')");
      params.push(vehicle_type);
    }
    if (is_24hours === "true") {
      conditions.push("is_24hours = 1");
    }
    if (is_extended_hours === "true") {
      conditions.push("is_extended_hours = 1");
    }
    if (category && category !== "all") {
      conditions.push("category = ?");
      params.push(category);
    }
    if (area && area !== "all") {
      conditions.push("area LIKE ?");
      params.push(`%${area}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY is_24hours DESC, name ASC";

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get center by ID
app.get("/api/centers/:id", (req, res) => {
  try {
    db.get(
      "SELECT * FROM centers WHERE id = ?",
      [req.params.id],
      (err, row) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        if (!row) {
          return res.status(404).json({ error: "Center not found" });
        }
        res.json(row);
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get centers by category
app.get("/api/centers/category/:category", (req, res) => {
  try {
    db.all(
      "SELECT * FROM centers WHERE category = ? ORDER BY name",
      [req.params.category],
      (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get requirements
app.get("/api/requirements", (req, res) => {
  try {
    db.all("SELECT * FROM requirements ORDER BY priority", (err, rows) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get active announcements
app.get("/api/announcements", (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    db.all(
      "SELECT * FROM announcements WHERE expires_at >= ? OR expires_at IS NULL ORDER BY priority DESC, created_at DESC",
      [today],
      (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get latest reports for a center
app.get("/api/centers/:centerId/reports", (req, res) => {
  try {
    db.all(
      "SELECT * FROM reports WHERE center_id = ? ORDER BY created_at DESC LIMIT 50",
      [req.params.centerId],
      (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current status (most recent verified report)
app.get("/api/centers/:centerId/status", (req, res) => {
  try {
    db.get(
      "SELECT * FROM reports WHERE center_id = ? AND verified = 1 ORDER BY created_at DESC LIMIT 1",
      [req.params.centerId],
      (err, row) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        if (row) return res.json(row);

        // fallback to latest unverified
        db.get(
          "SELECT * FROM reports WHERE center_id = ? ORDER BY created_at DESC LIMIT 1",
          [req.params.centerId],
          (err, latest) => {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).json({ error: err.message });
            }
            res.json(latest || { crowd_level: "unknown", wait_time: 0 });
          },
        );
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Submit a new report
app.post("/api/reports", (req, res) => {
  try {
    const { center_id, crowd_level, wait_time, reporter_name, vehicle_type } =
      req.body;
    if (!center_id || !crowd_level || !wait_time) {
      return res.status(400).json({ error: "Missing fields" });
    }
    db.run(
      "INSERT INTO reports (center_id, crowd_level, wait_time, reporter_name, vehicle_type) VALUES (?, ?, ?, ?, ?)",
      [
        center_id,
        crowd_level,
        wait_time,
        reporter_name || "Anonymous",
        vehicle_type || "motorcycle",
      ],
      function (err) {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: "Report submitted" });
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify a report
app.post("/api/reports/:reportId/verify", (req, res) => {
  try {
    const { reportId } = req.params;
    const clientIp = req.ip || req.connection.remoteAddress;

    db.get(
      "SELECT * FROM verifications WHERE report_id = ? AND verifier_ip = ?",
      [reportId, clientIp],
      (err, existing) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        if (existing)
          return res.status(400).json({ error: "Already verified" });

        db.run(
          "INSERT INTO verifications (report_id, verifier_ip) VALUES (?, ?)",
          [reportId, clientIp],
          function (err) {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).json({ error: err.message });
            }

            db.run(
              "UPDATE reports SET verification_count = verification_count + 1 WHERE id = ?",
              [reportId],
            );

            db.get(
              "SELECT COUNT(*) as count FROM verifications WHERE report_id = ?",
              [reportId],
              (err, row) => {
                if (err) {
                  console.error("Database error:", err);
                  return res.status(500).json({ error: err.message });
                }
                if (row.count >= 3) {
                  db.run("UPDATE reports SET verified = 1 WHERE id = ?", [
                    reportId,
                  ]);
                }
              },
            );

            res.json({ message: "Verified" });
          },
        );
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Submit a review
app.post("/api/reviews", (req, res) => {
  try {
    const { center_id, rating, comment, user_name } = req.body;
    if (!center_id || !rating) {
      return res.status(400).json({ error: "Missing fields" });
    }
    db.run(
      "INSERT INTO reviews (center_id, rating, comment, user_name) VALUES (?, ?, ?, ?)",
      [center_id, rating, comment, user_name || "Anonymous"],
      function (err) {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: "Review submitted" });
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get reviews for a center
app.get("/api/centers/:centerId/reviews", (req, res) => {
  try {
    db.all(
      "SELECT * FROM reviews WHERE center_id = ? ORDER BY created_at DESC LIMIT 20",
      [req.params.centerId],
      (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get center ratings
app.get("/api/centers/:centerId/rating", (req, res) => {
  try {
    db.get(
      "SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews FROM reviews WHERE center_id = ?",
      [req.params.centerId],
      (err, row) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        res.json(row || { average_rating: 0, total_reviews: 0 });
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get statistics
app.get("/api/stats", (req, res) => {
  try {
    db.all(
      `
      SELECT 
        c.id,
        c.name,
        c.area,
        c.is_24hours,
        c.is_extended_hours,
        COUNT(DISTINCT r.id) as total_reports,
        AVG(CASE WHEN r.verified = 1 THEN r.wait_time END) as avg_wait_time,
        SUM(CASE WHEN r.crowd_level IN ('busy','very_busy') THEN 1 ELSE 0 END) as rush_count,
        COUNT(DISTINCT rev.id) as total_reviews,
        AVG(rev.rating) as avg_rating
      FROM centers c
      LEFT JOIN reports r ON c.id = r.center_id AND r.created_at > datetime('now', '-24 hours')
      LEFT JOIN reviews rev ON c.id = rev.center_id
      GROUP BY c.id
      ORDER BY c.is_24hours DESC, c.name ASC
    `,
      (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get rush prediction based on historical data
app.get("/api/predict/:centerId", (req, res) => {
  try {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    db.all(
      `SELECT AVG(wait_time) as avg_wait, crowd_level, COUNT(*) as count 
       FROM reports 
       WHERE center_id = ? 
       AND strftime('%H', created_at) = ? 
       AND strftime('%w', created_at) = ?
       GROUP BY crowd_level 
       ORDER BY count DESC`,
      [
        req.params.centerId,
        hour.toString().padStart(2, "0"),
        dayOfWeek.toString(),
      ],
      (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }

        let predicted_level = "unknown";
        let confidence = 0;

        if (rows.length > 0) {
          predicted_level = rows[0].crowd_level;
          confidence = Math.min(100, Math.round((rows[0].count / 10) * 100));
        }

        res.json({
          predicted_level,
          confidence,
          hour,
          day: dayOfWeek,
        });
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get centers by location/area
app.get("/api/areas", (req, res) => {
  try {
    db.all(
      "SELECT DISTINCT area FROM centers WHERE area IS NOT NULL ORDER BY area",
      (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        res.json(rows.map((r) => r.area));
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search centers
app.get("/api/search", (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    db.all(
      `SELECT * FROM centers 
       WHERE name LIKE ? OR address LIKE ? OR area LIKE ? OR landmark LIKE ?
       ORDER BY is_24hours DESC, name ASC`,
      [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`],
      (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: err.message });
        }
        res.json(rows);
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
