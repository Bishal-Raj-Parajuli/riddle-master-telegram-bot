import TelegramBot from 'node-telegram-bot-api';
import { GeminiService } from './GeminiService';

export class TelegramService {
    private bot: TelegramBot;
    private geminiService;
    private botUsername: string = '';

    constructor(token: string) {
        this.bot = new TelegramBot(token, { polling: true });
        
        this.geminiService = new GeminiService();
        this.init();
        // Get bot info when starting
        this.setupBotInfo();
    }

    private async setupBotInfo() {
        try {
            const me = await this.bot.getMe();
            this.botUsername = me.username || '';
        } catch (error) {
            console.log('Failed to get bot username:', error);
        }
    }

    private init() {
        this.bot.on('message', (msg) => {
            // Check if message is from group or private chat
            if (msg.chat.type === 'private') {
                this.handleIndividualMessage(msg);
            } else if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
                this.handleGroupMessage(msg);
            }
        })
    }

    private async handleGroupMessage(msg: TelegramBot.Message) {
        if (msg.text) {
            const isBotMentioned = this.botUsername && msg.text.includes(`@${this.botUsername}`);
            const isCommand = msg.text.startsWith('/');

            if (isBotMentioned || isCommand) {
                // Remove bot username from message if present
                const cleanMessage = this.botUsername ? 
                    msg.text.replace(`@${this.botUsername}`, '').trim() : 
                    msg.text.trim();

                const resp = await this.geminiService.generateResponse(cleanMessage, msg.chat.id);
                this.sendMessage(resp, msg.chat.id);
            }
        }
    }

    private async handleIndividualMessage(msg: TelegramBot.Message) {
        if (msg.text) {
            const resp = await this.geminiService.generateResponse(msg.text, msg.chat.id);
            this.sendMessage(resp, msg.chat.id)
        }
    }

    private async sendMessage(msg: string, chatId: number) {
        try {
            await this.bot.sendMessage(chatId, msg)
        } catch (error) {
            console.log(error)
        }
    }
}