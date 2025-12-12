export * from './actions';

export interface WhopProduct {
  id: string;
  name: string;
  description?: string;
  pricing?: any;
  status: string;
}

export interface PlanResponse {
  id: string;
  status: string;
  actions: any[];
  createdAt: string;
  productId?: string;
}

export interface ExecutionResult {
  success: boolean;
  planId: string;
  results: {
    actionType: string;
    success: boolean;
    error?: string;
    data?: any;
  }[];
}
