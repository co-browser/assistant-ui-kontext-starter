"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useKontext } from "@kontext.dev/kontext-sdk/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type UploadResult = { datasetId: string; jobId: string; status: string };
type StatusResult = { status: string; progress?: number; error?: string };
type SearchRow = { id: string | number; score?: number };
type SearchResult = { namespace: string | null; rows: SearchRow[] };

export function KontextDatasetsPanel({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const { isConnected } = useKontext();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"upload" | "search">("upload");

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [status, setStatus] = useState<StatusResult | null>(null);
  const pollRef = useRef<number | null>(null);

  // Search state
  const [query, setQuery] = useState("");
  const [datasetId, setDatasetId] = useState<string>("");
  const [topK, setTopK] = useState<number>(5);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  const handleUpload = async () => {
    setUploadError(null);
    setUploadResult(null);
    setStatus(null);
    if (!file) {
      setUploadError("Choose a .txt or .json file");
      return;
    }
    const name = file.name.toLowerCase();
    const type = file.type as string | undefined;
    const isTxt = name.endsWith(".txt") || type === "text/plain";
    const isJson = name.endsWith(".json") || type === "application/json";
    if (!isTxt && !isJson) {
      setUploadError("Only .txt or .json supported");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/kontext/datasets/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setUploadResult(data as UploadResult);
      // Start polling
      pollRef.current = window.setInterval(async () => {
        const u = await fetch(`/api/kontext/datasets/status?jobId=${encodeURIComponent(data.jobId)}`);
        const s = await u.json();
        setStatus(s);
        if (s?.status === "completed" || s?.status === "error" || s?.status === "failed") {
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 1000);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async () => {
    setSearchError(null);
    setSearchResult(null);
    if (!query.trim()) {
      setSearchError("Enter a query");
      return;
    }
    setSearching(true);
    try {
      const res = await fetch("/api/kontext/datasets/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, datasetId: datasetId || undefined, topK }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Search failed");
      setSearchResult(data as SearchResult);
    } catch (e: unknown) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const latestDatasetId = useMemo(() => uploadResult?.datasetId || "", [uploadResult]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Kontext Datasets</SheetTitle>
          <SheetDescription>
            Upload .txt or .json to Kontext, then run vector search against your dataset.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {!isConnected && (
            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Connect Kontext to enable uploads and search.
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant={tab === "upload" ? "default" : "ghost"} size="sm" onClick={() => setTab("upload")}>Upload</Button>
            <Button variant={tab === "search" ? "default" : "ghost"} size="sm" onClick={() => setTab("search")}>Vector Search</Button>
          </div>

          {tab === "upload" ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Accepted: .txt, .json (max 10MB)</div>
              <Input
                type="file"
                accept=".txt,application/json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={!isConnected || uploading}
              />
              <div className="flex items-center gap-2">
                <Button onClick={handleUpload} disabled={!isConnected || uploading || !file}>
                  {uploading ? "Uploading…" : "Upload to Kontext"}
                </Button>
                {uploadError && <span className="text-sm text-destructive">{uploadError}</span>}
              </div>
              {uploadResult && (
                <div className="rounded-md border p-3 text-sm">
                  <div className="font-medium">Upload started</div>
                  <div className="text-muted-foreground mt-1">datasetId: <code>{uploadResult.datasetId}</code></div>
                  <div className="text-muted-foreground">jobId: <code>{uploadResult.jobId}</code></div>
                  <Separator className="my-2" />
                  <div>Status: {status?.status || uploadResult.status}</div>
                  {status?.progress !== undefined && <div>Progress: {Math.round(status.progress!)}%</div>}
                  {status?.error && <div className="text-destructive">{status.error}</div>}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Query</span>
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What activities does Alice enjoy?" />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Dataset ID (optional)</span>
                  <Input value={datasetId} onChange={(e) => setDatasetId(e.target.value)} placeholder={latestDatasetId || "Use latest by default"} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted-foreground">Top K</span>
                  <Input type="number" value={topK} min={1} max={20} onChange={(e) => setTopK(Number(e.target.value || 5))} />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSearch} disabled={!isConnected || searching || !query.trim()}>
                  {searching ? "Searching…" : "Search"}
                </Button>
                {searchError && <span className="text-sm text-destructive">{searchError}</span>}
              </div>
              {searchResult && (
                <div className="rounded-md border p-3 text-sm">
                  <div className="font-medium">Results</div>
                  <div className="text-muted-foreground mt-1">namespace: <code>{searchResult.namespace ?? "null"}</code></div>
                  <Separator className="my-2" />
                  <div className="space-y-1">
                    {searchResult.rows.length === 0 && <div className="text-muted-foreground">No matches</div>}
                    {searchResult.rows.map((r, i) => (
                      <div key={`${r.id}-${i}`} className="flex items-center justify-between">
                        <span>id: <code>{String(r.id)}</code></span>
                        {typeof r.score === "number" && <span className="text-muted-foreground">score: {r.score.toFixed(3)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <SheetFooter />
      </SheetContent>
    </Sheet>
  );
}
