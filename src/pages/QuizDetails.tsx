import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import QuizProgress from "@/components/quiz/QuizProgress";
import RoomStep from "@/components/quiz/steps/RoomStep";
import BudgetStep from "@/components/quiz/steps/BudgetStep";
import ElementsStep from "@/components/quiz/steps/ElementsStep";
import FurnitureSourceStep from "@/components/quiz/steps/FurnitureSourceStep";
import ImageStep from "@/components/quiz/steps/ImageStep";
import ExistingRoomUpload from "@/components/generate/ExistingRoomUpload";
import { ArrowLeft, ArrowRight, Sparkles, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QuizDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { quizData, updateQuizData, resetQuiz } = useQuiz();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [existingRoomImages, setExistingRoomImages] = useState<string[]>([]);
  
  const { selectedStyle, analysisResult, productAnalysis, uploadedImages, includeProducts, source, selectedInspirations } = location.state || {};
  const isExistingRoom = source === "existing-room";
  const totalSteps = isExistingRoom ? 6 : 5; // Extra step for existing room upload

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // If no style selected, redirect back
  useEffect(() => {
    if (!selectedStyle && !loading) {
      navigate("/start");
    }
  }, [selectedStyle, loading, navigate]);

  const getStepOffset = () => (isExistingRoom ? 1 : 0);
  const adjustedStep = currentStep - getStepOffset();

  const canProceed = () => {
    if (isExistingRoom && currentStep === 0) {
      return existingRoomImages.length > 0;
    }
    switch (adjustedStep) {
      case 0:
        return !!quizData.roomType;
      case 1:
        return !!quizData.budgetFeel;
      case 2:
        return true; // Elements are optional
      case 3:
        return !!quizData.furnitureSource; // Furniture source is required
      case 4:
        return true; // Image is optional
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
          style_preference: quizData.stylePreference || selectedStyle?.id,
          color_palette: quizData.colorPalette || "neutral",
          room_type: quizData.roomType,
          budget_feel: quizData.budgetFeel,
          must_have_elements: quizData.mustHaveElements,
          furniture_source: quizData.furnitureSource,
        });

        if (error) throw error;

        toast({
          title: "Preferences saved!",
          description: "Generating your dream room...",
        });

        navigate("/generate", { 
          state: { 
            quizData: {
              ...quizData,
              stylePreference: quizData.stylePreference || selectedStyle?.id,
            },
            selectedStyle,
            analysisResult,
            productAnalysis,
            sourceImages: uploadedImages,
            includeProducts,
            existingRoomImages: isExistingRoom ? existingRoomImages : undefined,
            selectedInspirations,
          } 
        });
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
    } else {
      navigate(-1);
    }
  };

  const renderStep = () => {
    if (isExistingRoom && currentStep === 0) {
      return (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Upload your room photos</h2>
            <p className="text-muted-foreground">
              Share photos of your existing space so we can redesign it while keeping your layout
            </p>
          </div>
          <ExistingRoomUpload
            images={existingRoomImages}
            onImagesChange={setExistingRoomImages}
          />
        </div>
      );
    }
    switch (adjustedStep) {
      case 0:
        return <RoomStep />;
      case 1:
        return <BudgetStep />;
      case 2:
        return <ElementsStep />;
      case 3:
        return <FurnitureSourceStep />;
      case 4:
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
            onClick={() => {
              resetQuiz();
              navigate("/start");
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Start Over
          </button>
        </div>

        {/* Selected Style Info */}
        {selectedStyle && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">Selected style</p>
            <p className="font-semibold">{selectedStyle.title}</p>
          </div>
        )}

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

export default QuizDetails;
