import axios from 'axios';

const API_KEY = process.env.OPENWEATHERMAP_API_KEY || process.env.WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const isConfigured = !!API_KEY;

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  forecast: Array<{
    date: string;
    temp: number;
    description: string;
    precipitation: number;
  }>;
}

interface WeatherAlert {
  type: string;
  severity: string;
  message: string;
}

export class WeatherService {
  async getCurrentWeather(location: string): Promise<WeatherData> {
    if (!isConfigured) {
      // Return mock weather data
      return {
        temperature: 28,
        description: 'partly cloudy',
        humidity: 75,
        windSpeed: 2.5,
        pressure: 1013,
        forecast: [
          { date: new Date().toLocaleDateString(), temp: 28, description: 'partly cloudy', precipitation: 0 },
          { date: new Date(Date.now() + 86400000).toLocaleDateString(), temp: 30, description: 'sunny', precipitation: 0 },
          { date: new Date(Date.now() + 172800000).toLocaleDateString(), temp: 26, description: 'light rain', precipitation: 5 },
          { date: new Date(Date.now() + 259200000).toLocaleDateString(), temp: 27, description: 'cloudy', precipitation: 0 },
          { date: new Date(Date.now() + 345600000).toLocaleDateString(), temp: 29, description: 'sunny', precipitation: 0 }
        ]
      };
    }
    
    try {
      const currentResponse = await axios.get(`${BASE_URL}/weather`, {
        params: {
          q: location,
          appid: API_KEY,
          units: 'metric'
        }
      });

      const forecastResponse = await axios.get(`${BASE_URL}/forecast`, {
        params: {
          q: location,
          appid: API_KEY,
          units: 'metric',
          cnt: 5 // 5 day forecast
        }
      });

      const current = currentResponse.data;
      const forecast = forecastResponse.data.list.map((item: any) => ({
        date: new Date(item.dt * 1000).toLocaleDateString(),
        temp: Math.round(item.main.temp),
        description: item.weather[0].description,
        precipitation: item.rain?.['3h'] || 0,
      }));

      return {
        temperature: Math.round(current.main.temp),
        description: current.weather[0].description,
        humidity: current.main.humidity,
        windSpeed: current.wind.speed,
        pressure: current.main.pressure,
        forecast,
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  async getWeatherAlerts(location: string): Promise<WeatherAlert[]> {
    if (!isConfigured) {
      // Return mock weather alerts
      return [
        {
          type: 'humidity',
          severity: 'medium',
          message: `[MOCK] High humidity detected in ${location}. Monitor for fungal diseases.`
        }
      ];
    }
    
    try {
      const response = await axios.get(`${BASE_URL}/weather`, {
        params: {
          q: location,
          appid: API_KEY,
          units: 'metric'
        }
      });

      const weather = response.data;
      const alerts: WeatherAlert[] = [];

      // Check for extreme weather conditions
      if (weather.main.temp > 35) {
        alerts.push({
          type: 'heat',
          severity: 'high',
          message: `Extreme heat warning: ${weather.main.temp}°C. Protect crops from heat stress.`
        });
      }

      if (weather.main.humidity > 85) {
        alerts.push({
          type: 'humidity',
          severity: 'medium',
          message: `High humidity: ${weather.main.humidity}%. Monitor for fungal diseases.`
        });
      }

      if (weather.wind.speed > 10) {
        alerts.push({
          type: 'wind',
          severity: 'medium',
          message: `Strong winds: ${weather.wind.speed} m/s. Secure tall crops and structures.`
        });
      }

      // Check for rain in forecast
      const forecastResponse = await axios.get(`${BASE_URL}/forecast`, {
        params: {
          q: location,
          appid: API_KEY,
          units: 'metric',
          cnt: 8 // Next 24 hours
        }
      });

      const heavyRain = forecastResponse.data.list.some((item: any) => 
        item.rain && item.rain['3h'] > 10
      );

      if (heavyRain) {
        alerts.push({
          type: 'rain',
          severity: 'high',
          message: 'Heavy rain expected in next 24 hours. Prepare drainage and protect crops.'
        });
      }

      return alerts;
    } catch (error) {
      console.error('Weather alerts error:', error);
      return [];
    }
  }

  formatWeatherForWhatsApp(weatherData: WeatherData, crop: string): string {
    const { temperature, description, humidity, forecast } = weatherData;
    
    let message = `🌤️ Weather for ${crop} farming:\n\n`;
    message += `Current: ${temperature}°C, ${description}\n`;
    message += `Humidity: ${humidity}%\n\n`;
    message += `📅 5-day forecast:\n`;
    
    forecast.forEach(day => {
      message += `${day.date}: ${day.temp}°C, ${day.description}\n`;
    });

    return message;
  }
}

export const weatherService = new WeatherService();
