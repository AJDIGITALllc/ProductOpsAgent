import dotenv from 'dotenv';

dotenv.config();

export interface WhopProductData {
  name: string;
  description?: string;
  visibility?: 'visible' | 'hidden';
}

export interface WhopPricingData {
  type: 'one_time' | 'recurring';
  amount: number;
  currency?: string;
  interval?: 'day' | 'week' | 'month' | 'year';
}

export interface WhopProduct {
  id: string;
  name: string;
  description?: string;
  visibility?: string;
  [key: string]: any;
}

export interface IWhopAdapter {
  createProduct(data: WhopProductData): Promise<WhopProduct>;
  updateProduct(productId: string, data: Partial<WhopProductData>): Promise<WhopProduct>;
  setPricing(productId: string, pricing: WhopPricingData): Promise<WhopProduct>;
  addMetadata(productId: string, metadata: Record<string, any>): Promise<WhopProduct>;
  publishProduct(productId: string): Promise<WhopProduct>;
  getProduct(productId: string): Promise<WhopProduct>;
  isStubMode(): boolean;
}

/**
 * Real Whop API Adapter
 * Makes actual API calls to Whop when WHOP_API_KEY is configured
 */
class RealWhopAdapter implements IWhopAdapter {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async createProduct(data: WhopProductData): Promise<WhopProduct> {
    const response = await fetch(`${this.apiUrl}/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whop API error (createProduct): ${response.status} ${error}`);
    }

    return response.json() as Promise<WhopProduct>;
  }

  async updateProduct(productId: string, data: Partial<WhopProductData>): Promise<WhopProduct> {
    const response = await fetch(`${this.apiUrl}/products/${productId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whop API error (updateProduct): ${response.status} ${error}`);
    }

    return response.json() as Promise<WhopProduct>;
  }

  async setPricing(productId: string, pricing: WhopPricingData): Promise<WhopProduct> {
    const response = await fetch(`${this.apiUrl}/products/${productId}/pricing`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pricing),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whop API error (setPricing): ${response.status} ${error}`);
    }

    return response.json() as Promise<WhopProduct>;
  }

  async addMetadata(productId: string, metadata: Record<string, any>): Promise<WhopProduct> {
    const response = await fetch(`${this.apiUrl}/products/${productId}/metadata`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whop API error (addMetadata): ${response.status} ${error}`);
    }

    return response.json() as Promise<WhopProduct>;
  }

  async publishProduct(productId: string): Promise<WhopProduct> {
    const response = await fetch(`${this.apiUrl}/products/${productId}/publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whop API error (publishProduct): ${response.status} ${error}`);
    }

    return response.json() as Promise<WhopProduct>;
  }

  async getProduct(productId: string): Promise<WhopProduct> {
    const response = await fetch(`${this.apiUrl}/products/${productId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whop API error (getProduct): ${response.status} ${error}`);
    }

    return response.json() as Promise<WhopProduct>;
  }

  isStubMode(): boolean {
    return false;
  }
}

/**
 * Stub Whop API Adapter
 * Returns simulated responses when WHOP_API_KEY is not configured
 */
class StubWhopAdapter implements IWhopAdapter {
  private products: Map<string, WhopProduct> = new Map();

  async createProduct(data: WhopProductData): Promise<WhopProduct> {
    const id = `whop_stub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const product: WhopProduct = {
      id,
      name: data.name,
      description: data.description,
      visibility: data.visibility || 'hidden',
      created_at: new Date().toISOString(),
    };
    this.products.set(id, product);
    console.log(`[STUB] Created product: ${id}`, data);
    return product;
  }

  async updateProduct(productId: string, data: Partial<WhopProductData>): Promise<WhopProduct> {
    const existing = this.products.get(productId) || {
      id: productId,
      name: 'Unknown Product',
    };
    const updated = { ...existing, ...data };
    this.products.set(productId, updated);
    console.log(`[STUB] Updated product: ${productId}`, data);
    return updated;
  }

  async setPricing(productId: string, pricing: WhopPricingData): Promise<WhopProduct> {
    const existing = this.products.get(productId) || {
      id: productId,
      name: 'Unknown Product',
    };
    const updated = { ...existing, pricing };
    this.products.set(productId, updated);
    console.log(`[STUB] Set pricing for product: ${productId}`, pricing);
    return updated;
  }

  async addMetadata(productId: string, metadata: Record<string, any>): Promise<WhopProduct> {
    const existing = this.products.get(productId) || {
      id: productId,
      name: 'Unknown Product',
    };
    const updated = {
      ...existing,
      metadata: { ...(existing.metadata || {}), ...metadata },
    };
    this.products.set(productId, updated);
    console.log(`[STUB] Added metadata to product: ${productId}`, metadata);
    return updated;
  }

  async publishProduct(productId: string): Promise<WhopProduct> {
    const existing = this.products.get(productId) || {
      id: productId,
      name: 'Unknown Product',
    };
    const updated = { ...existing, visibility: 'visible', published: true };
    this.products.set(productId, updated);
    console.log(`[STUB] Published product: ${productId}`);
    return updated;
  }

  async getProduct(productId: string): Promise<WhopProduct> {
    const product = this.products.get(productId) || {
      id: productId,
      name: 'Unknown Product',
    };
    console.log(`[STUB] Retrieved product: ${productId}`);
    return product;
  }

  isStubMode(): boolean {
    return true;
  }
}

/**
 * WhopClient Factory
 * Returns real adapter when API key is present, otherwise returns stub adapter
 */
export class WhopClient {
  private adapter: IWhopAdapter;
  private static instance: WhopClient;

  private constructor() {
    const apiKey = process.env.WHOP_API_KEY;
    const apiUrl = process.env.WHOP_API_URL || 'https://api.whop.com/v1';

    if (apiKey && apiKey.trim() !== '') {
      console.log('✅ Whop API: Real mode activated');
      this.adapter = new RealWhopAdapter(apiKey, apiUrl);
    } else {
      console.log('⚠️  Whop API: STUB mode - no API key provided');
      this.adapter = new StubWhopAdapter();
    }
  }

  static getInstance(): WhopClient {
    if (!WhopClient.instance) {
      WhopClient.instance = new WhopClient();
    }
    return WhopClient.instance;
  }

  async createProduct(data: WhopProductData): Promise<WhopProduct> {
    return this.adapter.createProduct(data);
  }

  async updateProduct(productId: string, data: Partial<WhopProductData>): Promise<WhopProduct> {
    return this.adapter.updateProduct(productId, data);
  }

  async setPricing(productId: string, pricing: WhopPricingData): Promise<WhopProduct> {
    return this.adapter.setPricing(productId, pricing);
  }

  async addMetadata(productId: string, metadata: Record<string, any>): Promise<WhopProduct> {
    return this.adapter.addMetadata(productId, metadata);
  }

  async publishProduct(productId: string): Promise<WhopProduct> {
    return this.adapter.publishProduct(productId);
  }

  async getProduct(productId: string): Promise<WhopProduct> {
    return this.adapter.getProduct(productId);
  }

  isStubMode(): boolean {
    return this.adapter.isStubMode();
  }
}

// Export singleton instance
export const whopClient = WhopClient.getInstance();
