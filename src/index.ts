import "dotenv/config";
import { TelegramService } from "./service/TelegramService";

const geminiApiKey = process.env.GEMINI_API_KEY ?? "";
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
const dbFileName = process.env.DB_FILE_NAME ?? "";

if (geminiApiKey === "") {
  console.log("Please provide API KEY of Gemini ...");
  process.exit();
}

if (telegramBotToken === "") {
  console.log("Please provide Telegram BOT Token ...");
  process.exit();
}

if (dbFileName === "") {
  console.log("Please provide DB File Name ...");
  process.exit();
}

async function main() {
  new TelegramService(telegramBotToken);
}

main();
