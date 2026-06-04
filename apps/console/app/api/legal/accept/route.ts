import { createCivisClient } from "@repo/civis";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { documentId?: string; locale?: string };
    if (!body.documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }
    const client = await createCivisClient();
    const result = await client.me.legal.accept(body.documentId, body.locale);
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    const status = err instanceof Error && err.message.includes("401") ? 401 : 500;
    return NextResponse.json({ error: "acceptance failed" }, { status });
  }
}
