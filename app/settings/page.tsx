import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { ProfileSettings } from "@/components/settings/profile-settings"

export default function SettingsPage() {
  return (
    <AuthenticatedLayout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and profile</p>
        </div>
        <ProfileSettings />
      </div>
    </AuthenticatedLayout>
  )
}

