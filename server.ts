import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./src/lib/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Medications API
  app.get("/api/medications", async (req, res) => {
    try {
      const { profileId } = req.query;
      const where = profileId ? { profileId: String(profileId) } : {};
      const medications = await db.medication.findMany({
        where,
        include: { profile: true }
      });
      res.json(medications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medications" });
    }
  });

  app.post("/api/medications", async (req, res) => {
    try {
      console.log("POST /api/medications", req.body);
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
        nightMeal 
      } = req.body;
      
      // For prototype, if profileId is missing, we'll try to find the first profile
      let targetProfileId = profileId;
      if (!targetProfileId) {
        const firstProfile = await db.profile.findFirst();
        if (firstProfile) targetProfileId = firstProfile.id;
      }

      if (!targetProfileId) {
        return res.status(400).json({ error: "Profile ID is required" });
      }

      // Calculate endDate if durationDays is provided and endDate is not
      let calculatedEndDate = endDate;
      if (!calculatedEndDate && durationDays && startDate) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + parseInt(durationDays));
        calculatedEndDate = end.toISOString().split('T')[0];
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
          profileId: targetProfileId
        }
      });
      res.status(201).json(newMed);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create medication" });
    }
  });

  app.put("/api/medications/:id", async (req, res) => {
    try {
      const { id } = req.params;
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
        nightMeal 
      } = req.body;

      // Calculate endDate if durationDays is provided and endDate is not
      let calculatedEndDate = endDate;
      if (!calculatedEndDate && durationDays && startDate) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + parseInt(durationDays));
        calculatedEndDate = end.toISOString().split('T')[0];
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
        }
      });
      res.json(updatedMed);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update medication" });
    }
  });

  app.delete("/api/medications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.medication.delete({
        where: { id }
      });
      res.json({ message: "Medication deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete medication" });
    }
  });

  // Doctors API
  app.get("/api/doctors", async (req, res) => {
    try {
      const doctors = await db.doctor.findMany();
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch doctors" });
    }
  });

  app.post("/api/doctors", async (req, res) => {
    try {
      console.log("POST /api/doctors", req.body);
      const { name, specialty, hospital, phone, email, address } = req.body;
      const newDoc = await db.doctor.create({
        data: { name, specialty, hospital, phone, email, address }
      });
      res.status(201).json(newDoc);
    } catch (error) {
      res.status(500).json({ error: "Failed to create doctor" });
    }
  });

  // Visits API
  app.get("/api/visits", async (req, res) => {
    try {
      const { profileId } = req.query;
      const where = profileId ? { profileId: String(profileId) } : {};
      const visits = await db.visit.findMany({
        where,
        include: { doctor: true, profile: true }
      });
      res.json(visits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch visits" });
    }
  });

  app.post("/api/visits", async (req, res) => {
    try {
      console.log("POST /api/visits", req.body);
      const { date, time, location, type, reason, diagnosis, notes, status, profileId, doctorId } = req.body;
      
      let targetProfileId = profileId;
      if (!targetProfileId) {
        const firstProfile = await db.profile.findFirst();
        if (firstProfile) targetProfileId = firstProfile.id;
      }

      let targetDoctorId = doctorId;
      if (!targetDoctorId) {
        const firstDoc = await db.doctor.findFirst();
        if (firstDoc) targetDoctorId = firstDoc.id;
      }

      if (!targetProfileId || !targetDoctorId) {
        return res.status(400).json({ error: "Profile ID and Doctor ID are required" });
      }

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
          profileId: targetProfileId,
          doctorId: targetDoctorId
        }
      });
      res.status(201).json(newVisit);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create visit" });
    }
  });

  app.put("/api/visits/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { date, time, location, type, reason, diagnosis, notes, status, doctorId } = req.body;
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
          doctorId
        }
      });
      res.json(updatedVisit);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update visit" });
    }
  });

  app.delete("/api/visits/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.visit.delete({
        where: { id }
      });
      res.json({ message: "Visit deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete visit" });
    }
  });

  // Profiles API
  app.get("/api/profiles", async (req, res) => {
    try {
      const profiles = await db.profile.findMany();
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      console.log("POST /api/profiles", req.body);
      const { name, age, gender, bloodGroup, height, weight, userId, relationship, conditions, allergies, emergencyContact, emergencyPhone } = req.body;
      
      // For prototype, if userId is missing, we'll try to find the first user or create a default one
      let targetUserId = userId;
      if (!targetUserId) {
        let firstUser = await db.user.findFirst();
        if (!firstUser) {
          firstUser = await db.user.create({
            data: {
              email: "default@example.com",
              password: "password",
              name: "Default User"
            }
          });
        }
        targetUserId = firstUser.id;
      }

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
          userId: targetUserId
        }
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
      const { profileId } = req.query;
      const where = profileId ? { profileId: String(profileId) } : {};
      const reports = await db.report.findMany({
        where,
        include: { profile: true }
      });
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      console.log("POST /api/reports", req.body);
      const { title, date, type, result, status, profileId, doctorId } = req.body;
      
      let targetProfileId = profileId;
      if (!targetProfileId) {
        const firstProfile = await db.profile.findFirst();
        if (firstProfile) targetProfileId = firstProfile.id;
      }

      if (!targetProfileId) {
        return res.status(400).json({ error: "Profile ID is required" });
      }

      const newReport = await db.report.create({
        data: {
          title,
          date: date || new Date().toISOString(),
          type,
          result,
          status: status || "completed",
          doctorId,
          profileId: targetProfileId
        }
      });
      res.status(201).json(newReport);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
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
