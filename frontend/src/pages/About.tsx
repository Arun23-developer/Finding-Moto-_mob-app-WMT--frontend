import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-24 section-padding">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            About <span className="text-gradient">Finding Moto</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
            Finding Moto is a dedicated motorbike marketplace built to connect riders with genuine spare parts, verified mechanics, and reliable services.
          </p>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            We focus on creating a seamless experience where users can discover, compare, and access everything their bike needs without hassle. By combining smart technology with trusted service networks, we ensure every rider gets quality support.
          </p>
          <p className="text-muted-foreground mb-12 leading-relaxed">
            From daily maintenance to major repairs, Finding Moto empowers riders with the right tools, trusted professionals, and fast delivery - all in one platform.
          </p>
        </motion.div>

      </div>
    </div>
    <Footer />
  </div>
);

export default About;
