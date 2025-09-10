"use client";

import { useEffect, useState } from "react";
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
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Smart context toggle"
          onClick={() => setEnabled((v) => !v)}
          className={[
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-muted-foreground/30",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-3 w-3 transform rounded-full bg-background shadow-sm transition-transform",
              enabled ? "translate-x-5" : "translate-x-1",
            ].join(" ")}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={6}>
        {enabled ? "Using recent context" : "General mode"}
      </TooltipContent>
    </Tooltip>
  );
}
