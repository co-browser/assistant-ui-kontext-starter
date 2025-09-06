"use client";

import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function UserQueryToggle() {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    // read cookie on mount
    const flag = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("kontext_use_user_query="));
    if (flag) setEnabled(flag.split("=")[1] === "1");
  }, []);

  useEffect(() => {
    // write cookie when changed
    const isSecure = window.location.protocol === "https:";
    const cookie = `kontext_use_user_query=${enabled ? "1" : "0"}; path=/; max-age=2592000; SameSite=Lax${isSecure ? "; Secure" : ""}`;
    document.cookie = cookie;
  }, [enabled]);

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <div className="hidden items-center gap-1 sm:flex">
        <span>Focused Retrieval</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground/80 transition-colors hover:text-foreground"
              aria-label="Focused Retrieval info"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent sideOffset={6}>
            Uses your last message to focus what the assistant fetches for this reply (e.g., projects, legal docs, visa tasks). Turn off for general chat.
          </TooltipContent>
        </Tooltip>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Focused Retrieval toggle"
        onClick={() => setEnabled((v) => !v)}
        className={[
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          enabled ? "bg-primary" : "bg-muted-foreground/30",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform",
            enabled ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
