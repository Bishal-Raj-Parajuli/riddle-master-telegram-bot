import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import "dotenv/config";
import {eq, lt } from "drizzle-orm/expressions";
import { chatDetail, messageHistory } from "../drizzle/schema";
import * as schema from "../drizzle/schema";

export class DatabaseService {
  public db;
  constructor() {
    const db = new Database(process.env.DB_FILE_NAME);
    this.db = drizzle(db, { schema });
  }

  async insertMessage(
    chatId: number,
    { role, message }: { role: string; message: string }
  ) {
    try {
      const existingChat = await this.db
        .select()
        .from(chatDetail)
        .where(eq(chatDetail.chatId, chatId))
        .get();

      let chatDetailId: number;

      if (!existingChat) {
        const result = await this.db
          .insert(chatDetail)
          .values({ chatId: chatId })
          .returning(); // Get the inserted ID
        chatDetailId = result[0].id;
      } else {
        chatDetailId = existingChat.id;
      }

      // Insert message with correct foreign key
      await this.db.insert(messageHistory).values({
        role: role,
        message: message,
        chatId: chatDetailId, // Use the actual ID from chatDetail
      });
    } catch (error) {
      console.log(error);
      throw error; // Re-throw the error for proper error handling
    }
  }

  async selectMessage(chatId: number) {
    try {
      const existingChat = this.db
        .select()
        .from(chatDetail)
        .where(eq(chatDetail.chatId, chatId))
        .get();
      if (existingChat) {
        const existingMessage = await this.db
          .select()
          .from(messageHistory)
          .where(eq(messageHistory.chatId, existingChat.id));

        this.clearHistory();

        const result = existingMessage.map((data) => ({
          role: data.role,
          parts: [
            {
              text: data.message,
            },
          ],
        }));
        return result;
      }
      return;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async clearHistory() {
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const cutoffDate = twoDaysAgo.toISOString();

      // Delete messages older than 2 days for the given chatId
      const result = await this.db
        .delete(messageHistory)
        .where(lt(messageHistory.createdAt, cutoffDate));
    } catch (error) {
      throw error;
    }
  }
}
