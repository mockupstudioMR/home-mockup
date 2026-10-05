import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const reportError = vi.fn();
vi.mock("@/lib/errorReporting", async (orig) => {
  const actual = await orig<typeof import("@/lib/errorReporting")>();
  return { ...actual, reportError: (...args: unknown[]) => reportError(...args) };
});

import { ErrorBoundary } from "@/components/ErrorBoundary";

let shouldThrow: Error | null = null;
const Bomb = () => {
  if (shouldThrow) throw shouldThrow;
  return <p>page content</p>;
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    reportError.mockReset();
    shouldThrow = null;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("shows the error, reports it, and recovers on Try again", () => {
    shouldThrow = new Error("Cannot read properties of undefined (reading 'map')");
    render(
      <ErrorBoundary resetKey="/generate">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong on this page");
    expect(screen.getByText(/reading 'map'/)).toBeInTheDocument();
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), "render", expect.objectContaining({ boundary: "page" }));

    shouldThrow = null;
    fireEvent.click(screen.getByText("Try again"));
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("clears the error when the route changes", () => {
    shouldThrow = new Error("boom");
    const { rerender } = render(
      <ErrorBoundary resetKey="/generate">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();

    shouldThrow = null;
    rerender(
      <ErrorBoundary resetKey="/gallery">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("asks to refresh only when a deploy replaced the code", () => {
    shouldThrow = new TypeError("Failed to fetch dynamically imported module: /assets/Generate-abc.js");
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("A new version of HomeMockUp is available");
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), "chunk_load", expect.anything());
  });
});
