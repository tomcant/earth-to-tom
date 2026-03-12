const PUSHOVER_ENDPOINT = "https://api.pushover.net/1/messages.json";

export async function sendNotification(
  userKey: string,
  message: string,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const token = process.env.PUSHOVER_TOKEN;
  if (!token) {
    throw new Error("PUSHOVER_TOKEN environment variable is not set.");
  }

  const body = new URLSearchParams({
    token,
    user: userKey,
    message,
    priority: "1",
  });

  const response = await fetchFn(PUSHOVER_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const result = (await response.json()) as { status: number; errors?: string[] };

  if (result.status !== 1) {
    const errors = result.errors?.join(", ") ?? "unknown error";
    throw new Error(`Pushover API error: ${errors}`);
  }
}
