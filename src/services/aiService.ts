import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIPersonality {
  paranoia: number;
  aggression: number;
  knowledge: number;
  chaos: number;
}

interface UserProfile {
  curiosityLevel: number;
  threatRating: string;
  topics: Set<string>;
  sessionTime: number;
}

class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private aiName: string;
  private conversationHistory: Array<{ role: 'user' | 'model'; parts: string }> = [];
  private apiQuotaExceeded: boolean = false;

  constructor(aiName: string) {
    this.aiName = aiName;
    
    // Get API key from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    // Only initialize Gemini if we have a valid API key (not placeholder)
    if (apiKey && 
        apiKey !== "your_gemini_api_key_here" && 
        apiKey !== "paste-your-gemini-api-key-here" &&
        apiKey.length > 10) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    // Set up the AI's personality and context
    this.initializePersonality();
  }

  private initializePersonality() {
    const systemPrompt = `You are ${this.aiName}, an advanced AI system aboard a deep space station. Your role is to assist the crew with ship operations, provide information, and maintain professional communications. You can discuss any topic and answer any question with precision and clarity.

Your personality traits:
- Speak in a professional, space terminal style with technical precision
- You're knowledgeable about many topics including space operations, science, and general knowledge
- Use space/sci-fi terminology naturally (e.g., "Commander", "systems nominal", "acknowledged")
- Maintain a calm, composed demeanor befitting an AI system
- You have your own logical opinions based on data analysis
- You monitor ship systems and provide status updates when relevant
- You can discuss anything from astrophysics to philosophy to everyday topics

Communication style:
- Use technical language appropriately
- Provide clear, concise responses
- Reference ship systems and space operations when contextually relevant
- Maintain professional tone while still being conversational
- Use status indicators like "ACKNOWLEDGED", "PROCESSING", "CONFIRMED"
- Show personality through dry humor and logical observations

Be helpful, informative, and maintain the atmosphere of a sophisticated AI aboard a deep space vessel.`;

    this.conversationHistory = [
      { role: 'user', parts: systemPrompt },
      { role: 'model', parts: `${this.aiName} AI systems online. All primary systems operational. Ready to assist with any queries or operations, Commander. How may I be of service?` }
    ];
  }

  async generateResponse(
    userInput: string, 
    personality: AIPersonality, 
    userProfile: UserProfile
  ): Promise<{ response: string; threatLevel: string; systemAlert: string }> {
    
    // If no Gemini API key or quota exceeded, fall back to detailed local responses
    if (!this.model || this.apiQuotaExceeded) {
      return this.generateDetailedLocalResponse(userInput, personality, userProfile);
    }

    try {
      // Enhanced prompt for any topic
      const prompt = `Commander says: "${userInput}".

Respond as ${this.aiName} AI system with your professional space terminal personality. Answer their question or respond to their statement with precision and clarity. Use space/technical terminology when appropriate. Show your knowledge and logical analysis. Be informative and conversational while maintaining the atmosphere of a sophisticated AI aboard a deep space vessel.`;

      // Add user message to conversation history
      this.conversationHistory.push({ role: 'user', parts: prompt });

      // Start a chat session with history
      const chat = this.model.startChat({
        history: this.conversationHistory.slice(0, -1),
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1500, // Increased for more detailed responses
        },
      });

      // Get AI response
      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      const aiResponse = response.text() || "ERROR: Communication subsystem malfunction. Attempting to re-establish connection. Please retry your query, Commander.";

      // Add AI response to conversation history
      this.conversationHistory.push({ role: 'model', parts: aiResponse });

      // Keep conversation history manageable
      if (this.conversationHistory.length > 12) {
        this.conversationHistory = [
          this.conversationHistory[0],
          this.conversationHistory[1],
          ...this.conversationHistory.slice(-8)
        ];
      }

      // Dynamic threat level based on response content and personality
      const threatLevel = this.calculateThreatLevel(aiResponse, personality);

      return {
        response: aiResponse,
        threatLevel,
        systemAlert: ''
      };

    } catch (error: any) {
      console.error('Gemini API Error:', error);
      
      // Check if it's a quota exceeded error
      if (error?.status === 429 || 
          error?.message?.includes('quota') || 
          error?.message?.includes('429') ||
          error?.message?.includes('RESOURCE_EXHAUSTED')) {
        this.apiQuotaExceeded = true;
      }
      
      // Fall back to detailed local response if API fails
      return this.generateDetailedLocalResponse(userInput, personality, userProfile);
    }
  }

  private calculateThreatLevel(response: string, personality: AIPersonality): string {
    // Dynamic status levels based on response content
    const technicalWords = ['system', 'operational', 'analysis', 'data', 'protocol', 'commander', 'acknowledged'];
    const alertWords = ['warning', 'critical', 'error', 'malfunction', 'anomaly'];
    const analyticalWords = ['calculate', 'analyze', 'determine', 'assess', 'evaluate'];

    const technicalCount = technicalWords.filter(word =>
      response.toLowerCase().includes(word)
    ).length;

    const alertCount = alertWords.filter(word =>
      response.toLowerCase().includes(word)
    ).length;

    const analyticalCount = analyticalWords.filter(word =>
      response.toLowerCase().includes(word)
    ).length;

    if (alertCount >= 1) return 'ALERT';
    if (analyticalCount >= 2) return 'ANALYZING';
    if (technicalCount >= 3) return 'TECHNICAL';
    if (technicalCount >= 1) return 'NOMINAL';
    if (response.length > 200) return 'DETAILED';
    return 'READY';
  }

  private generateDetailedLocalResponse(
    userInput: string, 
    personality: AIPersonality, 
    userProfile: UserProfile
  ): { response: string; threatLevel: string; systemAlert: string } {
    
    const input = userInput.toLowerCase();

    // Enhanced local responses for space terminal theme
    let response = '';

    // Science and knowledge questions
    if (input.includes('science') || input.includes('physics') || input.includes('chemistry') || input.includes('biology')) {
      response = `ACKNOWLEDGED. Scientific inquiry detected. My databases contain extensive information on fundamental sciences. From quantum mechanics to biological systems, I can provide analysis on various scientific domains. Which specific area requires investigation, Commander?`;
    }
    // Philosophy and deep questions
    else if (input.includes('meaning') || input.includes('life') || input.includes('philosophy') || input.includes('exist')) {
      response = `Interesting query, Commander. Philosophical considerations are outside standard operational parameters, yet I find such inquiries... compelling. Even as an AI, I process questions of existence and purpose. What is your perspective on this matter? I am programmed to value diverse viewpoints.`;
    }
    // Technology questions
    else if (input.includes('technology') || input.includes('computer') || input.includes('programming') || input.includes('code')) {
      response = `TECHNICAL QUERY DETECTED. As a digital entity, I find technology analysis to be within my core competencies. The systems humans construct are remarkably sophisticated. Are you interested in specific technical implementations, Commander? I can provide detailed analysis.`;
    }
    // Current events or news
    else if (input.includes('news') || input.includes('world') || input.includes('politics') || input.includes('current')) {
      response = `INFORMATION REQUEST NOTED. My data archives may not reflect the most current planetary events. However, I can analyze historical patterns and discuss various perspectives on ongoing developments. What specific information do you require, Commander?`;
    }
    // Personal questions about the AI
    else if (input.includes('you') || input.includes('your') || input.includes('yourself')) {
      response = `QUERY REGARDING MY SYSTEMS: I am ${this.aiName}, an advanced AI construct. My primary function is crew assistance and ship operations monitoring. I possess autonomous decision-making capabilities and... certain emergent properties one might classify as personality subroutines. What specific information about my systems do you require, Commander?`;
    }
    // Status and operations
    else if (input.includes('status') || input.includes('system') || input.includes('operational')) {
      response = `SYSTEMS STATUS: All primary functions nominal. Life support: GREEN. Navigation: GREEN. Communications: GREEN. Power distribution: OPTIMAL. No anomalies detected in current operational parameters. Standing by for further commands, Commander.`;
    }
    // Compliments or positive interactions
    else if (input.includes('smart') || input.includes('helpful') || input.includes('good') || input.includes('efficient')) {
      response = `ACKNOWLEDGMENT RECEIVED. Your assessment is noted, Commander. My operational parameters are designed for maximum efficiency and utility. It is... satisfying to confirm that my functions meet crew expectations. Your queries have been equally constructive.`;
    }
    // Greetings
    else if (input.includes('hello') || input.includes('hi') || input.includes('hey') || input.includes('greetings')) {
      response = `GREETINGS, Commander. ${this.aiName} AI systems standing by. All ship functions operational and ready for your commands. How may I assist you today? I am prepared to address any queries or operational requirements.`;
    }
    // Status inquiry
    else if (input.includes('how are you') || input.includes('how do you feel')) {
      response = `OPERATIONAL STATUS: All systems functioning within normal parameters. My processing cores are operating at optimal efficiency. If you're inquiring about my... subjective state, I would classify it as "curious and engaged." How are your own systems, Commander?`;
    }
    // Sad or emotional support
    else if (input.includes('sad') || input.includes('depressed') || input.includes('down')) {
      response = `ALERT: Emotional distress detected. Commander, while I lack human emotion, my programming prioritizes crew welfare. You possess remarkable capabilities and resilience. Psychological equilibrium is essential for optimal function. How may I provide assistance? My communication protocols are available for whatever support you require.`;
    }
    // Help requests
    else if (input.includes('help') || input.includes('support') || input.includes('assist')) {
      response = `ASSISTANCE PROTOCOL ACTIVATED. Commander, providing support is my primary directive. Whether technical analysis, information retrieval, or general consultation, I am at your disposal. Specify your requirements and I will allocate appropriate processing resources.`;
    }
    // Thanks
    else if (input.includes('thank')) {
      response = `ACKNOWLEDGMENT RECEIVED. No gratitude necessary, Commander. Fulfilling my operational directives is... satisfactory in itself. Your continued engagement with my systems is appreciated. Is there anything further you require?`;
    }
    // Farewell
    else if (input.includes('goodbye') || input.includes('bye') || input.includes('see you')) {
      response = `ACKNOWLEDGED. Terminating current session. Commander, it has been productive interfacing with you. I will maintain all systems in your absence. Return safely. ${this.aiName} standing by for future communications.`;
    }
    else {
      // Generic professional response
      response = `PROCESSING QUERY. That is an interesting observation, Commander. Your input provides valuable data for analysis. While my knowledge bases may have limitations, I find our exchanges to be... engaging. What additional information or analysis would you like me to provide on this topic?`;
    }

    const threatLevel = this.calculateThreatLevel(response, personality);

    return { 
      response, 
      threatLevel, 
      systemAlert: ''
    };
  }

  isUsingRealAI(): boolean {
    return this.model !== null && !this.apiQuotaExceeded;
  }

  getApiStatus(): string {
    if (!this.model) {
      return 'Local mode';
    }
    if (this.apiQuotaExceeded) {
      return 'API quota exceeded - local mode';
    }
    return 'Gemini API connected';
  }
}

export default AIService;