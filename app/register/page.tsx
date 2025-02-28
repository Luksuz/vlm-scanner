import Link from "next/link"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="text-primary">Document</span>Scanner
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <RegisterForm />
      </main>
    </div>
  )
}

