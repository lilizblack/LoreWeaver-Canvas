import { NextRequest, NextResponse } from "next/server";

// Rate limit: max 10 validation attempts per IP per hour
const attempts = new Map<string, { count: number; resetAt: number }>();

function getRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  if (!getRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait an hour before trying again." },
      { status: 429 }
    );
  }

  let config: Record<string, string>;
  try {
    config = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const required = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
  const missing = required.filter(k => !config[k]?.trim());
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // Ping Firebase REST API with the provided apiKey to verify it's valid
  // This doesn't create any data — it just checks the key is real
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${config.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnSecureToken: false }),
      }
    );

    const data = await res.json();

    // A valid API key returns 400 (missing email) NOT 400 with INVALID_API_KEY
    if (data?.error?.message === "INVALID_API_KEY") {
      return NextResponse.json({ error: "Invalid API Key. Check your Firebase project settings." }, { status: 400 });
    }

    // Any other response (including valid 400s) means the key itself is accepted
    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Firebase servers. Check your internet connection." },
      { status: 502 }
    );
  }
}
