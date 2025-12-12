// Whitelisted action types
export type ActionType =
  | 'CREATE_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'ADD_FAQ'
  | 'UPDATE_FAQ'
  | 'DELETE_FAQ';

export interface ActionPayload {
  // CREATE_PRODUCT
  name?: string;
  price?: number;
  recurring?: boolean;
  
  // UPDATE_PRODUCT, DELETE_PRODUCT
  productId?: string;
  
  // ADD_FAQ, UPDATE_FAQ, DELETE_FAQ
  question?: string;
  answer?: string;
  faqId?: string;
  
  // Generic fields
  [key: string]: any;
}

export interface Action {
  type: ActionType;
  payload: ActionPayload;
}

export interface ActionPlan {
  planId: string;
  actions: Action[];
  description?: string;
}

export interface ExecutionResult {
  planId: string;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL';
  completedSteps: number;
  failedStepIndex?: number;
  results: any[];
  error?: string;
}

export interface User {
  sub: string; // JWT subject (user ID)
  role: 'Owner' | 'User';
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface RequestContext {
  user?: User;
  correlationId: string;
  ipAddress: string;
}

export interface WhopProduct {
  id: string;
  name: string;
  price: number;
  recurring: boolean;
}

export interface WhopFAQ {
  id: string;
  question: string;
  answer: string;
}

export interface HealthStatus {
  mode: 'REAL' | 'STUB';
  database: 'connected' | 'error';
  timestamp: string;
}
