import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import type { PricingConfig, FAQ, DescriptionBlock } from '@productopsagent/shared';

export interface WhopProductResponse {
  id: string;
  name: string;
  status: 'draft' | 'published';
  created_at: number;
  updated_at: number;
}

export interface WhopPricingResponse {
  product_id: string;
  amount: number;
  currency: string;
  interval: string;
}

export class WhopClient {
  private client: AxiosInstance;
  private stubMode: boolean;
  private idempotencyCache: Map<string, any>;

  constructor(apiKey?: string) {
    this.stubMode = !apiKey;
    this.idempotencyCache = new Map();

    if (this.stubMode) {
      console.warn('[WhopClient] Running in STUB MODE - WHOP_API_KEY not provided');
    }

    this.client = axios.create({
      baseURL: 'https://api.whop.com/v1',
      headers: apiKey
        ? {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        : {},
      timeout: 30000,
    });

    // Configure retry logic
    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status ? error.response.status >= 500 : false)
        );
      },
    });
  }

  /**
   * Create a new product (defaults to draft)
   * TODO: Update endpoint and payload based on actual Whop API documentation
   */
  async createProduct(
    params: { name: string; status?: 'draft' | 'published' },
    idempotencyKey: string
  ): Promise<WhopProductResponse> {
    // Check idempotency cache
    if (this.idempotencyCache.has(idempotencyKey)) {
      console.log(`[WhopClient] Idempotency hit for key: ${idempotencyKey}`);
      return this.idempotencyCache.get(idempotencyKey);
    }

    if (this.stubMode) {
      const stubResponse: WhopProductResponse = {
        id: `stub_product_${Date.now()}`,
        name: params.name,
        status: params.status || 'draft',
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      this.idempotencyCache.set(idempotencyKey, stubResponse);
      console.log('[WhopClient STUB] createProduct:', stubResponse);
      return stubResponse;
    }

    // TODO: Replace with actual Whop API endpoint
    const response = await this.client.post<WhopProductResponse>(
      '/products',
      {
        name: params.name,
        status: params.status || 'draft',
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );

    this.idempotencyCache.set(idempotencyKey, response.data);
    return response.data;
  }

  /**
   * Update product name
   * TODO: Verify endpoint path and payload structure
   */
  async updateProductName(
    productId: string,
    name: string,
    idempotencyKey: string
  ): Promise<WhopProductResponse> {
    if (this.idempotencyCache.has(idempotencyKey)) {
      return this.idempotencyCache.get(idempotencyKey);
    }

    if (this.stubMode) {
      const stubResponse: WhopProductResponse = {
        id: productId,
        name,
        status: 'draft',
        created_at: Date.now() - 10000,
        updated_at: Date.now(),
      };
      this.idempotencyCache.set(idempotencyKey, stubResponse);
      console.log('[WhopClient STUB] updateProductName:', stubResponse);
      return stubResponse;
    }

    // TODO: Replace with actual endpoint
    const response = await this.client.patch<WhopProductResponse>(
      `/products/${productId}`,
      { name },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );

    this.idempotencyCache.set(idempotencyKey, response.data);
    return response.data;
  }

  /**
   * Set product pricing
   * TODO: Confirm pricing API structure
   */
  async setProductPricing(
    productId: string,
    pricing: PricingConfig,
    idempotencyKey: string
  ): Promise<WhopPricingResponse> {
    if (this.idempotencyCache.has(idempotencyKey)) {
      return this.idempotencyCache.get(idempotencyKey);
    }

    if (this.stubMode) {
      const stubResponse: WhopPricingResponse = {
        product_id: productId,
        amount: pricing.amount,
        currency: pricing.currency,
        interval: pricing.interval,
      };
      this.idempotencyCache.set(idempotencyKey, stubResponse);
      console.log('[WhopClient STUB] setProductPricing:', stubResponse);
      return stubResponse;
    }

    // TODO: Verify the actual pricing endpoint structure
    const response = await this.client.post<WhopPricingResponse>(
      `/products/${productId}/pricing`,
      {
        amount: pricing.amount,
        currency: pricing.currency,
        interval: pricing.interval,
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );

    this.idempotencyCache.set(idempotencyKey, response.data);
    return response.data;
  }

  /**
   * Set product description (block model)
   * TODO: Confirm description block structure with Whop API
   */
  async setProductDescription(
    productId: string,
    description: DescriptionBlock[],
    idempotencyKey: string
  ): Promise<{ success: boolean }> {
    if (this.idempotencyCache.has(idempotencyKey)) {
      return this.idempotencyCache.get(idempotencyKey);
    }

    if (this.stubMode) {
      const stubResponse = { success: true };
      this.idempotencyCache.set(idempotencyKey, stubResponse);
      console.log('[WhopClient STUB] setProductDescription:', { productId, description });
      return stubResponse;
    }

    // TODO: Map to actual Whop description format
    const response = await this.client.patch<{ success: boolean }>(
      `/products/${productId}/description`,
      { blocks: description },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );

    this.idempotencyCache.set(idempotencyKey, response.data);
    return response.data;
  }

  /**
   * Set product FAQs
   * TODO: Verify FAQs endpoint structure
   */
  async setProductFAQs(
    productId: string,
    faqs: FAQ[],
    idempotencyKey: string
  ): Promise<{ success: boolean }> {
    if (this.idempotencyCache.has(idempotencyKey)) {
      return this.idempotencyCache.get(idempotencyKey);
    }

    if (this.stubMode) {
      const stubResponse = { success: true };
      this.idempotencyCache.set(idempotencyKey, stubResponse);
      console.log('[WhopClient STUB] setProductFAQs:', { productId, faqs });
      return stubResponse;
    }

    // TODO: Confirm actual FAQs endpoint
    const response = await this.client.post<{ success: boolean }>(
      `/products/${productId}/faqs`,
      { faqs },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );

    this.idempotencyCache.set(idempotencyKey, response.data);
    return response.data;
  }

  /**
   * Set payment options
   * TODO: Confirm if Whop API supports this; stub for now
   */
  async setPaymentOptions(
    productId: string,
    paymentOptions: string[],
    idempotencyKey: string
  ): Promise<{ success: boolean }> {
    if (this.idempotencyCache.has(idempotencyKey)) {
      return this.idempotencyCache.get(idempotencyKey);
    }

    if (this.stubMode) {
      const stubResponse = { success: true };
      this.idempotencyCache.set(idempotencyKey, stubResponse);
      console.log('[WhopClient STUB] setPaymentOptions:', { productId, paymentOptions });
      return stubResponse;
    }

    // TODO: Verify if Whop supports payment options configuration
    console.warn('[WhopClient] setPaymentOptions may not be supported by Whop API');
    const stubResponse = { success: true };
    this.idempotencyCache.set(idempotencyKey, stubResponse);
    return stubResponse;
  }

  /**
   * Publish a product
   * TODO: Confirm publish endpoint
   */
  async publishProduct(productId: string, idempotencyKey: string): Promise<WhopProductResponse> {
    if (this.idempotencyCache.has(idempotencyKey)) {
      return this.idempotencyCache.get(idempotencyKey);
    }

    if (this.stubMode) {
      const stubResponse: WhopProductResponse = {
        id: productId,
        name: 'Published Product',
        status: 'published',
        created_at: Date.now() - 10000,
        updated_at: Date.now(),
      };
      this.idempotencyCache.set(idempotencyKey, stubResponse);
      console.log('[WhopClient STUB] publishProduct:', stubResponse);
      return stubResponse;
    }

    // TODO: Verify publish endpoint
    const response = await this.client.post<WhopProductResponse>(
      `/products/${productId}/publish`,
      {},
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );

    this.idempotencyCache.set(idempotencyKey, response.data);
    return response.data;
  }

  /**
   * Get product details (read-only)
   */
  async getProduct(productId: string): Promise<WhopProductResponse> {
    if (this.stubMode) {
      const stubResponse: WhopProductResponse = {
        id: productId,
        name: 'Stub Product',
        status: 'draft',
        created_at: Date.now() - 10000,
        updated_at: Date.now(),
      };
      console.log('[WhopClient STUB] getProduct:', stubResponse);
      return stubResponse;
    }

    // TODO: Verify get endpoint
    const response = await this.client.get<WhopProductResponse>(`/products/${productId}`);
    return response.data;
  }
}
