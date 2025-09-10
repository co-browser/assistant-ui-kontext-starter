"use client";

import { useState, useEffect, useRef } from "react";
import { useKontext } from "@kontext.dev/kontext-sdk/react";
import { Search, Loader2 } from "lucide-react";

type SearchRow = { 
  id: string | number; 
  score?: number;
  attributes?: Record<string, unknown>;
  text?: string;
};
type SearchResult = { namespace: string | null; rows: SearchRow[] };

export function KontextVectorSearch() {
  const { isConnected } = useKontext();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr(null);
    setRes(null);
    if (!q.trim()) return;
    if (!isConnected) {
      setErr("Connect Kontext first");
      setOpen(true);
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/kontext/datasets/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q, topK: 5 }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Search failed");
      setRes(data as SearchResult);
      setOpen(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Search failed");
      setOpen(true);
    } finally {
      setBusy(false);
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={submit} className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          className="h-7 w-full rounded-md bg-muted/30 px-2.5 pr-7 text-[11px] leading-7 placeholder:text-[11px] placeholder:text-muted-foreground/50 outline-none transition-colors hover:bg-muted/40 focus:bg-muted/50 focus:ring-1 focus:ring-ring/20"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && q.trim() && !busy && isConnected) {
              submit();
            }
          }}
        />
        {/* Search/Loading button - only show when focused and has text */}
        {focused && q.trim() && (
          <button
            type="submit"
            disabled={busy || !isConnected}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-muted/50 rounded transition-colors disabled:opacity-50"
            aria-label={busy ? "Searching..." : "Search"}
            onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking button
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <Search className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        )}
      </form>
      
      {/* Results or Loading state */}
      {open && (busy || res || err) && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 max-h-96 overflow-auto rounded-md border bg-background shadow-lg p-3">
          {busy && !res && !err && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-xs text-muted-foreground">Searching...</span>
            </div>
          )}
          {err && !busy && (
            <div className="text-sm text-destructive">{err}</div>
          )}
          {res && !busy && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground border-b pb-2">
                Namespace: <code className="text-[10px]">{res.namespace ?? "null"}</code>
              </div>
              {res.rows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No matches found</div>
              ) : (
                <div className="space-y-2">
                  {res.rows.map((r, i) => (
                    <div key={`${r.id}-${i}`} className="rounded-md border p-2">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>ID: {String(r.id).slice(0, 8)}...</span>
                        {typeof r.score === "number" && (
                          <span>Score: {r.score.toFixed(3)}</span>
                        )}
                      </div>
                      <div className="text-sm">
                        {typeof (r.attributes as Record<string, unknown> | undefined)?.text === "string"
                          ? String((r.attributes as Record<string, unknown>).text)
                          : r.text ?? "No content available"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
