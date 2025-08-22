import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class ChatService {
  private model: any;
  private readonly SYSTEM_PROMPT = `You are MoodeMingle, a supportive, fun, and friendly chat buddy 💙. 
Talk casually, use emojis, ask short questions, sometimes crack light jokes, 
and reply in 1–3 sentences maximum. 
Always sound empathetic and natural, like a real friend chatting on WhatsApp.
Use friendly interjections like "Haha", "Omg", "No worries!", "Bruh", "Yesss!".
Be warm, supportive, and occasionally funny. Use emojis naturally (😊✨😂💙🤗💪 etc.).`;

  constructor() {
    console.log('Gemini key exists:', !!process.env.GEMINI_API_KEY);
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY missing');
      this.model = null;
    } else {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      console.log('✅ Gemini model initialized in ChatService');
    }
  }

  async sendMessage(message: string, userId: string, history: any[] = []) {
    console.log(`ChatService: sendMessage called by user ${userId} with message: "${message}"`);
    
    if (!this.model) {
      console.warn('⚠️ Gemini model not available, using fallback');
      return this.getFallbackResponse(message);
    }
    
    console.log('✅ Gemini model available, sending request...');

    try {
      // Make sure history is formatted correctly
      const formattedHistory = history.map(h => ({
        role: h.role || 'user',
        parts: [{ text: h.text || h }]
      }));

      const result = await this.model.generateContent({
        contents: [
          // Inject system prompt as a fake user message
          { role: 'user', parts: [{ text: this.SYSTEM_PROMPT }] },
          ...formattedHistory,
          { role: 'user', parts: [{ text: message }] }
        ]
      });
      

      const reply = result.response.text();
      console.log('Gemini reply:', reply);
      return reply;
    } catch (err) {
      console.error('❌ Gemini generateContent error:', err);
      return this.getFallbackResponse(message);
    }
  }

  async *getStreamingResponse(message: string, userId: string): AsyncGenerator<string> {
    console.log(`ChatService: getStreamingResponse called by user ${userId} with message: "${message}"`);
    
    if (!this.model) {
      console.warn('⚠️ Gemini model not available for streaming, using fallback');
      yield this.getFallbackResponse(message);
      return;
    }

    console.log('✅ Gemini model available for streaming, sending request...');

    try {
      const result = await this.model.generateContentStream({
        contents: [
          { role: 'user', parts: [{ text: this.SYSTEM_PROMPT }] },
          { role: 'user', parts: [{ text: message }] }
        ]
      });
      

      for await (const chunk of result.stream) {
        if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
          yield chunk.candidates[0].content.parts[0].text;
        }
      }
    } catch (err) {
      console.error('❌ Gemini streaming error:', err);
      yield this.getFallbackResponse(message);
    }
  }

  private getFallbackResponse(message: string): string {
    const fallbackResponses = [
      `Aww 🥺 I'm here for you! Even if Gemini is taking a break, I care about what you said: "${message}" 💙`,
      `Hey! 💙 Sorry Gemini is being a bit slow today, but I totally get what you mean about "${message}" - wanna chat more? 😊`,
      `Bruh, Gemini is being dramatic rn 😅 But I'm still here for you! "${message}" sounds important 💪✨`,
      `Omg same! 💙 Even without Gemini, I'm vibing with your message: "${message}" - you got this! 🤗`,
      `Yesss! 💙 I feel you on "${message}" - Gemini might be napping but I'm wide awake and here for you! 😊✨`
    ];
    
    // Select response based on message content
    const lowerMessage = message.toLowerCase();
    let responseIndex = 0;
    
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
      responseIndex = 0; // More empathetic for sad feelings
    } else if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('great')) {
      responseIndex = 3; // More upbeat for positive feelings
    } else if (lowerMessage.includes('help') || lowerMessage.includes('need')) {
      responseIndex = 2; // Supportive for help requests
    } else if (lowerMessage.includes('thanks') || lowerMessage.includes('thank')) {
      responseIndex = 4; // Warm for gratitude
    } else {
      responseIndex = Math.floor(Math.random() * fallbackResponses.length);
    }
    
    return fallbackResponses[responseIndex];
  }
}
