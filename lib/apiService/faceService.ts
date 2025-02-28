"use client"

import * as faceapi from '@vladmandic/face-api';
import { supabase } from '@/lib/supabase';


async function findBestMatch(targetImage: string | File | FormData, referenceImageUrls: string[], options: {
  tolerance?: number;
} = {}) {
  const { tolerance = 0.6 } = options;
  
  try {
    console.log('Starting face comparison process...');
    console.log('Target image type:', typeof targetImage);
    console.log('Reference URLs:', referenceImageUrls);
    console.log('Tolerance setting:', tolerance);
    
    // Load the face-api models
    console.log('Loading face-api models...');
    await loadModels();
    console.log('Models loaded successfully');
    
    // Handle target image (could be URL, File, or FormData)
    console.log('Processing target image...');
    let targetImageElement: HTMLImageElement;
    
    if (typeof targetImage === 'string') {
      console.log('Target image is a string URL:', targetImage);
      // Handle URL or storage path
      if (targetImage.includes('supabase') && !targetImage.startsWith('http')) {
        console.log('Target image is a Supabase storage path');
        // Get public URL from Supabase storage path
        const url = await getSupabasePublicUrl(targetImage);
        console.log('Converted Supabase path to URL:', url);
        targetImageElement = await loadImageFromUrl(url);
      } else {
        // Direct URL
        console.log('Loading target image from direct URL');
        targetImageElement = await loadImageFromUrl(targetImage);
      }
    } else if (targetImage instanceof FormData) {
      console.log('Target image is FormData');
      // Handle FormData object
      const imageFile = targetImage.get('image') as File;
      if (!imageFile) {
        throw new Error('No image found in FormData');
      }
      console.log('FormData image file:', imageFile.name, imageFile.type, imageFile.size);
      targetImageElement = await loadImageFromFile(imageFile);
    } else {
      console.log('Target image is a File object:', targetImage.name, targetImage.type, targetImage.size);
      // Handle File object
      targetImageElement = await loadImageFromFile(targetImage);
    }
    
    console.log('Target image loaded, dimensions:', targetImageElement.width, 'x', targetImageElement.height);
    
    // Process the target image
    console.log('Detecting face in target image...');
    const targetDetection = await faceapi.detectSingleFace(targetImageElement)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    console.log('Target detection result:', targetDetection ? 'Face detected' : 'No face detected');
    
    if (!targetDetection) {
      return {
        status: "error",
        message: "No face detected in the target image"
      };
    }
    
    console.log('Target face detection score:', targetDetection.detection.score);
    console.log('Target face box:', targetDetection.detection.box);
    
    // Process all reference images
    console.log('Processing reference images...');
    const comparisonResults = [];
    
    for (let i = 0; i < referenceImageUrls.length; i++) {
      const refImageUrl = referenceImageUrls[i];
      console.log(`Processing reference image ${i+1}/${referenceImageUrls.length}:`, refImageUrl);
      
      try {
        let refImageElement: HTMLImageElement;
        let publicUrl: string;
        
        // Check if it's a Supabase storage path or external URL
        if (refImageUrl.includes('supabase') && !refImageUrl.startsWith('http')) {
          console.log('Reference image is a Supabase storage path');
          publicUrl = await getSupabasePublicUrl(refImageUrl);
          console.log('Converted Supabase path to URL:', publicUrl);
          refImageElement = await loadImageFromUrl(publicUrl);
        } else {
          console.log('Loading reference image from direct URL');
          publicUrl = refImageUrl;
          refImageElement = await loadImageFromUrl(refImageUrl);
        }
        
        console.log('Reference image loaded, dimensions:', refImageElement.width, 'x', refImageElement.height);
        
        console.log('Detecting face in reference image...');
        const refDetection = await faceapi.detectSingleFace(refImageElement)
          .withFaceLandmarks()
          .withFaceDescriptor();
        
        console.log('Reference detection result:', refDetection ? 'Face detected' : 'No face detected');
        
        if (!refDetection) {
          console.log('No face detected in reference image');
          comparisonResults.push({
            imageUrl: refImageUrl,
            publicUrl: publicUrl,
            status: "error",
            message: "No face detected in reference image"
          });
          continue;
        }
        
        console.log('Reference face detection score:', refDetection.detection.score);
        console.log('Reference face box:', refDetection.detection.box);
        
        // Compare the faces
        console.log('Comparing face descriptors...');
        const distance = faceapi.euclideanDistance(targetDetection.descriptor, refDetection.descriptor);
        const confidence = Math.max(0, 1 - distance);
        console.log('Distance:', distance);
        console.log('Confidence:', confidence);
        console.log('Match threshold:', tolerance);
        const match = distance <= tolerance;
        console.log('Match result:', match ? 'MATCH' : 'NO MATCH');
        
        comparisonResults.push({
          imageUrl: refImageUrl,
          publicUrl: publicUrl,
          status: match ? "match" : "no_match",
          confidence: confidence,
          distance: distance,
          metadata: {
            targetFace: {
              score: targetDetection.detection.score,
              box: targetDetection.detection.box
            },
            refFace: {
              score: refDetection.detection.score,
              box: refDetection.detection.box
            }
          }
        });
      } catch (error) {
        console.error('Error processing reference image:', error);
        comparisonResults.push({
          imageUrl: refImageUrl,
          status: "error",
          message: `Error processing reference image: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
    
    // Find the best match (lowest distance / highest confidence)
    console.log('Finding best match among', comparisonResults.length, 'comparisons');
    const validResults = comparisonResults.filter(result => result.status !== "error");
    console.log('Valid comparison results:', validResults.length);
    
    if (validResults.length === 0) {
      console.log('No valid comparisons found');
      return {
        status: "error",
        message: "No valid comparisons could be made",
        allResults: comparisonResults
      };
    }
    
    // Sort by confidence (descending)
    validResults.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
    
    const bestMatch = validResults[0];
    console.log('Best match:', bestMatch);
    console.log('BEST MATCH IMAGE URL:', bestMatch.publicUrl);
    console.log('BEST MATCH CONFIDENCE:', ((bestMatch.confidence ?? 0) * 100).toFixed(2) + '%');
    
    return {
      status: (bestMatch.confidence ?? 0) >= (1 - tolerance) ? "match_found" : "no_match_found",
      bestMatch: bestMatch,
      message: (bestMatch.confidence ?? 0) >= (1 - tolerance) 
        ? `Best match found with ${((bestMatch.confidence ?? 0) * 100).toFixed(2)}% confidence` 
        : `No match found above threshold. Best candidate has ${((bestMatch.confidence ?? 0) * 100).toFixed(2)}% confidence`,
      allResults: comparisonResults
    };
    
  } catch (error) {
    console.error('Error in face comparison process:', error);
    return {
      status: "error",
      message: `Error in face comparison process: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get a public URL from a Supabase storage path
 */
async function getSupabasePublicUrl(storagePath: string): Promise<string> {
  console.log('Getting public URL for Supabase path:', storagePath);
  // Extract bucket and file path from storage path
  const parts = storagePath.split('/');
  const bucket = parts.length > 1 ? parts[0] : 'default';
  const filePath = parts.length > 1 ? parts.slice(1).join('/') : storagePath;
  
  console.log('Bucket:', bucket);
  console.log('File path:', filePath);
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
    
  if (!data || !data.publicUrl) {
    console.error('Failed to get public URL from Supabase');
    throw new Error('Could not get public URL from Supabase');
  }
  
  console.log('Got public URL:', data.publicUrl);
  return data.publicUrl;
}

/**
 * Load an image from a URL into an HTMLImageElement
 */
async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  console.log('Loading image from URL:', url);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log('Image loaded successfully:', img.width, 'x', img.height);
      resolve(img);
    };
    img.onerror = (err) => {
      console.error('Failed to load image from URL:', url, err);
      reject(new Error(`Failed to load image from URL: ${url}`));
    };
    img.src = url;
  });
}

/**
 * Load an image from a File object into an HTMLImageElement
 */
async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  console.log('Loading image from File:', file.name, file.type, file.size);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('File read successfully');
      const img = new Image();
      img.onload = () => {
        console.log('Image created from file successfully:', img.width, 'x', img.height);
        resolve(img);
      };
      img.onerror = (err) => {
        console.error('Failed to create image from file:', err);
        reject(new Error('Failed to load image from file'));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => {
      console.error('Failed to read file:', err);
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Load the required face-api models
 */
async function loadModels() {
  const modelUrl = '/models'; // Assuming models are in the public directory
  console.log('Loading face-api models from:', modelUrl);
  
  try {
    // Load models if not already loaded
    if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
      console.log('Loading SSD MobileNet model...');
      await faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl);
      console.log('SSD MobileNet model loaded successfully');
    } else {
      console.log('SSD MobileNet model already loaded');
    }
    
    if (!faceapi.nets.faceLandmark68Net.isLoaded) {
      console.log('Loading Face Landmark model...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
      console.log('Face Landmark model loaded successfully');
    } else {
      console.log('Face Landmark model already loaded');
    }
    
    if (!faceapi.nets.faceRecognitionNet.isLoaded) {
      console.log('Loading Face Recognition model...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
      console.log('Face Recognition model loaded successfully');
    } else {
      console.log('Face Recognition model already loaded');
    }
    
    console.log('All models loaded successfully');
  } catch (error) {
    console.error('Error loading models:', error);
    throw error;
  }
}

// ... existing code for compareFaces function ...

export { findBestMatch };