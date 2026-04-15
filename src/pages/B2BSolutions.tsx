import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, PenTool, Building2, Code2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import Logo from "@/components/Logo";
import B2BOnboardingFlow from "@/components/b2b/B2BOnboardingFlow";

const B2BSolutions = () => {
  const navigate = useNavigate();

  const solutions = [
    {
      icon: <Store className="w-8 h-8" />,
      title: "Furniture Shops",
      description: "Showcase products to matched users, manage inventory, and send targeted offers",
      features: [
        "AI-powered product matching with user preferences",
        "Automated inventory management via URL scraping",
        "Credit-based targeted offer system",
        "Analytics dashboard for engagement tracking",
      ],
    },
    {
      icon: <PenTool className="w-8 h-8" />,
      title: "Interior Designers",
      description: "Reach clients with personalized design proposals through a credit-based lead system",
      features: [
        "Access to qualified design leads",
        "Personalized proposal creation tools",
        "Client style profile insights",
        "Portfolio showcase integration",
      ],
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      title: "Real Estate & Staging",
      description: "Virtual staging, property visualization, and bulk room redesigns at scale",
      features: [
        "Virtual staging for empty properties",
        "Bulk room visualization processing",
        "Before/after comparison views",
        "MLS-ready export formats",
      ],
    },
    {
      icon: <Code2 className="w-8 h-8" />,
      title: "API & White-label",
      description: "Embed HomeMockUp's AI design engine directly into your own platform",
      features: [
        "RESTful API access to design generation",
        "Custom branding and theming",
        "Scalable infrastructure",
        "Dedicated support and SLA",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-2xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-accent/10 rounded-full blur-2xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3"
        >
          <Logo size={32} />
          <span className="font-semibold text-lg tracking-tight">HomeMockUp</span>
        </button>
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-4 py-16 md:py-24 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Design Sells. We Prove It.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Give your customers an experience they'll remember — and come back for
          </p>
        </div>
      </section>

      {/* Interactive Onboarding Demo */}
      <section className="relative z-10 px-4 py-16 md:py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Experience the Magic
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              This is exactly what your customers will feel — instant, beautiful, effortless
            </p>
          </div>
          <Card className="p-8 md:p-12 border-border/50 bg-card/90 backdrop-blur-sm">
            <B2BOnboardingFlow />
          </Card>
        </div>
      </section>

      {/* How It Works — Flow Explanation */}
      <section className="relative z-10 px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              From Zero to Showroom in 60 Seconds
            </h2>
            <p className="text-muted-foreground text-lg">Fast like TikTok. Polished like Apple.</p>
          </div>

          <div className="grid gap-4">
            {[
              {
                step: "1",
                title: "Love at First Sight",
                time: "0–3 sec",
                desc: "One bold headline, one irresistible button. Your customer is hooked before they even scroll.",
              },
              {
                step: "2",
                title: "Their Way, Instantly",
                time: "1 tap",
                desc: "Upload products or dive into a demo — two paths, zero confusion. They're in control from the start.",
              },
              {
                step: "3",
                title: "Drop In Your Products",
                time: "10–20 sec",
                desc: "Drag photos or paste links — we do the heavy lifting. Your catalog comes alive in seconds.",
              },
              {
                step: "4",
                title: "Set the Mood",
                time: "5 sec",
                desc: "Five stunning room styles. One tap. The space transforms — no buttons, no friction, pure visual storytelling.",
              },
              {
                step: "5",
                title: "The One Question That Matters",
                time: "5 sec",
                desc: "Sales, presence, or engagement? One answer shapes the entire experience — and your pitch.",
              },
              {
                step: "6",
                title: "Watch the Magic Happen",
                time: "loading",
                desc: "Not a spinner — a story. 'Designing your showroom…' 'Matching your products…' Anticipation builds with every line.",
              },
              {
                step: "7",
                title: "The Reveal",
                time: "reveal",
                desc: "A fully styled room. Their products. A live shopping list. One look and they'll say: 'I need this on my website.'",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-4 p-4 rounded-xl border border-border/50 bg-card/60"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{item.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Solutions Grid */}
      <section className="relative z-10 px-4 pb-16">
        <div className="max-w-5xl mx-auto grid gap-8">
          {solutions.map((solution, index) => (
            <Card
              key={index}
              className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden"
            >
              <CardContent className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                  <div className="flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                      {solution.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-foreground">{solution.title}</h3>
                    <p className="text-muted-foreground text-lg">{solution.description}</p>
                  </div>
                  <div className="flex-1">
                    <ul className="space-y-3">
                      {solution.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-3 text-muted-foreground">
                          <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-4 py-16 bg-secondary/10">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Ready to Make Your Store Unforgettable?
          </h2>
          <p className="text-muted-foreground text-lg">
            Join the brands already transforming how customers discover and shop furniture.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 bg-primary hover:bg-primary/90"
          >
            Sign Up as Business
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-sm text-muted-foreground">
        <p>Powered by AI • Create beautiful spaces effortlessly</p>
      </footer>
    </div>
  );
};

export default B2BSolutions;
