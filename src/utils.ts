import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
const exifr = require('exifr');

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  extension: string;
}

export interface ImageFileInfo extends FileInfo {
  base64: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * List all files in a directory
 */
export const listFiles = (path: string): FileInfo[] => {
  try {
    return readdirSync(path)
      .map((name) => {
        const fullPath = join(path, name);
        const stats = statSync(fullPath);
        
        return {
          name: basename(name, extname(name)), // filename without extension
          path: fullPath,
          size: stats.size,
          extension: extname(name).toLowerCase(),
        };
      })
      .filter((file) => file.size > 0); // Filter out empty files
  } catch (error) {
    console.error(`Error reading directory ${path}:`, error);
    return [];
  }
};

/**
 * Get base64 encoding of a file
 */
export const getBase64 = (filePath: string): string => {
  try {
    return readFileSync(filePath, { encoding: 'base64' });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
};

/**
 * Extract GPS coordinates from image EXIF data
 */
export const getImageCoordinates = async (filePath: string): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const exifData = await exifr.parse(filePath, { gps: true });
    
    if (exifData && exifData.latitude && exifData.longitude) {
      return {
        latitude: exifData.latitude,
        longitude: exifData.longitude
      };
    }
    
    return null;
  } catch (error) {
    console.warn(`Warning: Could not extract GPS coordinates from ${filePath}:`, error);
    return null;
  }
};

/**
 * Check if file is a supported image format
 */
export const isImageFile = (extension: string): boolean => {
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg'];
  return supportedExtensions.includes(extension);
};

/**
 * Get image files with base64 encoding and GPS coordinates
 */
export const getImageFiles = async (directoryPath: string): Promise<ImageFileInfo[]> => {
  const files = listFiles(directoryPath);
  const imageFiles = files.filter((file) => isImageFile(file.extension));
  
  const results: ImageFileInfo[] = [];
  
  for (const file of imageFiles) {
    try {
      const base64 = getBase64(file.path);
      const coordinates = await getImageCoordinates(file.path);
      
      results.push({
        ...file,
        base64,
        coordinates: coordinates || undefined,
      });
    } catch (error) {
      console.warn(`Warning: Could not process image ${file.path}:`, error);
      // Still add the file without coordinates
      results.push({
        ...file,
        base64: getBase64(file.path),
        coordinates: undefined,
      });
    }
  }
  
  return results;
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

