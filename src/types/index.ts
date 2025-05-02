import { ObjectId } from "mongodb";

/**
 * User related types
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  queriesUsed: number;
  messageCredits: number;
  isNewUser?: boolean;
  stripeCustomerId?: string;
  lastTopUpDate?: Date;
  // Database specific fields that might not be included in all contexts
  password?: string;
  _id?: string | ObjectId; // MongoDB ObjectId or string representation
}

// Extended database user type for authentication
export interface DBUser {
  _id: any;
  email: string;
  password?: string;
  name?: string;
  image?: string;
  queriesUsed: number;
  messageCredits: number;
  isNewUser?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Chat and model related types
 */
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  modelId?: string;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxTokens: number;
  contextLength: number;
  imageCapable: boolean;
}

/**
 * API related types
 */
export interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

/**
 * Environment variables
 */
export interface Env {
  OPENROUTER_API_KEY: string;
  MONGODB_URI: string;
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Component types
export type ButtonVariant = 
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export type ButtonSize = "default" | "sm" | "lg" | "icon"; 