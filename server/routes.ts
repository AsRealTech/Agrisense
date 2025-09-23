import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { whatsappService } from "./services/whatsapp";
import { openaiService } from "./services/openai";
import { weatherService } from "./services/weather";
import { insertFarmerSchema, insertQuerySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // WhatsApp webhook endpoint
  app.post("/api/whatsapp/webhook", async (req, res) => {
  console.log("📩 Incoming Twilio message:", req.body);

  try {
    const { From, Body } = req.body;

    if (!From || !Body) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const phone = From.startsWith("whatsapp:") ? From : `whatsapp:${From}`;

    console.log("FROM (sandbox):", process.env.TWILIO_WHATSAPP_NUMBER);
    console.log("TO (user):", phone);

    const response = `You said: ${Body}`;
    await whatsappService.sendMessage(phone, response);

    res.status(200).json({ message: "Echo sent successfully" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});






  

  // Dashboard API endpoints
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/crop-stats", async (req, res) => {
    try {
      const cropStats = await storage.getCropStats();
      res.json(cropStats);
    } catch (error) {
      console.error('Crop stats error:', error);
      res.status(500).json({ error: "Failed to fetch crop stats" });
    }
  });

  app.get("/api/dashboard/recent-activity", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await storage.getRecentActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error('Recent activity error:', error);
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  });

  app.get("/api/dashboard/weather-alerts", async (req, res) => {
    try {
      const alerts = await storage.getActiveWeatherAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Weather alerts error:', error);
      res.status(500).json({ error: "Failed to fetch weather alerts" });
    }
  });

  app.get("/api/queries", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const queryType = req.query.type as string;
      
      let queries;
      if (queryType && queryType !== 'all') {
        const filteredQueries = await storage.getQueriesByType(queryType);
        queries = filteredQueries.slice(offset, offset + limit);
        
        // Add farmer data manually for filtered queries
        const queriesWithFarmers = [];
        for (const query of queries) {
          const farmer = await storage.getFarmer(query.farmerId);
          if (farmer) {
            queriesWithFarmers.push({ ...query, farmer });
          }
        }
        queries = queriesWithFarmers;
      } else {
        queries = await storage.getQueriesWithFarmers(limit, offset);
      }
      
      res.json(queries);
    } catch (error) {
      console.error('Queries fetch error:', error);
      res.status(500).json({ error: "Failed to fetch queries" });
    }
  });

  app.get("/api/farmers", async (req, res) => {
    try {
      const farmers = await storage.getAllFarmers();
      res.json(farmers);
    } catch (error) {
      console.error('Farmers fetch error:', error);
      res.status(500).json({ error: "Failed to fetch farmers" });
    }
  });

  // Manual alert creation endpoint
  app.post("/api/weather-alerts", async (req, res) => {
    try {
      const alertData = req.body;
      const alert = await storage.createWeatherAlert(alertData);
      res.status(201).json(alert);
    } catch (error) {
      console.error('Create alert error:', error);
      res.status(500).json({ error: "Failed to create weather alert" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
