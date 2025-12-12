import axios, { AxiosInstance } from 'axios';
import { WhopProduct, WhopFAQ, ActionPayload } from '../../types';

export interface IWhopClient {
  createProduct(payload: ActionPayload): Promise<WhopProduct>;
  updateProduct(payload: ActionPayload): Promise<WhopProduct>;
  deleteProduct(payload: ActionPayload): Promise<void>;
  addFAQ(payload: ActionPayload): Promise<WhopFAQ>;
  updateFAQ(payload: ActionPayload): Promise<WhopFAQ>;
  deleteFAQ(payload: ActionPayload): Promise<void>;
}

/**
 * Real Whop API client
 */
class RealWhopClient implements IWhopClient {
  private client: AxiosInstance;
  
  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.whop.com/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }
  
  async createProduct(payload: ActionPayload): Promise<WhopProduct> {
    const response = await this.client.post('/products', {
      name: payload.name,
      price: payload.price,
      recurring: payload.recurring,
    });
    return response.data;
  }
  
  async updateProduct(payload: ActionPayload): Promise<WhopProduct> {
    const response = await this.client.put(`/products/${payload.productId}`, {
      name: payload.name,
      price: payload.price,
      recurring: payload.recurring,
    });
    return response.data;
  }
  
  async deleteProduct(payload: ActionPayload): Promise<void> {
    await this.client.delete(`/products/${payload.productId}`);
  }
  
  async addFAQ(payload: ActionPayload): Promise<WhopFAQ> {
    const response = await this.client.post('/faqs', {
      question: payload.question,
      answer: payload.answer,
    });
    return response.data;
  }
  
  async updateFAQ(payload: ActionPayload): Promise<WhopFAQ> {
    const response = await this.client.put(`/faqs/${payload.faqId}`, {
      question: payload.question,
      answer: payload.answer,
    });
    return response.data;
  }
  
  async deleteFAQ(payload: ActionPayload): Promise<void> {
    await this.client.delete(`/faqs/${payload.faqId}`);
  }
}

/**
 * Stub Whop client for testing/development without real API key
 */
class StubWhopClient implements IWhopClient {
  private products: Map<string, WhopProduct> = new Map();
  private faqs: Map<string, WhopFAQ> = new Map();
  private productIdCounter = 1;
  private faqIdCounter = 1;
  
  async createProduct(payload: ActionPayload): Promise<WhopProduct> {
    const id = `prod_${this.productIdCounter++}`;
    const product: WhopProduct = {
      id,
      name: payload.name || 'Unnamed Product',
      price: payload.price || 0,
      recurring: payload.recurring || false,
    };
    this.products.set(id, product);
    return product;
  }
  
  async updateProduct(payload: ActionPayload): Promise<WhopProduct> {
    const existing = this.products.get(payload.productId!);
    if (!existing) {
      throw new Error(`Product ${payload.productId} not found`);
    }
    const updated: WhopProduct = {
      ...existing,
      name: payload.name !== undefined ? payload.name : existing.name,
      price: payload.price !== undefined ? payload.price : existing.price,
      recurring: payload.recurring !== undefined ? payload.recurring : existing.recurring,
    };
    this.products.set(payload.productId!, updated);
    return updated;
  }
  
  async deleteProduct(payload: ActionPayload): Promise<void> {
    if (!this.products.has(payload.productId!)) {
      throw new Error(`Product ${payload.productId} not found`);
    }
    this.products.delete(payload.productId!);
  }
  
  async addFAQ(payload: ActionPayload): Promise<WhopFAQ> {
    const id = `faq_${this.faqIdCounter++}`;
    const faq: WhopFAQ = {
      id,
      question: payload.question || '',
      answer: payload.answer || '',
    };
    this.faqs.set(id, faq);
    return faq;
  }
  
  async updateFAQ(payload: ActionPayload): Promise<WhopFAQ> {
    const existing = this.faqs.get(payload.faqId!);
    if (!existing) {
      throw new Error(`FAQ ${payload.faqId} not found`);
    }
    const updated: WhopFAQ = {
      ...existing,
      question: payload.question !== undefined ? payload.question : existing.question,
      answer: payload.answer !== undefined ? payload.answer : existing.answer,
    };
    this.faqs.set(payload.faqId!, updated);
    return updated;
  }
  
  async deleteFAQ(payload: ActionPayload): Promise<void> {
    if (!this.faqs.has(payload.faqId!)) {
      throw new Error(`FAQ ${payload.faqId} not found`);
    }
    this.faqs.delete(payload.faqId!);
  }
}

/**
 * Factory function to create appropriate Whop client based on API key presence
 */
export function createWhopClient(): { client: IWhopClient; mode: 'REAL' | 'STUB' } {
  const apiKey = process.env.WHOP_API_KEY;
  
  if (apiKey && apiKey.trim() !== '') {
    return {
      client: new RealWhopClient(apiKey),
      mode: 'REAL',
    };
  }
  
  return {
    client: new StubWhopClient(),
    mode: 'STUB',
  };
}

export const whopClient = createWhopClient();
