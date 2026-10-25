import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" }, loading: false }),
}));
vi.mock("@/contexts/QuizContext", () => ({
  useQuiz: () => ({ quizData: {}, updateQuizData: vi.fn() }),
}));
vi.mock("@/components/AccountNameDialog", () => ({ useProfileName: () => null }));
vi.mock("@/components/b2b/RetailerStyleFlow", () => ({ default: () => null }));

import Start from "@/pages/Start";

function Where() {
  const loc = useLocation();
  return <p data-testid="where">{loc.pathname}</p>;
}

const renderAt = (entry: string | { pathname: string; state: unknown }) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/start" element={<Start />} />
        <Route path="/journey" element={<p>Journey</p>} />
      </Routes>
      <Where />
    </MemoryRouter>,
  );

describe("Start → journey redirect", () => {
  it("sends a signed-in home owner to /journey", async () => {
    renderAt("/start");
    expect(await screen.findByText("Journey")).toBeInTheDocument();
  });

  // Regression: arriving from "I'm designing my home" with { fromChoosePath } used to rewrite the
  // URL back to /start right after the redirect, leaving a blank page.
  it("still reaches /journey when arriving from the choose-path screen", async () => {
    renderAt({ pathname: "/start", state: { fromChoosePath: true } });
    expect(await screen.findByText("Journey")).toBeInTheDocument();
    expect(screen.getByTestId("where").textContent).toBe("/journey");
  });

  it("keeps professionals on the start page", () => {
    renderAt("/start?as=pro");
    expect(screen.getByTestId("where").textContent).toBe("/start");
    expect(screen.queryByText("Journey")).not.toBeInTheDocument();
  });
});
