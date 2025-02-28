import { supabase } from "@/lib/supabase"

/**
 * Uploads an image to Supabase storage
 * @param userId - The user ID to associate with the image
 * @param file - The file to upload
 * @param fileName - Optional custom file name, defaults to original file name
 * @returns Object containing success status and data or error
 */
export const uploadImage = async (userId: string, file: File, fileName?: string) => {
  try {
    const fileExt = file.name.split(".").pop()
    const finalFileName = fileName ? `${fileName}.${fileExt}` : file.name
    const filePath = `${userId}/${finalFileName}`

    const { data, error } = await supabase.storage.from("selfie-images").upload(filePath, file, {
      upsert: true,
    })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error uploading image:", error)
    return { success: false, error }
  }
}

/**
 * Gets a single image from Supabase storage
 * @param userId - The user ID associated with the image
 * @param imageName - The name of the image to retrieve
 * @returns Object containing success status and URL or error
 */
export const getImage = async (userId: string, imageName: string) => {
  try {
    const { data } = supabase.storage.from("selfie-images").getPublicUrl(`${userId}/${imageName}`)

    return { success: true, url: data.publicUrl }
  } catch (error) {
    console.error("Error getting image:", error)
    return { success: false, error }
  }
}

/**
 * Deletes an image from Supabase storage
 * @param userId - The user ID associated with the image
 * @param imageName - The name of the image to delete
 * @returns Object containing success status and data or error
 */
export const deleteImage = async (userId: string, imageName: string) => {
  try {
    const { data, error } = await supabase.storage.from("selfie-images").remove([`${userId}/${imageName}`])

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error deleting image:", error)
    return { success: false, error }
  }
}

/**
 * Gets all images for a specific user from Supabase storage
 * @param userId - The user ID to get images for
 * @returns Object containing success status and list of images or error
 */
export const getAllImages = async (userId: string) => {
  try {
    const { data, error } = await supabase.storage.from("selfie-images").list(userId, {
      sortBy: { column: "created_at", order: "desc" },
    })

    if (error) throw error

    // Generate public URLs for each image
    const imagesWithUrls = data.map((file) => {
      const publicUrl = supabase.storage.from("selfie-images").getPublicUrl(`${userId}/${file.name}`).data.publicUrl

      return {
        ...file,
        url: publicUrl,
      }
    })

    return { success: true, data: imagesWithUrls }
  } catch (error) {
    console.error("Error getting all images:", error)
    return { success: false, error }
  }
}

