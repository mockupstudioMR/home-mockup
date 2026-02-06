import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import QuizProgress from "@/components/quiz/QuizProgress";
import StyleStep from "@/components/quiz/steps/StyleStep";
import ColorStep from "@/components/quiz/steps/ColorStep";
import RoomStep from "@/components/quiz/steps/RoomStep";
import BudgetStep from "@/components/quiz/steps/BudgetStep";
import ElementsStep from "@/components/quiz/steps/ElementsStep";
import FurnitureSourceStep from "@/components/quiz/steps/FurnitureSourceStep";
import ImageStep from "@/components/quiz/steps/ImageStep";
import { ArrowLeft, ArrowRight, Sparkles, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Quiz = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { quizData, currentStep, setCurrentStep, totalSteps, resetQuiz } = useQuiz();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!quizData.stylePreference;
      case 1:
        return !!quizData.colorPalette;
      case 2:
        return !!quizData.roomType;
      case 3:
        return !!quizData.budgetFeel;
      case 4:
        return true; // Elements are optional
      case 5:
        return !!quizData.furnitureSource; // Furniture source is required
      case 6:
        return true; // Image is optional but recommended
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - save and navigate to generate
      try {
        const { error } = await supabase.from("quiz_responses").insert({
          user_id: user!.id,
          style_preference: quizData.stylePreference,
          color_palette: quizData.colorPalette,
          room_type: quizData.roomType,
          budget_feel: quizData.budgetFeel,
          must_have_elements: quizData.mustHaveElements,
          furniture_source: quizData.furnitureSource,
        });

        if (error) throw error;

        // Set a unique session nonce so Generate page always detects a fresh quiz
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
        return <StyleStep />;
      case 1:
        return <ColorStep />;
      case 2:
        return <RoomStep />;
      case 3:
        return <BudgetStep />;
      case 4:
        return <ElementsStep />;
      case 5:
        return <FurnitureSourceStep />;
      case 6:
        return <ImageStep />;
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
        <QuizProgress currentStep={currentStep} totalSteps={totalSteps} />

        {/* Quiz Card */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">{renderStep()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
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
            {currentStep === totalSteps - 1 ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Design
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
