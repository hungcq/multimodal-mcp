import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class GoogleGcloudAuth {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Refresh token using gcloud CLI
   * Equivalent to Python: subprocess.run(["gcloud", "auth", "print-access-token"], ...)
   */
  async refreshToken(): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync('/Users/hungcq/programs/google-cloud-sdk/bin/gcloud auth print-access-token');
      
      if (stderr) {
        console.error(`❌ Error refreshing token: ${stderr}`);
        throw new Error(`gcloud auth failed: ${stderr}`);
      }
      
      const token = stdout.trim();
      this.token = token;
      // Set expiry to 1 hour from now (gcloud tokens typically last 1 hour)
      this.tokenExpiry = Date.now() + 60 * 60 * 1000;
      return token;
    } catch (error) {
      console.error('❌ Error refreshing Google token:', error);
      throw error;
    }
  }

  /**
   * Get valid token, refreshing if necessary
   */
  async getValidToken(): Promise<string> {
    // Check if token is still valid (refresh 5 minutes before expiry)
    const now = Date.now();
    if (this.token && this.tokenExpiry > now + 5 * 60 * 1000) {
      return this.token;
    }

    return await this.refreshToken();
  }

  /**
   * Re-instantiate Weaviate client with fresh credentials
   * Call this every ~60 minutes to ensure fresh tokens
   */
  async reInstantiateWeaviate() {
    const weaviateApiKey = process.env.WEAVIATE_API_KEY;
    const weaviateUrl = process.env.WEAVIATE_URL;

    if (!weaviateApiKey || !weaviateUrl) {
      throw new Error('Missing required environment variables: WEAVIATE_API_KEY, WEAVIATE_URL');
    }

    const token = await this.getValidToken();
    
    // Import weaviate dynamically to avoid circular dependencies
    const weaviate = await import('weaviate-client');
    
    return await weaviate.connectToWeaviateCloud(weaviateUrl, {
      authCredentials: new weaviate.ApiKey(weaviateApiKey),
      headers: {
        'X-Goog-Vertex-Api-Key': token,
      },
    });
  }
}

// Singleton instance
export const googleGcloudAuth = new GoogleGcloudAuth();
