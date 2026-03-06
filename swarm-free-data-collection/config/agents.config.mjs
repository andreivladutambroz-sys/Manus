/**
 * Agents Configuration
 * 
 * Defines all supplier agents for the 200-agent swarm
 * Currently configured with 30 agents (can be scaled to 200)
 * 
 * Each agent represents one supplier website to scrape
 */

export const AGENTS_CONFIG = {
  suppliers: [
    // Romanian suppliers (primary targets)
    { id: 'AGENT_S_001', name: 'epiesa.ro', type: 'supplier', country: 'RO', priority: 1 },
    { id: 'AGENT_S_002', name: 'autodoc.ro', type: 'supplier', country: 'RO', priority: 1 },
    { id: 'AGENT_S_003', name: 'emag.ro', type: 'supplier', country: 'RO', priority: 2 },
    { id: 'AGENT_S_004', name: 'dedeman.ro', type: 'supplier', country: 'RO', priority: 2 },
    { id: 'AGENT_S_005', name: 'altex.ro', type: 'supplier', country: 'RO', priority: 2 },
    { id: 'AGENT_S_006', name: 'olx.ro', type: 'marketplace', country: 'RO', priority: 3 },
    
    // European suppliers
    { id: 'AGENT_S_007', name: 'ricardo.ch', type: 'supplier', country: 'CH', priority: 2 },
    { id: 'AGENT_S_008', name: 'autoscout24.eu', type: 'marketplace', country: 'EU', priority: 2 },
    { id: 'AGENT_S_009', name: 'mobile.de', type: 'marketplace', country: 'DE', priority: 2 },
    
    // OEM & Manufacturer data
    { id: 'AGENT_S_010', name: 'bmw.com', type: 'manufacturer', country: 'DE', priority: 3 },
    { id: 'AGENT_S_011', name: 'mercedes-benz.com', type: 'manufacturer', country: 'DE', priority: 3 },
    { id: 'AGENT_S_012', name: 'audi.com', type: 'manufacturer', country: 'DE', priority: 3 },
    { id: 'AGENT_S_013', name: 'volkswagen.com', type: 'manufacturer', country: 'DE', priority: 3 },
    { id: 'AGENT_S_014', name: 'ford.com', type: 'manufacturer', country: 'US', priority: 3 },
    { id: 'AGENT_S_015', name: 'toyota.com', type: 'manufacturer', country: 'JP', priority: 3 },
    
    // Reference & Knowledge bases
    { id: 'AGENT_S_016', name: 'wikipedia.org', type: 'reference', country: 'US', priority: 4 },
    { id: 'AGENT_S_017', name: 'vin-decoder.com', type: 'api', country: 'US', priority: 2 },
    { id: 'AGENT_S_018', name: 'obd-codes.com', type: 'reference', country: 'US', priority: 3 },
    
    // Additional Romanian suppliers
    { id: 'AGENT_S_019', name: 'piese-auto.ro', type: 'supplier', country: 'RO', priority: 2 },
    { id: 'AGENT_S_020', name: 'autoparts.ro', type: 'supplier', country: 'RO', priority: 2 },
    { id: 'AGENT_S_021', name: 'piesauto.ro', type: 'supplier', country: 'RO', priority: 2 },
    { id: 'AGENT_S_022', name: 'carparts.ro', type: 'supplier', country: 'RO', priority: 2 },
    { id: 'AGENT_S_023', name: 'automax.ro', type: 'supplier', country: 'RO', priority: 2 },
    { id: 'AGENT_S_024', name: 'carshop.ro', type: 'supplier', country: 'RO', priority: 2 },
    
    // European marketplaces
    { id: 'AGENT_S_025', name: 'ebay.co.uk', type: 'marketplace', country: 'UK', priority: 3 },
    { id: 'AGENT_S_026', name: 'leboncoin.fr', type: 'marketplace', country: 'FR', priority: 3 },
    { id: 'AGENT_S_027', name: 'subito.it', type: 'marketplace', country: 'IT', priority: 3 },
    
    // Specialty suppliers
    { id: 'AGENT_S_028', name: 'bosch.com', type: 'manufacturer', country: 'DE', priority: 3 },
    { id: 'AGENT_S_029', name: 'denso.com', type: 'manufacturer', country: 'JP', priority: 3 },
    { id: 'AGENT_S_030', name: 'valeo.com', type: 'manufacturer', country: 'FR', priority: 3 }
  ],

  // Brands to scrape
  brands: [
    'BMW',
    'Mercedes-Benz',
    'Audi',
    'Volkswagen',
    'Ford',
    'Opel',
    'Renault',
    'Peugeot',
    'Citroen',
    'Fiat',
    'Alfa Romeo',
    'Lancia',
    'Ferrari',
    'Lamborghini',
    'Porsche',
    'Rolls-Royce',
    'Bentley',
    'Aston Martin',
    'Jaguar',
    'Land Rover',
    'Range Rover',
    'Mini',
    'Rolls-Royce',
    'Tesla',
    'Nissan',
    'Honda',
    'Toyota',
    'Mazda',
    'Mitsubishi',
    'Subaru',
    'Suzuki',
    'Daihatsu',
    'Hyundai',
    'Kia',
    'Daewoo',
    'SsangYong',
    'Geely',
    'BYD',
    'Chery',
    'JAC',
    'Changan',
    'Great Wall',
    'Volvo',
    'Saab',
    'Scania',
    'MAN',
    'Iveco',
    'DAF',
    'Kamaz',
    'Ural'
  ],

  // Part categories to scrape
  categories: [
    'engine',
    'transmission',
    'suspension',
    'brakes',
    'electrical',
    'cooling',
    'fuel',
    'exhaust',
    'interior',
    'exterior',
    'lights',
    'wipers',
    'filters',
    'belts',
    'hoses',
    'seals',
    'bearings',
    'bushings',
    'springs',
    'shocks'
  ]
};

/**
 * Get agents by priority level
 */
export function getAgentsByPriority(priority) {
  return AGENTS_CONFIG.suppliers.filter(a => a.priority === priority);
}

/**
 * Get agents by country
 */
export function getAgentsByCountry(country) {
  return AGENTS_CONFIG.suppliers.filter(a => a.country === country);
}

/**
 * Get agents by type
 */
export function getAgentsByType(type) {
  return AGENTS_CONFIG.suppliers.filter(a => a.type === type);
}

/**
 * Get all Romanian suppliers (priority targets)
 */
export function getRomanianSuppliers() {
  return getAgentsByCountry('RO').sort((a, b) => a.priority - b.priority);
}

/**
 * Get high-priority agents for initial testing
 */
export function getHighPriorityAgents() {
  return AGENTS_CONFIG.suppliers
    .filter(a => a.priority <= 2)
    .sort((a, b) => a.priority - b.priority);
}

export default AGENTS_CONFIG;
