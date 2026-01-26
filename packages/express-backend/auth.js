import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "./schemas/user.js";

async function registerUser(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing name, email or password." });
  }

  if (await User.exists({ email })) {
    return res.status(409).json({ error: "Email already registered." });
  }

  try {
    const hash = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const user = await User.create({ name, email, password: hash });
    const token = generateAccessToken({ sub: user._id, email: user.email });

    return res.status(201).json({ token });
  } catch (err) {
    console.error("Error in registerUser:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: "1d" });
}

function authenticateUser(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided." });
  } else {
    jwt.verify(token, process.env.TOKEN_SECRET, (error, decoded) => {
      if (error) return res.status(401).json({ error: "Invalid token." });
      req.user = decoded;
      next();
    });
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = generateAccessToken({ sub: user._id, email: user.email });

    return res.status(200).json({ token });
  } catch (error) {
    console.error("Error in loginUser:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

export default {
  registerUser,
  generateAccessToken,
  authenticateUser,
  loginUser,
};
