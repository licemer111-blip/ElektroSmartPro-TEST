import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("has info, warn, and error methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("calls console.error for error level in dev mode", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("Test error", { code: 500 });
    expect(spy).toHaveBeenCalled();
    const call = spy.mock.calls[0];
    expect(call[0]).toContain("ERROR");
    expect(call[0]).toContain("Test error");
  });

  it("calls console.error for warn level in dev mode", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.warn("Test warning", { remaining: 3 });
    expect(spy).toHaveBeenCalled();
    const call = spy.mock.calls[0];
    expect(call[0]).toContain("WARN");
  });

  it("calls console.error for info level in dev mode", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.info("Test info");
    expect(spy).toHaveBeenCalled();
    const call = spy.mock.calls[0];
    expect(call[0]).toContain("INFO");
  });

  it("passes context and error objects", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const testError = new Error("DB connection failed");
    logger.error("Database error", { table: "projects" }, testError);
    expect(spy).toHaveBeenCalled();
    // Context should be in the second argument
    expect(spy.mock.calls[0][1]).toEqual({ table: "projects" });
    // Error should be in the third argument
    expect(spy.mock.calls[0][2]).toBe(testError);
  });

  it("handles missing context gracefully", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.info("No context");
    expect(spy).toHaveBeenCalled();
  });
});
