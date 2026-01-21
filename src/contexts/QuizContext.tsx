import React, { createContext, useContext, useState } from "react";

export interface QuizData {
  stylePreference: string;
  colorPalette: string;
  roomType: string;
  budgetFeel: string;
  mustHaveElements: string[];
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
  sourceImageUrl: undefined,
};

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider = ({ children }: { children: React.ReactNode }) => {
  const [quizData, setQuizData] = useState<QuizData>(defaultQuizData);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 6; // 5 questions + image selection

  const updateQuizData = (data: Partial<QuizData>) => {
    setQuizData((prev) => ({ ...prev, ...data }));
  };

  const resetQuiz = () => {
    setQuizData(defaultQuizData);
    setCurrentStep(0);
  };

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
