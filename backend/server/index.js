// ========== ENVIRONMENT ==========
require("dotenv").config();

// ========== IMPORTS ==========
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ========== SETUP ==========
const app = express();
const PORT = process.env.PORT || 3042;
const JWT_SECRET = process.env.JWT_SECRET || "secret-key"; //Fallback if no env variable is set

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ========== MOCK DATABASE ==========
// Password is hashed with bcrypt (salt rounds: 10)
const users = [
  { 
    id: 1, 
    email: "admin@example.com", 
    password: bcrypt.hashSync("123", 10),
    profilePicture: "/src/assets/pfp.jpg"
  }
];

// Store refresh tokens (in production, use a database)
const refreshTokens = [];

// ========== MIDDLEWARE FUNCTIONS ==========

// Authentication middleware - verifies JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(401).json({ message: "Invalid or expired token" });
    
    req.user = decoded;
    next();
  });
}

// ========== ENDPOINTS ==========

// Login endpoint - validates credentials and returns JWT token
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    // Find user by email
    const user = users.find((u) => u.email === email);
    if (!user)
      return res.status(401).json({ message: "Incorrect email or password" });

    // Verify password using bcrypt
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: "Incorrect email or password" });

    // Generate access token (expires in 15 minutes)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, profilePicture: user.profilePicture },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Generate refresh token (expires in 7 days)
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, profilePicture: user.profilePicture },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Store refresh token
    refreshTokens.push(refreshToken);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Profile endpoint - requires valid JWT token
app.get("/profile", authenticateToken, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user
  });
});

// Get user by ID - requires valid JWT token
app.get("/user/:id", authenticateToken, (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const user = users.find((u) => u.id === userId);

  if (!user)
    return res.status(404).json({ message: "User not found" });

  res.json({
    id: user.id,
    email: user.email
  });
});

// Refresh token endpoint - generates new access token
app.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token required" });

  // Check if refresh token exists in storage
  if (!refreshTokens.includes(refreshToken))
    return res.status(403).json({ message: "Invalid refresh token" });

  // Verify refresh token
  jwt.verify(refreshToken, JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(403).json({ message: "Invalid or expired refresh token" });

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, profilePicture: decoded.profilePicture },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken });
  });
});

// Logout endpoint - removes refresh token
app.post("/logout", (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    const index = refreshTokens.indexOf(refreshToken);
    if (index > -1) {
      refreshTokens.splice(index, 1);
    }
  }

  res.json({ message: "Logged out successfully" });
});

// ========== START SERVER ==========
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
