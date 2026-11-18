import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { StateOfPlace, Brief } from "@/journey/screens/Step1";

const state = vi.hoisted(() => ({ houseState: "partial", allowInWalls: false, rooms: ["bedroom"], startRoom: "bedroom", done: [], brief: {} }));
vi.mock("@/journey/state", () => ({
  useJourney: () => ({ s: state, set: vi.fn() }),
  orderedRooms: () => ["bedroom"],
}));
vi.mock("@/journey/sync", () => ({ saveStep1: vi.fn().mockResolvedValue(null) }));
vi.mock("@/journey/Summary", () => ({ JourneyStrip: () => null }));
vi.mock("@/journey/Shell", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/journey/Shell")>();
  return {
    ...original,
    Screen: ({ children, dock }: { children: ReactNode; dock: ReactNode }) => <>{children}{dock}</>,
  };
});

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}
afterEach(cleanup);

describe("Step 1 stays in sequence", () => {
  it.each(["partial", "redoing"])("keeps %s users in Step 1 before inspiration", (houseState) => {
    state.houseState = houseState;
    render(<MemoryRouter initialEntries={["/journey/1/state"]}><StateOfPlace /><Location /></MemoryRouter>);
    fireEvent.click(screen.getByRole("link", { name: "Continue" }));
    expect(screen.getByTestId("location").textContent).toBe("/journey/1/brief");
  });

  it("continues from the project brief to Step 2, not Step 5", () => {
    render(<MemoryRouter initialEntries={["/journey/1/brief"]}><Brief /><Location /></MemoryRouter>);
    fireEvent.click(screen.getByRole("link", { name: /Continue to step 2/ }));
    expect(screen.getByTestId("location").textContent).toBe("/journey/2/vision");
  });
});