import { motion } from "framer-motion";
import { Download, Share2, ShoppingBag, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface Props {
  score: number;
  style: string;
  budget: number;
  productCount: number;
}

const Particles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 24 }).map((_, i) => (
      <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-primary/30" initial={{ x: Math.random() * 100 + "%", y: Math.random() * 100 + "%", opacity: 0 }} animate={{ y: [null, "-20%"], opacity: [0, 1, 0] }} transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 4 }} />
    ))}
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-6 bg-card border border-border/50 text-center">
    <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="text-2xl md:text-3xl font-semibold mt-2">{value}</p>
  </motion.div>
);

const ShareNextSteps = ({ score, style, budget, productCount }: Props) => {
  const navigate = useNavigate();

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "My HomeMockUp Design", url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied", description: "Share your design with anyone." });
      }
    } catch {}
  };

  return (
    <div className="relative space-y-12">
      <Particles />
      <div className="text-center space-y-3 relative">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chapter 10</p>
        <h2 className="text-5xl md:text-7xl font-semibold tracking-tight leading-tight">Your design,<br /><span className="italic font-light">complete.</span></h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Share it, shop it, or start your next room.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
        <Stat label="Design Score" value={`${score}`} />
        <Stat label="Style" value={style} />
        <Stat label="Est. Budget" value={`€${budget.toLocaleString()}`} />
        <Stat label="Products" value={`${productCount}`} />
      </div>

      <div className="flex flex-wrap justify-center gap-3 relative">
        <Button size="lg" className="rounded-full h-12 px-6 gap-2 bg-foreground text-background hover:bg-foreground/90" onClick={() => toast({ title: "Design book", description: "Coming soon." })}>
          <Download className="w-4 h-4" /> Download Design Book
        </Button>
        <Button size="lg" variant="outline" className="rounded-full h-12 px-6 gap-2" onClick={share}>
          <Share2 className="w-4 h-4" /> Share
        </Button>
        <Button size="lg" variant="outline" className="rounded-full h-12 px-6 gap-2" onClick={() => navigate("/gallery")}>
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </Button>
        <Button size="lg" variant="outline" className="rounded-full h-12 px-6 gap-2" onClick={() => navigate("/start")}>
          <HomeIcon className="w-4 h-4" /> Start Another Room
        </Button>
      </div>
    </div>
  );
};

export default ShareNextSteps;