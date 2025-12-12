/**
 * Connector Factory
 * 
 * Provides connector instances and ensures planner remains connector-agnostic
 */

const WhopConnector = require('./whop-connector');
const GumroadConnector = require('./gumroad-connector');

// Connector registry
const connectors = {
  whop: null,
  gumroad: null
};

/**
 * Get connector instance by name
 */
function getConnector(name = 'whop') {
  const lowerName = name.toLowerCase();
  
  if (!connectors[lowerName]) {
    switch (lowerName) {
      case 'whop':
        connectors[lowerName] = new WhopConnector();
        break;
      case 'gumroad':
        connectors[lowerName] = new GumroadConnector();
        break;
      default:
        throw new Error(`Unknown connector: ${name}`);
    }
  }
  
  return connectors[lowerName];
}

/**
 * Get list of available connectors
 */
function getAvailableConnectors() {
  return ['whop', 'gumroad'];
}

module.exports = {
  getConnector,
  getAvailableConnectors
};
