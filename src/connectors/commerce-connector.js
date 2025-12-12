/**
 * CommerceConnector Interface
 * 
 * Generic interface that all commerce platform connectors must implement.
 * The planner must remain connector-agnostic and only use this interface.
 */

class CommerceConnector {
  /**
   * Create a new product
   * @param {Object} params - Product creation parameters
   * @param {string} params.name - Product name
   * @param {string} params.description - Product description (optional)
   * @returns {Promise<Object>} Created product data
   */
  async createProduct(params) {
    throw new Error('createProduct must be implemented by connector');
  }
  
  /**
   * Update product pricing
   * @param {Object} params - Pricing parameters
   * @param {string} params.productId - Product ID
   * @param {number} params.price - Price amount
   * @param {string} params.currency - Currency code (default: USD)
   * @param {boolean} params.recurring - Whether pricing is recurring
   * @param {string} params.interval - Recurring interval (monthly, yearly, etc.)
   * @returns {Promise<Object>} Updated pricing data
   */
  async updatePricing(params) {
    throw new Error('updatePricing must be implemented by connector');
  }
  
  /**
   * Set product description
   * @param {Object} params - Description parameters
   * @param {string} params.productId - Product ID
   * @param {string} params.description - Product description
   * @returns {Promise<Object>} Updated product data
   */
  async setDescription(params) {
    throw new Error('setDescription must be implemented by connector');
  }
  
  /**
   * Add FAQs to product
   * @param {Object} params - FAQ parameters
   * @param {string} params.productId - Product ID
   * @param {Array<Object>} params.faqs - Array of FAQ objects with question/answer
   * @returns {Promise<Object>} Updated product data
   */
  async addFAQs(params) {
    throw new Error('addFAQs must be implemented by connector');
  }
  
  /**
   * Set product image
   * @param {Object} params - Image parameters
   * @param {string} params.productId - Product ID
   * @param {string} params.imageUrl - Image URL or data
   * @param {Object} params.metadata - Image generation metadata (prompt, settings, etc.)
   * @returns {Promise<Object>} Updated product data
   */
  async setImage(params) {
    throw new Error('setImage must be implemented by connector');
  }
  
  /**
   * Add media (images, videos, etc.) to product
   * @param {Object} params - Media parameters
   * @param {string} params.productId - Product ID
   * @param {Array<Object>} params.media - Array of media objects
   * @returns {Promise<Object>} Updated product data
   */
  async addMedia(params) {
    throw new Error('addMedia must be implemented by connector');
  }
  
  /**
   * Publish product (make it live)
   * @param {Object} params - Publish parameters
   * @param {string} params.productId - Product ID
   * @returns {Promise<Object>} Published product data
   */
  async publish(params) {
    throw new Error('publish must be implemented by connector');
  }
  
  /**
   * Get connector name
   * @returns {string} Connector name
   */
  getName() {
    throw new Error('getName must be implemented by connector');
  }
}

module.exports = CommerceConnector;
