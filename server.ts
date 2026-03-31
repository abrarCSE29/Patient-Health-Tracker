import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./src/lib/db.js";
import {
  clearRefreshCookie,
  getRefreshTokenFromRequest,
  requireRequestUser,
  setRefreshCookie,
} from "./src/lib/auth.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./src/lib/tokens.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isPublicApiRoute(pathname: string, method: string) {
  if (pathname === "/health") return true;
  if (pathname === "/auth/register" && method === "POST") return true;
  if (pathname === "/auth/login" && method === "POST") return true;
  if (pathname === "/auth/refresh" && method === "POST") return true;
  return false;
}

async function userOwnsProfile(userId: string, profileId: string) {
  const profile = await db.profile.findFirst({ where: { id: profileId, userId } });
  return !!profile;
}

async function userOwnsDoctor(userId: string, doctorId: string) {
  const doctor = await db.doctor.findFirst({
    where: {
      id: doctorId,
      profile: { userId },
    },
  });
  return !!doctor;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cookieParser());
  app.use(express.json());

  app.use("/api", (req, res, next) => {
    if (isPublicApiRoute(req.path, req.method)) return next();
    const user = requireRequestUser(req, res);
    if (!user) return;
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth API
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password } = req.body || {};

      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }

      const normalizedEmail = String(email).toLowerCase().trim();
      if (String(password).length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }

      const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(String(password), 10);
      const user = await db.user.create({
        data: {
          name: String(name).trim(),
          email: normalizedEmail,
          password: hashedPassword,
        },
      });

      const accessToken = signAccessToken({ id: user.id, email: user.email });
      const refreshToken = signRefreshToken({ id: user.id, email: user.email });
      setRefreshCookie(res, refreshToken);

      return res.status(201).json({
        accessToken,
        user: { id: user.id, email: user.email, name: user.name ?? null },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const normalizedEmail = String(email).toLowerCase().trim();
      const user = await db.user.findUnique({ where: { email: normalizedEmail } });

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      let valid = false;
      if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")) {
        valid = await bcrypt.compare(password, user.password);
      } else {
        valid = user.password === password;
      }

      if (!valid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const accessToken = signAccessToken({ id: user.id, email: user.email });
      const refreshToken = signRefreshToken({ id: user.id, email: user.email });
      setRefreshCookie(res, refreshToken);

      return res.json({
        accessToken,
        user: { id: user.id, email: user.email, name: user.name ?? null },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const refreshToken = getRefreshTokenFromRequest(req);
      if (!refreshToken) {
        return res.status(401).json({ error: "Missing refresh token" });
      }

      const payload = verifyRefreshToken(refreshToken);
      const user = await db.user.findUnique({ where: { id: payload.sub } });

      if (!user || user.email !== payload.email) {
        clearRefreshCookie(res);
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      const nextAccessToken = signAccessToken({ id: user.id, email: user.email });
      const nextRefreshToken = signRefreshToken({ id: user.id, email: user.email });
      setRefreshCookie(res, nextRefreshToken);

      return res.json({
        accessToken: nextAccessToken,
        user: { id: user.id, email: user.email, name: user.name ?? null },
      });
    } catch {
      clearRefreshCookie(res);
      res.status(401).json({ error: "Invalid refresh token" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    clearRefreshCookie(res);
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req, res) => {
    const authUser = requireRequestUser(req, res);
    if (!authUser) return;

    const user = await db.user.findUnique({ where: { id: authUser.userId } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    res.json({ id: user.id, email: user.email, name: user.name ?? null });
  });

  // Medications API
  app.get("/api/medications", async (req, res) => {
    try {
      const authUser = requireRequestUser(req, res);
      if (!authUser) return;

      const { profileId } = req.query;
      if (profileId) {
        const owned = await userOwnsProfile(authUser.userId, String(profileId));
        if (!owned) return res.status(403).json({ error: "Forbidden" });
      }

      const medications = await db.medication.findMany({
        where: profileId
          ? { profileId: String(profileId) }
          : { profile: { userId: authUser.userId } },
        include: { profile: true },
      });
      res.json(medications);
    } catch {
      res.status(500).json({ error: "Failed to fetch medications" });
    }
  });

  app.post("/api/medications", async (req, res) => {
    try {
      const authUser = requireRequestUser(req, res);
      if (!authUser) return;

      const {
        name,
        startDate,
        endDate,
        status,
        profileId,
        durationDays,
        doctor,
        notes,
        morningDosage,
        afternoonDosage,
        nightDosage,
        morningMeal,
        afternoonMeal,
        nightMeal,
      } = req.body;

      if (!profileId) return res.status(400).json({ error: "Profile ID is required" });
      const owned = await userOwnsProfile(authUser.userId, String(profileId));
      if (!owned) return res.status(403).json({ error: "Forbidden" });

      let calculatedEndDate = endDate;
      if (!calculatedEndDate && durationDays && startDate) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + parseInt(durationDays));
        calculatedEndDate = end.toISOString().split("T")[0];
      }

      const newMed = await db.medication.create({
        data: {
          name,
          startDate: startDate || new Date().toISOString(),
          endDate: calculatedEndDate,
          durationDays: parseInt(durationDays) || null,
          morningDosage,
          afternoonDosage,
          nightDosage,
          morningMeal,
          afternoonMeal,
          nightMeal,
          doctor,
          notes,
          status: status || "active",
          profileId,
        },
      });
      res.status(201).json(newMed);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create medication" });
    }
  });

  app.put("/api/medications/:id", async (req, res) => {
    try {
      const authUser = requireRequestUser(req, res);
      if (!authUser) return;

      const { id } = req.params;
      const current = await db.medication.findUnique({
        where: { id },
        include: { profile: true },
      });
      if (!current) return res.status(404).json({ error: "Medication not found" });
      if (current.profile.userId !== authUser.userId) return res.status(403).json({ error: "Forbidden" });

      const {
        name,
        startDate,
        endDate,
        status,
        durationDays,
        doctor,
        notes,
        morningDosage,
        afternoonDosage,
        nightDosage,
        morningMeal,
        afternoonMeal,
        nightMeal,
      } = req.body;

      let calculatedEndDate = endDate;
      if (!calculatedEndDate && durationDays && startDate) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + parseInt(durationDays));
        calculatedEndDate = end.toISOString().split("T")[0];
      }

      const updatedMed = await db.medication.update({
        where: { id },
        data: {
          name,
          startDate: startDate || undefined,
          endDate: calculatedEndDate,
          durationDays: durationDays ? parseInt(durationDays) : undefined,
          morningDosage,
          afternoonDosage,
          nightDosage,
          morningMeal,
          afternoonMeal,
          nightMeal,
          doctor,
          notes,
          status: status || undefined,
        },
      });
      res.json(updatedMed);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update medication" });
    }
  });

  app.delete("/api/medications/:id", async (req, res) => {
    try {
      const authUser = requireRequestUser(req, res);
      if (!authUser) return;

      const { id } = req.params;
      const current = await db.medication.findUnique({ where: { id }, include: { profile: true } });
      if (!current) return res.status(404).json({ error: "Medication not found" });
      if (current.profile.userId !== authUser.userId) return res.status(403).json({ error: "Forbidden" });

      await db.medication.delete({ where: { id } });
      res.json({ message: "Medication deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete medication" });
    }
  });

  // Doctors API
  app.get("/api/doctors", async (req, res) => {
    try {
      const authUser = requireRequestUser(req, res);
      if (!authUser) return;

      const { profileId } = req.query;
      if (!profileId) {
        return res.status(400).json({ error: "Profile ID is required" });
      }

      const owned = await userOwnsProfile(authUser.userId, String(profileId));
      if (!owned) return res.status(403).json({ error: "Forbidden" });

      const doctors = await db.doctor.findMany({ where: { profileId: String(profileId) } });
      res.json(doctors);
    } catch {
      res.status(500).json({ error: "Failed to fetch doctors" });
    }
  });

  app.post("/api/doctors", async (req, res) => {
    try {
      const authUser = requireRequestUser(req, res);
      if (!authUser) return;

      const { name, specialty, hospital, phone, email, address, profileId } = req.body;
      if (!profileId) {
        return res.status(400).json({ error: "Profile ID is required" });
      }

      const owned = await userOwnsProfile(authUser.userId, String(profileId));
      if (!owned) return res.status(403).json({ error: "Forbidden" });

      const newDoc = await db.doctor.create({ data: { name, specialty, hospital, phone, email, address, profileId } });
      res.status(201).json(newDoc);
    } catch {
      res.status(500).json({ error: "Failed to create doctor" });
    }
  });

  // Visits API
  app.get("/api/visits", async (req, res) => {
    try {
      const authUser = requireRequestUser(req, res);
      if (!authUser) return;

      const { profileId } = req.query;
      if (profileId) {
        const owned = await userOwnsProfile(authUser.userId, String(profileId));
        if (!owned) return res.status(403).json({ error: "Forbidden" });
      }

      const visits = await db.visit.findMany({
        where: profileId
          ? { profileId: String(profileId) }
          : { profile: { userId: authUser.userId } },
        include: { doctor: true, profile: true },
      });
      res.json(visits);
    } catch {
      res.status(500).json({ error: "Failed to fetch visits" });
    }
  });

  app.post("/api/visits", async (req, res) => {
    try {
      const authUser = requireRequestUser(req, res);
      if (!authUser) return;

      const { date, time, location, type, reason, diagnosis, notes, status, profileId, doctorId } = req.body;
      if (!profileId || !doctorId) {
        return res.status(400).json({ error: "Profile ID and Doctor ID are required" });
      }
      const owned = await userOwnsProfile(authUser.userId, String(profileId));
      if (!owned) return res.status(403).json({ error: "Forbidden" });
      const ownsDoctor = await userOwnsDoctor(authUser.userId, String(doctorId));
      if (!ownsDoctor) return res.status(403).json({ error: "Forbidden" });

      const newVisit = await db.visit.create({
        data: {
          date: date || new Date().toISOString(),
          time,
          location,
          type: type || "Checkup",
          reason,
          diagnosis,
          notes,
          status: status || "upcoming",
          profileId,
          doctorId,
        },
      });
      res.status(201).json(newVisit);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create visit" });
    }
  });

  app.put("/api/visits/:id", async (req, res) => {
    try {
      const authUser = requireRequestUser(req, res);
      if (!authUser) return;

      const { id } = req.params;
      const current = await db.visit.findUnique({ where: { id }, include: { profile: true } });
      if (!current) return res.status(404).json({ error: "Visit not found" });
      if (current.profile.userId !== authUser.userId) return res.status(403).json({ error: "Forbidden" });

      const { date, time, location, type, reason, diagnosis, notes, status, doctorId } = req.body;
      if (doctorId) {
        const ownsDoctor = await userOwnsDoctor(authUser.userId, String(doctorId));
        if (!ownsDoctor) return res.status(403).json({ error: "Forbidden" });
      }
      const updatedVisit = await db.visit.update({
        where: { id },
        data: {
          date: date || undefined,
          time,
          location,
          type,
          reason,
          diagnosis,
          notes,
          status,
          doctorId,
        },
      });
      res.json(updatedVisit);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update visit" });
    }
  });

  app.delete("/api/visits/:id", async (req, res) => {
    try {
      const authUser = requireRequestUser(req, res);
      if (!authUser) return;

      const { id } = req.params;
      const current = await db.visit.findUnique({ where: { id }, include: { profile: true } });
      if (!current) return res.status(404).json({ error: "Visit not found" });
      if (current.profile.userId !== authUser.userId) return res.status(403).json({ error: "Forbidden" });

      await db.visit.delete({ where: { id } });
      res.json({ message: "Visit deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete visit" });
    }
  });

  // Profiles API
  app.get("/api/profiles", async (req, res) => {
    try {
      const authUser = requireRequestUser(req, res);
      if (!authUser) return;

      const profiles = await db.profile.findMany({ where: { userId: authUser.userId } });
      res.json(profiles);
    } catch {
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const authUser = requireRequestUser(req, res);
      if (!authUser) return;

      const {
        name,
        age,
        gender,
        bloodGroup,
        height,
        weight,
        relationship,
        conditions,
        allergies,
        emergencyContact,
        emergencyPhone,
      } = req.body;

      const newProfile = await db.profile.create({
        data: {
          name,
          age: parseInt(age) || 0,
          gender,
          bloodGroup,
          height,
          weight,
          relationship: relationship || "Self",
          conditions,
          allergies,
          emergencyContact,
          emergencyPhone,
          userId: authUser.userId,
        },
      });
      res.status(201).json(newProfile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create profile" });
    }
  });

  // Reports API
  app.get("/api/reports", async (req, res) => {
    try {
      const authUser = requireRequestUser(req, res);
      if (!authUser) return;

      const { profileId } = req.query;
      if (profileId) {
        const owned = await userOwnsProfile(authUser.userId, String(profileId));
        if (!owned) return res.status(403).json({ error: "Forbidden" });
      }

      const reports = await db.report.findMany({
        where: profileId
          ? { profileId: String(profileId) }
          : { profile: { userId: authUser.userId } },
        include: { profile: true },
      });
      res.json(reports);
    } catch {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const authUser = requireRequestUser(req, res);
      if (!authUser) return;

      const { title, date, type, result, status, profileId, doctorId } = req.body;
      if (!profileId) return res.status(400).json({ error: "Profile ID is required" });
      const owned = await userOwnsProfile(authUser.userId, String(profileId));
      if (!owned) return res.status(403).json({ error: "Forbidden" });
      if (doctorId) {
        const ownsDoctor = await userOwnsDoctor(authUser.userId, String(doctorId));
        if (!ownsDoctor) return res.status(403).json({ error: "Forbidden" });
      }

      const newReport = await db.report.create({
        data: {
          title,
          date: date || new Date().toISOString(),
          type,
          result,
          status: status || "completed",
          doctorId,
          profileId,
        },
      });
      res.status(201).json(newReport);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create report" });
    }
  });

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
