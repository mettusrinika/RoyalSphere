import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, Users, Target, Lightbulb } from "lucide-react"

export const metadata = {
  title: "About Royal Sphere - Our Story & Mission",
  description:
    "Learn about Royal Sphere, our vision to redefine lifestyle and event services, and meet our founder Mettu Srinika.",
}

export default function About() {
  const values = [
    {
      icon: Target,
      title: "Trusted Quality",
      description: "All vendors are verified and vetted to ensure the highest standards of service",
    },
    {
      icon: Users,
      title: "Community Focused",
      description: "We believe in building genuine connections between customers and service providers",
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "Continuously improving our platform to make lifestyle planning simpler and better",
    },
    {
      icon: CheckCircle2,
      title: "Convenience",
      description: "One-stop solution for all your lifestyle and event planning needs",
    },
  ]

  return (
    <ThemeProvider>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-primary text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 text-balance">About Royal Sphere</h1>
            <p className="text-lg text-white/90 max-w-2xl">
              Redefining convenience in lifestyle and event services through digital innovation and trusted
              partnerships.
            </p>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-8 border border-primary/20">
                <h2 className="font-display text-3xl font-bold text-primary mb-4">Our Vision</h2>
                <p className="text-foreground/80 text-lg leading-relaxed">
                  To redefine convenience in lifestyle and event services by creating a seamless platform where
                  individuals and families can easily discover, connect, and collaborate with trusted service providers
                  for every celebration and milestone.
                </p>
              </div>

              <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-8 border border-accent/20">
                <h2 className="font-display text-3xl font-bold text-foreground mb-4">Our Mission</h2>
                <p className="text-foreground/80 text-lg leading-relaxed">
                  To deliver verified, quality-driven lifestyle services through digital innovation and strategic
                  partnerships. We empower vendors while providing customers with transparent, trustworthy access to the
                  best professionals in the industry.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 md:py-24 bg-primary/5 border-y border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">Our Story</h2>

            <div className="space-y-6 text-foreground/80">
              <p className="text-lg leading-relaxed">
                Royal Sphere was founded by <strong>Mettu Srinika</strong> with a simple yet powerful vision: to make
                lifestyle and event planning effortless for everyone. After experiencing the challenge of finding
                reliable vendors for personal events, Mettu recognized a gap in the market that needed bridging.
              </p>

              <p className="text-lg leading-relaxed">
                What started as a small initiative to connect couples with wedding vendors has evolved into a
                comprehensive lifestyle platform serving thousands of customers and hundreds of verified service
                providers across multiple categories including weddings, fashion, beauty, photography, and event decor.
              </p>

              <p className="text-lg leading-relaxed">
                Today, Royal Sphere stands as a testament to the power of trust, quality, and innovation. Every vendor
                on our platform is carefully verified, every customer is treated with care, and every moment is made
                more special through our dedicated community of professionals.
              </p>

              <p className="text-lg leading-relaxed">
                We continue to grow and expand our services, always keeping our core values at the heart of everything
                we do: authenticity, excellence, and the belief that every celebration deserves to be royal.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
              Our Values
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon
                return (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="bg-primary/10 p-4 rounded-lg">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-2">{value.title}</h3>
                    <p className="text-foreground/70">{value.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary to-primary/90 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">Join Our Community</h2>
            <p className="text-lg text-white/90 mb-8">
              Whether you're looking for exceptional vendors or want to grow your business with us, Royal Sphere is your
              platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/vendors">
                <Button className="bg-white text-primary hover:bg-white/90 text-base h-12 px-8">Explore Vendors</Button>
              </Link>
              <Link href="/join">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-base h-12 px-8 bg-transparent"
                >
                  Become a Vendor
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </ThemeProvider>
  )
}
