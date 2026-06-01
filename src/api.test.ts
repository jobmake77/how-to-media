import { api } from "./api";

describe("api client", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("requests the real workbench endpoint", async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          summary: {
            totalProjects: 0,
            blockedProjects: 0,
            awaitingReview: 0,
            readyThisWeek: 0,
            aiRunning: 0
          },
          columns: [],
          aiQueue: {
            running: [],
            awaitingReview: [],
            failed: [],
            availableActions: []
          }
        })
      } as Response;
    });
    globalThis.fetch = fetchMock;

    await api.getWorkbench();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/workbench",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        })
      })
    );
  });
});
