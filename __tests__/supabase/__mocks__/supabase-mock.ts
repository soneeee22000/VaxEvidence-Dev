import { vi } from "vitest";

/**
 * Creates a chainable mock Supabase client for testing CRUD modules.
 * Each query builder method returns the builder itself for chaining,
 * and the terminal method resolves with the configured response.
 */
export function createMockSupabaseClient(
  response: { data: unknown; error: unknown } = { data: null, error: null },
) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};

  // Terminal methods - return the response
  const terminal = vi.fn().mockResolvedValue(response);

  // Chainable methods - return the builder
  const chainable = () => {
    const proxy = new Proxy(
      {},
      {
        get(_target, prop: string) {
          if (prop === "then") {
            // Make it thenable - resolve with response
            return (resolve: (val: unknown) => void) => resolve(response);
          }
          if (!builder[prop]) {
            builder[prop] = vi.fn().mockReturnValue(proxy);
          }
          return builder[prop];
        },
      },
    );
    return proxy;
  };

  const mockClient = {
    from: vi.fn().mockReturnValue(chainable()),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue(response),
        createSignedUrl: vi.fn().mockResolvedValue(response),
        remove: vi.fn().mockResolvedValue(response),
      }),
    },
    _setResponse(newResponse: { data: unknown; error: unknown }) {
      response = newResponse;
    },
  };

  return mockClient;
}
