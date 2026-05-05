import { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

const quickLinks = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Services", to: "/services" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const Footer = () => {
  const handleRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <footer className="bg-[#121212] text-white border-t border-[#2C2C2C]">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.95fr_1.15fr]">
          {/* Brand Section */}
          <div className="rounded-lg border border-[#2C2C2C] bg-[#181818] p-6">
            <Link to="/" className="mb-4 inline-flex items-center">
              <span className="font-heading text-2xl font-bold tracking-tight text-white">
                Finding<span className="text-[#E53935]">Moto</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-6 text-[#B0B0B0]">
              A trusted marketplace for genuine bike parts, verified mechanics,
              service support, and delivery updates in one place.
            </p>
          </div>

          {/* Quick Links */}
          <div className="rounded-lg border border-[#2C2C2C] bg-[#181818] p-6">
            <h3 className="font-heading text-base font-semibold text-white">
              Quick Links
            </h3>
            <nav className="mt-5 flex flex-col gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm text-[#B0B0B0] transition-colors hover:text-[#E53935]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Services Section */}
          <div className="rounded-lg border border-[#2C2C2C] bg-[#181818] p-6">
            <h3 className="font-heading text-base font-semibold text-white">
              Services
            </h3>
            <p className="mt-5 text-sm leading-6 text-[#B0B0B0]">
              We offer premium motorbike spare parts sourced from trusted manufacturers, access to verified and experienced mechanics, comprehensive bike servicing and maintenance, specialized engine repair services, professional brake and suspension work, and convenient doorstep delivery across the region.
            </p>
          </div>

          {/* Create New Account */}
          <div className="rounded-lg border border-[#2C2C2C] bg-[#181818] p-6">
            <h3 className="font-heading text-base font-semibold text-white">
              Create New Account
            </h3>
            <p className="mt-4 text-sm leading-6 text-[#B0B0B0]">
              Join our marketplace and get access to exclusive deals and services.
            </p>
            <form onSubmit={handleRegister} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="min-h-11 flex-1 rounded-lg border border-[#2C2C2C] bg-[#121212] px-4 text-sm text-white outline-none transition-colors placeholder:text-[#777777] focus:border-[#E53935]"
              />
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#E53935] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#FF4C4C] whitespace-nowrap"
              >
                Register
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 border-t border-[#2C2C2C] pt-6 text-center text-sm text-[#888888]">
          © {new Date().getFullYear()} Finding Moto. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
