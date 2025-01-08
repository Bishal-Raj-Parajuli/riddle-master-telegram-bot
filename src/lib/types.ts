

export type MessagePart = {
    text: string;
}

export type MessageType = {
    role: 'user' | 'model';
    parts: [MessagePart];  // Keeping your original structure
}

export type ChatHistoryType = {
    [key: number]: MessageType[];
}
