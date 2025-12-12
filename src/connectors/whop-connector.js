/**
 * Whop Commerce Connector
 * 
 * Implements CommerceConnector interface for Whop platform
 */

const CommerceConnector = require('./commerce-connector');
const { generateImage } = require('../services/image-service');

class WhopConnector extends CommerceConnector {
  constructor() {
    super();
    this.apiKey = process.env.WHOP_API_KEY;
    this.baseUrl = 'https://api.whop.com/v1';
  }
  
  /**
   * Make API request to Whop
   */
  async makeRequest(method, endpoint, body = null) {
    if (!this.apiKey) {
      throw new Error('WHOP_API_KEY not configured');
    }
    
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`🔌 Whop API: ${method} ${endpoint}`);
    
    // Simulated response for now - would use actual fetch in production
    return {
      success: true,
      data: { id: 'mock-id', ...body }
    };
  }
  
  async createProduct(params) {
    const { name, description } = params;
    
    const result = await this.makeRequest('POST', '/products', {
      name,
      description: description || `Product: ${name}`
    });
    
    console.log(`✓ Created product: ${result.data.id}`);
    return result.data;
  }
  
  async updatePricing(params) {
    const { productId, price, currency = 'USD', recurring, interval = 'monthly' } = params;
    
    const result = await this.makeRequest('PUT', `/products/${productId}/pricing`, {
      price,
      currency,
      recurring,
      interval: recurring ? interval : null
    });
    
    console.log(`✓ Updated pricing for product: ${productId}`);
    return result.data;
  }
  
  async setDescription(params) {
    const { productId, description } = params;
    
    const result = await this.makeRequest('PUT', `/products/${productId}`, {
      description
    });
    
    console.log(`✓ Updated description for product: ${productId}`);
    return result.data;
  }
  
  async addFAQs(params) {
    const { productId, faqs } = params;
    
    const result = await this.makeRequest('PUT', `/products/${productId}/faqs`, {
      faqs
    });
    
    console.log(`✓ Added ${faqs.length} FAQs to product: ${productId}`);
    return result.data;
  }
  
  async setImage(params) {
    const { productId, imageUrl, metadata } = params;
    
    let finalImageUrl = imageUrl;
    
    // If no imageUrl provided, generate one using image service
    if (!finalImageUrl && metadata && metadata.prompt) {
      const generatedImage = await generateImage(metadata.prompt, metadata.settings);
      finalImageUrl = generatedImage.url;
    }
    
    const result = await this.makeRequest('PUT', `/products/${productId}/image`, {
      imageUrl: finalImageUrl,
      metadata
    });
    
    console.log(`✓ Set image for product: ${productId}`);
    return result.data;
  }
  
  async addMedia(params) {
    const { productId, media } = params;
    
    const result = await this.makeRequest('POST', `/products/${productId}/media`, {
      media
    });
    
    console.log(`✓ Added ${media.length} media items to product: ${productId}`);
    return result.data;
  }
  
  async publish(params) {
    const { productId } = params;
    
    const result = await this.makeRequest('POST', `/products/${productId}/publish`, {});
    
    console.log(`✓ Published product: ${productId}`);
    return result.data;
  }
  
  getName() {
    return 'whop';
  }
}

module.exports = WhopConnector;
