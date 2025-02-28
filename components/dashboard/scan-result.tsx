"use client"

import { useState, useEffect } from "react"
import { Check, Loader2, FileQuestion, CreditCard, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { findBestMatch } from "@/lib/apiService/faceService"
import { getAllImages } from "@/lib/apiService/service"
import { supabase } from "@/lib/supabase"

// interface ScanResultProps {
//   result: {
//     type: string
//     id?: string
//   } | null
//   file: File | null
// }

export function ScanResult() {
  const [comparing, setComparing] = useState(false)
  const [comparisonResult, setComparisonResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Handle file upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    if (file) {
      setUploadedImage(file)
      setComparisonResult(null)
      setError(null)
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const compareSelfie = async () => {
    if (!uploadedImage) {
      setError("Please upload an image first")
      return
    }

    try {
      setComparing(true)
      setComparisonResult(null)
      setError(null)

      const user = await supabase.auth.getUser()
      if (!user.data.user?.id) {
        throw new Error("User not found")
      }
      const referenceImages = await getAllImages("1")

      if (!referenceImages.data || referenceImages.data.length === 0) {
        throw new Error("No reference images found")
      }
      const referenceImageUrls = referenceImages.data.map((image: any) => image.url)

      // Convert the File to FormData before sending
      const formData = new FormData()
      formData.append('image', uploadedImage)
      
      const bestMatch = await findBestMatch(formData, referenceImageUrls)
      
      if (bestMatch.status === "match") {
        setComparisonResult(`Match found with ${(bestMatch.bestMatch!.confidence! * 100).toFixed(2)}% confidence`)
      } else {
        setComparisonResult("No match found")
      }
    } catch (error: any) {
      setError(error.message || "Error comparing selfie")
    } finally {
      setComparing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Face Verification</CardTitle>
        <CardDescription>Upload a selfie to verify your identity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <User className="h-12 w-12 text-primary" />
          
          {/* Image upload section */}
          <div className="w-full mt-4">
            <label htmlFor="image-upload" className="block text-sm font-medium mb-2">
              Upload a selfie to compare
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-primary/90"
            />
          </div>
          
          {/* Image preview */}
          {imagePreview && (
            <div className="mt-4 w-full max-w-xs">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-auto rounded-md border border-border"
              />
            </div>
          )}

          {comparisonResult && (
            <div className="mt-4 rounded-lg bg-primary/10 p-4 text-primary w-full">
              <p className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                {comparisonResult}
              </p>
            </div>
          )}

          {error && <div className="text-sm font-medium text-destructive">{error}</div>}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full gap-2" 
          onClick={compareSelfie} 
          disabled={comparing || !uploadedImage}
        >
          {comparing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Comparing...
            </>
          ) : (
            "Compare with Profile"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

