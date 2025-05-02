'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Send, User, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useOpenRouter } from '@/hooks/useOpenRouter';
import { motion } from 'framer-motion';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';

// Define types for our conversation
interface ModelResponse {
  modelId: string;
  modelName: string;
  provider: string;
  response: string;
}

interface ConversationExchange {
  id: string;
  query: string;
  responses: ModelResponse[];
  timestamp: Date;
  activeModelIndex?: number;
}

export default function OpenModePage() {
  const {
    apiKey,
    saveApiKey,
    clearApiKey,
    messages: chatMessages,
    isLoading,
    error: chatError,
    sendMessage,
    clearChat,
    availableModels,
  } = useOpenRouter();
  
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSwipeIndicators, setShowSwipeIndicators] = useState<{[key: string]: boolean}>({});
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const modelSlidersRef = useRef<{[key: string]: HTMLDivElement}>({});
  const exchangeRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const prevIsLoadingRef = useRef(isLoading);
  const prevConversationLengthRef = useRef(chatMessages.length);
  
  const [conversation, setConversation] = useState<ConversationExchange[]>([]);

  useEffect(() => {
    let currentExchange: ConversationExchange | null = null;
    const exchanges: ConversationExchange[] = [];

    chatMessages.forEach((message, index) => {
      if (message.role === 'user') {
        currentExchange = {
          id: `exchange-${index}`,
          query: message.content,
          responses: [],
          timestamp: new Date(),
        };
        exchanges.push(currentExchange);
      } else if (message.role === 'assistant' && currentExchange) {
        // Find the model info from our available models
        const model = availableModels.find(m => m.id === message.modelId);
        if (model) {
          currentExchange.responses.push({
            modelId: model.id,
            modelName: model.name,
            provider: model.provider,
            response: message.content
          });
        }
      }
    });

    setConversation(exchanges);
  }, [chatMessages, availableModels]);
  
  useEffect(() => {
    if (chatError) {
      setError(chatError);
    }
  }, [chatError]);
  
  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading]);
  
  useEffect(() => {
    const justFinishedLoading = prevIsLoadingRef.current && !isLoading;
    
    if (justFinishedLoading && conversation.length > 0 && chatContainerRef.current) {
      const lastExchangeId = conversation[conversation.length - 1]?.id;
      const lastExchangeElement = lastExchangeId ? exchangeRefs.current[lastExchangeId] : null;
      
      if (lastExchangeElement) {
        const topPos = lastExchangeElement.offsetTop - chatContainerRef.current.offsetTop;
        
        chatContainerRef.current.scrollTo({
          top: topPos - 16,
          behavior: 'smooth' 
        });
      }
    }
    
    prevIsLoadingRef.current = isLoading;
    
  }, [isLoading, conversation]);
  
  useEffect(() => {
    const newQueryAdded = conversation.length > prevConversationLengthRef.current;
    const lastExchange = conversation[conversation.length - 1];
    
    if (newQueryAdded && lastExchange && lastExchange.responses.length === 0 && chatContainerRef.current) {
      const lastExchangeElement = exchangeRefs.current[lastExchange.id];
  
      const scrollTimer = setTimeout(() => {
        if (lastExchangeElement && chatContainerRef.current) {
            const topPos = lastExchangeElement.offsetTop - chatContainerRef.current.offsetTop;
            chatContainerRef.current.scrollTo({
            top: topPos - 16,
            behavior: 'smooth'
            });
        }
      }, 50);
  
      return () => clearTimeout(scrollTimer);
    }
  
    prevConversationLengthRef.current = conversation.length;
  
  }, [conversation]);
  
  useEffect(() => {
    conversation.forEach(exchange => {
      if (exchange.responses.length > 0 && !showSwipeIndicators[exchange.id]) {
        setShowSwipeIndicators(prev => ({
          ...prev, 
          [exchange.id]: true
        }));
        
        const timer = setTimeout(() => {
          setShowSwipeIndicators(prev => ({
            ...prev, 
            [exchange.id]: false
          }));
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    });
  }, [conversation]);
  
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    
    conversation.forEach((exchange, exchangeIndex) => {
      if (exchange.responses.length <= 1) return;
      
      const sliderElement = modelSlidersRef.current[exchange.id];
      if (!sliderElement) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const modelIndex = parseInt(entry.target.getAttribute('data-index') || '0');
              setConversation((prev) => {
                 const currentExchange = prev[exchangeIndex];
                 if (currentExchange && currentExchange.activeModelIndex !== modelIndex) {
                    return prev.map((item, idx) => 
                       idx === exchangeIndex ? { ...item, activeModelIndex: modelIndex } : item
                    );
                 }
                 return prev;
              });
            }
          });
        },
        { 
          root: sliderElement,
          threshold: 0.7,
          rootMargin: '0px'
        }
      );
      
      Array.from(sliderElement.children).forEach((child, index) => {
        child.setAttribute('data-index', index.toString());
        observer.observe(child as Element);
      });
      
      observers.push(observer);
    });
    
    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [conversation, modelSlidersRef]); 
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    setError(null);
    
    if (!apiKey) {
      setError('Please enter your OpenRouter API key to continue');
      setShowApiKeyDialog(true);
      return;
    }
    
    await sendMessage(query);
    setQuery('');
  };
  
  const scrollToModel = (exchangeId: string, modelIndex: number) => {
    const sliderElement = modelSlidersRef.current[exchangeId];
    const modelCard = sliderElement?.children[modelIndex] as HTMLElement;

    if (!sliderElement || !modelCard) return;
    
    sliderElement.scrollTo({
      left: modelCard.offsetLeft - sliderElement.offsetLeft,
      behavior: 'smooth'
    });
    
    setConversation((prev) => 
      prev.map((exchange) => 
        exchange.id === exchangeId 
          ? { ...exchange, activeModelIndex: modelIndex } 
          : exchange
      )
    );
  };
  
  const navigateModel = (exchangeId: string, direction: 'prev' | 'next') => {
    const exchange = conversation.find(e => e.id === exchangeId);
    if (!exchange || !exchange.responses.length) return;
    
    let newIndex = (exchange.activeModelIndex ?? 0) + (direction === 'next' ? 1 : -1);
    
    const numResponses = exchange.responses.length;
    if (newIndex < 0) newIndex = numResponses - 1;
    if (newIndex >= numResponses) newIndex = 0;
    
    scrollToModel(exchangeId, newIndex);
  };
  
  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      saveApiKey(apiKeyInput.trim());
      setApiKeyInput('');
      setShowApiKeyDialog(false);
    }
  };
  
  const handleClearApiKey = () => {
    clearApiKey();
    clearChat();
    setConversation([]);
  };
  
  return (
    <div className="container py-6 max-w-6xl px-4 md:px-6">
      <div className="mx-auto max-w-2xl text-center mb-6">
        <motion.h1 
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          Multi-Model
        </motion.h1>
        <motion.p 
          className="mt-4 text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          Get answers from multiple AI models at once.
        </motion.p>
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {apiKey ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 mb-6 dark:bg-green-950/30 dark:border-green-800">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-green-800 dark:text-green-300 text-sm font-medium">
                  <span className="font-semibold">API Key:</span> Connected to OpenRouter
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your API key is stored locally on your device only
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-500 border-red-200 hover:text-red-700 hover:bg-red-50"
                onClick={handleClearApiKey}
              >
                <X className="h-4 w-4 mr-1" /> Remove Key
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6 dark:bg-amber-950/30 dark:border-amber-800">
            <p className="text-amber-800 dark:text-amber-300 text-sm font-medium mb-2">
              <span className="font-semibold">Get started:</span> Add your OpenRouter API key to continue
            </p>
            <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">Add API Key</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enter your OpenRouter API Key</DialogTitle>
                  <DialogDescription>
                    Your API key is stored locally on your device. We don't save it on our servers.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    type="text"
                    placeholder="sk-or-v1-..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Don't have an API key? <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Get one from OpenRouter</a>
                  </p>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSaveApiKey}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto pr-2 pb-4 space-y-8 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
        >
          {conversation.map((exchange, exchangeIdx) => (
            <div 
              key={exchange.id} 
              ref={el => { 
                if (el) exchangeRefs.current[exchange.id] = el; 
              }}
              className="space-y-4 animate-fadeIn"
            >
              <div className="flex justify-end items-start gap-3">
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg rounded-tr-none max-w-[80%]">
                  <p className="whitespace-pre-wrap">{exchange.query}</p>
                </div>
                <div className="bg-secondary flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              </div>
              
              {exchange.responses.length > 0 ? (
                <div className="space-y-2">
                  <div className="relative">
                    {showSwipeIndicators[exchange.id] && exchange.responses.length > 1 && (
                      <>
                        <button 
                          className="swipe-indicator swipe-indicator--left md:hidden"
                          onClick={() => navigateModel(exchange.id, 'prev')}
                          aria-label="Previous model"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button 
                          className="swipe-indicator swipe-indicator--right md:hidden"
                          onClick={() => navigateModel(exchange.id, 'next')}
                          aria-label="Next model"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    
                    <div 
                      ref={el => { modelSlidersRef.current[exchange.id] = el as HTMLDivElement; }}
                      className="model-slider"
                    >
                      {exchange.responses.map((response, index) => (
                        <div key={response.modelId} className="model-card">
                          <div className="text-sm font-medium mb-2 flex justify-between items-center">
                            <span className="font-semibold">{response.modelName}</span>
                            <span className="text-xs text-muted-foreground rounded-full bg-secondary px-2 py-1">
                              {response.provider}
                            </span>
                          </div>
                          <div className="border-t border-border pt-3">
                            <p className="whitespace-pre-wrap text-sm">{response.response}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {exchange.responses.length > 1 && (
                      <div className="hidden md:flex justify-center mt-4 space-x-2">
                        {exchange.responses.map((_, index) => (
                          <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              (exchange.activeModelIndex ?? 0) === index 
                                ? 'bg-primary' 
                                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            }`}
                            onClick={() => scrollToModel(exchange.id, index)}
                            aria-label={`View model ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : isLoading && exchangeIdx === conversation.length - 1 ? (
                <div className="flex items-start gap-3">
                  <div className="flex-grow bg-muted text-muted-foreground px-4 py-3 rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse h-4 w-24 bg-muted-foreground/20 rounded"></div>
                      <div className="animate-pulse h-6 w-16 bg-muted-foreground/20 rounded-full"></div>
                    </div>
                    <div className="pt-2 space-y-2">
                      <div className="animate-pulse h-4 w-full bg-muted-foreground/20 rounded"></div>
                      <div className="animate-pulse h-4 w-5/6 bg-muted-foreground/20 rounded"></div>
                      <div className="animate-pulse h-4 w-4/6 bg-muted-foreground/20 rounded"></div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          
          {/* Show errors */}
          {(error || chatError) && (
            <div className="p-4 mt-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
              {error || chatError}
            </div>
          )}
          
          {/* Show empty state for no conversation */}
          {conversation.length === 0 && apiKey && !isLoading && (
            <div className="text-center py-10 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <Send className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Start a conversation</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Your messages aren't stored on our servers. When you close this tab, your conversation will be lost.
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t bg-background relative">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2 ">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Type your message..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading || !apiKey}
              className="flex-1 rounded-md bg-muted/90 px-4 py-3 text-sm focus:outline-none focus:bg-muted/90 transition-all duration-300 ease"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={isLoading || !query.trim() || !apiKey}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
          
          {isLoading && (
            <div className="absolute left-0 right-0 -top-5 w-full">
              <div className="h-1 bg-primary/20 overflow-hidden rounded-full mx-4 sm:mx-6">
                <div className="h-full bg-primary w-1/3 animate-progress rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>This webapp was built by <Link href="https://x.com/zedkay22" className="text-primary hover:underline">Zalmay Karimi</Link></p>
      </div>
    </div>
  );
} 