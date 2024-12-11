import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const HISTORY_PATH = path.join(process.cwd(), 'data/chat_history.json');

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StoredMessage extends ChatMessage {
  id: string;
  pdfId: string;
  timestamp: number;
}

function ensureHistoryFileExists() {
  const dir = path.dirname(HISTORY_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_PATH)) {
    fs.writeFileSync(HISTORY_PATH, '[]', 'utf-8');
  }
}

export function addChatMessage(pdfId: string, message: ChatMessage) {
  ensureHistoryFileExists();
  const storedMessage: StoredMessage = {
    id: uuidv4(),
    pdfId,
    timestamp: Date.now(),
    ...message
  };
  
  const history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
  history.push(storedMessage);
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  return storedMessage;
}

export function getChatHistory(pdfId: string): ChatMessage[] {
  ensureHistoryFileExists();
  try {
    const content = fs.readFileSync(HISTORY_PATH, 'utf-8');
    const history = JSON.parse(content);
    if (!Array.isArray(history)) {
      fs.writeFileSync(HISTORY_PATH, '[]', 'utf-8');
      return [];
    }
    return history
      .filter(msg => msg.pdfId === pdfId)
      .map(({ role, content }) => ({ role, content }));
  } catch (error) {
    console.error('Error reading chat history:', error);
    fs.writeFileSync(HISTORY_PATH, '[]', 'utf-8');
    return [];
  }
} 