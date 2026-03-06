import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import axios from 'axios';

interface SupplierPart {
  partNumber: string;
  name: string;
  supplier: string;
  price: number;
  availability: 'in-stock' | 'limited' | 'out-of-stock';
  url: string;
  estimatedDelivery: string;
  rating: number;
}

export const supplierRouter = router({
  // Search parts across multiple suppliers
  searchParts: protectedProcedure
    .input(z.object({
      partNumber: z.string(),
      partName: z.string().optional(),
      suppliers: z.array(z.enum(['autozone', 'rockauto', 'amazon'])).optional()
    }))
    .query(async ({ input }) => {
      try {
        const results: SupplierPart[] = [];

        // Search AutoZone
        if (!input.suppliers || input.suppliers.includes('autozone')) {
          try {
            const autoZoneResults = await searchAutoZone(input.partNumber, input.partName);
            results.push(...autoZoneResults);
          } catch (error) {
            console.error('AutoZone search failed:', error);
          }
        }

        // Search RockAuto
        if (!input.suppliers || input.suppliers.includes('rockauto')) {
          try {
            const rockAutoResults = await searchRockAuto(input.partNumber, input.partName);
            results.push(...rockAutoResults);
          } catch (error) {
            console.error('RockAuto search failed:', error);
          }
        }

        // Search Amazon
        if (!input.suppliers || input.suppliers.includes('amazon')) {
          try {
            const amazonResults = await searchAmazon(input.partNumber, input.partName);
            results.push(...amazonResults);
          } catch (error) {
            console.error('Amazon search failed:', error);
          }
        }

        // Sort by price (lowest first)
        return results.sort((a, b) => a.price - b.price);
      } catch (error) {
        throw new Error('Failed to search parts');
      }
    }),

  // Get best price for a specific part
  getBestPrice: protectedProcedure
    .input(z.object({
      partNumber: z.string(),
      partName: z.string().optional()
    }))
    .query(async ({ input }) => {
      try {
        const results = await searchAllSuppliers(input.partNumber, input.partName);
        
        if (results.length === 0) {
          return null;
        }

        const bestPrice = results[0];
        const alternatives = results.slice(1, 4);

        return {
          bestPrice,
          alternatives,
          savings: alternatives.length > 0 
            ? alternatives[0].price - bestPrice.price 
            : 0
        };
      } catch (error) {
        throw new Error('Failed to get best price');
      }
    }),

  // Auto-order parts when inventory is low
  autoOrderParts: protectedProcedure
    .input(z.object({
      partId: z.string(),
      partNumber: z.string(),
      quantity: z.number().min(1),
      supplier: z.enum(['autozone', 'rockauto', 'amazon']),
      maxPrice: z.number().optional()
    }))
    .mutation(async ({ input }) => {
      try {
        // Get pricing from supplier
        const pricing = await getPricingFromSupplier(input.supplier, input.partNumber);

        if (!pricing) {
          throw new Error('Part not found at supplier');
        }

        if (input.maxPrice && pricing.price > input.maxPrice) {
          throw new Error(`Price ${pricing.price} exceeds max price ${input.maxPrice}`);
        }

        // Create order (in production, this would integrate with supplier APIs)
        const order = {
          id: `order-${Date.now()}`,
          partId: input.partId,
          partNumber: input.partNumber,
          quantity: input.quantity,
          supplier: input.supplier,
          unitPrice: pricing.price,
          totalPrice: pricing.price * input.quantity,
          status: 'pending',
          createdAt: new Date(),
          estimatedDelivery: pricing.estimatedDelivery
        };

        return {
          success: true,
          order,
          message: `Order placed for ${input.quantity}x ${input.partNumber} from ${input.supplier}`
        };
      } catch (error) {
        throw new Error(`Failed to place order: ${error}`);
      }
    }),

  // Get supplier availability
  getAvailability: protectedProcedure
    .input(z.object({
      partNumber: z.string(),
      suppliers: z.array(z.enum(['autozone', 'rockauto', 'amazon'])).optional()
    }))
    .query(async ({ input }) => {
      try {
        const availability: Record<string, any> = {};

        if (!input.suppliers || input.suppliers.includes('autozone')) {
          availability.autozone = await checkAutoZoneAvailability(input.partNumber);
        }

        if (!input.suppliers || input.suppliers.includes('rockauto')) {
          availability.rockauto = await checkRockAutoAvailability(input.partNumber);
        }

        if (!input.suppliers || input.suppliers.includes('amazon')) {
          availability.amazon = await checkAmazonAvailability(input.partNumber);
        }

        return availability;
      } catch (error) {
        throw new Error('Failed to check availability');
      }
    })
});

// Helper functions
async function searchAutoZone(partNumber: string, partName?: string): Promise<SupplierPart[]> {
  // Mock implementation - in production, use AutoZone API
  return [
    {
      partNumber,
      name: partName || 'Oil Filter',
      supplier: 'autozone',
      price: 8.99,
      availability: 'in-stock',
      url: `https://www.autozone.com/search?q=${partNumber}`,
      estimatedDelivery: '1-2 days',
      rating: 4.5
    }
  ];
}

async function searchRockAuto(partNumber: string, partName?: string): Promise<SupplierPart[]> {
  // Mock implementation - in production, use RockAuto API
  return [
    {
      partNumber,
      name: partName || 'Oil Filter',
      supplier: 'rockauto',
      price: 7.49,
      availability: 'in-stock',
      url: `https://www.rockauto.com/en/moreinfo.php?pk=${partNumber}`,
      estimatedDelivery: '3-5 days',
      rating: 4.3
    }
  ];
}

async function searchAmazon(partNumber: string, partName?: string): Promise<SupplierPart[]> {
  // Mock implementation - in production, use Amazon Product Advertising API
  return [
    {
      partNumber,
      name: partName || 'Oil Filter',
      supplier: 'amazon',
      price: 9.99,
      availability: 'in-stock',
      url: `https://www.amazon.com/s?k=${partNumber}`,
      estimatedDelivery: '2 days (Prime)',
      rating: 4.6
    }
  ];
}

async function searchAllSuppliers(partNumber: string, partName?: string): Promise<SupplierPart[]> {
  const results = [
    ...(await searchAutoZone(partNumber, partName)),
    ...(await searchRockAuto(partNumber, partName)),
    ...(await searchAmazon(partNumber, partName))
  ];
  return results.sort((a, b) => a.price - b.price);
}

async function getPricingFromSupplier(supplier: string, partNumber: string): Promise<any> {
  switch (supplier) {
    case 'autozone':
      return { price: 8.99, estimatedDelivery: '1-2 days' };
    case 'rockauto':
      return { price: 7.49, estimatedDelivery: '3-5 days' };
    case 'amazon':
      return { price: 9.99, estimatedDelivery: '2 days' };
    default:
      return null;
  }
}

async function checkAutoZoneAvailability(partNumber: string): Promise<any> {
  return { inStock: true, quantity: 12, stores: 5 };
}

async function checkRockAutoAvailability(partNumber: string): Promise<any> {
  return { inStock: true, quantity: 8, warehouse: 'Central' };
}

async function checkAmazonAvailability(partNumber: string): Promise<any> {
  return { inStock: true, quantity: 25, prime: true };
}
