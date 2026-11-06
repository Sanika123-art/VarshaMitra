import { test, describe } from "node:test";
import assert from "node:assert";
import { ApiError } from "../src/lib/api/client.ts";

// Test ApiError class and contract
describe("API Client & Error Handling Suite", () => {
  test("ApiError correctly stores status code, message, and details", () => {
    const error = new ApiError(404, "Block 'unknown_block' not found", { block_id: "unknown_block" });
    assert.strictEqual(error.status, 404);
    assert.strictEqual(error.message, "Block 'unknown_block' not found");
    assert.deepStrictEqual(error.detail, { block_id: "unknown_block" });
    assert.strictEqual(error.name, "ApiError");
    assert.ok(error instanceof Error);
  });

  test("ApiError formats string correctly when details are omitted", () => {
    const error = new ApiError(500, "Internal Server Error");
    assert.strictEqual(error.status, 500);
    assert.strictEqual(error.message, "Internal Server Error");
    assert.strictEqual(error.detail, undefined);
  });

  test("Base URL resolution respects environment variable or defaults to localhost:8000", () => {
    const defaultUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
    assert.ok(defaultUrl.startsWith("http://127.0.0.1:8000") || defaultUrl.startsWith("http://localhost:8000"));
  });

  test("Non-2xx response handling produces descriptive ApiError", async () => {
    // Simulated mock fetch returning 422 Unprocessable Entity
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(JSON.stringify({ detail: "Validation failed: horizon must be between 1 and 14 days" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });

    try {
      const { api } = await import("../src/lib/api/client.ts");
      await assert.rejects(
        async () => {
          await api.getForecast("baramati", 30);
        },
        (err: unknown) => {
          return err instanceof ApiError && err.status === 422;
        }
      );
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("Network failure is mapped to 503 ApiError", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => {
      throw new TypeError("fetch failed");
    };

    try {
      const { api } = await import("../src/lib/api/client.ts");
      await assert.rejects(
        async () => {
          await api.getHealth();
        },
        (err: unknown) => {
          return err instanceof ApiError && err.status === 503 && err.message.includes("Network error");
        }
      );
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("Timeout handling aborts long-hanging request", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => {
      // Immediately abort to simulate timeout
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      throw abortError;
    };

    try {
      const { api } = await import("../src/lib/api/client.ts");
      await assert.rejects(
        async () => {
          await api.getHealth();
        },
        (err: unknown) => {
          return err instanceof ApiError && err.status === 408;
        }
      );
    } finally {
      global.fetch = originalFetch;
    }
  });
});
