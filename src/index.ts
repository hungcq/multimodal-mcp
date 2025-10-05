#!/usr/bin/env ts-node

/**
 * Main entry point for the Multimodal MCP project
 * 
 * This file provides a simple CLI interface to access all functionality
 */

import { uploadImages } from './upload-images';
import { searchImages, getAllImages } from './search-images';
import { createImagesCollection, deleteImagesCollection } from './collection';
import { closeWeaviateClient } from './weaviate-client';

const showHelp = () => {
  console.log('Multimodal MCP - Image Upload and Search for Weaviate');
  console.log('');
  console.log('Usage: npm run dev <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  upload <directory>     Upload images from directory to Weaviate');
  console.log('  search <query>         Search for images using text query');
  console.log('  list                   List all images in the collection');
  console.log('  create-collection      Create the Images collection');
  console.log('  delete-collection      Delete the Images collection');
  console.log('  help                   Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  npm run dev upload ./images');
  console.log('  npm run dev search "sunset"');
  console.log('  npm run dev list');
  console.log('');
  console.log('For more detailed usage, use the specific scripts:');
  console.log('  npm run upload --help');
  console.log('  npm run search --help');
};

const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help') {
    showHelp();
    return;
  }

  const command = args[0];
  
  try {
    switch (command) {
      case 'upload':
        if (args.length < 2) {
          console.error('❌ Please provide a directory path');
          console.log('Usage: npm run dev upload <directory>');
          process.exit(1);
        }
        const uploadResult = await uploadImages({
          directory: args[1],
          batchSize: 10,
          skipExisting: false
        });
        console.log('🎉 Upload completed!');
        console.log(`✅ Successfully uploaded: ${uploadResult.success} images`);
        console.log(`⏭️  Skipped: ${uploadResult.skipped} images`);
        console.log(`❌ Failed: ${uploadResult.failed} images`);
        break;
        
      case 'search':
        if (args.length < 2) {
          console.error('❌ Please provide a search query');
          console.log('Usage: npm run dev search <query>');
          process.exit(1);
        }
        const searchResults = await searchImages(args[1], 10);
        console.log(`🔍 Found ${searchResults.length} results for "${args[1]}":`);
        searchResults.forEach((result, index) => {
          console.log(`${index + 1}. ${result.title}${result.extension} (${result.url})`);
        });
        break;
        
      case 'list':
        const allImages = await getAllImages(50);
        console.log(`📋 Found ${allImages.length} images in collection:`);
        allImages.forEach((image, index) => {
          console.log(`${index + 1}. ${image.title}${image.extension} (${image.url})`);
        });
        break;
        
      case 'create-collection':
        await createImagesCollection();
        console.log('✅ Collection created successfully');
        break;
        
      case 'delete-collection':
        await deleteImagesCollection();
        console.log('✅ Collection deleted successfully');
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error);
    process.exit(1);
  } finally {
    await closeWeaviateClient();
  }
};

// Run the CLI if this file is executed directly
if (require.main === module) {
  main();
}

