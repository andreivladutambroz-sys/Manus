/**
 * Diagnostic Router - Search and retrieve repair cases
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import mysql from "mysql2/promise";

const diagnosticRouter = router({
  /**
   * Search repair cases by error code, symptoms, or vehicle
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(2).max(100),
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const connection = await mysql.createConnection(process.env.DATABASE_URL!);

      try {
        const searchTerm = `%${input.query}%`;

        const [results] = await connection.execute(
          `
          SELECT 
            id,
            vehicleMake,
            vehicleModel,
            vehicleYear,
            errorCode,
            errorSystem,
            errorDescription,
            symptoms,
            repairAction,
            confidence,
            sourceType,
            sourceDomain,
            repairOutcome
          FROM repairCases
          WHERE 
            vehicleMake LIKE ? OR
            vehicleModel LIKE ? OR
            errorCode LIKE ? OR
            errorSystem LIKE ? OR
            errorDescription LIKE ?
          ORDER BY confidence DESC
          LIMIT ? OFFSET ?
          `,
          [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, input.limit, input.offset]
        );

        return {
          results: results as any[],
          count: (results as any[]).length,
          hasMore: (results as any[]).length === input.limit,
        };
      } finally {
        await connection.end();
      }
    }),

  /**
   * Get detailed repair case by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const connection = await mysql.createConnection(process.env.DATABASE_URL!);

      try {
        const [results] = await connection.execute(
          `SELECT * FROM repairCases WHERE id = ?`,
          [input.id]
        );

        const records = results as any[];
        if (records.length === 0) {
          throw new Error("Repair case not found");
        }

        const record = records[0];

        // Parse JSON fields
        return {
          ...record,
          symptoms: record.symptoms ? JSON.parse(record.symptoms) : [],
          toolsUsed: record.toolsUsed ? JSON.parse(record.toolsUsed) : [],
          partsNeeded: record.partsNeeded ? JSON.parse(record.partsNeeded) : [],
          evidenceSnippets: record.evidenceSnippets ? JSON.parse(record.evidenceSnippets) : [],
          rawJson: record.rawJson ? JSON.parse(record.rawJson) : {},
        };
      } finally {
        await connection.end();
      }
    }),

  /**
   * Get repair cases by vehicle make/model
   */
  byVehicle: publicProcedure
    .input(
      z.object({
        make: z.string(),
        model: z.string(),
        year: z.number().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const connection = await mysql.createConnection(process.env.DATABASE_URL!);

      try {
        let query = `
          SELECT 
            id,
            vehicleMake,
            vehicleModel,
            vehicleYear,
            errorCode,
            errorSystem,
            symptoms,
            confidence,
            repairOutcome
          FROM repairCases
          WHERE vehicleMake = ? AND vehicleModel = ?
        `;

        const params: any[] = [input.make, input.model];

        if (input.year) {
          query += ` AND vehicleYear = ?`;
          params.push(input.year);
        }

        query += ` ORDER BY confidence DESC LIMIT ?`;
        params.push(input.limit);

        const [results] = await connection.execute(query, params);

        return results as any[];
      } finally {
        await connection.end();
      }
    }),

  /**
   * Get repair cases by error code
   */
  byErrorCode: publicProcedure
    .input(
      z.object({
        errorCode: z.string(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const connection = await mysql.createConnection(process.env.DATABASE_URL!);

      try {
        const [results] = await connection.execute(
          `
          SELECT 
            id,
            vehicleMake,
            vehicleModel,
            errorCode,
            errorSystem,
            errorDescription,
            symptoms,
            repairAction,
            confidence,
            sourceType
          FROM repairCases
          WHERE errorCode = ?
          ORDER BY confidence DESC
          LIMIT ?
          `,
          [input.errorCode, input.limit]
        );

        return results as any[];
      } finally {
        await connection.end();
      }
    }),

  /**
   * Get statistics about repair cases
   */
  stats: publicProcedure.query(async () => {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    try {
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as totalCases,
          COUNT(DISTINCT vehicleMake) as uniqueMakes,
          COUNT(DISTINCT vehicleModel) as uniqueModels,
          COUNT(DISTINCT errorCode) as uniqueErrorCodes,
          COUNT(DISTINCT sourceType) as sourceTypes,
          AVG(confidence) as avgConfidence,
          MIN(vehicleYear) as minYear,
          MAX(vehicleYear) as maxYear
        FROM repairCases
      `);

      return (stats as any[])[0];
    } finally {
      await connection.end();
    }
  }),

  /**
   * Get popular error codes
   */
  popularErrors: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const connection = await mysql.createConnection(process.env.DATABASE_URL!);

      try {
        const [results] = await connection.execute(
          `
          SELECT 
            errorCode,
            errorSystem,
            COUNT(*) as count,
            AVG(confidence) as avgConfidence
          FROM repairCases
          WHERE errorCode IS NOT NULL
          GROUP BY errorCode, errorSystem
          ORDER BY count DESC
          LIMIT ?
          `,
          [input.limit]
        );

        return results as any[];
      } finally {
        await connection.end();
      }
    }),
});

export default diagnosticRouter;
