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
  distance?: number;
}

/**
 * Search for images using text query
 */
export const searchImages = async (query: string, limit: number = 10): Promise<SearchResult[]> => {
  try {
    const collection = await getImagesCollection();
    
    const response = await collection.query.nearText(query, {
      limit: limit,
      returnMetadata: ['distance'],
      returnProperties: ['title', 'url', 'extension', 'coordinates']
    });

    return response.objects.map(obj => ({
      title: obj.properties.title as string,
      url: obj.properties.url as string,
      extension: obj.properties.extension as string,
      coordinates: obj.properties.coordinates as { latitude: number; longitude: number } | undefined,
      distance: obj.metadata?.distance
    }));
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
};

/**
 * Get all images in the collection
 */
export const getAllImages = async (limit: number = 100): Promise<SearchResult[]> => {
  try {
    const collection = await getImagesCollection();
    
    const response = await collection.query.fetchObjects({
      limit: limit,
      returnProperties: ['title', 'url', 'extension', 'coordinates']
    });

    return response.objects.map(obj => ({
      title: obj.properties.title as string,
      url: obj.properties.url as string,
      extension: obj.properties.extension as string,
      coordinates: obj.properties.coordinates as { latitude: number; longitude: number } | undefined
    }));
  } catch (error) {
    console.error('Failed to fetch images:', error);
    throw error;
  }
};

