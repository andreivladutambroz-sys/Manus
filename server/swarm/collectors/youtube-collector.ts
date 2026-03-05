/**
 * YouTube Collector Agent
 * Collects repair data from automotive YouTube channels
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  description: string;
  transcript: string;
  url: string;
  views: number;
  likes: number;
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

class YouTubeCollector {
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
      const videos = await this.fetchYouTubeVideos();

      for (const video of videos) {
        try {
          await this.processVideo(video);
          this.recordsCollected++;
        } catch (error) {
          console.error(`Failed to process video ${video.id}:`, error);
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

  private async fetchYouTubeVideos(): Promise<YouTubeVideo[]> {
    // Simulated YouTube videos
    return [
      {
        id: "vid-1",
        title: "How to Fix P0420 Catalyst System Error Code",
        channel: "ChrisFix",
        description: "Complete guide to diagnosing and fixing P0420 error code on any vehicle",
        transcript:
          "In this video we'll show you how to diagnose P0420 code. First check your oxygen sensors. If they're bad, replace them. If that doesn't work, check the catalytic converter.",
        url: "https://youtube.com/watch?v=p0420fix",
        views: 250000,
        likes: 8500,
        createdAt: Date.now() - 86400000,
      },
      {
        id: "vid-2",
        title: "P0300 Random Misfire - Complete Diagnosis",
        channel: "EricTheCarGuy",
        description: "Step-by-step guide to finding the cause of P0300 misfire code",
        transcript:
          "P0300 means random misfire detected. Could be spark plugs, ignition coils, fuel injectors, or compression issues. Let's test each one systematically.",
        url: "https://youtube.com/watch?v=p0300misfire",
        views: 180000,
        likes: 6200,
        createdAt: Date.now() - 172800000,
      },
    ];
  }

  private async processVideo(video: YouTubeVideo): Promise<void> {
    const repairData = {
      source: this.sourceId,
      vehicle: this.extractVehicleInfo(video),
      errorCode: this.extractErrorCode(video),
      symptoms: this.extractSymptoms(video),
      repairSteps: this.extractRepairSteps(video),
      tools: this.extractTools(video),
      confidence: 0.85,
      timestamp: Date.now(),
    };

    console.log(`[YouTubeCollector] Processed video: ${video.id}`, repairData);
  }

  private extractVehicleInfo(video: YouTubeVideo): Record<string, unknown> {
    const content = video.title + " " + video.description + " " + video.transcript;
    const makeMatch = content.match(
      /\b(BMW|Honda|Ford|Volkswagen|Toyota|Nissan|Audi|Mercedes|Volvo|Chevrolet|any|all)\b/i
    );
    const modelMatch = content.match(/\b(320d|Civic|F-150|Golf|Camry|Sentra|A4|C-Class)\b/i);
    const yearMatch = content.match(/\b(19|20)\d{2}\b/);

    return {
      make: makeMatch ? makeMatch[1] : "Universal",
      model: modelMatch ? modelMatch[1] : undefined,
      year: yearMatch ? parseInt(yearMatch[0]) : undefined,
    };
  }

  private extractErrorCode(video: YouTubeVideo): string | undefined {
    const content = video.title + " " + video.description;
    const codeMatch = content.match(/\b(P\d{4}|U\d{4}|B\d{4}|C\d{4})\b/);
    return codeMatch ? codeMatch[1] : undefined;
  }

  private extractSymptoms(video: YouTubeVideo): string[] {
    const content = video.title + " " + video.description + " " + video.transcript;
    const symptoms: string[] = [];
    const symptomPatterns = [
      { pattern: /rough\s+idle/i, symptom: "rough idle" },
      { pattern: /poor\s+acceleration/i, symptom: "poor acceleration" },
      { pattern: /check\s+engine\s+light/i, symptom: "check engine light" },
      { pattern: /misfir/i, symptom: "misfire" },
      { pattern: /reduced\s+fuel\s+economy/i, symptom: "reduced fuel economy" },
      { pattern: /stalling/i, symptom: "stalling" },
      { pattern: /hesitation/i, symptom: "hesitation" },
    ];

    for (const { pattern, symptom } of symptomPatterns) {
      if (pattern.test(content)) {
        symptoms.push(symptom);
      }
    }

    return symptoms;
  }

  private extractRepairSteps(video: YouTubeVideo): string[] {
    const content = video.transcript;
    const steps: string[] = [];
    const stepPatterns = [
      /check.*(?:O2|oxygen|sensor)/i,
      /replace.*(?:spark|plug|coil)/i,
      /inspect.*(?:exhaust|leak|vacuum)/i,
      /clean.*(?:fuel|injector|MAF)/i,
      /test.*(?:compression|voltage|pressure)/i,
      /diagnose/i,
      /fix/i,
      /repair/i,
    ];

    for (const pattern of stepPatterns) {
      if (pattern.test(content)) {
        const match = content.match(pattern);
        if (match) {
          steps.push(match[0]);
        }
      }
    }

    return steps;
  }

  private extractTools(video: YouTubeVideo): string[] {
    const content = video.transcript;
    const tools: string[] = [];
    const toolPatterns = [
      { pattern: /diagnostic\s+scanner/i, tool: "diagnostic scanner" },
      { pattern: /multimeter/i, tool: "multimeter" },
      { pattern: /smoke\s+test/i, tool: "smoke tester" },
      { pattern: /compression\s+tester/i, tool: "compression tester" },
      { pattern: /socket\s+set/i, tool: "socket set" },
      { pattern: /wrench/i, tool: "wrench" },
      { pattern: /screwdriver/i, tool: "screwdriver" },
    ];

    for (const { pattern, tool } of toolPatterns) {
      if (pattern.test(content)) {
        tools.push(tool);
      }
    }

    return tools;
  }
}

export { YouTubeCollector };
