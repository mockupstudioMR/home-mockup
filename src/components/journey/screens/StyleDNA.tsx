import { motion } from "framer-motion";
import { Sparkles, Palette, Layers, Heart, Home as HomeIcon, Feather } from "lucide-react";

interface StyleDNAProps {
  primaryStyle?: string;
  secondaryStyle?: string;
  mood?: string;
  colors?: string[];
  materials?: string[];
  lifestyle?: string;
}

const container = { animate: { transition: { staggerChildren: 0.1 } } };
const item = {
  initial: { opacity: 0, y: 30, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const Card = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <motion.div
    variants={item}
    className="rounded-3xl p-6 bg-card border border-border/50 shadow-[0_10px_40px_-20px_hsl(var(--primary)/0.2)] flex flex-col gap-3"
  >
    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  </motion.div>
);

const StyleDNA = ({
  primaryStyle = "Modern Minimal",
  secondaryStyle = "Warm Scandinavian",
  mood = "Calm & Grounded",
  colors = ["#E8DFD3", "#8B7355", "#4A6741", "#2D2D2D", "#F5F0E8"],
  materials = ["Oak", "Linen", "Ceramic", "Wool"],
  lifestyle = "Quiet evenings, slow living",
}: StyleDNAProps) => {
  return (
    <motion.div variants={container} initial="initial" animate="animate" className="space-y-12">
      <motion.div variants={item} className="text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chapter 02</p>
        <h2 className="text-5xl md:text-6xl font-semibold tracking-tight">Your Style DNA</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">The essence of who you are, translated into space.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-5">
        <Card label="Primary Style" value={primaryStyle} icon={<Sparkles className="w-5 h-5" />} />
        <Card label="Secondary Style" value={secondaryStyle} icon={<Layers className="w-5 h-5" />} />
        <Card label="Mood" value={mood} icon={<Feather className="w-5 h-5" />} />

        <motion.div variants={item} className="rounded-3xl p-6 bg-card border border-border/50 md:col-span-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-4">
            <Palette className="w-4 h-4" /> Color palette
          </div>
          <div className="flex gap-3 flex-wrap">
            {colors.map((c, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1, type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-full border-4 border-background shadow-lg"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </motion.div>

        <Card label="Lifestyle Match" value={lifestyle} icon={<Heart className="w-5 h-5" />} />

        <motion.div variants={item} className="rounded-3xl p-6 bg-card border border-border/50 md:col-span-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-4">
            <HomeIcon className="w-4 h-4" /> Materials
          </div>
          <div className="flex flex-wrap gap-2">
            {materials.map((m) => (
              <span key={m} className="px-4 py-2 rounded-full bg-secondary/40 text-sm font-medium">{m}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StyleDNA;