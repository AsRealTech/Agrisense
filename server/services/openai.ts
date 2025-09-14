import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
const isConfigured = !!apiKey;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export class OpenAIService {
  async getCropPlantingAdvice(crop: string, location?: string): Promise<string> {
    if (!isConfigured) {
      return `[MOCK] Planting advice for ${crop}${location ? ` in ${location}` : ''}: Plant during the appropriate season, ensure proper soil preparation, and maintain adequate spacing. For ${crop}, plant in well-drained soil with good sun exposure.`;
    }
    
    try {
      const prompt = `Provide comprehensive planting advice for ${crop}${location ? ` in ${location}` : ''}. Include:
      - Best planting season and timing
      - Soil preparation requirements
      - Spacing and depth guidelines
      - Essential care tips
      - Common challenges to avoid
      
      Keep the response practical and under 200 words for WhatsApp.`;

      const response = await openai!.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert agricultural advisor providing practical farming guidance to Filipino farmers. Be concise, specific, and actionable."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
      });

      return response.choices[0].message.content || "Unable to provide planting advice at this time.";
    } catch (error) {
      console.error('OpenAI planting advice error:', error);
      throw new Error('Failed to get planting advice');
    }
  }

  async getPestIdentification(description: string, crop?: string): Promise<string> {
    if (!isConfigured) {
      return `[MOCK] Pest identification for "${description}"${crop ? ` on ${crop}` : ''}: Based on your description, this appears to be a common plant issue. Consider applying organic pest control methods and monitor the affected areas closely.`;
    }
    
    try {
      const prompt = `Based on this description: "${description}"${crop ? ` affecting ${crop}` : ''}, identify the likely pest or disease and provide:
      - Most probable pest/disease identification
      - Immediate treatment recommendations
      - Prevention measures
      - When to seek professional help
      
      Keep response practical and under 200 words for WhatsApp.`;

      const response = await openai!.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a plant pathology expert helping Filipino farmers identify and treat crop pests and diseases. Provide practical, actionable advice."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
      });

      return response.choices[0].message.content || "Unable to identify pest at this time.";
    } catch (error) {
      console.error('OpenAI pest identification error:', error);
      throw new Error('Failed to identify pest');
    }
  }

  async generateWeatherAdvice(weatherData: any, crop: string): Promise<string> {
    if (!isConfigured) {
      return `[MOCK] Weather advice for ${crop}: Based on current conditions, monitor your crops closely and adjust watering as needed. Protect from extreme weather when necessary.`;
    }
    
    try {
      const prompt = `Based on this weather forecast: ${JSON.stringify(weatherData)} for ${crop} crops, provide:
      - Weather impact assessment
      - Immediate action recommendations
      - Protective measures if needed
      - Timing adjustments for farming activities
      
      Keep response practical and under 150 words for WhatsApp.`;

      const response = await openai!.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an agricultural meteorologist helping Filipino farmers adapt to weather conditions. Provide actionable weather-based farming advice."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 250,
      });

      return response.choices[0].message.content || "Weather advice unavailable at this time.";
    } catch (error) {
      console.error('OpenAI weather advice error:', error);
      throw new Error('Failed to generate weather advice');
    }
  }
}

export const openaiService = new OpenAIService();
