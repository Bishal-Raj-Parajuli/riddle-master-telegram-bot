import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";


export const chatDetail = sqliteTable("chatDetail", {
    id: int().primaryKey({autoIncrement: true}),
    chatId: int().notNull().unique(),
    createdAt: text().$defaultFn(() => new Date().toISOString()).notNull()
})

export const messageHistory = sqliteTable("messageHistory", {
    id: int().primaryKey({autoIncrement: true}),
    chatId: int().references(() => chatDetail.id).notNull(),
    role: text().notNull(),
    message: text().notNull(),
    createdAt: text().$defaultFn(() => new Date().toISOString()).notNull()
})

export const chatDetailRelations = relations(chatDetail, ({many}) => ({
    messageHistroy: many(messageHistory)
}))

export const messageHistoryRelations = relations(messageHistory, ({one}) => ({
    chatDetail: one(chatDetail)
}))