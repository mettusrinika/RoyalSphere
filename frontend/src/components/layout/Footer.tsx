import Link from 'next/link';
import { Crown, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-royal-navy text-white">
      <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-royal-gold rounded-lg flex items-center justify-center">
              <Crown size={18} className="text-royal-blue" />
            </div>

            <span className="font-bold text-xl">
              Royal <span className="text-royal-gold">Sphere</span>
            </span>
          </div>

          <p className="text-blue-300 text-sm leading-relaxed max-w-md">
            Royal Sphere is an AI-powered services ecosystem connecting customers,
            verified vendors and businesses through one trusted platform. Starting
            with events and lifestyle services, our vision is to become India's
            most trusted services marketplace.
          </p>

          <div className="mt-6 space-y-2 text-sm text-blue-300">
            <div className="flex items-center gap-2">
              <Mail size={14} />
              Contact information will be available at launch
            </div>

            <div className="flex items-center gap-2">
              <Phone size={14} />
              Support available after public launch
            </div>

            <div className="flex items-center gap-2">
              <MapPin size={14} />
              Hyderabad, Telangana, India
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-4">Platform</h4>

          <ul className="space-y-2 text-sm text-blue-300">
            <li>
              <Link href="/services" className="hover:text-royal-gold transition-colors">
                Services
              </Link>
            </li>

            <li>
              <Link href="/vendors" className="hover:text-royal-gold transition-colors">
                Vendors
              </Link>
            </li>

            <li>
              <Link href="/ai/budget-planner" className="hover:text-royal-gold transition-colors">
                AI Planner
              </Link>
            </li>

            <li>
              <Link href="/auth/register" className="hover:text-royal-gold transition-colors">
                Get Started
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-4">Company</h4>

          <ul className="space-y-2 text-sm text-blue-300">
            <li>
              <Link href="/about" className="hover:text-royal-gold transition-colors">
                About
              </Link>
            </li>

            <li>
              <Link href="/privacy" className="hover:text-royal-gold transition-colors">
                Privacy Policy
              </Link>
            </li>

            <li>
              <Link href="/terms" className="hover:text-royal-gold transition-colors">
                Terms of Service
              </Link>
            </li>

            <li>
              <Link href="/contact" className="hover:text-royal-gold transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-sm text-blue-400">
        © {new Date().getFullYear()} Royal Sphere. All rights reserved.
      </div>
    </footer>
  );
}