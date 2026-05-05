import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const slides = [
  {
    label: "Premium motorbike",
    image:
      "https://tse2.mm.bing.net/th/id/OIP.7rCrJ4ki5wSjidbFlzCvQQHaEP?rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    label: "Workshop service",
    image:
      "https://tse1.mm.bing.net/th/id/OIP.7L5niiPMOX7-Q2CDeAdZPwHaFn?rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    label: "Genuine spare parts",
    image:
      "https://th.bing.com/th/id/OIP.SjyrZVG9X0o4bbduJRxGcwHaFj?w=242&h=181&c=7&r=0&o=7&pid=1.7&rm=3",
  },
  {
    label: "Parts and accessories",
    image:
      "https://th.bing.com/th/id/OIP.Fo7UuDNkSpFQU6TPAtY8HQHaDS?w=283&h=155&c=7&r=0&o=7&pid=1.7&rm=3",
  },
  {
    label: "Mechanic support",
    image:
      "https://tse4.mm.bing.net/th/id/OIP.I19NrtAV7t-LeKE-cbSkngHaE7?rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    label: "Rider service network",
    image:
      "https://tse1.mm.bing.net/th/id/OIP.e0qrf6PwpmTTYGOiUTN02wHaFc?rs=1&pid=ImgDetMain&o=7&rm=3",
  },
];

const tags = ["Motorbikes", "Spare Parts", "Mechanic Services", "Delivery"];
const features = ["Genuine Parts", "Verified Mechanics", "All Major Brands", "Fast Delivery"];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);

  const goToSlide = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [next]);

  return (
    <section className="flex min-h-screen items-center justify-center overflow-hidden bg-[#121212] px-4 pb-8 pt-24 sm:pt-28 lg:px-6">
      <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-2xl border border-[#2C2C2C] bg-[#121212] text-white shadow-2xl shadow-black/40">
        <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[0.96fr_1.04fr]">
          <div className="relative z-10 flex min-w-0 flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 h-0.5 w-9 rounded-full bg-[#E53935]"
            />

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-5 font-heading text-5xl font-black leading-none tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              Finding
              <br />
              <span className="text-[#E53935]">Moto</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-3 max-w-[360px] text-lg font-semibold leading-snug text-white"
            >
              Everything Your Bike Needs in One Place
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 max-w-[380px] text-sm leading-7 text-[#B0B0B0]"
            >
              Find genuine spare parts, connect with trusted mechanics, and get reliable service and
              delivery all from one platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mb-6 flex max-w-[420px] flex-wrap gap-2"
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 rounded-md border border-[#2C2C2C] bg-[#1E1E1E] px-3 py-1.5 text-xs font-medium text-[#B0B0B0]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E53935]" />
                  {tag}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.58, duration: 0.7 }}
              className="mb-8 grid max-w-[420px] grid-cols-1 gap-3 sm:grid-cols-2"
            >
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm font-medium text-[#e0e0e0]">
                  <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#E53935]">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                  {feature}
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.72, duration: 0.6 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#E53935] px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.03] hover:bg-[#FF4C4C] hover:shadow-[0_0_18px_rgba(229,57,53,.35)] active:scale-[0.97]"
              >
                Browse Parts <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#3A3A3A] bg-transparent px-6 py-3 text-sm font-medium text-white transition-all hover:scale-[1.03] hover:border-[#6A6A6A] hover:bg-[#1E1E1E] active:scale-[0.97]"
              >
                <MessageCircle className="h-4 w-4" /> Find a Mechanic
              </Link>
            </motion.div>
          </div>

          <div className="relative min-h-[360px] overflow-hidden bg-[#161616] sm:min-h-[460px] lg:min-h-0">
            {slides.map((slide, index) => (
              <div
                key={slide.image}
                className={`absolute inset-0 transition-all duration-1000 ease-out ${
                  index === current ? "scale-105 opacity-100" : "scale-100 opacity-0"
                }`}
                aria-hidden={index !== current}
              >
                <img
                  src={slide.image}
                  alt={slide.label}
                  className="h-full w-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
                <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#121212]/80 to-transparent" />
              </div>
            ))}

            <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-[#2C2C2C] bg-black/60 px-3 py-1.5 text-xs font-medium text-[#EDEDED] backdrop-blur">
              {slides[current].label}
            </div>
            <div className="absolute bottom-5 right-5 z-10 flex gap-1.5">
              {slides.map((slide, index) => (
                <button
                  key={slide.label}
                  type="button"
                  onClick={() => goToSlide(index)}
                  aria-label={`Show ${slide.label}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === current ? "w-5 bg-[#E53935]" : "w-1.5 bg-[#4A4A4A] hover:bg-[#6A6A6A]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
