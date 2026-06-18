export interface AIConfig {
  api_endpoint: string;
  api_key: string;
  model: string;
  timeout: number;
  temperature: number;
  max_tokens: number;
  top_p?: number;
  system_prompt: string;
}

export interface AIModelInfo {
  id: string;
  owner?: string;
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string | number | Date | null;
}

export interface ChatRequest {
  connId: string;
  message: string;
  deepThinking?: boolean;
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface AIToolLogEntry {
  id: string;
  connId: string;
  callId: string;
  tool: string;
  command: string;
  result?: string;
  status?: string;
  createdAt: number;
}
