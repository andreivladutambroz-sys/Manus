/**
 * Source Discovery System
 * Discovers and scores new data sources
 */

export interface Source {
  id: string;
  url: string;
  name: string;
  type: "forum" | "reddit" | "manual" | "blog" | "video" | "obd";
  category: string;
  reliability: number; // 0-1
  lastCrawled?: number;
  recordsCollected: number;
  status: "active" | "blocked" | "cooldown";
  cooldownUntil?: number;
}

class SourceDiscovery {
  private sources: Map<string, Source> = new Map();
  private blacklist: Set<string> = new Set();
  private cooldowns: Map<string, number> = new Map();

  constructor() {
    this.initializeSeeds();
  }

  /**
   * Initialize with seed sources
   */
  private initializeSeeds(): void {
    const seeds: Source[] = [
      // Forums
      {
        id: "forum-1",
        url: "https://www.bimmerpost.com",
        name: "BimmerPost",
        type: "forum",
        category: "BMW",
        reliability: 0.95,
        recordsCollected: 0,
        status: "active",
      },
      {
        id: "forum-2",
        url: "https://www.vwvortex.com",
        name: "VW Vortex",
        type: "forum",
        category: "Volkswagen",
        reliability: 0.93,
        recordsCollected: 0,
        status: "active",
      },
      {
        id: "forum-3",
        url: "https://www.fordmuscleforums.com",
        name: "Ford Muscle Forums",
        type: "forum",
        category: "Ford",
        reliability: 0.90,
        recordsCollected: 0,
        status: "active",
      },

      // Reddit
      {
        id: "reddit-1",
        url: "https://www.reddit.com/r/MechanicAdvice",
        name: "r/MechanicAdvice",
        type: "reddit",
        category: "General",
        reliability: 0.88,
        recordsCollected: 0,
        status: "active",
      },
      {
        id: "reddit-2",
        url: "https://www.reddit.com/r/Cartalk",
        name: "r/Cartalk",
        type: "reddit",
        category: "General",
        reliability: 0.85,
        recordsCollected: 0,
        status: "active",
      },

      // Service Manuals
      {
        id: "manual-1",
        url: "https://www.ifixit.com",
        name: "iFixit",
        type: "manual",
        category: "General",
        reliability: 0.92,
        recordsCollected: 0,
        status: "active",
      },
      {
        id: "manual-2",
        url: "https://www.manualslib.com",
        name: "ManualsLib",
        type: "manual",
        category: "General",
        reliability: 0.89,
        recordsCollected: 0,
        status: "active",
      },

      // OBD Codes
      {
        id: "obd-1",
        url: "https://www.obd-codes.com",
        name: "OBD Codes",
        type: "obd",
        category: "Error Codes",
        reliability: 0.98,
        recordsCollected: 0,
        status: "active",
      },

      // Blogs
      {
        id: "blog-1",
        url: "https://www.youcanic.com",
        name: "YouCanic",
        type: "blog",
        category: "General",
        reliability: 0.87,
        recordsCollected: 0,
        status: "active",
      },
      {
        id: "blog-2",
        url: "https://www.autoservicecosts.com",
        name: "Auto Service Costs",
        type: "blog",
        category: "Costs",
        reliability: 0.84,
        recordsCollected: 0,
        status: "active",
      },

      // Videos
      {
        id: "video-1",
        url: "https://www.youtube.com/@ChrisFix",
        name: "ChrisFix",
        type: "video",
        category: "DIY",
        reliability: 0.91,
        recordsCollected: 0,
        status: "active",
      },
      {
        id: "video-2",
        url: "https://www.youtube.com/@EricTheCarGuy",
        name: "EricTheCarGuy",
        type: "video",
        category: "DIY",
        reliability: 0.90,
        recordsCollected: 0,
        status: "active",
      },
    ];

    seeds.forEach((source) => this.sources.set(source.id, source));
  }

  /**
   * Add source
   */
  addSource(source: Source): void {
    if (this.blacklist.has(source.url)) {
      throw new Error(`Source ${source.url} is blacklisted`);
    }
    this.sources.set(source.id, source);
  }

  /**
   * Get all active sources
   */
  getActiveSources(): Source[] {
    return Array.from(this.sources.values()).filter((s) => s.status === "active");
  }

  /**
   * Get sources by type
   */
  getSourcesByType(type: Source["type"]): Source[] {
    return Array.from(this.sources.values()).filter((s) => s.type === type);
  }

  /**
   * Score source (for discovery)
   */
  scoreSource(source: Partial<Source>): number {
    let score = 0.5; // Base score

    // Reliability
    if (source.reliability) {
      score += source.reliability * 0.3;
    }

    // Records collected
    if (source.recordsCollected !== undefined) {
      score += Math.min(source.recordsCollected / 1000, 1) * 0.2;
    }

    // Type bonus
    const typeBonus: Record<Source["type"], number> = {
      obd: 0.2,
      manual: 0.15,
      forum: 0.1,
      reddit: 0.08,
      blog: 0.05,
      video: 0.02,
    };
    if (source.type) {
      score += typeBonus[source.type] || 0;
    }

    return Math.min(score, 1);
  }

  /**
   * Blacklist source
   */
  blacklistSource(url: string): void {
    this.blacklist.add(url);
    // Remove from active sources
    Array.from(this.sources.values()).forEach((source) => {
      if (source.url === url) {
        source.status = "blocked";
      }
    });
  }

  /**
   * Set cooldown for source
   */
  setCooldown(sourceId: string, durationMs: number): void {
    const source = this.sources.get(sourceId);
    if (!source) throw new Error(`Source ${sourceId} not found`);

    source.status = "cooldown";
    source.cooldownUntil = Date.now() + durationMs;
    this.cooldowns.set(sourceId, source.cooldownUntil);
  }

  /**
   * Check if source is in cooldown
   */
  isInCooldown(sourceId: string): boolean {
    const cooldownUntil = this.cooldowns.get(sourceId);
    if (!cooldownUntil) return false;

    if (Date.now() > cooldownUntil) {
      const source = this.sources.get(sourceId);
      if (source) {
        source.status = "active";
      }
      this.cooldowns.delete(sourceId);
      return false;
    }

    return true;
  }

  /**
   * Update source stats
   */
  updateSourceStats(sourceId: string, recordsCollected: number): void {
    const source = this.sources.get(sourceId);
    if (!source) throw new Error(`Source ${sourceId} not found`);

    source.recordsCollected += recordsCollected;
    source.lastCrawled = Date.now();
  }

  /**
   * Get source statistics
   */
  getStats(): {
    totalSources: number;
    activeSources: number;
    blockedSources: number;
    cooldownSources: number;
    totalRecords: number;
    avgRecordsPerSource: number;
  } {
    const allSources = Array.from(this.sources.values());
    const activeSources = allSources.filter((s) => s.status === "active").length;
    const blockedSources = allSources.filter((s) => s.status === "blocked").length;
    const cooldownSources = allSources.filter((s) => s.status === "cooldown").length;
    const totalRecords = allSources.reduce((sum, s) => sum + s.recordsCollected, 0);

    return {
      totalSources: allSources.length,
      activeSources,
      blockedSources,
      cooldownSources,
      totalRecords,
      avgRecordsPerSource: totalRecords / allSources.length,
    };
  }

  /**
   * Get all sources
   */
  getAllSources(): Source[] {
    return Array.from(this.sources.values());
  }
}

export const sourceDiscovery = new SourceDiscovery();
