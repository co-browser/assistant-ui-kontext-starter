"use client";

import { useKontext } from "@kontext.dev/kontext-sdk/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { KontextManageDropdown } from "@/components/kontext-manage-dropdown";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function KontextHeaderStatus() {
  const { isConnected, isLoading, error, connectGmail } = useKontext();

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/70" />
        <span className="text-xs font-medium text-muted-foreground">Personalization</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-destructive">Personalization error</span>
        <KontextManageDropdown
          trigger={
            <div className="relative inline-block group align-middle">
              <div className="pointer-events-none absolute -inset-1 rounded-md bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur opacity-60 group-hover:opacity-100 transition duration-300" />
              <Button variant="ghost" size="sm" className="relative h-8 px-2.5 text-xs bg-background/80 ring-1 ring-border/50 hover:bg-background/90">
                Manage
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="bg-emerald-500/70 h-1 w-1 rounded-full" />
          <span className="text-xs font-medium">Personalized</span>
        </div>
        <KontextManageDropdown
          trigger={
            <div className="relative inline-block group align-middle">
              <div className="pointer-events-none absolute -inset-1 rounded-md bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur opacity-60 group-hover:opacity-100 transition duration-300" />
              <Button variant="ghost" size="sm" className="relative h-8 px-2.5 text-xs bg-background/80 ring-1 ring-border/50 hover:bg-background/90">
                Manage
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <span className="bg-muted-foreground/40 h-1 w-1 rounded-full" />
            <span className="text-xs font-medium">Use Kontext</span>
          </div>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>
          <p className="text-[10px]">Connect to enable personalized responses</p>
          <p className="text-[10px] text-muted-foreground">based on your communications</p>
        </TooltipContent>
      </Tooltip>
      <div className="relative inline-block group align-middle">
        <div className="pointer-events-none absolute -inset-1 rounded-md bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur opacity-60 group-hover:opacity-100 transition duration-300" />
        <Button size="sm" variant="ghost" className="relative h-8 px-2.5 text-xs bg-background/80 ring-1 ring-border/50 hover:bg-background/90" onClick={() => connectGmail()}>
          Connect
        </Button>
      </div>
    </div>
  );
}
