import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { ImageGallery } from "@/components/user-images/image-gallery"

export default function UserImagesPage() {
  return (
    <AuthenticatedLayout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">User Images</h1>
          <p className="text-muted-foreground">View all your uploaded images</p>
        </div>
        <ImageGallery />
      </div>
    </AuthenticatedLayout>
  )
}

