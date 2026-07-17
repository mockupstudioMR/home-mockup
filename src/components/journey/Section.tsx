import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

const Section = ({ children, className, id }: SectionProps) => (
  <motion.section
    id={id}
    initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    className={cn(
      "min-h-screen w-full flex items-center justify-center px-6 md:px-12 py-24 relative",
      className
    )}
  >
    <div className="w-full max-w-6xl">{children}</div>
  </motion.section>
);

export default Section;