import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { DEFAULT_SEARCH_RADIUS_KM } from './constants';
import { searchImages } from './search-images';

/**
 * Shared tool definition for search_photo_albums
 * Used by both SSE and stdio servers to ensure consistency
 */

export const TOOL_NAME = 'search_photo_albums';

export const TOOL_DESCRIPTION = 'Search through our photo albums using natural language queries. Find photos by description, locations, objects, or any visual content. Optionally filter by location using place names (e.g., "Paris", "New York", "Tokyo").';

export const toolInputSchema = {
  query: z.string().describe('Natural language description of what you want to find in the photos (e.g., "sunset over mountains", "people at the beach", "dogs playing")'),
  limit: z.number().describe('Maximum number of photos to return').min(1).max(10).default(5),
  location: z.string().optional().describe('Optional location to filter photos by (e.g., "Paris, France", "Tokyo", "Central Park New York"). Uses Nominatim geocoding.'),
  radiusKm: z.number().min(0.1).max(500).default(DEFAULT_SEARCH_RADIUS_KM).describe(`Search radius in kilometers around the location (default: ${DEFAULT_SEARCH_RADIUS_KM}km). Only used when location is specified.`)
};

export type ToolInput = {
  query: string;
  limit: number;
  location?: string;
  radiusKm?: number;
};

/**
 * Shared handler function for the search_photo_albums tool
 */
export async function handleSearchPhotoAlbums({ query, limit, location, radiusKm }: ToolInput): Promise<CallToolResult> {
  try {
    const effectiveRadius = radiusKm ?? DEFAULT_SEARCH_RADIUS_KM;
    const locationInfo = location ? ` near "${location}" (radius: ${effectiveRadius}km)` : '';
    console.log(`🔍 Searching photo albums for: "${query}"${locationInfo} (limit: ${limit})`);

    // Perform the search
    const results = await searchImages(query, {
      limit,
      location,
      radiusKm
    });

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No photos found matching "${query}". Try a different search term or check if photos have been uploaded to the collection.`,
          },
        ],
      };
    }

    // Format the results
    const formattedResults = results.map((result, index) => {
      const coordInfo = result.coordinates
        ? `📍 Location: ${result.coordinates.latitude.toFixed(6)}, ${result.coordinates.longitude.toFixed(6)}`
        : '📍 Location: No GPS data available';

      const similarityInfo = result.score !== undefined
        ? `🎯 Similarity: ${(result.score * 100).toFixed(1)}%`
        : '';

      return `${index + 1}. **${result.title}${result.extension}**
   🔗 URL: ${result.url}
   ${coordInfo}
   ${similarityInfo}`;
    }).join('\n\n');

    const summary = `Found ${results.length} photo(s) matching "${query}":\n\n${formattedResults}`;

    return {
      content: [
        {
          type: 'text',
          text: summary,
        },
      ],
    };

  } catch (error) {
    console.error('Error searching photo albums:', error);

    return {
      content: [
        {
          type: 'text',
          text: `Error searching photo albums: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your Weaviate connection and try again.`,
        },
      ],
      isError: true,
    };
  }
}
