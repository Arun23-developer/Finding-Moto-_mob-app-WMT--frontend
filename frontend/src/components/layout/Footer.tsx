import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, LucideIcon } from "lucide-react";

interface FooterLink {
  name: string;
  href: string;
}

interface FooterLinkSection {
  shop: FooterLink[];
  services: FooterLink[];
  company: FooterLink[];
  support: FooterLink[];
}

interface SocialLink {
  name: string;
  icon: LucideIcon;
  href: string;
}

const footerLinks: FooterLinkSection = {
  shop: [
    { name: "All Parts", href: "/products" },
    { name: "Engine Parts", href: "/products?category=engine" },
    { name: "Brakes & Suspension", href: "/products?category=brakes" },
    { name: "Accessories", href: "/products?category=accessories" },
    { name: "Gear & Apparel", href: "/products?category=gear" },
  ],
  services: [
    { name: "Find a Garage", href: "/services" },
    { name: "Book Service", href: "/services#book" },
    { name: "Maintenance Tips", href: "/services#tips" },
    { name: "Emergency Support", href: "/services#emergency" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Careers", href: "/about#careers" },
    { name: "Press", href: "/about#press" },
    { name: "Blog", href: "/blog" },
  ],
  support: [
    { name: "Contact Us", href: "/contact" },
    { name: "FAQ", href: "/contact#faq" },
    { name: "Shipping Info", href: "/shipping" },
    { name: "Returns", href: "/returns" },
  ],
};

const socialLinks: SocialLink[] = [
  { name: "Facebook", icon: Facebook, href: "#" },
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "YouTube", icon: Youtube, href: "#" },
];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                <span className="text-xl font-black text-accent-foreground">FM</span>
              </div>
              <span className="text-xl font-bold">
                Finding<span className="text-accent">Moto</span>
              </span>
            </Link>
            <p className="text-primary-foreground/70 text-sm mb-6 max-w-xs">
              Your trusted destination for quality motorcycle parts and reliable service providers.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/10 hover:bg-accent transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-primary-foreground/70">
              <a href="mailto:contact@findingmoto.com" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Mail className="h-4 w-4" />
                contact@findingmoto.com
              </a>
              <a href="tel:+1234567890" className="flex items-center gap-2 hover:text-accent transition-colors">
                <Phone className="h-4 w-4" />
                +1 (234) 567-890
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Los Angeles, CA
              </span>
            </div>
            <p className="text-sm text-primary-foreground/50">
              &copy; {new Date().getFullYear()} Finding Moto. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
