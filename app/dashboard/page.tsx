import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { ImageUpload } from "@/components/dashboard/image-upload"

export default function DashboardPage() {
  return (
    <AuthenticatedLayout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Upload and scan your documents</p>
        </div>
        <ImageUpload />
      </div>
    </AuthenticatedLayout>
  )
}

