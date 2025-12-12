/**
 * Gumroad Commerce Connector (Skeleton)
 * 
 * Implements CommerceConnector interface for Gumroad platform
 * NOTE: This is a skeleton implementation - execution not yet implemented
 */

const CommerceConnector = require('./commerce-connector');

class GumroadConnector extends CommerceConnector {
  constructor() {
    super();
    this.apiKey = process.env.GUMROAD_API_KEY;
    this.baseUrl = 'https://api.gumroad.com/v2';
  }
  
  async createProduct(params) {
    console.log('⚠️  Gumroad connector: createProduct not yet implemented');
    throw new Error('Gumroad connector not yet implemented - coming soon');
  }
  
  async updatePricing(params) {
    console.log('⚠️  Gumroad connector: updatePricing not yet implemented');
    throw new Error('Gumroad connector not yet implemented - coming soon');
  }
  
  async setDescription(params) {
    console.log('⚠️  Gumroad connector: setDescription not yet implemented');
    throw new Error('Gumroad connector not yet implemented - coming soon');
  }
  
  async addFAQs(params) {
    console.log('⚠️  Gumroad connector: addFAQs not yet implemented');
    throw new Error('Gumroad connector not yet implemented - coming soon');
  }
  
  async setImage(params) {
    console.log('⚠️  Gumroad connector: setImage not yet implemented');
    throw new Error('Gumroad connector not yet implemented - coming soon');
  }
  
  async addMedia(params) {
    console.log('⚠️  Gumroad connector: addMedia not yet implemented');
    throw new Error('Gumroad connector not yet implemented - coming soon');
  }
  
  async publish(params) {
    console.log('⚠️  Gumroad connector: publish not yet implemented');
    throw new Error('Gumroad connector not yet implemented - coming soon');
  }
  
  getName() {
    return 'gumroad';
  }
}

module.exports = GumroadConnector;
