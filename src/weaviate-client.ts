import weaviate, { type WeaviateClient, ApiKey } from 'weaviate-client';
import 'dotenv/config';

let client: WeaviateClient;

export const getWeaviateClient = async (): Promise<WeaviateClient> => {
  if (!client) {
    const weaviateUrl = process.env.WEAVIATE_URL;
    const weaviateApiKey = process.env.WEAVIATE_API_KEY;
    const googleApiKey = process.env.GOOGLE_API_KEY;

    if (!weaviateUrl || !weaviateApiKey || !googleApiKey) {
      throw new Error('Missing required environment variables. Please check your .env file.');
    }

    client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
      authCredentials: new weaviate.ApiKey(weaviateApiKey),
      headers: {
        'X-Goog-Api-Key': googleApiKey || '',
      }
    });
  }

  return client;
};

export const closeWeaviateClient = async (): Promise<void> => {
  if (client) {
    await client.close();
  }
};

