"use client"

import { useState } from "react"
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { ImageGallery } from "@/components/user-images/image-gallery"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Loader2, X } from "lucide-react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function UserImagesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setError(null)

    if (selectedFile) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setPreview(null)
    setError(null)
  }

  const uploadImage = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!file || !user) return

    try {
      setUploading(true)
      setError(null)

      // Create a unique file name
      const bucketName = "selfie-images"
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const userPath = `${user.id}/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage.from(bucketName).upload(userPath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) throw error

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(userPath)

      toast.success("Image uploaded successfully")
      resetUpload()
      
      // Refresh the gallery
      // You might need to implement a refresh method in the ImageGallery component
      
    } catch (error: any) {
      setError(error.message || "Error uploading image")
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">User Images</h1>
          <p className="text-muted-foreground">View and upload your images</p>
        </div>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
              <CardDescription>Upload a new image to your collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-4">
                {preview ? (
                  <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-lg border">
                    <Image src={preview} alt="Image preview" fill className="object-contain" />
                    <Button variant="destructive" size="icon" className="absolute right-2 top-2" onClick={resetUpload}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex aspect-square w-full max-w-md cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/50 p-4 text-center transition-colors hover:bg-muted/50">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="font-medium">Click to upload</p>
                    <p className="text-sm text-muted-foreground">Supports JPG, PNG, HEIC</p>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                )}
                {error && <div className="text-sm font-medium text-destructive">{error}</div>}
                
                <Button 
                  className="w-full" 
                  onClick={uploadImage} 
                  disabled={!file || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Image"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <ImageGallery />
      </div>
    </AuthenticatedLayout>
  )
}

