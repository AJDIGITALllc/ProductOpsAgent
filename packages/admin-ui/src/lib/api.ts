const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = {
  // Templates
  async getTemplates() {
    const res = await fetch(`${API_URL}/api/templates`);
    if (!res.ok) throw new Error('Failed to fetch templates');
    return res.json();
  },

  async getTemplate(id: string) {
    const res = await fetch(`${API_URL}/api/templates/${id}`);
    if (!res.ok) throw new Error('Failed to fetch template');
    return res.json();
  },

  // Products
  async getProducts() {
    const res = await fetch(`${API_URL}/api/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async getProduct(id: string) {
    const res = await fetch(`${API_URL}/api/products/${id}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return res.json();
  },

  // Plans
  async createPlan(actions: any[], productId?: string) {
    const res = await fetch(`${API_URL}/api/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actions, productId }),
    });
    if (!res.ok) throw new Error('Failed to create plan');
    return res.json();
  },

  async getPlan(id: string) {
    const res = await fetch(`${API_URL}/api/plans/${id}`);
    if (!res.ok) throw new Error('Failed to fetch plan');
    return res.json();
  },

  async approvePlan(id: string, approvedBy: string = 'user') {
    const res = await fetch(`${API_URL}/api/plans/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy }),
    });
    if (!res.ok) throw new Error('Failed to approve plan');
    return res.json();
  },

  async executePlan(id: string) {
    const res = await fetch(`${API_URL}/api/plans/${id}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `execute-${id}-${Date.now()}`,
      },
    });
    if (!res.ok) throw new Error('Failed to execute plan');
    return res.json();
  },

  async cancelPlan(id: string) {
    const res = await fetch(`${API_URL}/api/plans/${id}/cancel`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to cancel plan');
    return res.json();
  },

  async getPlans(status?: string) {
    const url = status
      ? `${API_URL}/api/plans?status=${status}`
      : `${API_URL}/api/plans`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch plans');
    return res.json();
  },

  // Audit
  async getAuditLogs(limit: number = 100) {
    const res = await fetch(`${API_URL}/api/audit?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },
};
