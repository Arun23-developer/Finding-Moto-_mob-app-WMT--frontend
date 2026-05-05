import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Products", path: "/products" },
  { label: "Services", path: "/services" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  const handleCartClick = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Please sign in as a buyer to view your cart.",
      });
      navigate("/login");
      return;
    }

    if (user.role !== "buyer") {
      toast({
        variant: "destructive",
        title: "Buyer account required",
        description: "Please switch to a buyer account to use the cart.",
      });
      navigate("/dashboard");
      return;
    }

    navigate("/buyer/cart");
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl transition-all duration-300 ${
        isScrolled ? "bg-card/90 shadow-lg" : "bg-card/80"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-16 md:h-20 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="h-7 w-7 text-primary" />
          <span className="font-heading font-bold text-xl tracking-tight">
            Finding<span className="text-primary">Moto</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:text-primary ${
                location.pathname === link.path ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <button
            className="relative p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors"
            aria-label="Cart"
            type="button"
            onClick={handleCartClick}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 ? (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </button>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="px-5 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile actions */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            className="relative p-2 rounded-lg text-foreground"
            aria-label="Cart"
            type="button"
            onClick={handleCartClick}
          >
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 ? (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </button>

          <button className="p-2 text-foreground" onClick={() => setIsMobileOpen(!isMobileOpen)}>
            {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass border-t border-border/50"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  className="px-4 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="px-4 py-3 text-sm font-semibold rounded-lg border border-border text-center mt-2"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="px-4 py-3 text-sm font-semibold rounded-lg bg-primary text-primary-foreground text-center"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-3 text-sm font-semibold rounded-lg border border-border text-center mt-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-3 text-sm font-semibold rounded-lg bg-primary text-primary-foreground text-center"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
