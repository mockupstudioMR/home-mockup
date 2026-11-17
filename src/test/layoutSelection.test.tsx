import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { JourneyProvider, STORAGE_KEY, useJourney, type Layout } from "@/journey/state";
import { Layouts } from "@/journey/screens/Step4";

const mocks = vi.hoisted(() => ({ makeLayout: vi.fn() }));
vi.mock("@/journey/services", () => ({ makeLayout: mocks.makeLayout }));
vi.mock("@/journey/sync", () => ({ saveStepDone: vi.fn() }));
vi.mock("@/journey/Shell", () => ({
  Screen: ({ children }: { children: ReactNode }) => <>{children}</>,
  Back: () => null, Go: () => null, Opt: () => null, useGo: () => vi.fn(),
}));
vi.mock("@/journey/screens/LayoutPlan", () => ({
  LayoutPlan: () => null, PlanDrawing: () => null, TEX: {},
}));

const layout = (id: string): Layout => ({ id, name: id, items: [], zones: [], notes: [] });
function State() {
  const { s } = useJourney();
  return <output data-testid="state">{JSON.stringify(s)}</output>;
}
const mount = () => render(<JourneyProvider><Layouts /><State /></JourneyProvider>);
const saved = () => JSON.parse(screen.getByTestId("state").textContent ?? "{}");
beforeEach(() => { localStorage.clear(); mocks.makeLayout.mockReset(); });
afterEach(cleanup);

describe("Chosen layouts survive background work", () => {
  it("keeps a saved single layout without generating replacements on return", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ layouts: [layout("Saved")], chosenLayout: 0 }));
    mount();
    expect(mocks.makeLayout).not.toHaveBeenCalled();
    expect(saved().layouts[0].id).toBe("Saved");
    expect(saved().chosenLayout).toBe(0);
  });

  it("keeps edits and selection when the second option arrives", async () => {
    let finish: (value: Layout) => void = () => {};
    mocks.makeLayout.mockResolvedValueOnce(layout("First")).mockImplementationOnce(() => new Promise<Layout>((resolve) => { finish = resolve; }));
    mount();
    await waitFor(() => expect(saved().layouts).toHaveLength(1));
    fireEvent.change(screen.getByRole("combobox", { name: "Add another piece" }), { target: { value: "Sofa" } });
    fireEvent.click(screen.getByRole("button", { name: /Layout 1.*First/ }));
    await act(async () => { finish(layout("Second")); });
    expect(saved().layouts).toHaveLength(2);
    expect(saved().layouts[0].items).toHaveLength(1);
    expect(saved().layouts[0].items[0].label).toBe("Sofa");
    expect(saved().chosenLayout).toBe(0);
  });

  it("does not write a late option after leaving the layout screen", async () => {
    let finish: (value: Layout) => void = () => {};
    mocks.makeLayout.mockResolvedValueOnce(layout("First")).mockImplementationOnce(() => new Promise<Layout>((resolve) => { finish = resolve; }));
    const view = mount();
    await waitFor(() => expect(saved().layouts).toHaveLength(1));
    view.unmount();
    await act(async () => { finish(layout("Second")); });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").layouts).toHaveLength(1);
  });
});