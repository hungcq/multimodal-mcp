#!/usr/bin/env ts-node

import { getImagesCollection } from './collection';

interface SearchResult {
  title: string;
  url: string;
  extension: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  score?: number;
}

/**
 * Search for images using text query
 */
export const searchImages = async (query: string, limit: number = 10): Promise<SearchResult[]> => {
  try {
    const collection = await getImagesCollection();
    
    const response = await collection.query.nearText(query, {
      limit: limit,
      returnMetadata: ['certainty'],
      returnProperties: ['title', 'url', 'extension', 'coordinates'],
      // Use certainty threshold to filter out very low similarity results
      certainty: 0.5,
    });

    return response.objects.map(obj => ({
      title: obj.properties.title as string,
      url: obj.properties.url as string,
      extension: obj.properties.extension as string,
      coordinates: obj.properties.coordinates as { latitude: number; longitude: number } | undefined,
      score: obj.metadata?.certainty,
    }));
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
};
