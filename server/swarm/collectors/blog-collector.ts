/**
 * Blog Collector Agent
 * Collects repair data from automotive blogs
 */

export interface BlogArticle {
  id: string;
  title: string;
  author: string;
  content: string;
  url: string;
  publishedAt: number;
  views: number;
}

export interface CollectorResult {
  agentId: string;
  sourceId: string;
  recordsCollected: number;
  recordsFailed: number;
  totalTime: number;
  status: "success" | "partial" | "failed";
  error?: string;
}

class BlogCollector {
  private agentId: string;
  private sourceId: string;
  private recordsCollected: number = 0;
  private recordsFailed: number = 0;

  constructor(agentId: string, sourceId: string) {
    this.agentId = agentId;
    this.sourceId = sourceId;
  }

  async collect(): Promise<CollectorResult> {
    const startTime = Date.now();

    try {
      const articles = await this.fetchBlogArticles();

      for (const article of articles) {
        try {
          await this.processArticle(article);
          this.recordsCollected++;
        } catch (error) {
          console.error(`Failed to process article ${article.id}:`, error);
          this.recordsFailed++;
        }
      }

      const totalTime = Date.now() - startTime;

      return {
        agentId: this.agentId,
        sourceId: this.sourceId,
        recordsCollected: this.recordsCollected,
        recordsFailed: this.recordsFailed,
        totalTime,
        status: this.recordsFailed === 0 ? "success" : "partial",
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;

      return {
        agentId: this.agentId,
        sourceId: this.sourceId,
        recordsCollected: this.recordsCollected,
        recordsFailed: this.recordsFailed,
        totalTime,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async fetchBlogArticles(): Promise<BlogArticle[]> {
    // Simulated blog articles
    return [
      {
        id: "article-1",
        title: "Understanding P0171 Code: System Too Lean",
        author: "John Smith",
        content:
          "P0171 code indicates the engine is running too lean. This means there's too much air and not enough fuel. Common causes include vacuum leaks, dirty MAF sensors, or faulty oxygen sensors. Start by checking for vacuum leaks using a smoke test. If no leaks found, clean the MAF sensor with specialized cleaner. If still persisting, test oxygen sensors with a multimeter.",
        url: "https://youcanic.com/p0171-system-too-lean",
        publishedAt: Date.now() - 259200000,
        views: 45000,
      },
      {
        id: "article-2",
        title: "P0420 Catalyst System Efficiency - Complete Guide",
        author: "Mike Johnson",
        content:
          "P0420 code means your catalytic converter efficiency is below threshold. Before replacing the expensive converter, check oxygen sensors first. They often fail before the cat. Use a diagnostic scanner to monitor O2 sensor readings. If readings are off, replace sensors ($200-400). If sensors are good, the catalytic converter likely needs replacement ($800-2000).",
        url: "https://autoservicecosts.com/p0420-catalyst",
        publishedAt: Date.now() - 172800000,
        views: 62000,
      },
    ];
  }

  private async processArticle(article: BlogArticle): Promise<void> {
    const repairData = {
      source: this.sourceId,
      vehicle: this.extractVehicleInfo(article),
      errorCode: this.extractErrorCode(article),
      symptoms: this.extractSymptoms(article),
      repairSteps: this.extractRepairSteps(article),
      tools: this.extractTools(article),
      estimatedCost: this.extractCost(article),
      confidence: 0.88,
      timestamp: Date.now(),
    };

    console.log(`[BlogCollector] Processed article: ${article.id}`, repairData);
  }

  private extractVehicleInfo(article: BlogArticle): Record<string, unknown> {
    const content = article.title + " " + article.content;
    const makeMatch = content.match(
      /\b(BMW|Honda|Ford|Volkswagen|Toyota|Nissan|Audi|Mercedes|Volvo|Chevrolet|any|all|universal)\b/i
    );
    const modelMatch = content.match(/\b(320d|Civic|F-150|Golf|Camry|Sentra|A4|C-Class)\b/i);

    return {
      make: makeMatch ? makeMatch[1] : "Universal",
      model: modelMatch ? modelMatch[1] : undefined,
    };
  }

  private extractErrorCode(article: BlogArticle): string | undefined {
    const codeMatch = article.title.match(/\b(P\d{4}|U\d{4}|B\d{4}|C\d{4})\b/);
    return codeMatch ? codeMatch[1] : undefined;
  }

  private extractSymptoms(article: BlogArticle): string[] {
    const content = article.title + " " + article.content;
    const symptoms: string[] = [];
    const symptomPatterns = [
      { pattern: /rough\s+idle/i, symptom: "rough idle" },
      { pattern: /poor\s+acceleration/i, symptom: "poor acceleration" },
      { pattern: /check\s+engine\s+light/i, symptom: "check engine light" },
      { pattern: /misfir/i, symptom: "misfire" },
      { pattern: /reduced\s+fuel\s+economy/i, symptom: "reduced fuel economy" },
      { pattern: /stalling/i, symptom: "stalling" },
      { pattern: /hesitation/i, symptom: "hesitation" },
      { pattern: /running\s+lean/i, symptom: "running lean" },
      { pattern: /running\s+rich/i, symptom: "running rich" },
    ];

    for (const { pattern, symptom } of symptomPatterns) {
      if (pattern.test(content)) {
        symptoms.push(symptom);
      }
    }

    return symptoms;
  }

  private extractRepairSteps(article: BlogArticle): string[] {
    const content = article.content;
    const steps: string[] = [];

    // Extract numbered steps
    const numberedSteps = content.match(/\d+\.\s+([^.]+)/g);
    if (numberedSteps) {
      steps.push(...numberedSteps.map((s) => s.replace(/^\d+\.\s+/, "").trim()));
    }

    // Extract common repair patterns
    const patterns = [
      /check.*(?:O2|oxygen|sensor)/i,
      /replace.*(?:spark|plug|coil|sensor|converter)/i,
      /inspect.*(?:exhaust|leak|vacuum|hose)/i,
      /clean.*(?:fuel|injector|MAF|sensor)/i,
      /test.*(?:compression|voltage|pressure|readings)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && !steps.includes(match[0])) {
        steps.push(match[0]);
      }
    }

    return steps.slice(0, 10); // Limit to 10 steps
  }

  private extractTools(article: BlogArticle): string[] {
    const content = article.content;
    const tools: string[] = [];
    const toolPatterns = [
      { pattern: /diagnostic\s+scanner/i, tool: "diagnostic scanner" },
      { pattern: /multimeter/i, tool: "multimeter" },
      { pattern: /smoke\s+test/i, tool: "smoke tester" },
      { pattern: /compression\s+tester/i, tool: "compression tester" },
      { pattern: /socket\s+set/i, tool: "socket set" },
      { pattern: /wrench/i, tool: "wrench" },
      { pattern: /screwdriver/i, tool: "screwdriver" },
      { pattern: /jack/i, tool: "jack" },
      { pattern: /jack\s+stands/i, tool: "jack stands" },
    ];

    for (const { pattern, tool } of toolPatterns) {
      if (pattern.test(content) && !tools.includes(tool)) {
        tools.push(tool);
      }
    }

    return tools;
  }

  private extractCost(article: BlogArticle): number | undefined {
    const costMatch = article.content.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (costMatch) {
      return parseFloat(costMatch[1].replace(/,/g, ""));
    }
    return undefined;
  }
}

export { BlogCollector };
