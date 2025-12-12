import type { ActionPlan, Run, Product, Template, ActionResult } from '@productopsagent/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PlanResponse {
  runId: string;
  actionPlan: ActionPlan;
  approvalToken: string;
}

export interface ExecuteResponse {
  runId: string;
  status: string;
  results: ActionResult[];
}

export const api = {
  async createPlan(prompt: string): Promise<PlanResponse> {
    const response = await fetch(`${API_URL}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create plan');
    }

    return response.json();
  },

  async executePlan(runId: string, approvalToken: string): Promise<ExecuteResponse> {
    const response = await fetch(`${API_URL}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId, approvalToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to execute plan');
    }

    return response.json();
  },

  async getRuns(limit = 50, offset = 0): Promise<{ runs: Run[]; total: number }> {
    const response = await fetch(`${API_URL}/api/runs?limit=${limit}&offset=${offset}`);

    if (!response.ok) {
      throw new Error('Failed to fetch runs');
    }

    return response.json();
  },

  async getRun(id: string): Promise<Run> {
    const response = await fetch(`${API_URL}/api/runs/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch run');
    }

    return response.json();
  },

  async getProducts(limit = 50, offset = 0): Promise<{ products: Product[]; total: number }> {
    const response = await fetch(`${API_URL}/api/products?limit=${limit}&offset=${offset}`);

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    return response.json();
  },

  async getProduct(id: string): Promise<Product> {
    const response = await fetch(`${API_URL}/api/products/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }

    return response.json();
  },

  async getTemplates(): Promise<{ templates: Template[] }> {
    const response = await fetch(`${API_URL}/api/templates`);

    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }

    return response.json();
  },

  async getTemplate(id: string): Promise<Template> {
    const response = await fetch(`${API_URL}/api/templates/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch template');
    }

    return response.json();
  },
};
