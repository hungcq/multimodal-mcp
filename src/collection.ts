import { configure, vectors } from 'weaviate-client';

import { getWeaviateClient } from './weaviate-client';

const COLLECTION_NAME = 'Thuy';

/**
 * Check if a collection exists
 */
const collectionExists = async (name: string): Promise<boolean> => {
  const client = await getWeaviateClient();
  try {
    const collections = await client.collections.listAll();
    return collections.some(collection => collection.name === name);
  } catch (error) {
    console.error('Error checking if collection exists:', error);
    return false;
  }
};

/**
 * Create the Images collection with proper schema
 */
export const createImagesCollection = async (): Promise<void> => {
  const client = await getWeaviateClient();

  try {
    // Check if collection already exists
    const exists = await collectionExists(COLLECTION_NAME);
    if (exists) {
      return;
    }

    // Create the collection with schema
    await client.collections.create({
      name: COLLECTION_NAME,
      description: 'Collection for storing images with multimodal search capabilities',
      properties: [
        {
          name: 'title',
          dataType: configure.dataType.TEXT,
          description: 'Title of the image file',
        },
        {
          name: 'image',
          dataType: configure.dataType.BLOB,
          description: 'Image file',
        },
        {
          name: 'url',
          dataType: configure.dataType.TEXT,
          description: 'Url to the image file',
        },
        {
          name: 'extension',
          dataType: configure.dataType.TEXT,
          description: 'File extension of the image',
        },
        {
          name: 'coordinates',
          dataType: configure.dataType.GEO_COORDINATES,
          description: 'Coordinates of the image',
        }
      ],
      // Define the vectorizer module for multimodal search
      // Using OpenAI vectorizer as Palm vectorizer configuration may differ in v3
      vectorizers: vectors.multi2VecGoogle({ 
        model: 'multimodalembedding', 
        projectId: process.env.GOOGLE_PROJECT_ID || '', 
        location: 'us-central1',
        imageFields: [{ name: "image", weight: 1 }],
      }),
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
};

/**
 * Get the Images collection
 */
export const getImagesCollection = async () => {
  const client = await getWeaviateClient();
  return client.collections.get(COLLECTION_NAME);
};


