import { WhopProduct } from '../types';

export class WhopService {
  private apiKey: string | undefined;
  private apiUrl: string;
  private stubMode: boolean;

  constructor() {
    this.apiKey = process.env.WHOP_API_KEY;
    this.apiUrl = process.env.WHOP_API_URL || 'https://api.whop.com/v1';
    this.stubMode = !this.apiKey;

    if (this.stubMode) {
      console.log('⚠️  Running in STUB mode - Whop API calls will be simulated');
    }
  }

  async createProduct(data: {
    name: string;
    description?: string;
  }): Promise<WhopProduct> {
    if (this.stubMode) {
      return this.stubCreateProduct(data);
    }

    // Real API call would go here
    const response = await fetch(`${this.apiUrl}/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Whop API error: ${response.statusText}`);
    }

    return response.json() as Promise<WhopProduct>;
  }

  async updateProduct(
    productId: string,
    data: Partial<WhopProduct>
  ): Promise<WhopProduct> {
    if (this.stubMode) {
      return this.stubUpdateProduct(productId, data);
    }

    const response = await fetch(`${this.apiUrl}/products/${productId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Whop API error: ${response.statusText}`);
    }

    return response.json() as Promise<WhopProduct>;
  }

  async publishProduct(productId: string): Promise<WhopProduct> {
    if (this.stubMode) {
      return this.stubPublishProduct(productId);
    }

    const response = await fetch(`${this.apiUrl}/products/${productId}/publish`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Whop API error: ${response.statusText}`);
    }

    return response.json() as Promise<WhopProduct>;
  }

  async getProduct(productId: string): Promise<WhopProduct> {
    if (this.stubMode) {
      return this.stubGetProduct(productId);
    }

    const response = await fetch(`${this.apiUrl}/products/${productId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Whop API error: ${response.statusText}`);
    }

    return response.json() as Promise<WhopProduct>;
  }

  // Stub implementations
  private stubCreateProduct(data: {
    name: string;
    description?: string;
  }): WhopProduct {
    console.log('📝 [STUB] Creating product:', data);
    return {
      id: `whop_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: data.name,
      description: data.description,
      status: 'draft',
    };
  }

  private stubUpdateProduct(
    productId: string,
    data: Partial<WhopProduct>
  ): WhopProduct {
    console.log(`📝 [STUB] Updating product ${productId}:`, data);
    return {
      id: productId,
      name: data.name || 'Updated Product',
      description: data.description,
      pricing: data.pricing,
      status: data.status || 'draft',
    };
  }

  private stubPublishProduct(productId: string): WhopProduct {
    console.log(`🚀 [STUB] Publishing product ${productId}`);
    return {
      id: productId,
      name: 'Published Product',
      status: 'published',
    };
  }

  private stubGetProduct(productId: string): WhopProduct {
    console.log(`🔍 [STUB] Getting product ${productId}`);
    return {
      id: productId,
      name: 'Sample Product',
      status: 'draft',
    };
  }

  isStubMode(): boolean {
    return this.stubMode;
  }
}

export const whopService = new WhopService();
