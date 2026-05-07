import { Linkedin, Twitter, Instagram, Facebook } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  Donate: [
    { label: "Health Fund", href: "/explore" },
    { label: "Funeral Fund", href: "/explore" },
    { label: "scholarship fund", href: "/explore" },
  ],
  "Quick links": [
    { label: "About", href: "/about" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "About JoyFund", href: "/about" },
    { label: "Explore JoyFunds", href: "/explore" },
    { label: "Privacy policy", href: "#" },
  ],
  Legal: [
    { label: "Terms of service", href: "#" },
    { label: "data protection", href: "#" },
    { label: "Privacy policy", href: "#" },
    { label: "Cookie policy", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 mb-12">
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-bold text-gray-900 mb-5 text-sm tracking-wide">
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-500 hover:text-blue-600 text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">© 2026 JoyFund</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors" aria-label="LinkedIn">
              <Linkedin size={18} />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors" aria-label="X / Twitter">
              <Twitter size={18} />
            </a>
            <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors" aria-label="Instagram">
              <Instagram size={18} />
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-700 transition-colors" aria-label="Facebook">
              <Facebook size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
