"use client";

import { useKontext } from "@kontext.dev/kontext-sdk/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { KontextManageSheet } from "@/components/kontext-manage-sheet";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function KontextHeaderStatus() {
  const { isConnected, isLoading, error } = useKontext();

  if (isLoading) {
    return (
      <div className="bg-background/60 text-muted-foreground flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs overflow-hidden">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Personalization</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background/60 flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs overflow-hidden">
        <span className="text-destructive">Personalization error</span>
        <KontextManageSheet trigger={<Button variant="ghost" size="sm" className="h-7 px-2 focus-visible:ring-0">Manage</Button>} />
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="bg-background/60 flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs overflow-hidden">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <span className="bg-emerald-500 inline-block h-2 w-2 rounded-full" />
          Personalized
        </span>
        <KontextManageSheet trigger={<Button variant="ghost" size="sm" className="h-7 px-2 focus-visible:ring-0">Manage</Button>} />
      </div>
    );
  }

  return (
    <div className="bg-background/60 flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs overflow-hidden">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help items-center gap-2 text-muted-foreground">
            <span className="bg-muted-foreground/40 inline-block h-2 w-2 rounded-full" />
            Use Kontext
          </span>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>
          Connect to enable personalized responses based on your communications. You can disconnect anytime.
        </TooltipContent>
      </Tooltip>
      <KontextManageSheet
        trigger={
          <Button
            size="sm"
            className="h-6 px-1.5 text-[11px] focus-visible:ring-0"
          >
            Connect
          </Button>
        }
      />
    </div>
  );
}
