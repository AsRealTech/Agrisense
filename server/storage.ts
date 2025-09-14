import { type Farmer, type InsertFarmer, type Query, type InsertQuery, type QueryWithFarmer, type WeatherAlert, type InsertWeatherAlert, type DashboardStats, type CropStats, type RecentActivity, farmers, queries, weatherAlerts } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";

export interface IStorage {
  // Farmer operations
  getFarmer(id: string): Promise<Farmer | undefined>;
  getFarmerByPhone(phone: string): Promise<Farmer | undefined>;
  createFarmer(farmer: InsertFarmer): Promise<Farmer>;
  getAllFarmers(): Promise<Farmer[]>;
  
  // Query operations
  getQuery(id: string): Promise<Query | undefined>;
  createQuery(query: InsertQuery): Promise<Query>;
  updateQuery(id: string, updates: Partial<Query>): Promise<Query | undefined>;
  getQueriesByFarmer(farmerId: string): Promise<Query[]>;
  getQueriesWithFarmers(limit?: number, offset?: number): Promise<QueryWithFarmer[]>;
  getQueriesByType(queryType: string): Promise<Query[]>;
  getQueriesByDateRange(startDate: Date, endDate: Date): Promise<Query[]>;
  
  // Weather alert operations
  getWeatherAlert(id: string): Promise<WeatherAlert | undefined>;
  createWeatherAlert(alert: InsertWeatherAlert): Promise<WeatherAlert>;
  getActiveWeatherAlerts(): Promise<WeatherAlert[]>;
  updateWeatherAlert(id: string, updates: Partial<WeatherAlert>): Promise<WeatherAlert | undefined>;
  
  // Dashboard analytics
  getDashboardStats(): Promise<DashboardStats>;
  getCropStats(): Promise<CropStats[]>;
  getRecentActivity(limit?: number): Promise<RecentActivity[]>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Database storage - no need for in-memory maps
  }

  // Farmer operations
  async getFarmer(id: string): Promise<Farmer | undefined> {
    const [farmer] = await db.select().from(farmers).where(eq(farmers.id, id));
    return farmer || undefined;
  }

  async getFarmerByPhone(phone: string): Promise<Farmer | undefined> {
    const [farmer] = await db.select().from(farmers).where(eq(farmers.phone, phone));
    return farmer || undefined;
  }

  async createFarmer(insertFarmer: InsertFarmer): Promise<Farmer> {
    const [farmer] = await db.insert(farmers).values(insertFarmer).returning();
    return farmer;
  }

  async getAllFarmers(): Promise<Farmer[]> {
    return await db.select().from(farmers);
  }

  // Query operations
  async getQuery(id: string): Promise<Query | undefined> {
    const [query] = await db.select().from(queries).where(eq(queries.id, id));
    return query || undefined;
  }

  async createQuery(insertQuery: InsertQuery): Promise<Query> {
    const [query] = await db.insert(queries).values(insertQuery).returning();
    return query;
  }

  async updateQuery(id: string, updates: Partial<Query>): Promise<Query | undefined> {
    const [updatedQuery] = await db.update(queries).set(updates).where(eq(queries.id, id)).returning();
    return updatedQuery || undefined;
  }

  async getQueriesByFarmer(farmerId: string): Promise<Query[]> {
    return await db.select().from(queries).where(eq(queries.farmerId, farmerId));
  }

  async getQueriesWithFarmers(limit = 50, offset = 0): Promise<QueryWithFarmer[]> {
    const result = await db
      .select({
        id: queries.id,
        farmerId: queries.farmerId,
        queryType: queries.queryType,
        crop: queries.crop,
        message: queries.message,
        response: queries.response,
        status: queries.status,
        metadata: queries.metadata,
        timestamp: queries.timestamp,
        farmer: {
          id: farmers.id,
          name: farmers.name,
          phone: farmers.phone,
          location: farmers.location,
          createdAt: farmers.createdAt
        }
      })
      .from(queries)
      .innerJoin(farmers, eq(queries.farmerId, farmers.id))
      .orderBy(desc(queries.timestamp))
      .limit(limit)
      .offset(offset);
    
    return result.map(row => ({
      ...row,
      farmer: row.farmer
    }));
  }

  async getQueriesByType(queryType: string): Promise<Query[]> {
    return await db.select().from(queries).where(eq(queries.queryType, queryType));
  }

  async getQueriesByDateRange(startDate: Date, endDate: Date): Promise<Query[]> {
    return await db.select().from(queries).where(
      and(
        gte(queries.timestamp, startDate),
        lte(queries.timestamp, endDate)
      )
    );
  }

  // Weather alert operations
  async getWeatherAlert(id: string): Promise<WeatherAlert | undefined> {
    const [alert] = await db.select().from(weatherAlerts).where(eq(weatherAlerts.id, id));
    return alert || undefined;
  }

  async createWeatherAlert(insertAlert: InsertWeatherAlert): Promise<WeatherAlert> {
    const [alert] = await db.insert(weatherAlerts).values(insertAlert).returning();
    return alert;
  }

  async getActiveWeatherAlerts(): Promise<WeatherAlert[]> {
    return await db.select().from(weatherAlerts).where(eq(weatherAlerts.isActive, "true"));
  }

  async updateWeatherAlert(id: string, updates: Partial<WeatherAlert>): Promise<WeatherAlert | undefined> {
    const [updatedAlert] = await db.update(weatherAlerts).set(updates).where(eq(weatherAlerts.id, id)).returning();
    return updatedAlert || undefined;
  }

  // Dashboard analytics
  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalFarmersResult] = await db.select({ count: count() }).from(farmers);
    const [dailyQueriesResult] = await db.select({ count: count() }).from(queries).where(
      and(
        gte(queries.timestamp, today),
        lte(queries.timestamp, tomorrow)
      )
    );
    const [pestQueriesResult] = await db.select({ count: count() }).from(queries).where(eq(queries.queryType, "pest"));
    const [activeAlertsResult] = await db.select({ count: count() }).from(weatherAlerts).where(eq(weatherAlerts.isActive, "true"));

    return {
      totalFarmers: totalFarmersResult.count || 0,
      dailyQueries: dailyQueriesResult.count || 0,
      activeAlerts: activeAlertsResult.count || 0,
      pestDetections: pestQueriesResult.count || 0,
    };
  }

  async getCropStats(): Promise<CropStats[]> {
    const cropCounts = await db
      .select({
        crop: queries.crop,
        count: count()
      })
      .from(queries)
      .where(sql`${queries.crop} IS NOT NULL`)
      .groupBy(queries.crop)
      .orderBy(desc(count()))
      .limit(10);

    const [totalResult] = await db.select({ total: count() }).from(queries);
    const totalQueries = totalResult.total || 0;

    return cropCounts.map(row => ({
      crop: row.crop || 'Unknown',
      queries: row.count,
      percentage: totalQueries > 0 ? (row.count / totalQueries) * 100 : 0,
    }));
  }

  async getRecentActivity(limit = 10): Promise<RecentActivity[]> {
    const result = await db
      .select({
        id: queries.id,
        queryType: queries.queryType,
        crop: queries.crop,
        timestamp: queries.timestamp,
        farmerName: farmers.name
      })
      .from(queries)
      .innerJoin(farmers, eq(queries.farmerId, farmers.id))
      .orderBy(desc(queries.timestamp))
      .limit(limit);

    return result.map(row => {
      const timeDiff = Date.now() - new Date(row.timestamp!).getTime();
      const minutes = Math.floor(timeDiff / 60000);
      const timeAgo = minutes < 1 ? "just now" : minutes < 60 ? `${minutes} minutes ago` : `${Math.floor(minutes / 60)} hours ago`;

      return {
        id: row.id,
        farmer: row.farmerName,
        queryType: row.queryType,
        crop: row.crop || "N/A",
        time: timeAgo,
      };
    });
  }
}

export const storage = new DatabaseStorage();
