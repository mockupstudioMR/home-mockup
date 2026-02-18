import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Palette, Home, Upload, Package, LogOut, User, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleEntryClick = (path: string) => {
    if (user) {
      navigate(path);
    } else {
      navigate("/auth");
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const entryPoints = [
    {
      icon: <Home className="w-6 h-6" />,
      title: "Start with Your Room",
      description: "Upload a photo of your existing room and we'll redesign it",
      path: "/style-tree?source=existing-room",
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Browse Style Tree",
      description: "Explore curated interior styles and find your perfect aesthetic",
      path: "/style-tree",
    },
    {
      icon: <Upload className="w-6 h-6" />,
      title: "Upload Inspiration",
      description: "Upload photos of rooms you love and we'll detect the styles",
      path: "/analyze-room",
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "Start with Products",
      description: "Upload furniture or decor items and we'll design around them",
      path: "/analyze-products",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/30 clip-diagonal" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Logo size={32} />
          <span className="font-semibold text-lg tracking-tight">HomeMockUp</span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/gallery")}>
                <User className="w-4 h-4 mr-2" />
                My HomeMockUps
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/40 text-secondary-foreground text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Where You Lead. Technology Supports.
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Live individually.{" "}
            <span className="text-primary">Design Beautifully.</span>
          </h1>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => handleEntryClick("/start")}
              className="text-lg px-8 bg-primary hover:bg-primary/90"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started
            </Button>
            {user && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/gallery")}
                className="text-lg px-8 border-secondary bg-secondary/20 hover:bg-secondary/40"
              >
                View My HomeMockUps
              </Button>
            )}
          </div>
        </div>

        {/* Starting Points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16 max-w-3xl mx-auto w-full px-4">
          {entryPoints.map((entry, index) => (
            <Card
              key={index}
              className="group cursor-pointer border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              onClick={() => handleEntryClick(entry.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                    {entry.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold mb-1 text-foreground group-hover:text-primary transition-colors">
                        {entry.title}
                      </h3>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-sm text-muted-foreground">
        <p>Powered by AI • Create beautiful spaces effortlessly</p>
      </footer>

      <style>{`
        .clip-diagonal {
          clip-path: polygon(30% 0, 100% 0, 100% 100%, 0% 100%);
        }
      `}</style>
    </div>
  );
};

export default Index;