/**
 * Image Upload Router
 * Handles vehicle image uploads and VIN extraction
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { kimiVisionService } from "../services/kimi-vision.service";
import { vinDecoderService } from "../services/vin-decoder.service";

export const imageUploadRouter = router({
  /**
   * Extract vehicle info from image
   * Accepts image URL and returns extracted VIN, make, model, year, etc.
   */
  extractVehicleInfo: publicProcedure
    .input(
      z.object({
        imageUrl: z.string().url("Invalid image URL"),
      })
    )
    .mutation(async ({ input }: { input: { imageUrl: string } }) => {
      try {
        const result = await kimiVisionService.extractVehicleInfo(
          input.imageUrl
        );

        if (!result.success) {
          return {
            success: false,
            error: result.error || "Failed to extract vehicle information",
          };
        }

        // If VIN was extracted, decode it for additional info
        if (result.vin) {
          try {
            const vinData = vinDecoderService.decode(result.vin);
            return {
              success: true,
              vin: result.vin,
              make: result.make || vinData.make,
              model: result.model || vinData.model,
              year: result.year || vinData.year,
              engineType: result.engineType || vinData.engine,
              bodyType: vinData.bodyType,
              driveType: vinData.driveType,
              licensePlate: result.licensePlate,
              confidence: result.confidence,
            };
          } catch (error) {
            // VIN decode failed, return what we extracted
            return result;
          }
        }

        return result;
      } catch (error) {
        console.error("Extract vehicle info error:", error);
        return {
          success: false,
          confidence: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Extract VIN from image
   */
  extractVIN: publicProcedure
    .input(
      z.object({
        imageUrl: z.string().url("Invalid image URL"),
      })
    )
    .mutation(async ({ input }: { input: { imageUrl: string } }) => {
      try {
        const vin = await kimiVisionService.extractVIN(input.imageUrl);

        if (!vin) {
          return {
            success: false,
            error: "Could not extract VIN from image",
          };
        }

        // Decode VIN
        try {
          const vinData = vinDecoderService.decode(vin);
          return {
            success: true,
            vin,
            make: vinData.make,
            model: vinData.model,
            year: vinData.year,
            engine: vinData.engine,
            bodyType: vinData.bodyType,
            driveType: vinData.driveType,
          };
        } catch (error) {
        return {
          success: true,
          vin,
        };
        }
      } catch (error) {
        console.error("Extract VIN error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Extract license plate from image
   */
  extractLicensePlate: publicProcedure
    .input(
      z.object({
        imageUrl: z.string().url("Invalid image URL"),
      })
    )
    .mutation(async ({ input }: { input: { imageUrl: string } }) => {
      try {
        const plate = await kimiVisionService.extractLicensePlate(
          input.imageUrl
        );

        if (!plate) {
          return {
            success: false,
            error: "Could not extract license plate from image",
          };
        }

        return {
          success: true,
          licensePlate: plate,
        };
      } catch (error) {
        console.error("Extract license plate error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
});
