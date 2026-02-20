import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the browser client module
const mockSingle = vi.fn();
const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
const mockEq = vi
  .fn()
  .mockReturnValue({ select: mockSelect, single: mockSingle });
const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
const mockDelete = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ data: null, error: null }),
});
const mockFrom = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    order: mockOrder,
    eq: mockEq,
  }),
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
});

vi.mock("@/lib/supabase/browser", () => ({
  createClient: () => ({ from: mockFrom }),
}));

import {
  fetchProtocols,
  fetchProtocolById,
  createProtocol,
  updateProtocol,
  deleteProtocol,
} from "@/lib/supabase/protocols";

describe("protocols CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default return values
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
  });

  describe("fetchProtocols", () => {
    it("queries protocols table ordered by updated_at desc", async () => {
      const mockData = [{ id: "1", title: "Protocol 1" }];
      mockOrder.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await fetchProtocols();

      expect(mockFrom).toHaveBeenCalledWith("protocols");
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });

    it("returns error when query fails", async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: "Query failed" },
      });

      const result = await fetchProtocols();

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: "Query failed" });
    });
  });

  describe("fetchProtocolById", () => {
    it("queries protocol by id with single()", async () => {
      const mockData = { id: "abc", title: "My Protocol" };
      mockSingle.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await fetchProtocolById("abc");

      expect(mockFrom).toHaveBeenCalledWith("protocols");
      expect(result.data).toEqual(mockData);
    });
  });

  describe("createProtocol", () => {
    const payload = {
      title: "New Protocol",
      study_question: "Does X improve Y?",
      population: "Adults 18+",
      intervention: "Treatment A",
      comparator: "Placebo",
      outcomes: "Mortality",
      design: "RCT",
      status: "draft" as const,
      user_id: "user-123",
    };

    it("inserts protocol and returns result", async () => {
      const mockResult = { id: "new-1", ...payload };
      mockSingle.mockResolvedValueOnce({ data: mockResult, error: null });

      const result = await createProtocol(payload);

      expect(mockFrom).toHaveBeenCalledWith("protocols");
      expect(mockInsert).toHaveBeenCalledWith(payload);
      expect(result.data).toEqual(mockResult);
    });
  });

  describe("updateProtocol", () => {
    it("updates protocol with new data and updated_at", async () => {
      const mockResult = { id: "1", title: "Updated" };
      mockSingle.mockResolvedValueOnce({ data: mockResult, error: null });

      const result = await updateProtocol("1", { title: "Updated" });

      expect(mockFrom).toHaveBeenCalledWith("protocols");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Updated",
          updated_at: expect.any(String),
        }),
      );
    });
  });

  describe("deleteProtocol", () => {
    it("deletes protocol by id", async () => {
      await deleteProtocol("1");

      expect(mockFrom).toHaveBeenCalledWith("protocols");
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
