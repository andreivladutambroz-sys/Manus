/**
 * Reddit Collector Agent
 * Collects repair data from automotive subreddits
 */

export interface RedditPost {
  id: string;
  title: string;
  author: string;
  content: string;
  comments: RedditComment[];
  url: string;
  createdAt: number;
  upvotes: number;
}

export interface RedditComment {
  id: string;
  author: string;
  content: string;
  upvotes: number;
  createdAt: number;
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

class RedditCollector {
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
      // Simulate Reddit API calls
      const posts = await this.fetchRedditPosts();

      for (const post of posts) {
        try {
          await this.processPost(post);
          this.recordsCollected++;
        } catch (error) {
          console.error(`Failed to process post ${post.id}:`, error);
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

  private async fetchRedditPosts(): Promise<RedditPost[]> {
    // Simulated Reddit posts
    return [
      {
        id: "post-1",
        title: "P0171 System Too Lean - What should I check first?",
        author: "car_newbie",
        content:
          "My 2015 Honda Civic is throwing P0171 code. Rough idle and poor acceleration. Already cleaned the MAF sensor but code persists.",
        comments: [
          {
            id: "comment-1",
            author: "experienced_mechanic",
            content:
              "Check for vacuum leaks first. Use smoke test. If no leaks, check fuel pressure and injectors.",
            upvotes: 45,
            createdAt: Date.now() - 86400000,
          },
          {
            id: "comment-2",
            author: "diy_guy",
            content: "I had same issue. Turned out to be bad oxygen sensor. Replaced it and fixed.",
            upvotes: 32,
            createdAt: Date.now() - 72000000,
          },
        ],
        url: "https://reddit.com/r/MechanicAdvice/posts/p0171",
        createdAt: Date.now() - 172800000,
        upvotes: 127,
      },
      {
        id: "post-2",
        title: "P0420 Catalyst System - Expensive repair?",
        author: "budget_conscious",
        content:
          "Getting P0420 on my 2012 BMW 320d. Do I really need to replace the whole catalytic converter?",
        comments: [
          {
            id: "comment-3",
            author: "bmw_expert",
            content:
              "Check O2 sensors first. Often they fail before the cat. Much cheaper fix. If cat is bad, expect $800-2000 depending on model.",
            upvotes: 78,
            createdAt: Date.now() - 86400000,
          },
        ],
        url: "https://reddit.com/r/MechanicAdvice/posts/p0420",
        createdAt: Date.now() - 259200000,
        upvotes: 203,
      },
    ];
  }

  private async processPost(post: RedditPost): Promise<void> {
    const repairData = {
      source: this.sourceId,
      vehicle: this.extractVehicleInfo(post),
      errorCode: this.extractErrorCode(post),
      symptoms: this.extractSymptoms(post),
      repairSteps: this.extractRepairSteps(post),
      tools: this.extractTools(post),
      confidence: 0.82,
      timestamp: Date.now(),
    };

    console.log(`[RedditCollector] Processed post: ${post.id}`, repairData);
  }

  private extractVehicleInfo(post: RedditPost): Record<string, unknown> {
    const content = post.title + " " + post.content;
    const makeMatch = content.match(
      /\b(BMW|Honda|Ford|Volkswagen|Toyota|Nissan|Audi|Mercedes|Volvo|Chevrolet)\b/i
    );
    const modelMatch = content.match(/\b(320d|Civic|F-150|Golf|Camry|Sentra|A4|C-Class)\b/i);
    const yearMatch = content.match(/\b(19|20)\d{2}\b/);

    return {
      make: makeMatch ? makeMatch[1] : undefined,
      model: modelMatch ? modelMatch[1] : undefined,
      year: yearMatch ? parseInt(yearMatch[0]) : undefined,
    };
  }

  private extractErrorCode(post: RedditPost): string | undefined {
    const content = post.title + " " + post.content;
    const codeMatch = content.match(/\b(P\d{4}|U\d{4}|B\d{4}|C\d{4})\b/);
    return codeMatch ? codeMatch[1] : undefined;
  }

  private extractSymptoms(post: RedditPost): string[] {
    const content = post.title + " " + post.content;
    const symptoms: string[] = [];
    const symptomPatterns = [
      { pattern: /rough\s+idle/i, symptom: "rough idle" },
      { pattern: /poor\s+acceleration/i, symptom: "poor acceleration" },
      { pattern: /check\s+engine\s+light/i, symptom: "check engine light" },
      { pattern: /misfir/i, symptom: "misfire" },
      { pattern: /reduced\s+fuel\s+economy/i, symptom: "reduced fuel economy" },
    ];

    for (const { pattern, symptom } of symptomPatterns) {
      if (pattern.test(content)) {
        symptoms.push(symptom);
      }
    }

    return symptoms;
  }

  private extractRepairSteps(post: RedditPost): string[] {
    const allContent = post.content + " " + post.comments.map((c) => c.content).join(" ");
    const steps: string[] = [];
    const stepPatterns = [
      /check.*(?:O2|oxygen|sensor)/i,
      /replace.*(?:spark|plug|coil)/i,
      /inspect.*(?:exhaust|leak|vacuum)/i,
      /clean.*(?:fuel|injector|MAF)/i,
      /test.*(?:compression|voltage|pressure)/i,
    ];

    for (const pattern of stepPatterns) {
      if (pattern.test(allContent)) {
        const match = allContent.match(pattern);
        if (match) {
          steps.push(match[0]);
        }
      }
    }

    return steps;
  }

  private extractTools(post: RedditPost): string[] {
    const content = post.content + " " + post.comments.map((c) => c.content).join(" ");
    const tools: string[] = [];
    const toolPatterns = [
      { pattern: /diagnostic\s+scanner/i, tool: "diagnostic scanner" },
      { pattern: /multimeter/i, tool: "multimeter" },
      { pattern: /smoke\s+test/i, tool: "smoke tester" },
      { pattern: /compression\s+tester/i, tool: "compression tester" },
      { pattern: /socket\s+set/i, tool: "socket set" },
    ];

    for (const { pattern, tool } of toolPatterns) {
      if (pattern.test(content)) {
        tools.push(tool);
      }
    }

    return tools;
  }
}

export { RedditCollector };
