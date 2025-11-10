"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Star } from "lucide-react"
import { useEffect, useState } from "react"

export function PageClient() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "categories", "stats", "testimonials", "cta"]
      const newVisible = new Set<string>()

      sections.forEach((section) => {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top < window.innerHeight * 0.75) {
            newVisible.add(section)
          }
        }
      })

      setVisibleSections(newVisible)
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Call on mount
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const categories = [
    {
      icon: "💍",
      name: "Weddings & Events",
      description: "Plan your perfect celebration with trusted vendors",
      color: "from-primary/10 to-primary/5",
    },
    {
      icon: "💄",
      name: "Makeup & Beauty",
      description: "Get glammed up with certified makeup artists",
      color: "from-accent/10 to-accent/5",
    },
    {
      icon: "👗",
      name: "Fashion & Styling",
      description: "Discover expert stylists for every occasion",
      color: "from-primary/10 to-primary/5",
    },
    {
      icon: "📸",
      name: "Photography",
      description: "Capture your moments with professional photographers",
      color: "from-accent/10 to-accent/5",
    },
    {
      icon: "🎨",
      name: "Event Decor",
      description: "Create magical spaces with expert decorators",
      color: "from-primary/10 to-primary/5",
    },
    {
      icon: "✨",
      name: "More Services",
      description: "Explore additional lifestyle and planning services",
      color: "from-accent/10 to-accent/5",
    },
  ]

  const testimonials = [
    {
      text: "Royal Sphere made planning my wedding so easy! I found amazing vendors all in one place. Highly recommended!",
      author: "Sarah Johnson",
      role: "Bride",
      rating: 5,
    },
    {
      text: "As a vendor, Royal Sphere has been incredible for my business. The platform is professional and brings quality leads.",
      author: "Michael Chen",
      role: "Photographer",
      rating: 5,
    },
    {
      text: "Finding a makeup artist was seamless. The verification system gives me confidence in the quality. Love this platform!",
      author: "Emma Williams",
      role: "Customer",
      rating: 5,
    },
  ]

  return (
    <ThemeProvider>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section
          id="hero"
          className="relative bg-gradient-to-br from-primary via-primary to-primary/90 text-white overflow-hidden pt-12 md:pt-20 pb-20 md:pb-32 animate-fade-in"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 right-0 w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-3xl animate-pulse-soft"></div>
            <div
              className="absolute bottom-0 left-20 w-96 h-96 bg-accent/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-soft"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-6">
              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-balance animate-slide-up">
                One Platform, Infinite Possibilities
              </h1>
              <p
                className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto text-balance animate-slide-up"
                style={{ animationDelay: "100ms" }}
              >
                Find trusted vendors for every celebration — weddings, fashion, beauty, and more. Connect with verified
                professionals and make every moment royal.
              </p>
              <div
                className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-slide-up"
                style={{ animationDelay: "200ms" }}
              >
                <Link href="/vendors">
                  <Button className="bg-white text-primary hover:bg-white/90 text-base md:text-lg h-12 md:h-14 px-6 md:px-8 -translate-y-0 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                    Explore Services
                  </Button>
                </Link>
                <Link href="/join">
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 text-base md:text-lg h-12 md:h-14 px-6 md:px-8 bg-transparent -translate-y-0 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                  >
                    Join as Vendor
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section id="categories" className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16 animate-fade-in">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">Our Services</h2>
              <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
                Everything you need for your special occasions, all in one trusted platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${category.color} border border-border rounded-xl p-6 md:p-8 hover:border-primary/30 transition-all duration-300 cursor-pointer group animate-stagger-fade ${
                    visibleSections.has("categories") ? "animate-scale-in" : "opacity-0"
                  }`}
                >
                  <div className="text-4xl md:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">{category.name}</h3>
                  <p className="text-foreground/70 text-sm md:text-base">{category.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-16 md:py-24 bg-primary/5 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[
                { label: "Verified Vendors", value: "500+" },
                { label: "Happy Customers", value: "10K+" },
                { label: "Average Rating", value: "4.9★" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`text-center animate-fade-in ${
                    visibleSections.has("stats") ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="font-display text-4xl md:text-5xl font-bold text-primary mb-2 animate-pulse-soft">
                    {stat.value}
                  </div>
                  <p className="text-foreground/70 text-lg">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16 animate-fade-in">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Loved by Our Community
              </h2>
              <p className="text-foreground/70 text-lg">See what customers and vendors say about Royal Sphere</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow duration-300 animate-stagger-fade ${
                    visibleSections.has("testimonials") ? "animate-scale-in" : "opacity-0"
                  }`}
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-accent text-accent animate-pulse-soft"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-foreground/80 mb-6 italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-foreground/60 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-16 md:py-24 bg-gradient-to-r from-primary to-primary/90 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-lg text-white/90 mb-8">
              Whether you're looking for vendors or want to join our platform, we're here to help make your moments
              royal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/vendors">
                <Button className="bg-white text-primary hover:bg-white/90 text-base h-12 px-8 -translate-y-0 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  Find Vendors
                </Button>
              </Link>
              <Link href="/join">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-base h-12 px-8 bg-transparent -translate-y-0 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                >
                  Become a Vendor
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-12 md:py-16 bg-background border-b border-border animate-fade-in">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">Stay Updated</h3>
            <p className="text-foreground/70 mb-6">
              Subscribe to our newsletter for exclusive vendor spotlights, tips, and special offers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
              />
              <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-6 -translate-y-0 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                Subscribe
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </ThemeProvider>
  )
}
