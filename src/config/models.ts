export interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
  // Add other backend-specific config here if needed in the future
}

// Centralized list of models available in the application
export const availableModels: ModelDefinition[] = [
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7', provider: 'Anthropic' },
  { id: 'openai/chatgpt-4o-latest', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'google/gemini-2.5-pro-preview-03-25', name: 'Gemini Pro 2.5', provider: 'Google' },
  { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3', provider: 'DeepSeek' },
 ]; 