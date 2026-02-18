import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import QuizProgress from "@/components/quiz/QuizProgress";
import RoomStep from "@/components/quiz/steps/RoomStep";
import { ArrowLeft, Sparkles, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TOTAL_STEPS = 1;

const Quiz = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { quizData, currentStep, setCurrentStep, resetQuiz } = useQuiz();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Clamp step to valid range (handles stale sessionStorage from old quiz)
  useEffect(() => {
    if (currentStep >= TOTAL_STEPS) {
      setCurrentStep(0);
    }
  }, [currentStep, setCurrentStep]);

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!quizData.roomType;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - save and navigate to generate
      try {
        const { error } = await supabase.from("quiz_responses").insert({
          user_id: user!.id,
          style_preference: quizData.stylePreference || "modern-minimal",
          color_palette: quizData.colorPalette || "neutral",
          room_type: quizData.roomType,
          budget_feel: quizData.budgetFeel || "mid-range",
          must_have_elements: quizData.mustHaveElements,
          furniture_source: quizData.furnitureSource,
        });

        if (error) throw error;

        sessionStorage.setItem('generate_quiz_nonce', crypto.randomUUID());

        toast({
          title: "Preferences saved!",
          description: "Generating your dream room...",
        });

        navigate("/generate", { state: { quizData } });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save preferences",
          variant: "destructive",
        });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <RoomStep />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-lg mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          <button
            onClick={resetQuiz}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Start Over
          </button>
        </div>

        {/* Progress */}
        <QuizProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Quiz Card */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">{renderStep()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Design
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
