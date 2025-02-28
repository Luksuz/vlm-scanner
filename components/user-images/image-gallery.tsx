"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Loader2, FileQuestion, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getAllImages, deleteImage as deleteImageApi } from "@/lib/apiService/service"

interface ImageItem {
  id: string
  url: string
}

export function ImageGallery() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      setLoading(true)

      // Get the user ID - you'll need to implement this based on your auth system
      const userId = "1" // Replace with actual user ID from your auth context

      const response = await getAllImages(userId)

      if (!response.success) {
        throw new Error((response.error as string) || "Failed to fetch images")
      }

      // Transform the data to match the ImageItem interface
      const formattedImages: ImageItem[] =
        response.data?.map((item) => ({
          id: item.id || item.name,
          url: item.url,
        })) || []

      setImages(formattedImages)
    } catch (error: any) {
      setError(error.message || "Error fetching images")
    } finally {
      setLoading(false)
    }
  }

  const deleteImage = async (image: ImageItem) => {
    try {
      setDeleting(true)

      // Extract the image name from the path
      const imageName = image.url.split("/").pop() || ""
      const userId = image.url.split("/")[0]

      const response = await deleteImageApi(userId, imageName)

      if (!response.success) {
        throw new Error((response.error as string) || "Failed to delete image")
      }

      // Update state
      setImages(images.filter((img) => img.id !== image.id))
      setSelectedImage(null)
    } catch (error: any) {
      setError(error.message || "Error deleting image")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading images...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center text-destructive">
          <p className="font-medium">Error loading images</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <FileQuestion className="h-12 w-12" />
        <p>No images found</p>
        <p className="text-sm">Upload documents from the dashboard to see them here</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {images.map((image) => (
          <Dialog key={image.id}>
            <DialogTrigger asChild>
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <div className="aspect-square relative">
                  <Image src={image.url || "/placeholder.svg"} alt={`Document`} fill className="object-cover" />
                </div>
                <CardFooter className="p-2 bg-muted/50">
                  <div className="w-full">
                    <p className="text-sm font-medium capitalize">Selfie</p>
                    <p className="text-xs text-muted-foreground">Uploaded on {new Date().toLocaleDateString()}</p>
                  </div>
                </CardFooter>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="capitalize">Selfie</DialogTitle>
                <DialogDescription>Selfie</DialogDescription>
              </DialogHeader>
              <div className="aspect-square relative rounded-md overflow-hidden">
                <Image src={image.url || "/placeholder.svg"} alt={`Document`} fill className="object-contain" />
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">Uploaded on {new Date().toLocaleDateString()}</p>
                <Button variant="destructive" size="sm" onClick={() => deleteImage(image)} disabled={deleting}>
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  )
}

