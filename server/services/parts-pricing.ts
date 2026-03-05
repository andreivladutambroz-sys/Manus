/**
 * Real Parts Pricing Integration Service
 * Fetches verified parts pricing from trusted suppliers:
 * - Autodoc.eu API
 * - Autodata OEM database
 * - eBay Motors API
 * - Local market APIs
 */

export interface PartsPricingSource {
  name: string;
  url: string;
  price: number;
  currency: string;
  availability: "in_stock" | "order" | "discontinued";
  lastUpdated: Date;
  confidence: number; // 0-100
}

export interface PartsPricingResult {
  partName: string;
  oemCode: string;
  aftermarketCode?: string;
  sources: PartsPricingSource[];
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  currency: string;
  bestSource: PartsPricingSource;
  verified: boolean;
}

/**
 * Fetch parts from Autodoc API
 */
export async function fetchFromAutodoc(
  brand: string,
  model: string,
  year: number,
  partName: string
): Promise<PartsPricingSource[]> {
  try {
    // Autodoc API endpoint (requires API key)
    const autodocApiKey = process.env.AUTODOC_API_KEY;
    if (!autodocApiKey) {
      console.warn("AUTODOC_API_KEY not configured");
      return [];
    }

    const response = await fetch(
      `https://api.autodoc.eu/v1/parts/search`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${autodocApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand,
          model,
          year,
          partName,
        }),
      }
    );

    if (!response.ok) {
      console.error("Autodoc API error:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.results?.map((item: any) => ({
      name: "Autodoc",
      url: `https://www.autodoc.eu/parts/${item.id}`,
      price: item.price,
      currency: item.currency || "EUR",
      availability: item.availability || "order",
      lastUpdated: new Date(),
      confidence: 95, // Autodoc is highly trusted
    })) || [];
  } catch (error) {
    console.error("Autodoc fetch error:", error);
    return [];
  }
}

/**
 * Fetch parts from Autodata database
 */
export async function fetchFromAutodata(
  brand: string,
  model: string,
  year: number,
  partName: string
): Promise<PartsPricingSource[]> {
  try {
    // Autodata API endpoint (requires subscription)
    const autodataApiKey = process.env.AUTODATA_API_KEY;
    if (!autodataApiKey) {
      console.warn("AUTODATA_API_KEY not configured");
      return [];
    }

    const response = await fetch(
      `https://api.autodata.com/v1/parts`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${autodataApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand,
          model,
          year,
          partName,
        }),
      }
    );

    if (!response.ok) {
      console.error("Autodata API error:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.parts?.map((item: any) => ({
      name: "Autodata",
      url: `https://www.autodata.com/parts/${item.id}`,
      price: item.listPrice,
      currency: "EUR",
      availability: "in_stock",
      lastUpdated: new Date(),
      confidence: 98, // Autodata is OEM official
    })) || [];
  } catch (error) {
    console.error("Autodata fetch error:", error);
    return [];
  }
}

/**
 * Fetch parts from eBay Motors
 */
export async function fetchFromEBayMotors(
  brand: string,
  model: string,
  partName: string
): Promise<PartsPricingSource[]> {
  try {
    const ebayApiKey = process.env.EBAY_API_KEY;
    if (!ebayApiKey) {
      console.warn("EBAY_API_KEY not configured");
      return [];
    }

    const searchQuery = `${brand} ${model} ${partName}`;
    const response = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchQuery)}&category_ids=6024&limit=5`,
      {
        headers: {
          "Authorization": `Bearer ${ebayApiKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error("eBay API error:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.itemSummaries?.map((item: any) => ({
      name: "eBay Motors",
      url: item.itemWebUrl,
      price: parseFloat(item.price?.value || "0"),
      currency: item.price?.currency || "EUR",
      availability: item.itemCondition === "NEW" ? "in_stock" : "order",
      lastUpdated: new Date(),
      confidence: 75, // eBay has variable sellers
    })) || [];
  } catch (error) {
    console.error("eBay fetch error:", error);
    return [];
  }
}

/**
 * Fetch parts from local market APIs (e.g., OLX, Emag)
 */
export async function fetchFromLocalMarkets(
  brand: string,
  model: string,
  partName: string
): Promise<PartsPricingSource[]> {
  const sources: PartsPricingSource[] = [];

  try {
    // Example: Emag API
    const emagApiKey = process.env.EMAG_API_KEY;
    if (emagApiKey) {
      const response = await fetch(
        `https://api.emag.ro/v1/products/search`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${emagApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `${brand} ${model} ${partName}`,
            category: "auto-parts",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        data.products?.forEach((item: any) => {
          sources.push({
            name: "Emag",
            url: item.url,
            price: item.price,
            currency: "RON",
            availability: item.inStock ? "in_stock" : "order",
            lastUpdated: new Date(),
            confidence: 85,
          });
        });
      }
    }
  } catch (error) {
    console.error("Local market fetch error:", error);
  }

  return sources;
}

/**
 * Get comprehensive parts pricing from all sources
 */
export async function getPartsPricing(
  brand: string,
  model: string,
  year: number,
  partName: string,
  oemCode?: string
): Promise<PartsPricingResult> {
  // Fetch from all sources in parallel
  const [autodocResults, autodataResults, ebayResults, localResults] = await Promise.all([
    fetchFromAutodoc(brand, model, year, partName),
    fetchFromAutodata(brand, model, year, partName),
    fetchFromEBayMotors(brand, model, partName),
    fetchFromLocalMarkets(brand, model, partName),
  ]);

  const allSources = [...autodocResults, ...autodataResults, ...ebayResults, ...localResults];

  if (allSources.length === 0) {
    return {
      partName,
      oemCode: oemCode || "UNKNOWN",
      sources: [],
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      currency: "EUR",
      bestSource: {
        name: "No sources found",
        url: "",
        price: 0,
        currency: "EUR",
        availability: "discontinued",
        lastUpdated: new Date(),
        confidence: 0,
      },
      verified: false,
    };
  }

  // Sort by confidence and price
  const sortedSources = allSources.sort((a, b) => {
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence;
    }
    return a.price - b.price;
  });

  // Calculate statistics
  const prices = allSources.map((s) => s.price).filter((p) => p > 0);
  const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    partName,
    oemCode: oemCode || "UNKNOWN",
    sources: sortedSources,
    averagePrice: Math.round(averagePrice * 100) / 100,
    minPrice,
    maxPrice,
    currency: "EUR",
    bestSource: sortedSources[0],
    verified: sortedSources.length > 0 && sortedSources[0].confidence >= 75,
  };
}

/**
 * Get multiple parts pricing
 */
export async function getMultiplePartsPricing(
  brand: string,
  model: string,
  year: number,
  parts: Array<{ name: string; oemCode?: string }>
): Promise<PartsPricingResult[]> {
  return Promise.all(
    parts.map((part) =>
      getPartsPricing(brand, model, year, part.name, part.oemCode)
    )
  );
}

/**
 * Cache parts pricing to avoid repeated API calls
 */
const pricingCache = new Map<string, { data: PartsPricingResult; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedPartsPricing(
  brand: string,
  model: string,
  year: number,
  partName: string,
  oemCode?: string
): Promise<PartsPricingResult> {
  const cacheKey = `${brand}-${model}-${year}-${partName}`;
  const cached = pricingCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const result = await getPartsPricing(brand, model, year, partName, oemCode);
  pricingCache.set(cacheKey, { data: result, timestamp: Date.now() });

  return result;
}

/**
 * Format pricing result for display
 */
export function formatPricingResult(result: PartsPricingResult): string {
  if (result.sources.length === 0) {
    return `${result.partName}: Nu au fost găsite surse de preț verificate`;
  }

  const sourcesList = result.sources
    .slice(0, 3)
    .map((s) => `• ${s.name}: ${s.price} ${s.currency} (${s.availability}) - [Link](${s.url})`)
    .join("\n");

  return `
**${result.partName}** (${result.oemCode})
Preț mediu: ${result.averagePrice} ${result.currency}
Interval: ${result.minPrice} - ${result.maxPrice} ${result.currency}
Sursa recomandată: ${result.bestSource.name}

**Surse verificate:**
${sourcesList}

**Status:** ${result.verified ? "✅ Verificat" : "⚠️ Neverificat"}
`;
}
