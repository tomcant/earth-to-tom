import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { sendNotification } from "../src/notifications";

let savedToken: string | undefined;

beforeEach(() => {
  savedToken = process.env.PUSHOVER_TOKEN;
  process.env.PUSHOVER_TOKEN = "test-token";
});

afterEach(() => {
  if (savedToken !== undefined) process.env.PUSHOVER_TOKEN = savedToken;
  else delete process.env.PUSHOVER_TOKEN;
});

describe("sending notifications", () => {
  test("sends a high-priority notification to Pushover", async () => {
    let capturedUrl = "";
    let capturedBody = "";
    const stubFetch = async (input: string | URL | Request, init?: RequestInit) => {
      capturedUrl = input as string;
      capturedBody = init?.body as string;
      return new Response(JSON.stringify({ status: 1, request: "abc123" }));
    };

    await sendNotification("user-key-123", "Urgent message!", stubFetch as typeof fetch);

    expect(capturedUrl).toBe("https://api.pushover.net/1/messages.json");
    const params = new URLSearchParams(capturedBody);
    expect(params.get("token")).toBe("test-token");
    expect(params.get("user")).toBe("user-key-123");
    expect(params.get("message")).toBe("Urgent message!");
    expect(params.get("priority")).toBe("1");
  });

  test("throws when Pushover API returns an error", async () => {
    const stubFetch = async () =>
      new Response(JSON.stringify({ status: 0, errors: ["invalid token"] }));

    const error = await sendNotification("user-key", "msg", stubFetch as typeof fetch).catch(
      (e) => e,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("Pushover API error");
    expect(error.message).toContain("invalid token");
  });

  test("throws when PUSHOVER_TOKEN is not set", async () => {
    delete process.env.PUSHOVER_TOKEN;
    const stubFetch = async () => new Response("{}");

    const error = await sendNotification("user-key", "msg", stubFetch as typeof fetch).catch(
      (e) => e,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("PUSHOVER_TOKEN");
  });
});
