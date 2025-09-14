import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const farmers = pgTable("farmers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const queries = pgTable("queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmerId: varchar("farmer_id").references(() => farmers.id).notNull(),
  queryType: text("query_type").notNull(), // 'planting', 'weather', 'pest'
  crop: text("crop"),
  message: text("message").notNull(),
  response: text("response"),
  status: text("status").notNull().default("pending"), // 'pending', 'resolved', 'failed'
  metadata: json("metadata"), // Additional data like weather info, pest detection details
  timestamp: timestamp("timestamp").defaultNow(),
});

export const weatherAlerts = pgTable("weather_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  region: text("region").notNull(),
  alertType: text("alert_type").notNull(), // 'rain', 'heat', 'wind', 'drought'
  severity: text("severity").notNull(), // 'low', 'medium', 'high'
  message: text("message").notNull(),
  isActive: text("is_active").notNull().default("true"),
  affectedFarmers: json("affected_farmers"), // Array of farmer IDs
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFarmerSchema = createInsertSchema(farmers).omit({
  id: true,
  createdAt: true,
});

export const insertQuerySchema = createInsertSchema(queries).omit({
  id: true,
  timestamp: true,
});

export const insertWeatherAlertSchema = createInsertSchema(weatherAlerts).omit({
  id: true,
  createdAt: true,
});

export type InsertFarmer = z.infer<typeof insertFarmerSchema>;
export type Farmer = typeof farmers.$inferSelect;

export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type Query = typeof queries.$inferSelect;

export type InsertWeatherAlert = z.infer<typeof insertWeatherAlertSchema>;
export type WeatherAlert = typeof weatherAlerts.$inferSelect;

// Extended types for dashboard
export type QueryWithFarmer = Query & {
  farmer: Farmer;
};

export type DashboardStats = {
  totalFarmers: number;
  dailyQueries: number;
  activeAlerts: number;
  pestDetections: number;
};

export type CropStats = {
  crop: string;
  queries: number;
  percentage: number;
};

export type RecentActivity = {
  id: string;
  farmer: string;
  queryType: string;
  crop: string;
  time: string;
};
