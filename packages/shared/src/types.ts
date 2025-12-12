// Core domain types for ProductOpsAgent

export type PricingInterval = 'one_time' | 'monthly' | 'yearly';

export type Currency = 'usd' | 'eur' | 'gbp';

export interface PricingConfig {
  amount: number; // in cents
  currency: Currency;
  interval: PricingInterval;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface DescriptionBlock {
  type: 'text' | 'heading' | 'list';
  content: string;
  items?: string[]; // for list type
}

export interface Product {
  id: string;
  whopProductId?: string; // External Whop ID once created
  name: string;
  description?: DescriptionBlock[];
  pricing?: PricingConfig;
  faqs?: FAQ[];
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // actor_id
}

export interface Template {
  id: string;
  name: string;
  description: string;
  actionPlan: ActionPlan;
  createdAt: Date;
}

// Action DSL types
export type ActionType = 
  | 'whop.product.create'
  | 'whop.product.update_name'
  | 'whop.product.set_pricing'
  | 'whop.product.set_description'
  | 'whop.product.set_faqs'
  | 'whop.product.set_payment_options'
  | 'whop.product.publish'
  | 'whop.product.get';

export interface Action {
  id: string; // unique action ID within the plan
  type: ActionType;
  params: Record<string, any>;
  idempotencyKey: string; // unique key for idempotent execution
  order: number; // execution order
}

export interface ActionPlan {
  id: string;
  actions: Action[];
  summary: string; // human-readable summary of what will happen
  createdAt: Date;
}

export type RunStatus = 'planning' | 'planned' | 'approved' | 'executing' | 'completed' | 'failed';

export type ActionStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';

export interface ActionResult {
  actionId: string;
  status: ActionStatus;
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Run {
  id: string;
  status: RunStatus;
  userPrompt: string;
  actionPlan?: ActionPlan;
  approvalToken?: string; // JWT token required to execute
  results: ActionResult[];
  actorId: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
}
