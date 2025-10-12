#!/usr/bin/env -S npx ts-node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { closeWeaviateClient } from './weaviate-client';
import { TOOL_NAME, TOOL_DESCRIPTION, toolInputSchema, handleSearchPhotoAlbums, ToolInput } from './tool-definitions';

const mcpServer = new McpServer({
    name: 'photo-album-search-stdio',
    version: '1.0.0'
});

// Tool that searches through photo albums
mcpServer.registerTool(
    TOOL_NAME,
    {
        description: TOOL_DESCRIPTION,
        inputSchema: toolInputSchema
    },
    async (input: ToolInput) => {
        // Use console.error for stdio transport (stdout is reserved for MCP messages)
        const originalLog = console.log;
        console.log = console.error;

        try {
            return await handleSearchPhotoAlbums(input);
        } finally {
            console.log = originalLog;
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
