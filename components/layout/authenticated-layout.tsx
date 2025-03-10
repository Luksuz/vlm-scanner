"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Images, Settings, LogOut, Menu, User, Loader2 } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname() // Moved usePathname here
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
      } else {
        router.push("/login")
      }
      setLoading(false)
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null // This prevents the protected content from flashing before redirect
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "User Images", href: "/user-images", icon: Images },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <div className="flex h-full flex-col">
                  <div className="flex items-center gap-2 border-b py-4">
                    <span className="font-bold">
                      <span className="text-primary">Document</span>Scanner
                    </span>
                  </div>
                  <nav className="flex-1 overflow-auto py-4">
                    <div className="flex flex-col gap-1">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                            pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </nav>
                  <div className="border-t py-4">
                    <Button variant="ghost" className="w-full justify-start gap-2 text-sm" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="flex items-center gap-2 font-bold">
              <span className="text-primary">Document</span>Scanner
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm">{user.email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            }
          </div>
        </div>
      </header>
      <div className="flex flex-1 container sm:px-6 lg:px-8">
        <aside className="hidden w-64 border-r md:block bg-background">
          <div className="flex h-full flex-col">
            <nav className="flex-1 overflow-auto p-4">
              <div className="flex flex-col gap-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

