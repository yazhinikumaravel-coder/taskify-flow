import express from "express";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const TASKS_FILE = path.join(process.cwd(), "tasks.json");
const USERS_FILE = path.join(process.cwd(), "users.json");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-todo-app";

// Middleware to parse JSON payloads
app.use(express.json());

// Load users helper
function getUsers(): any[] {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const content = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading users file:", error);
    return [];
  }
}

// Save users helper
function saveUsers(users: any[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error saving users file:", error);
  }
}

// Load tasks helper
function getTasks(): any[] {
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const content = fs.readFileSync(TASKS_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading tasks file:", error);
    return [];
  }
}

// Save tasks helper
function saveAllTasks(tasks: any[]) {
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
  } catch (error) {
    console.error("Error saving tasks file:", error);
  }
}

// Authentication Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
}

// --- API Routes ---

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const users = getUsers();
    const emailLower = email.toLowerCase().trim();

    if (users.some((u) => u.email === emailLower)) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: "user_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      email: emailLower,
      password: hashedPassword,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=fda4af&color=4c0519&bold=true&size=128`,
      bio: "Productivity enthusiast 🎯",
      location: "Earth 🌎"
    };

    users.push(newUser);
    saveUsers(users);

    // Create Token
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const users = getUsers();
    const emailLower = email.toLowerCase().trim();

    const user = users.find((u) => u.email === emailLower);
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Create Token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Forgot Password
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const users = getUsers();
  const user = users.find((u) => u.email === email.toLowerCase().trim());

  if (!user) {
    return res.status(400).json({ error: "No account found with this email" });
  }

  // Simulate success
  res.json({
    success: true,
    message: "A password reset link has been successfully simulated and sent to your email!"
  });
});

// Get User Profile
app.get("/api/auth/profile", authenticateToken, (req: any, res) => {
  const users = getUsers();
  const user = users.find((u) => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Update User Profile / Settings
app.put("/api/auth/profile", authenticateToken, (req: any, res) => {
  const { name, avatar, bio, location } = req.body;
  const users = getUsers();
  const index = users.findIndex((u) => u.id === req.user.id);

  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const updatedUser = {
    ...users[index],
    name: name !== undefined ? name.trim() : users[index].name,
    avatar: avatar !== undefined ? avatar.trim() : users[index].avatar,
    bio: bio !== undefined ? bio.trim() : users[index].bio,
    location: location !== undefined ? location.trim() : users[index].location,
  };

  users[index] = updatedUser;
  saveUsers(users);

  const { password: _, ...userWithoutPassword } = updatedUser;
  res.json(userWithoutPassword);
});

// --- Tasks Routes (with User Isolation) ---

// Get Tasks for logged-in user
app.get("/api/tasks", authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const allTasks = getTasks();

  // Filter tasks belonging to this user
  const userTasks = allTasks.filter((t) => t.userId === userId);
  res.json(userTasks);
});

// Save Tasks for logged-in user
app.post("/api/tasks", authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const { tasks } = req.body;

  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: "Invalid tasks payload" });
  }

  const allTasks = getTasks();

  // Keep tasks of other users, replace only tasks of this user
  const otherUsersTasks = allTasks.filter((t) => t.userId !== userId);

  // Map incoming tasks to have the correct userId
  const verifiedUserTasks = tasks.map((t) => ({
    ...t,
    userId,
  }));

  const mergedTasks = [...otherUsersTasks, ...verifiedUserTasks];
  saveAllTasks(mergedTasks);

  res.json({ success: true, tasks: verifiedUserTasks });
});

// Static file serving / Vite dev server integration
async function setupStaticServing() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}
setupStaticServing();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
