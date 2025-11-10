import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const metadata = {
  title: "Our Services - Royal Sphere",
  description:
    "Explore all services available on Royal Sphere platform for weddings, fashion, makeup, photography, and event decor.",
}

export default function Services() {
  const services = [
    {
      icon: "💍",
      title: "Wedding & Event Planning",
      description:
        "From intimate gatherings to grand celebrations, find experienced wedding planners, coordinators, and all-in-one event professionals.",
      features: ["Wedding Planners", "Event Coordinators", "Venue Consultation", "Catering Services", "Decorations"],
    },
    {
      icon: "💄",
      title: "Makeup & Beauty",
      description:
        "Get stunning makeup looks for any occasion with certified and experienced makeup artists and beauty professionals.",
      features: ["Bridal Makeup", "Party Makeup", "Beauty Treatments", "Skincare Services", "Salon Services"],
    },
    {
      icon: "👗",
      title: "Fashion & Styling",
      description:
        "Discover expert fashion stylists and designers who can help you look your absolute best for any event.",
      features: ["Personal Styling", "Fashion Consultation", "Outfit Selection", "Alterations", "Designer Collections"],
    },
    {
      icon: "📸",
      title: "Photography & Videography",
      description:
        "Capture your most precious moments with professional photographers and videographers specializing in events.",
      features: ["Event Photography", "Videography", "Photo Editing", "Album Creation", "Live Streaming"],
    },
    {
      icon: "🎨",
      title: "Event Decor",
      description: "Transform any space into a magical venue with creative decorators and design professionals.",
      features: ["Floral Arrangements", "Theme Decoration", "Lighting Design", "Table Settings", "Venue Styling"],
    },
    {
      icon: "✨",
      title: "Additional Services",
      description: "Explore more specialized services including entertainment, catering, invitations, and more.",
      features: ["Entertainment Acts", "Catering", "Invitations", "Transport", "Custom Services"],
    },
  ]

  return (
    <ThemeProvider>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-primary text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 text-balance">
              Our Comprehensive Services
            </h1>
            <p className="text-lg text-white/90 max-w-3xl">
              Everything you need for your celebrations and lifestyle events, all available in one trusted platform with
              verified professionals.
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="h-16 bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>

                  <div className="p-6">
                    <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-3">{service.title}</h3>

                    <p className="text-foreground/70 mb-6 text-sm md:text-base">{service.description}</p>

                    <div className="space-y-2 mb-6">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-foreground/80">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          {feature}
                        </div>
                      ))}
                    </div>

                    <Link
                      href="/vendors"
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-semibold text-sm"
                    >
                      Book Now
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 md:py-24 bg-primary/5 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
              Why Choose Royal Sphere Services?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-3">✓</div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">Verified Professionals</h3>
                <p className="text-foreground/70">
                  All vendors are thoroughly vetted and verified for quality and professionalism
                </p>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-3">✓</div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">Competitive Pricing</h3>
                <p className="text-foreground/70">
                  Compare vendors and find the best value for your budget and requirements
                </p>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-3">✓</div>
                <h3 className="font-display text-xl font-bold text-foreground mb-3">Easy Booking</h3>
                <p className="text-foreground/70">Seamless booking process with secure payments and customer support</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Info */}
        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">Get Started Today</h2>
            <p className="text-foreground/70 text-lg mb-8">
              Each service has its own pricing based on vendor expertise and service scope. Contact vendors directly
              through our platform for personalized quotes.
            </p>
            <Link href="/vendors">
              <Button className="bg-primary hover:bg-primary/90 text-white text-base h-12 px-8">
                Browse Vendors & Services
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </ThemeProvider>
  )
}
