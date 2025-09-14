import Twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

export class WhatsAppService {
  private client: any;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!(accountSid && authToken);
    if (this.isConfigured) {
      this.client = Twilio(accountSid!, authToken!);
    } else {
      console.warn('Twilio credentials not provided - WhatsApp service will run in mock mode');
      this.client = null;
    }
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.isConfigured) {
      console.log(`[MOCK] Would send WhatsApp message to ${to}: ${message}`);
      return;
    }
    
    try {
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      
      await this.client.messages.create({
        from: whatsappNumber,
        to: formattedTo,
        body: message,
      });
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  parseIncomingMessage(body: string): { command: string; crop?: string; description?: string } {
    const text = body.trim().toLowerCase();
    
    // Parse planting command: "planting rice" or "planting [crop]"
    if (text.startsWith('planting ')) {
      const crop = text.replace('planting ', '').trim();
      return { command: 'planting', crop };
    }
    
    // Parse weather command: "weather corn" or "weather [crop]"
    if (text.startsWith('weather ')) {
      const crop = text.replace('weather ', '').trim();
      return { command: 'weather', crop };
    }
    
    // Parse pest command: "pest description" or "pest [description]"
    if (text.startsWith('pest ')) {
      const description = text.replace('pest ', '').trim();
      return { command: 'pest', description };
    }
    
    // Default fallback
    return { command: 'unknown' };
  }

  generateHelpMessage(): string {
    return `🌱 Welcome to AgriSense Lite!

Available commands:
• *planting [crop]* - Get planting advice
• *weather [crop]* - Get weather forecast for your crop
• *pest [description]* - Get pest identification and treatment

Examples:
• planting rice
• weather corn
• pest yellow spots on leaves

Need help? Reply with 'help' anytime!`;
  }
}

export const whatsappService = new WhatsAppService();
