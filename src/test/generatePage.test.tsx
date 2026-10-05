import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// ---- Supabase: every query resolves to empty; function calls are recorded.
const invoke = vi.fn(async (fn: string, _opts?: unknown) => {
  if (fn === "analyze-style") {
    await new Promise((r) => setTimeout(r, 50));
    return { data: { dominantColors: ["#eee"], styles: [{ styleName: "Modern", keywords: ["calm"] }] }, error: null };
  }
  return { data: null, error: null };
});

const chain = (): unknown =>
  new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === "then") return (resolve: (v: unknown) => void) => resolve({ data: null, error: null });
      return chain();
    },
    apply() {
      return chain();
    },
  });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => chain(),
    rpc: () => chain(),
    storage: { from: () => chain() },
    functions: { invoke: (fn: string, opts: unknown) => invoke(fn, opts) },
    auth: {
      getUser: async () => ({ data: { user: { id: "user-1" } } }),
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "a@b.c" }, role: "user", loading: false }),
}));

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import { QuizProvider } from "@/contexts/QuizContext";
import Generate from "@/pages/Generate";
import { GENERATE_KEYS } from "@/lib/generateSession";

const quiz = {
  stylePreference: "modern-minimal",
  colorPalette: "neutral",
  roomType: "living-room",
  budgetFeel: "mid-range",
  mustHaveElements: [],
  furnitureSource: "open",
};

// Same hash the page computes for quiz data without route state.
const quizHash = JSON.stringify({
  stylePreference: quiz.stylePreference,
  colorPalette: quiz.colorPalette,
  roomType: quiz.roomType,
  budgetFeel: quiz.budgetFeel,
  mustHaveElements: quiz.mustHaveElements,
  furnitureSource: quiz.furnitureSource,
});

describe("Generate page after a refresh", () => {
  beforeEach(() => {
    sessionStorage.clear();
    invoke.mockClear();
    // Returning to the page: quiz data and design come from the session cache,
    // highlights are missing (e.g. evicted when storage was full).
    sessionStorage.setItem(GENERATE_KEYS.quizData, JSON.stringify(quiz));
    sessionStorage.setItem(GENERATE_KEYS.quizHash, quizHash + "|");
    sessionStorage.setItem(
      GENERATE_KEYS.design,
      JSON.stringify({ id: "design-1", imageUrl: "https://x.supabase.co/storage/v1/object/public/design-images/u/d.png", title: "Modern Calm", description: "", isFavorite: false }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("shows the cached design and runs the style analysis only once", async () => {
    render(
      <QuizProvider>
        <MemoryRouter initialEntries={["/generate"]}>
          <Routes>
            <Route path="/generate" element={<Generate />} />
            <Route path="/quiz" element={<p>quiz page</p>} />
          </Routes>
        </MemoryRouter>
      </QuizProvider>,
    );

    await waitFor(() => expect(screen.getAllByText("Modern Calm").length).toBeGreaterThan(0));
    // Let several render cycles and the analysis response pass.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });

    const analyses = invoke.mock.calls.filter(([fn]) => fn === "analyze-style");
    expect(analyses).toHaveLength(1);
    expect(screen.queryByText("quiz page")).toBeNull();
  });
});
