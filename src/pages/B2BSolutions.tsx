import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Store, PenTool, Building2, Code2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import Logo from "@/components/Logo";

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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
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
            B2B Solutions
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Grow your business with AI-powered interior design tools built for professionals
          </p>
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
            Ready to grow with HomeMockUp?
          </h2>
          <p className="text-muted-foreground text-lg">
            Join our professional network and connect with customers looking for exactly what you offer.
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
