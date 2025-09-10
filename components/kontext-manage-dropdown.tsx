"use client";

import { useState } from "react";
import { useKontext } from "@kontext.dev/kontext-sdk/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, LogOut, Loader2 } from "lucide-react";

interface KontextManageDropdownProps {
  trigger: React.ReactNode;
}

export function KontextManageDropdown({ trigger }: KontextManageDropdownProps) {
  const { isConnected, connectGmail, disconnect, refreshProfile } = useKontext();
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    if (!isConnected) return;
    setLoading(true);
    try {
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await disconnect();
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      await connectGmail();
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isConnected ? (
          <>
            <DropdownMenuItem 
              onClick={handleRefresh} 
              disabled={loading}
              className="px-2 py-1.5 text-xs flex items-center gap-1.5"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/60" />
              ) : (
                <RefreshCw className="h-3 w-3 text-muted-foreground/60" />
              )}
              <span className="leading-tight">Refresh</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-0.5" />
            <DropdownMenuItem 
              onClick={handleDisconnect} 
              disabled={loading}
              className="px-2 py-1.5 text-xs flex items-center gap-1.5"
            >
              <LogOut className="h-3 w-3 text-muted-foreground/60" />
              <span className="leading-tight">Disconnect</span>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem 
            onClick={handleConnect} 
            disabled={loading}
            className="px-2 py-1.5 text-xs flex items-center gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/60" />
            ) : null}
            <span className="leading-tight">Connect</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
