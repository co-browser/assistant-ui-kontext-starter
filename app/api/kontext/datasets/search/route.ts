import { cookies } from "next/headers";
import { Persona } from "@kontext.dev/kontext-sdk";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("kontext_user_id")?.value;
    if (!userId) {
      return Response.json({ error: "User not connected" }, { status: 401 });
    }

    const body = await req.json();
    const query: string | undefined = typeof body?.query === "string" ? body.query : undefined;
    let datasetId: string | undefined = typeof body?.datasetId === "string" ? body.datasetId : undefined;
    const topK: number | undefined = typeof body?.topK === "number" ? body.topK : undefined;
    if (!query || !query.trim()) {
      return Response.json({ error: "Missing query" }, { status: 400 });
    }

    const persona = process.env.KONTEXT_API_URL
      ? new Persona({ apiKey: process.env.KONTEXT_API_KEY!, apiUrl: process.env.KONTEXT_API_URL })
      : new Persona({ apiKey: process.env.KONTEXT_API_KEY! });

    // If datasetId not provided, use the stored one from cookie
    if (!datasetId) {
      datasetId = cookieStore.get("kontext_dataset_id")?.value;
    }

    if (!datasetId) {
      return Response.json({ error: "No dataset available. Upload first." }, { status: 400 });
    }

    const res = await persona.datasets.search({ datasetId, query, userId, topK });
    return Response.json(res);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Search failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
