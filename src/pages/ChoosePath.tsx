import { useNavigate } from "react-router-dom";
import { Briefcase, Home, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

const ChoosePath = () => {
  const navigate = useNavigate();

  const options = [
    {
      id: "end-user",
      icon: <Home className="w-8 h-8" />,
      title: "I'm designing my home",
      description: "Redesign your space, explore styles, and bring your vision to life.",
      path: "/start",
      gradient: "from-primary/30 to-secondary/30",
    },
    {
      id: "professional",
      icon: <Briefcase className="w-8 h-8" />,
      title: "I'm a professional",
      description: "Furniture shops, designers & real estate — grow your business with AI tools.",
      path: "/b2b-solutions",
      gradient: "from-accent/30 to-primary/20",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Logo size={32} />
          <span className="font-semibold text-lg tracking-tight text-foreground">HomeMockUp</span>
        </button>
      </header>

      <main className="relative z-10 px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 py-8 md:py-16">
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Welcome
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Who are you?
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              Choose the experience that fits you best.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => navigate(option.path)}
                className={`group relative block rounded-2xl overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 text-left p-8 md:p-10 min-h-[280px] flex flex-col justify-between bg-gradient-to-br ${option.gradient}`}
              >
                <div className="w-16 h-16 rounded-2xl bg-background/90 text-primary flex items-center justify-center shadow-md mb-6">
                  {option.icon}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 group-hover:text-primary transition-colors">
                    {option.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-5">
                    {option.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Continue
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChoosePath;
