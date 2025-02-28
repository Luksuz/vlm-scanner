"use server"

import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

/**
 * Document scan result interface
 */
interface ScanResult {
  type: "selfie" | "licence plate" | "national id" | "unknown";
  id?: string;
}

/**
 * Analyzes an image to identify document type and extract relevant information
 * @param imagePath - Path to the image in Supabase storage (e.g., "documents/image123.jpg")
 * @returns Promise with scan result containing document type and ID if applicable
 */
export async function scanDocument(imageUrl: string): Promise<ScanResult> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Create prompt for document analysis
    const prompt = "Analyze this image and identify if it contains: 1) a selfie/human face, 2) a licence plate (extract the number), 3) a national ID card (extract the ID number), or 4) none of these (unknown). Return ONLY ONE of these exact formats: 'selfie', 'licence plate: NUMBER', 'national id: NUMBER', or 'unknown'.";
    
    // Call OpenAI API with the image
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                "url": imageUrl,
              },
            },
          ],
        },
      ],
    });
    
    // Extract the response text
    const analysisResult = response.choices[0]?.message?.content?.trim() || "unknown";
    console.log('Analysis result:', analysisResult);
    
    // Parse the result
    if (analysisResult.toLowerCase().startsWith("selfie")) {
      return { type: "selfie" };
    } 
    else if (analysisResult.toLowerCase().startsWith("licence plate:") || 
             analysisResult.toLowerCase().startsWith("license plate:")) {
      const id = analysisResult.split(':')[1]?.trim();
      return { 
        type: "licence plate", 
        id: id || undefined
      };
    } 
    else if (analysisResult.toLowerCase().startsWith("national id:")) {
      const id = analysisResult.split(':')[1]?.trim();
      return { 
        type: "national id", 
        id: id || undefined
      };
    } 
    else {
      return { type: "unknown" };
    }
    
  } catch (error) {
    console.error('Error scanning document:', error);
    return { type: "unknown" };
  }
}