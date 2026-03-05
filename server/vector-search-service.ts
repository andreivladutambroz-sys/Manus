/**
 * Vector Search Service
 * Generates embeddings for procedures and performs semantic search
 * Uses OpenAI text-embedding-3-small (1536 dimensions)
 */

import { Pool } from "pg";
import fetch from "node-fetch";

interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage: {
    prompt_tokens: number;
  };
}

interface SearchResult {
  procedure_id: string;
  title: string;
  description: string;
  similarity_score: number;
  difficulty_level: string;
  estimated_time_minutes: number;
}

export class VectorSearchService {
  private pool: Pool;
  private openaiApiKey: string;
  private openaiModel = "text-embedding-3-small";
  private embeddingDimensions = 1536;

  constructor(postgresUrl: string, openaiApiKey: string) {
    this.pool = new Pool({
      connectionString: postgresUrl,
      max: 5,
    });
    this.openaiApiKey = openaiApiKey;
  }

  /**
   * Generate embedding for text using OpenAI API
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/embeddings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.openaiApiKey}`,
          },
          body: JSON.stringify({
            input: text,
            model: this.openaiModel,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      return data.data[0].embedding;
    } catch (error) {
      console.error("[VectorSearch] Error generating embedding:", error);
      throw error;
    }
  }

  /**
   * Embed a procedure and store in database
   */
  async embedProcedure(procedureId: number, contentText: string): Promise<void> {
    try {
      console.log(
        `[VectorSearch] Embedding procedure ${procedureId}...`
      );

      const embedding = await this.generateEmbedding(contentText);

      const client = await this.pool.connect();
      try {
        // Convert array to PostgreSQL vector format
        const vectorString = `[${embedding.join(",")}]`;

        await client.query(
          `INSERT INTO embeddings_procedures (procedure_id, content_text, embedding, embedding_model)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (procedure_id) DO UPDATE SET embedding = $3, embedding_timestamp = NOW()`,
          [procedureId, contentText, vectorString, this.openaiModel]
        );

        console.log(
          `[VectorSearch] ✅ Embedded procedure ${procedureId}`
        );
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(
        `[VectorSearch] Error embedding procedure ${procedureId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Semantic search for procedures
   * Returns top N most similar procedures
   */
  async semanticSearch(
    query: string,
    limit = 5,
    similarityThreshold = 0.5
  ): Promise<SearchResult[]> {
    try {
      console.log(
        `[VectorSearch] Searching for: "${query}"`
      );

      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);
      const vectorString = `[${queryEmbedding.join(",")}]`;

      const client = await this.pool.connect();
      try {
        // Use PostgreSQL vector similarity search (cosine distance)
        const result = await client.query(
          `SELECT
            ep.procedure_id,
            p.title,
            p.description,
            p.difficulty_level,
            p.estimated_time_minutes,
            1 - (ep.embedding <=> $1::vector) as similarity_score
          FROM embeddings_procedures ep
          JOIN procedures p ON p.id = ep.procedure_id
          WHERE 1 - (ep.embedding <=> $1::vector) > $2
          ORDER BY similarity_score DESC
          LIMIT $3`,
          [vectorString, similarityThreshold, limit]
        );

        return result.rows.map((row) => ({
          procedure_id: row.procedure_id,
          title: row.title,
          description: row.description,
          similarity_score: parseFloat(row.similarity_score),
          difficulty_level: row.difficulty_level,
          estimated_time_minutes: row.estimated_time_minutes,
        }));
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("[VectorSearch] Error in semantic search:", error);
      throw error;
    }
  }

  /**
   * Batch embed all procedures
   */
  async embedAllProcedures(): Promise<number> {
    try {
      const client = await this.pool.connect();
      try {
        // Get all procedures without embeddings
        const result = await client.query(
          `SELECT p.id, p.title, p.description
           FROM procedures p
           LEFT JOIN embeddings_procedures ep ON ep.procedure_id = p.id
           WHERE ep.id IS NULL
           LIMIT 100`
        );

        const procedures = result.rows;
        console.log(
          `[VectorSearch] Embedding ${procedures.length} procedures...`
        );

        let embedded = 0;
        for (const proc of procedures) {
          const contentText = `${proc.title}. ${proc.description || ""}`;

          try {
            await this.embedProcedure(proc.id, contentText);
            embedded++;

            // Rate limiting: 1 second between API calls
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(
              `[VectorSearch] Failed to embed procedure ${proc.id}:`,
              error
            );
          }
        }

        console.log(
          `[VectorSearch] ✅ Embedded ${embedded}/${procedures.length} procedures`
        );
        return embedded;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("[VectorSearch] Error batch embedding:", error);
      throw error;
    }
  }

  /**
   * Find similar procedures to a given procedure
   */
  async findSimilarProcedures(
    procedureId: number,
    limit = 5
  ): Promise<SearchResult[]> {
    try {
      const client = await this.pool.connect();
      try {
        // Get the embedding of the source procedure
        const sourceResult = await client.query(
          `SELECT embedding FROM embeddings_procedures WHERE procedure_id = $1`,
          [procedureId]
        );

        if (sourceResult.rows.length === 0) {
          return [];
        }

        const sourceEmbedding = sourceResult.rows[0].embedding;

        // Find similar procedures
        const result = await client.query(
          `SELECT
            ep.procedure_id,
            p.title,
            p.description,
            p.difficulty_level,
            p.estimated_time_minutes,
            1 - (ep.embedding <=> $1::vector) as similarity_score
          FROM embeddings_procedures ep
          JOIN procedures p ON p.id = ep.procedure_id
          WHERE ep.procedure_id != $2
          ORDER BY similarity_score DESC
          LIMIT $3`,
          [sourceEmbedding, procedureId, limit]
        );

        return result.rows.map((row) => ({
          procedure_id: row.procedure_id,
          title: row.title,
          description: row.description,
          similarity_score: parseFloat(row.similarity_score),
          difficulty_level: row.difficulty_level,
          estimated_time_minutes: row.estimated_time_minutes,
        }));
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(
        "[VectorSearch] Error finding similar procedures:",
        error
      );
      throw error;
    }
  }

  /**
   * Get embedding statistics
   */
  async getStats(): Promise<{
    totalProcedures: number;
    embeddedProcedures: number;
    pendingProcedures: number;
  }> {
    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query(
          `SELECT
            (SELECT COUNT(*) FROM procedures) as total,
            (SELECT COUNT(*) FROM embeddings_procedures) as embedded`
        );

        const { total, embedded } = result.rows[0];

        return {
          totalProcedures: parseInt(total),
          embeddedProcedures: parseInt(embedded),
          pendingProcedures: parseInt(total) - parseInt(embedded),
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("[VectorSearch] Error getting stats:", error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default VectorSearchService;
