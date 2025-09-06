"use client";

import { useKontext } from '@kontext.dev/kontext-sdk/react';
import { KontextModal, KontextStatus } from '@kontext.dev/kontext-sdk/components';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useKontextCookie } from '@/hooks/useKontextCookie';

export function KontextConnectionStatus() {
  const { isConnected, isLoading, error } = useKontext();
  
  // Set cookie for server-side access
  useKontextCookie();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading Kontext...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-red-500">
        <span className="text-sm">Error: {error}</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <KontextStatus />
        <span className="text-sm text-muted-foreground">Personalization enabled</span>
        <div className="ml-auto" />
        <KontextModal
          trigger={<Button variant="ghost" size="sm">Manage</Button>}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="text-sm text-muted-foreground">Connect Gmail for personalized responses</span>
      <div className="ml-auto" />
      <KontextModal
        trigger={<Button size="sm">Connect</Button>}
      />
    </div>
  );
}
