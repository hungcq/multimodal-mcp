#!/usr/bin/env ts-node

import { getImagesCollection } from './collection';
import { DEFAULT_SEARCH_RADIUS_KM } from './constants';

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

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  boundingbox: [string, string, string, string];
}

interface LocationSearchOptions {
  location?: string;
  radiusKm?: number;
}

/**
 * Geocode a location string to coordinates using Nominatim API
 */
const geocodeLocation = async (location: string): Promise<{ lat: number; lon: number } | null> => {
  try {
    const encodedLocation = encodeURIComponent(location);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MultimodalMCP/1.0', // Nominatim requires a User-Agent
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json() as NominatimResponse[];

    if (data.length === 0) {
      console.warn(`No geocoding results found for location: ${location}`);
      return null;
    }

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error('Geocoding failed:', error);
    return null;
  }
};

/**
 * Search for images using text query and optional location filter
 * @param query - Text search query
 * @param options - Search options including limit, location, and radius
 */
export const searchImages = async (
  query: string,
  options: LocationSearchOptions & { limit?: number } = {}
): Promise<SearchResult[]> => {
  try {
    const { location, radiusKm = DEFAULT_SEARCH_RADIUS_KM, limit = 10 } = options;
    const collection = await getImagesCollection();

    let locationCoords: { lat: number; lon: number } | null = null;

    // Geocode location if provided
    if (location) {
      locationCoords = await geocodeLocation(location);
      if (!locationCoords) {
        console.warn(`Could not geocode location "${location}", proceeding without location filter`);
      }
    }

    // Build the query options
    let response;
    if (locationCoords) {
      // Use Weaviate's native geolocation filter when location is provided
      response = await collection.query.nearText(query, {
        limit,
        returnMetadata: ['certainty'],
        returnProperties: ['title', 'url', 'extension', 'coordinates'],
        certainty: 0.5,
        filters: collection.filter.byProperty('coordinates').withinGeoRange({
          latitude: locationCoords.lat,
          longitude: locationCoords.lon,
          distance: radiusKm * 1000, // Convert km to meters for Weaviate
        }),
      });
    } else {
      // Query without location filter
      response = await collection.query.nearText(query, {
        limit,
        returnMetadata: ['certainty'],
        returnProperties: ['title', 'url', 'extension', 'coordinates'],
        certainty: 0.5,
      });
    }

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
