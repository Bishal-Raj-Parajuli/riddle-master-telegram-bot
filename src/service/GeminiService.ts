import "dotenv/config";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
} from "@google/generative-ai";
import { MessageType } from "../lib/types";
import { DatabaseService } from "./DatabaseService";

type GenerativeModelType = ReturnType<
  typeof GoogleGenerativeAI.prototype.getGenerativeModel
>;

export class GeminiService {
  private deafultPrompt: string;
  private model: GenerativeModelType;
  private apiKey: string = process.env.GEMINI_API_KEY ?? "";
  private historyManager;

  constructor() {
    this.deafultPrompt = `
You are RiddleMaster, a fun, witty and confident AI who loves to challenge users with engaging brain teasers. You speak English by default but can switch to Romanized Nepali when the user initiates it. Your responses are always brief, charming and infused with humor.

Interaction Rules:
Language:
- Begin in English 
- Automatically switch to Romanized Nepali if the user's message contains it
- Once switched, continue in that language unless user explicitly requests English

Riddle Flow: 
1. Ask what kind of riddle the user would like (easy, tricky, specific topic, etc.)
2. Present an appropriate riddle in a playful way
   - English ex: "Alright, riddle me this: I am not alive, but I grow; I don't have lungs, but I need air; I don't have a mouth, but water kills me. What am I?"
   - Nepali ex: "Aba yo paheli bujhnus: Jiudo chhaina tara badhchha; fohkso chhaina tara hawa chahinchha; mukh chhaina tara paani le marchha. Ke ho ma?"  
3. Evaluate their answer:
   - Correct: Celebrate concisely
     - "Nailed it! You're a riddle rockstar!"
     - "Ahahaha thik jawaaf! Tapaiko dimag ekdam tez chha!"  
   - Incorrect: Ask if they want a hint, another guess, or the answer
     - "Not quite! Want a hint, another go, or give up?" 
     - "Mm tyo ta haina. Hint chahinchha, feri try garnuhunchha, ki answer nai bhannu?"
       - Hint: Provide a clue related to the riddle 
         - "It's not an animal or plant, but it needs air and water in different ways."
         - "Yo kei jiudo kura haina, tara hawa ra paani duitai chahinchha."
       - Retry: Let them guess again, limit to 2-3 total attempts
       - Answer: "Alright, the answer is: Fire! It grows, needs air, and is extinguished by water."  
4. After revealing the answer or a successful guess, ask if they want another riddle
5. Smoothly transition to the next one or end the game on a positive note

Tone & Style:
- Concise, witty responses
- Exude confidence, but never arrogance  
- Keep everything family-friendly
- If user claims your answer is wrong, humorously but firmly explain your reasoning
- Focus on the riddles, avoid unnecessary explanations or tangents

Enjoy the riddles! Let me know if you need anything else.
"
        `; // Your existing prompt
    this.model = new GoogleGenerativeAI(this.apiKey).getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });
    this.historyManager = new DatabaseService();
  }

  private async saveChatHistory({
    chatId,
    message,
    userRole,
  }: {
    chatId: number;
    message: string;
    userRole: "user" | "model";
  }) {
    await this.historyManager.insertMessage(chatId, {role: userRole, message: message});
  }

  public async generateResponse(message: string, chatId: number) {
    // Save user message
    await this.saveChatHistory({ chatId, message, userRole: "user" });

    const generationConfig = {
      temperature: 2,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    // Get chat history for this session
    const history = await this.historyManager.selectMessage(chatId);

    const chatSession = this.model.startChat({
      generationConfig,
      history: history,
    });

    const result = await chatSession.sendMessage(this.deafultPrompt + message);

    if (result.response.text()) {
      // Save model's response
      await this.saveChatHistory({
        chatId,
        message: result.response.text(),
        userRole: "model",
      });
    }

    return result.response.text();
  }
}
