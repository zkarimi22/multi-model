'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ModelDefinition } from '@/config/models'; // Import the type

type Message = {
  role: 'user' | 'assistant';
  content: string;
  modelId?: string; // Optional for user messages, required for assistant messages from models
};

type ModelResponsePayload = {
  text: string;
};

type ApiResponse = {
  responses?: Record<string, ModelResponsePayload>;
  error?: string;
  isFirstFreeMessage?: boolean;
};

// REMOVED hardcoded availableModels array

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State to hold models fetched from backend
  const [fetchedModels, setFetchedModels] = useState<ModelDefinition[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(true);

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
        setFetchedModels(data);
        setError(null); // Clear previous errors if fetch succeeds
      })
      .catch(err => {
        console.error("Failed to fetch models:", err);
        setError('Could not load available AI models. Please try refreshing the page.');
        setFetchedModels([]); // Ensure models array is empty on error
      })
      .finally(() => {
        setIsFetchingModels(false);
      });
  }, []); // Fetch only once on mount

  // Send message to API
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || isFetchingModels || fetchedModels.length === 0) return;

    // Determine if streaming should be attempted based on backend logic
    // This simplified logic assumes streaming if only one model is available.
    const potentialModelsCount = fetchedModels.length;
    const useStreaming = potentialModelsCount === 1;

    try {
      setIsLoading(true);
      setError(null);

      // Add user message to the chat
      const userMessage: Message = { role: 'user', content };
      setMessages(prevMessages => [...prevMessages, userMessage]);

      // Prepare API request - NO LONGER sends model list
      const apiMessages = [...messages, userMessage].map(({ role, content }) => ({ role, content }));

      if (useStreaming) {
        // For streaming, add a placeholder assistant message first.
        // We need to know WHICH model the backend will use for streaming.
        // We assume it's the first model from the fetched list if count is 1.
        const streamingModelId = fetchedModels[0]?.id;
        if (!streamingModelId) {
          throw new Error("Cannot determine model ID for streaming.");
        }

        const placeholderMessage: Message = {
          role: 'assistant',
          content: '',
          modelId: streamingModelId,
        };
        setMessages(prevMessages => [...prevMessages, placeholderMessage]);

        // Call the API with streaming flag
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: apiMessages,
            // No models array sent!
            stream: true, // Indicate preference for streaming
          }),
        });

        if (!response.ok || !response.body) {
           // Try to parse error from body if possible
           let errorMsg = 'An error occurred while fetching streaming responses';
           try {
             const errorData = await response.json();
             errorMsg = errorData.error || errorMsg;
           } catch (_) { /* Ignore parsing error */ }
           // Remove placeholder before throwing
           setMessages(prev => prev.slice(0, -1));
           throw new Error(errorMsg);
        }

        // Process streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          // Update the placeholder message with the accumulated content
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const lastMessage = updatedMessages[updatedMessages.length - 1];

            // Check role and modelId to ensure we're updating the correct placeholder
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.modelId === streamingModelId) {
              lastMessage.content = accumulatedContent;
            }
            return updatedMessages;
          });
        }
      } else {
        // Regular non-streaming API call for multiple models
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: apiMessages,
            // No models array sent!
            stream: false, // Explicitly false or omitted
          }),
        });

        const data = await response.json() as ApiResponse;

        if (!response.ok) {
          throw new Error(data.error || 'An error occurred while fetching responses');
        }

        // Add model responses to the chat
        const { responses } = data;
        if (responses) {
           // Create messages for all received responses with proper typing
           const mappedResponses = Object.entries(responses)
             .map(([modelId, modelResponse]) => {
               // Find model details from the fetched list for display purposes
               const model = fetchedModels.find(m => m.id === modelId);
               if (model && modelResponse && modelResponse.text) {
                 return {
                   role: 'assistant' as const,
                   content: modelResponse.text,
                   modelId,
                 } as Message;
               } 
               return null;
             });
             
           // Filter out null values with type assertion
           const newAssistantMessages = mappedResponses.filter(
             (message): message is NonNullable<typeof message> => message !== null
           );
             
          setMessages(prevMessages => [...prevMessages, ...newAssistantMessages]);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while sending your message');

      // Clean up potential placeholder message if an error occurred during its update phase
      setMessages(prevMessages => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === '') {
          return prevMessages.slice(0, -1);
        }
        return prevMessages;
      });
    } finally {
      setIsLoading(false);
    }
    // Include fetchedModels in dependency array if its stability is required for useCallback logic
    // Though the core logic depends more on its length/content which changes via state update, not direct prop change.
  }, [messages, isLoading, fetchedModels, isFetchingModels]);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading: isLoading || isFetchingModels, // Combine loading states
    error,
    sendMessage,
    clearChat,
    availableModels: fetchedModels, // Return fetched models
  };
} 