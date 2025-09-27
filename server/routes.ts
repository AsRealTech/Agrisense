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

    // Extract farmer phone
    const phone = From.replace("whatsapp:", "");

    // Find or create farmer
    let farmer = await storage.getFarmerByPhone(phone);
    if (!farmer) {
      farmer = await storage.createFarmer({
        name: `Farmer ${phone.slice(-4)}`,
        phone,
        location: "Philippines", // default
      });
    }

    // Parse incoming message
    const parsed = whatsappService.parseIncomingMessage(Body);
    let response: string;
    let queryType = parsed.command;
    let crop = parsed.crop;

    try {
      switch (parsed.command) {
        case 'planting':
  if (!parsed.crop) {
    response = "Please specify a crop. Example: 'planting rice'";
    break;
  }

  try {
    // Try OpenAI advice first
    response = await openaiService.getCropPlantingAdvice(
      parsed.crop,
      farmer.location || undefined
    );
  } catch (err) {
    console.error("OpenAI planting advice error:", err);

    // 🌱 Fallback response if OpenAI fails
    response = `🌱 Planting guide for ${parsed.crop} (basic fallback):
- Prepare fertile, well-drained soil
- Ensure adequate sunlight & spacing
- Water regularly, avoid waterlogging
- Use local best practices or ask your extension officer for details`;
  }
  break;


        case 'weather':
  if (!parsed.crop) {
    response = "Please specify a crop. Example: 'weather corn'";
    break;
  }

  try {
    const weatherData = await weatherService.getCurrentWeather(
      farmer.location || "Philippines"
    );
    const weatherAdvice = await openaiService.generateWeatherAdvice(
      weatherData,
      parsed.crop
    );

    response =
      weatherService.formatWeatherForWhatsApp(weatherData, parsed.crop) +
      "\n\n📋 Advice:\n" +
      weatherAdvice;
  } catch (err) {
    console.error("Weather/advice service error:", err);

    // Fallback response if API fails
    response =
      `⚠️ Unable to fetch live weather data at the moment.\n` +
      `Here’s some general advice for ${parsed.crop}:\n` +
      `- Ensure proper soil drainage to avoid waterlogging.\n` +
      `- Monitor for common pests after rainfall.\n` +
      `- Water moderately if no rain is expected.\n\n` +
      `🌱 Stay prepared while we work on restoring live updates.`;
  }
  break;


        case "pest":
  if (!parsed.description) {
    response =
      "Please describe the pest issue. Example: 'pest yellow spots on leaves'";
    break;
  }

  try {
    response = await openaiService.getPestIdentification(
      parsed.description,
      parsed.crop
    );
  } catch (err) {
    console.error("Pest advice service error:", err);

    // Fallback response if API fails
    response =
      `⚠️ Unable to process pest identification right now.\n\n` +
      `Here are some general steps you can take:\n` +
      `- Inspect the affected ${parsed.crop || "plants"} closely for insects, larvae, or unusual patterns.\n` +
      `- Remove and safely dispose of heavily infested leaves.\n` +
      `- Avoid overwatering and keep good air circulation.\n` +
      `- If infestation spreads quickly, consider safe organic options like neem oil or soap spray.\n\n` +
      `🌱 We'll provide more specific advice once our pest service is restored.`;
  }

  queryType = "pest";
  break;


        default:
          response = whatsappService.generateHelpMessage();
          queryType = "help";
          break;
      }

      // Save query
      await storage.createQuery({
        farmerId: farmer.id,
        queryType,
        crop: crop || null,
        message: Body,
        response,
        status: "resolved",
        metadata:
          parsed.command !== "help" ? { command: parsed.command } : null,
      });

      // Send response
      await whatsappService.sendMessage(From, response);

      res.status(200).json({ message: "Message processed successfully" });
    } catch (serviceError) {
      console.error("Service error:", serviceError);

      await storage.createQuery({
        farmerId: farmer.id,
        queryType,
        crop: crop || null,
        message: Body,
        response: null,
        status: "failed",
        metadata: {
          error:
            serviceError instanceof Error
              ? serviceError.message
              : "Unknown error",
        },
      });

      const errorResponse =
        "⚠️ Sorry, I'm having trouble processing your request right now. Please try again later.";
      await whatsappService.sendMessage(From, errorResponse);

      res
        .status(200)
        .json({ message: "Error handled, farmer notified" });
    }
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
