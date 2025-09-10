import { Persona } from "@kontext.dev/kontext-sdk";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId") || undefined;
    const datasetId = searchParams.get("datasetId") || undefined;

    if (!jobId && !datasetId) {
      return Response.json({ error: "Provide jobId or datasetId" }, { status: 400 });
    }

    const persona = process.env.KONTEXT_API_URL
      ? new Persona({ apiKey: process.env.KONTEXT_API_KEY!, apiUrl: process.env.KONTEXT_API_URL })
      : new Persona({ apiKey: process.env.KONTEXT_API_KEY! });

    const status = await persona.datasets.getStatus({ jobId, datasetId });
    return Response.json(status);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Status fetch failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
