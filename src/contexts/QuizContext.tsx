import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface QuizData {
  stylePreference: string;
  colorPalette: string;
  roomType: string;
  budgetFeel: string;
  mustHaveElements: string[];
  furnitureSource: "shop_only" | "open";
  sourceImageUrl?: string;
}

interface QuizContextType {
  quizData: QuizData;
  updateQuizData: (data: Partial<QuizData>) => void;
  resetQuiz: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
}

const defaultQuizData: QuizData = {
  stylePreference: "",
  colorPalette: "",
  roomType: "",
  budgetFeel: "",
  mustHaveElements: [],
  furnitureSource: "open",
  sourceImageUrl: undefined,
};

const STORAGE_KEY = "quiz_data_cache";
const STEP_STORAGE_KEY = "quiz_step_cache";

const getInitialQuizData = (): QuizData => {
  try {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached) {
      return { ...defaultQuizData, ...JSON.parse(cached) };
    }
  } catch {
    // Ignore parse errors
  }
  return defaultQuizData;
};

const getInitialStep = (): number => {
  try {
    const cached = sessionStorage.getItem(STEP_STORAGE_KEY);
    if (cached) {
      return parseInt(cached, 10) || 0;
    }
  } catch {
    // Ignore parse errors
  }
  return 0;
};

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider = ({ children }: { children: React.ReactNode }) => {
  const [quizData, setQuizData] = useState<QuizData>(getInitialQuizData);
  const [currentStep, setCurrentStepState] = useState(getInitialStep);
  const totalSteps = 7; // 6 questions + image selection

  // Persist quiz data to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
    } catch {
      // Quota exceeded - ignore
    }
  }, [quizData]);

  // Persist current step to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STEP_STORAGE_KEY, String(currentStep));
    } catch {
      // Quota exceeded - ignore
    }
  }, [currentStep]);

  const updateQuizData = useCallback((data: Partial<QuizData>) => {
    setQuizData((prev) => ({ ...prev, ...data }));
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
  }, []);

  const resetQuiz = useCallback(() => {
    setQuizData(defaultQuizData);
    setCurrentStepState(0);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STEP_STORAGE_KEY);
  }, []);

  return (
    <QuizContext.Provider
      value={{
        quizData,
        updateQuizData,
        resetQuiz,
        currentStep,
        setCurrentStep,
        totalSteps,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
};