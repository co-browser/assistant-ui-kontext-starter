import { cookies } from "next/headers";
import { Persona } from "@kontext.dev/kontext-sdk";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("kontext_user_id")?.value;
    if (!userId) {
      return Response.json({ error: "User not connected" }, { status: 401 });
    }

    const contentLength = req.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BYTES * 1.2) {
      return Response.json({ error: "File too large" }, { status: 413 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Missing file" }, { status: 400 });
    }

    // Validate type: allow text/* and application/json (matching API capabilities)
    const type = file.type || "";
    const isText = type.startsWith("text/");
    const isJson = type === "application/json";
    if (!isText && !isJson) {
      return Response.json({ error: "Only text files (.txt, .csv, .md, etc.) or .json supported" }, { status: 400 });
    }

    const size = file.size ?? 0;
    if (size > MAX_BYTES) {
      return Response.json({ error: "File too large" }, { status: 413 });
    }

    const persona = process.env.KONTEXT_API_URL
      ? new Persona({ apiKey: process.env.KONTEXT_API_KEY!, apiUrl: process.env.KONTEXT_API_URL })
      : new Persona({ apiKey: process.env.KONTEXT_API_KEY! });

    const result = await persona.datasets.upload(file, { asUser: userId });
    
    // Store the datasetId for future search operations
    cookieStore.set("kontext_dataset_id", result.datasetId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return Response.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
