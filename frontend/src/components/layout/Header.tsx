import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Menu, X, Search, ShoppingCart, User, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { resolveMediaUrl } from "@/lib/imageUrl";

interface NavLink {
  name: string;
  href: string;
}

const navLinks: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
  { name: "Services", href: "/services" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = (): void => {
    logout();
    setIsProfileOpen(false);
    navigate("/");
  };

  const getInitials = (): string => {
    if (!user) return "?";
    const first = user.firstName?.charAt(0) || "";
    const last = user.lastName?.charAt(0) || "";
    return (first + last).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-black text-primary-foreground">FM</span>
          </div>
          <span className="text-xl font-bold text-foreground">
            Finding<span className="text-accent">Moto</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-md",
                location.pathname === link.href
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Search" onClick={() => navigate("/products") }>
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Cart" className="relative" onClick={() => navigate("/buyer/cart") }>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Button>

          {user ? (
            /* Logged-in state: Profile dropdown */
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-secondary transition-colors"
              >
                {user.avatar ? (
                  <img src={resolveMediaUrl(user.avatar, "https://placehold.co/80x80?text=U")} alt="Avatar" className="w-8 h-8 rounded-full object-cover border-2 border-accent" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                    {getInitials()}
                  </div>
                )}
                <span className="text-sm font-medium text-foreground hidden lg:block">
                  {user.firstName}
                </span>
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-border shadow-lg animate-fade-in overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      Dashboard
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      My Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Settings
                    </Link>
                  </div>
                  <div className="border-t border-border py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged-out state: Login / Register buttons */
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button variant="accent" size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-1 md:hidden">
          <Button variant="ghost" size="icon" aria-label="Cart" className="relative" onClick={() => navigate("/buyer/cart") }>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-slide-down">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "px-4 py-3 text-sm font-medium rounded-md transition-colors",
                  location.pathname === link.href
                    ? "bg-secondary text-accent"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              {user ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img src={resolveMediaUrl(user.avatar, "https://placehold.co/80x80?text=U")} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                        {getInitials()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" size="sm">Dashboard</Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="text-destructive">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="accent" size="sm" className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
