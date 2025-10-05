#!/usr/bin/env ts-node

import { getImageFiles, formatFileSize, type ImageFileInfo } from './utils';
import { createImagesCollection, getImagesCollection } from './collection';
import { closeWeaviateClient } from './weaviate-client';

interface UploadOptions {
  directory: string;
  batchSize?: number;
  skipExisting?: boolean;
}

interface UploadResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

/**
 * Upload a single image to Weaviate
 */
const uploadSingleImage = async (
  collection: any,
  imageFile: ImageFileInfo,
  skipExisting: boolean = false
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if image already exists (if skipExisting is true)
    if (skipExisting) {
      const existing = await collection.query.fetchObjects({
        where: {
          path: {
            equal: imageFile.path
          }
        },
        limit: 1
      });
      
      if (existing.objects.length > 0) {
        return { success: false, error: 'Image already exists' };
      }
    }

    // Prepare the data object
    const dataObject: any = {
      title: imageFile.name,
      url: `https://files.hungcq.com/photos/${imageFile.name}${imageFile.extension}`,
      extension: imageFile.extension,
      image: imageFile.base64,
    };

    // Add coordinates if available
    if (imageFile.coordinates) {
      dataObject.coordinates = {
        latitude: imageFile.coordinates.latitude,
        longitude: imageFile.coordinates.longitude,
      };
    }

    // Upload the image
    await collection.data.insert(dataObject);

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Upload images in batches
 */
const uploadBatch = async (
  collection: any,
  images: ImageFileInfo[],
  skipExisting: boolean = true,
): Promise<UploadResult> => {
  const result: UploadResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  for (const image of images) {
    const uploadResult = await uploadSingleImage(collection, image, skipExisting);
    
    if (uploadResult.success) {
      result.success++;
      const coordInfo = image.coordinates 
        ? ` [GPS: ${image.coordinates.latitude.toFixed(6)}, ${image.coordinates.longitude.toFixed(6)}]`
        : ' [No GPS data]';
      console.log(`✓ Uploaded: ${image.name}${image.extension} (${formatFileSize(image.size)})${coordInfo}`);
    } else if (uploadResult.error === 'Image already exists') {
      result.skipped++;
      console.log(`- Skipped: ${image.name}${image.extension} (already exists)`);
    } else {
      result.failed++;
      result.errors.push(`${image.name}${image.extension}: ${uploadResult.error}`);
      console.error(`✗ Failed: ${image.name}${image.extension} - ${uploadResult.error}`);
    }
  }

  return result;
};

/**
 * Main upload function
 */
export const uploadImages = async (options: UploadOptions): Promise<UploadResult> => {
  const { directory, batchSize = 10, skipExisting = true } = options;
  
  console.log(`🚀 Starting image upload from directory: ${directory}`);
  console.log(`📊 Batch size: ${batchSize}`);
  console.log(`⏭️  Skip existing: ${skipExisting}`);
  console.log('');

  try {
    // Get all image files from the directory
    console.log('📸 Extracting image metadata and GPS coordinates...');
    const imageFiles = await getImageFiles(directory);
    
    if (imageFiles.length === 0) {
      console.log('❌ No image files found in the specified directory.');
      return { success: 0, failed: 0, skipped: 0, errors: ['No image files found'] };
    }

    console.log(`📁 Found ${imageFiles.length} image files`);
    console.log('');

    // Create collection if it doesn't exist
    await createImagesCollection();
    const collection = await getImagesCollection();

    // Upload images in batches
    const totalResult: UploadResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(imageFiles.length / batchSize)} (${batch.length} images)`);
      
      const batchResult = await uploadBatch(collection, batch, skipExisting);
      
      totalResult.success += batchResult.success;
      totalResult.failed += batchResult.failed;
      totalResult.skipped += batchResult.skipped;
      totalResult.errors.push(...batchResult.errors);
      
      console.log('');
    }

    return totalResult;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
};

/**
 * CLI interface
 */
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npm run upload <directory> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --batch-size <number>    Number of images to upload in each batch (default: 10)');
    console.log('  --skip-existing          Skip images that already exist in the collection');
    console.log('  --help                   Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  npm run upload ./images');
    console.log('  npm run upload ./images --batch-size 5');
    console.log('  npm run upload ./images --skip-existing');
    process.exit(1);
  }

  if (args.includes('--help')) {
    console.log('Usage: npm run upload <directory> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --batch-size <number>    Number of images to upload in each batch (default: 10)');
    console.log('  --skip-existing          Skip images that already exist in the collection');
    console.log('  --help                   Show this help message');
    process.exit(0);
  }

  const directory = args[0];
  const batchSizeIndex = args.indexOf('--batch-size');
  const batchSize = batchSizeIndex !== -1 && args[batchSizeIndex + 1] 
    ? parseInt(args[batchSizeIndex + 1], 10) 
    : 10;

  try {
    const result = await uploadImages({
      directory,
      batchSize,
      skipExisting: true,
    });

    console.log('🎉 Upload completed!');
    console.log(`✅ Successfully uploaded: ${result.success} images`);
    console.log(`⏭️  Skipped: ${result.skipped} images`);
    console.log(`❌ Failed: ${result.failed} images`);
    
    if (result.errors.length > 0) {
      console.log('');
      console.log('❌ Errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  } finally {
    await closeWeaviateClient();
  }
};

// Run the CLI if this file is executed directly
if (require.main === module) {
  main();
}

