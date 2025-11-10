"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Menu, X, Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/vendors", label: "Vendors" },
    { href: "/contact", label: "Contact" },
  ]

  if (!mounted) return null

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border backdrop-blur-sm animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 relative flex-shrink-0">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/RSMainLogo-7N712KSLRUE4gOtmxAp6R4P7PCTDqc.png"
                alt="Royal Sphere Logo"
                fill
                className="object-contain group-hover:shadow-lg transition-all duration-300"
                priority
              />
            </div>
            <span className="hidden md:inline font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-300">
              Royal Sphere
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side - Theme & CTA */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-muted rounded-lg transition-all duration-300 -translate-y-0 hover:-translate-y-1"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link href="/join" className="hidden sm:inline">
              <Button className="bg-primary hover:bg-primary/90 text-white transition-all duration-300 -translate-y-0 hover:-translate-y-1 hover:shadow-lg">
                Join as Vendor
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 transition-colors duration-300"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-border animate-slide-up">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors duration-300"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/join" className="block px-4 py-2">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white -translate-y-0 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                Join as Vendor
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
