import { type WeaviateClient } from 'weaviate-client';

import 'dotenv/config';
import { googleGcloudAuth } from './google-service-auth';

let client: WeaviateClient;
let lastTokenRefresh: number = 0;
const TOKEN_REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes

export const getWeaviateClient = async (): Promise<WeaviateClient> => {
  const now = Date.now();
  
  // Re-instantiate client every 60 minutes to ensure fresh tokens
  if (!client || (now - lastTokenRefresh) > TOKEN_REFRESH_INTERVAL) {
    client = await googleGcloudAuth.reInstantiateWeaviate();
    lastTokenRefresh = now;
  }

  return client;
};

export const closeWeaviateClient = async (): Promise<void> => {
  if (client) {
    await client.close();
  }
};

