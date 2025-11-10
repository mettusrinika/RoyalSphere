"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Star, MapPin } from "lucide-react"

export default function Vendors() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [visibleVendors, setVisibleVendors] = useState<Set<number>>(new Set())

  const categories = [
    { id: "all", name: "All Services", icon: "✨" },
    { id: "wedding", name: "Weddings", icon: "💍" },
    { id: "makeup", name: "Makeup", icon: "💄" },
    { id: "fashion", name: "Fashion", icon: "👗" },
    { id: "photography", name: "Photography", icon: "📸" },
    { id: "decor", name: "Decor", icon: "🎨" },
  ]

  const vendors = [
    {
      id: 1,
      name: "Elegance Events",
      category: "wedding",
      rating: 4.9,
      reviews: 287,
      location: "New York, NY",
      image: "/wedding-planner-elegant.jpg",
      description: "Premium wedding planning and coordination services",
      price: "$$$",
    },
    {
      id: 2,
      name: "Glam by Sarah",
      category: "makeup",
      rating: 4.8,
      reviews: 156,
      location: "Los Angeles, CA",
      image: "/makeup-artist-professional.jpg",
      description: "Expert bridal and party makeup artist",
      price: "$$",
    },
    {
      id: 3,
      name: "Threads & Style",
      category: "fashion",
      rating: 4.7,
      reviews: 203,
      location: "Chicago, IL",
      image: "/fashion-stylist-boutique.jpg",
      description: "Personal styling and fashion consultation",
      price: "$$",
    },
    {
      id: 4,
      name: "Lens & Light Photography",
      category: "photography",
      rating: 4.9,
      reviews: 342,
      location: "Austin, TX",
      image: "/professional-photographer-studio.jpg",
      description: "Award-winning event and wedding photography",
      price: "$$$",
    },
    {
      id: 5,
      name: "Blooms & Decor",
      category: "decor",
      rating: 4.8,
      reviews: 198,
      location: "Miami, FL",
      image: "/event-decoration-floral-design.jpg",
      description: "Creative event decoration and floral design",
      price: "$$",
    },
    {
      id: 6,
      name: "Perfect Day Planning",
      category: "wedding",
      rating: 4.6,
      reviews: 124,
      location: "Boston, MA",
      image: "/wedding-coordinator-ceremony.jpg",
      description: "Full-service wedding coordination",
      price: "$$",
    },
    {
      id: 7,
      name: "Pro Makeup Studio",
      category: "makeup",
      rating: 4.9,
      reviews: 267,
      location: "New York, NY",
      image: "/makeup-studio-professional-artists.jpg",
      description: "Bridal and commercial makeup services",
      price: "$$",
    },
    {
      id: 8,
      name: "Fashion Forward",
      category: "fashion",
      rating: 4.7,
      reviews: 145,
      location: "Los Angeles, CA",
      image: "/fashion-designer-boutique-styling.jpg",
      description: "Designer styling and wardrobe consultation",
      price: "$$$",
    },
  ]

  const filteredVendors = vendors.filter((vendor) => {
    const matchesCategory = selectedCategory === "all" || vendor.category === selectedCategory
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  useEffect(() => {
    filteredVendors.forEach((vendor, index) => {
      setTimeout(() => {
        setVisibleVendors((prev) => new Set([...prev, vendor.id]))
      }, index * 50)
    })
  }, [filteredVendors])

  return (
    <ThemeProvider>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-primary text-white py-12 md:py-16 animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 animate-slide-up">
              Find Your Perfect Vendor
            </h1>
            <p className="text-lg text-white/90 animate-slide-up" style={{ animationDelay: "100ms" }}>
              Browse our curated list of verified professionals across all services
            </p>
          </div>
        </section>

        {/* Search and Filter */}
        <section className="bg-background border-b border-border py-6 md:py-8 animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search vendors by name or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                    selectedCategory === category.id
                      ? "bg-primary text-white shadow-md"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Vendors Grid */}
        <section className="py-12 md:py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {filteredVendors.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <p className="text-lg text-foreground/70">No vendors found matching your criteria.</p>
                <Button
                  onClick={() => {
                    setSelectedCategory("all")
                    setSearchQuery("")
                  }}
                  className="mt-4 bg-primary hover:bg-primary/90 text-white -translate-y-0 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredVendors.map((vendor, index) => (
                  <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
                    <div
                      className={`bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-500 cursor-pointer group h-full hover:scale-105 ${
                        visibleVendors.has(vendor.id) ? "animate-fade-in" : "opacity-0"
                      }`}
                    >
                      {/* Image */}
                      <div className="h-40 bg-muted overflow-hidden relative">
                        <img
                          src={vendor.image || "/placeholder.svg"}
                          alt={vendor.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-display text-lg font-bold text-foreground mb-1 line-clamp-1">
                          {vendor.name}
                        </h3>
                        <p className="text-sm text-foreground/70 mb-2 line-clamp-2">{vendor.description}</p>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-3">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 transition-all duration-300 ${i < Math.floor(vendor.rating) ? "fill-accent text-accent" : "text-muted"}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-foreground">{vendor.rating}</span>
                          <span className="text-xs text-foreground/60">({vendor.reviews})</span>
                        </div>

                        {/* Location & Price */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1 text-foreground/70 text-xs">
                            <MapPin className="w-3 h-3" />
                            {vendor.location}
                          </div>
                          <span className="text-sm font-semibold text-primary">{vendor.price}</span>
                        </div>

                        {/* Button */}
                        <Button className="w-full bg-primary hover:bg-primary/90 text-white text-sm h-9 -translate-y-0 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-primary/5 border-t border-border animate-fade-in">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">Are you a vendor?</h2>
            <p className="text-foreground/70 mb-6">
              Join our platform and start connecting with customers looking for your services.
            </p>
            <Link href="/join">
              <Button className="bg-primary hover:bg-primary/90 text-white -translate-y-0 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                Become a Vendor
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </ThemeProvider>
  )
}
