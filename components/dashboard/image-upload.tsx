"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Upload, Scan, Loader2, X } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ScanResult } from "@/components/dashboard/scan-result"
export function ImageUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{
    type: string
    id?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setScanResult(null)
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

  const uploadImage = async () => {
    if (!file) return null

    try {
      setUploading(true)

      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage.from("documents").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) throw error

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath)

      return { path: filePath, url: publicUrl }
    } catch (error: any) {
      setError(error.message || "Error uploading image")
      return null
    } finally {
      setUploading(false)
    }
  }

  const scanDocument = async () => {
    try {
      setScanning(true)
      setScanResult(null)
      setError(null)

      // Mock upload delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock different scan results
      const resultTypes = ["selfie", "unknown", "licence plate", "national id"]
      const randomType = resultTypes[Math.floor(Math.random() * resultTypes.length)]

      const result: { type: string; id?: string } = { type: randomType }

      if (randomType === "licence plate" || randomType === "national id") {
        result.id = Math.random().toString(36).substring(2, 10).toUpperCase()
      }

      // Mock saving scan result
      await new Promise((resolve) => setTimeout(resolve, 500))

      setScanResult(result)
    } catch (error: any) {
      setError(error.message || "Error scanning document")
    } finally {
      setScanning(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setPreview(null)
    setScanResult(null)
    setError(null)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>Upload an image to scan and analyze</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4">
            {preview ? (
              <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-lg border">
                <Image src={preview || "/placeholder.svg"} alt="Document preview" fill className="object-contain" />
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
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full gap-2" onClick={scanDocument} disabled={!file || uploading || scanning}>
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Scan className="h-4 w-4" />
                Scan Document
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <ScanResult />
    </div>
  )
}

