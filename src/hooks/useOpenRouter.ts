'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ModelDefinition } from '@/config/models';
import OpenAI from 'openai';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const LOCAL_STORAGE_KEY = 'openrouter_api_key';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  modelId?: string;
};

type ModelResponsePayload = {
  text: string;
};

export function useOpenRouter() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModelsState, setAvailableModelsState] = useState<ModelDefinition[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(true);

  // Load API key from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedKey) {
        setApiKey(savedKey);
      }
    }
  }, []);

  // Fetch available models from the backend API
  useEffect(() => {
    setIsFetchingModels(true);
    fetch('/api/models')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch models');
        }
        return res.json();
      })
      .then((data: ModelDefinition[]) => {
        setAvailableModelsState(data);
        setError(null); // Clear previous errors if fetch succeeds
      })
      .catch(err => {
        console.error("Failed to fetch models:", err);
        setError('Could not load available AI models. Please try refreshing the page.');
        setAvailableModelsState([]); // Ensure models array is empty on error
      })
      .finally(() => {
        setIsFetchingModels(false);
      });
  }, []); // Fetch only once on mount

  // Save API key to localStorage
  const saveApiKey = useCallback((key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, key);
      setApiKey(key);
      setError(null);
    }
  }, []);

  // Clear API key from localStorage
  const clearApiKey = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setApiKey(null);
    }
  }, []);

  // Send message to OpenRouter API
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || isFetchingModels || !apiKey || availableModelsState.length === 0) return;

    try {
      setIsLoading(true);
      setError(null);

      // Add user message to the chat
      const userMessage: Message = { role: 'user', content };
      setMessages(prevMessages => [...prevMessages, userMessage]);

      // Prepare API request
      const apiMessages = [...messages, userMessage].map(({ role, content }) => ({ role, content }));

      // Initialize OpenAI client with OpenRouter base URL
      const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: OPENROUTER_API_URL,
        dangerouslyAllowBrowser:true,
        defaultHeaders: {
          'HTTP-Referer': window.location.origin,
          'X-Title': 'GroupThink Open Mode',
        },
      });

      // Make parallel requests to all models
      const responses = await Promise.all(
        availableModelsState.map(async (model) => {
          try {
            const completion = await openai.chat.completions.create({
              model: model.id,
              messages: apiMessages,
            
              temperature: 0.7,
              max_tokens: 1000,
            });

            return {
              modelId: model.id,
              content: completion.choices[0]?.message?.content || '',
            };
          } catch (error) {
            console.error(`Error with model ${model.id}:`, error);
            return null;
          }
        })
      );

      // Add model responses to the chat
      const validResponses = responses.filter(Boolean) as { modelId: string; content: string }[];
      
      const newAssistantMessages: Message[] = validResponses.map(response => ({
        role: 'assistant',
        content: response.content,
        modelId: response.modelId,
      }));

      setMessages(prevMessages => [...prevMessages, ...newAssistantMessages]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while sending your message');
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, isFetchingModels, apiKey, availableModelsState]);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    apiKey,
    saveApiKey,
    clearApiKey,
    messages,
    isLoading: isLoading || isFetchingModels,
    error,
    sendMessage,
    clearChat,
    availableModels: availableModelsState,
  };
} 