#!/usr/bin/env ts-node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { searchImages } from './search-images';
import { closeWeaviateClient } from './weaviate-client';

const mcpServer = new McpServer({
    name: 'photo-album-search-stdio',
    version: '1.0.0'
});

// Tool that searches through photo albums
mcpServer.registerTool(
    'search_photo_albums',
    {
        description: 'Search through our photo albums using natural language queries. Find photos by description, locations, objects, or any visual content.',
        inputSchema: {
            query: z.string().describe('Natural language description of what you want to find in the photos (e.g., "sunset over mountains", "people at the beach", "dogs playing")'),
            limit: z.number().describe('Maximum number of photos to return').min(1).max(5).default(1)
        }
    },
    async ({ query, limit }) => {
        try {
            console.error(`🔍 Searching photo albums for: "${query}" (limit: ${limit})`);
            
            // Perform the search
            const results = await searchImages(query, limit);
            
            if (results.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `No photos found matching "${query}". Try a different search term or check if photos have been uploaded to the collection.`
                        }
                    ]
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
                        text: summary
                    }
                ]
            };

        } catch (error) {
            console.error('Error searching photo albums:', error);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching photo albums: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your Weaviate connection and try again.`
                    }
                ],
                isError: true
            };
        }
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error('📸 Photo Album Search MCP Server (stdio) is running...');
    console.error('🔍 Available tool: search_photo_albums');
    console.error('💡 Use natural language to search through your photo collection');
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.error('\n🛑 Shutting down MCP server...');
    await closeWeaviateClient();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.error('\n🛑 Shutting down MCP server...');
    await closeWeaviateClient();
    process.exit(0);
});

main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
});
