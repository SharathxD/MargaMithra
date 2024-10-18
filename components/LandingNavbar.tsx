"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-background border-b z-10">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          MargaMithra
        </Link>
        <div className="space-x-4">
          <Link href="/" className="text-foreground hover:text-primary">
            Home
          </Link>
          <Link href="/features" className="text-foreground hover:text-primary">
            Features
          </Link>
          <Link href="/contact" className="text-foreground hover:text-primary">
            Contact Us
          </Link>
        </div>
        <div className="space-x-2">
          <Button variant="outline" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}