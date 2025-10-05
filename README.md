# Multimodal MCP - Image Upload to Weaviate

A TypeScript script to upload images from a folder to a Weaviate collection with multimodal search capabilities. This script stores both the image data and metadata, enabling powerful multimodal search functionality.

## Features

- 🖼️ **Batch Image Upload**: Upload multiple images in configurable batches
- 🔍 **Multimodal Search**: Uses Google's multimodal embedding model for image search
- 📍 **GPS Coordinate Extraction**: Automatically extracts GPS coordinates from image EXIF data
- 📊 **Metadata Storage**: Stores file path, extension, GPS coordinates, and image data
- ⚡ **Skip Existing**: Option to skip images that already exist in the collection
- 🛡️ **Error Handling**: Comprehensive error handling and reporting
- 📝 **Progress Tracking**: Real-time upload progress and statistics

## Prerequisites

- Node.js (LTS version)
- Weaviate Cloud Services account
- Google Cloud Project with Vertex AI API enabled

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables by copying the example file:
   ```bash
   cp env.example .env
   ```

4. Edit the `.env` file with your credentials:
   ```env
   WEAVIATE_URL=https://your-cluster-url.weaviate.network
   WEAVIATE_API_KEY=your-weaviate-api-key
   GOOGLE_API_KEY=your-google-api-key
   GOOGLE_PROJECT_ID=your-google-project-id
   ```

## Setup Weaviate

1. **Create a Weaviate Cloud Services cluster**:
   - Go to [Weaviate Cloud Services](https://console.weaviate.cloud/)
   - Create a new cluster
   - Note down your cluster URL and API key

2. **Set up Google Vertex AI**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Vertex AI API
   - Create an API key or service account
   - See [GOOGLE_SETUP.md](GOOGLE_SETUP.md) for detailed instructions

## Usage

### Basic Usage

Upload all images from a directory:
```bash
npm run upload ./path/to/images
```

### Advanced Usage

Upload with custom batch size:
```bash
npm run upload ./path/to/images --batch-size 5
```

Skip images that already exist:
```bash
npm run upload ./path/to/images --skip-existing
```

Combine options:
```bash
npm run upload ./path/to/images --batch-size 3 --skip-existing
```

### Searching Images

Search for images using text queries:
```bash
npm run search "sunset"
npm run search "mountain landscape" --limit 5
```

List all images in the collection:
```bash
npm run search --all
```

### MCP Server Integration

This project includes an MCP (Model Context Protocol) server that allows AI assistants like Claude to search through your photo albums using natural language.

**Start the MCP server:**
```bash
npm run mcp-server
```

The server will start on port 3000 with SSE endpoint at `http://localhost:3000/mcp`.

**Available tools:**
- `search_photo_albums`: Search photos using natural language queries

**Example AI queries:**
- "Show me photos of sunsets"
- "Find pictures taken at the beach"
- "Search for images with mountains"

For detailed MCP server documentation, see [MCP_SERVER.md](MCP_SERVER.md).

### Testing

Test your Google authentication:
```bash
npm run test-google-auth
```

Test your collection setup:
```bash
npm run test-collection
```

Test GPS coordinate extraction:
```bash
npm run test-gps ./example-images
```

These will verify that your Google authentication, Weaviate connection, and GPS extraction work correctly.

### Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- BMP (.bmp)
- WebP (.webp)
- TIFF (.tiff)
- SVG (.svg)

## Collection Schema

The script creates a collection named "Thuy" with the following properties:

- `title`: Image filename (without extension)
- `url`: Full file path
- `extension`: File extension
- `image`: Base64 encoded image data
- `coordinates`: GPS coordinates (latitude, longitude) extracted from EXIF data

## Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Run the compiled JavaScript
- `npm run dev`: Run with ts-node for development
- `npm run upload`: Upload images (main script)
- `npm run search`: Search images in the collection
- `npm run mcp-server`: Start MCP server for AI integration
- `npm run test-gps`: Test GPS coordinate extraction from images

## Example Output

```
🚀 Starting image upload from directory: ./images
📊 Batch size: 10
⏭️  Skip existing: false

📁 Found 25 image files

📦 Processing batch 1/3 (10 images)
✓ Uploaded: sunset.jpg (2.3 MB) [GPS: 37.774929, -122.419416]
✓ Uploaded: mountain.png (1.8 MB) [No GPS data]
✓ Uploaded: ocean.gif (5.2 MB) [GPS: 34.052235, -118.243685]
...

🎉 Upload completed!
✅ Successfully uploaded: 25 images
⏭️  Skipped: 0 images
❌ Failed: 0 images
```

## Error Handling

The script provides detailed error reporting:
- Individual file upload failures
- Network connectivity issues
- Authentication problems
- Invalid file formats

## Development

### Project Structure

```
src/
├── weaviate-client.ts    # Weaviate client configuration
├── utils.ts              # File handling utilities
├── collection.ts         # Collection schema and management
└── upload-images.ts      # Main upload script
```

### Building

```bash
npm run build
```

The compiled JavaScript will be in the `dist/` directory.

## Troubleshooting

### Common Issues

1. **Authentication Error**: Check your Weaviate URL and API key
2. **Google API Error**: Verify your Google API key and project ID
3. **File Not Found**: Ensure the image directory path is correct
4. **Memory Issues**: Reduce batch size for large images

### Debug Mode

For detailed logging, you can modify the script to include more verbose output or use Node.js debugging:

```bash
node --inspect dist/upload-images.js ./images
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## References

- [Weaviate Documentation](https://weaviate.io/developers/weaviate)
- [Multimodal Search in TypeScript](https://weaviate.io/blog/multimodal-search-in-typescript)
- [Google Vertex AI](https://cloud.google.com/vertex-ai)
