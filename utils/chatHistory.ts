import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  pdfId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatHistory {
  [pdfId: string]: ChatMessage[];
}

const CHAT_DB_PATH = path.join(process.cwd(), 'data', 'chat_history.json');

export function ensureChatHistoryExists() {
  const dir = path.dirname(CHAT_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(CHAT_DB_PATH)) {
    fs.writeFileSync(CHAT_DB_PATH, '{}', 'utf-8');
  }
}

export function getChatHistory(pdfId: string): ChatMessage[] {
  ensureChatHistoryExists();
  const content = fs.readFileSync(CHAT_DB_PATH, 'utf-8');
  const history: ChatHistory = content ? JSON.parse(content) : {};
  return history[pdfId] || [];
}

export function saveChatMessage(message: ChatMessage): void {
  ensureChatHistoryExists();
  const content = fs.readFileSync(CHAT_DB_PATH, 'utf-8');
  const history: ChatHistory = content ? JSON.parse(content) : {};
  
  if (!history[message.pdfId]) {
    history[message.pdfId] = [];
  }
  
  history[message.pdfId].push(message);
  fs.writeFileSync(CHAT_DB_PATH, JSON.stringify(history, null, 2));
} 