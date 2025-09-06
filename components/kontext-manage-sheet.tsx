"use client";

import { useState } from "react";
import { useKontext } from "@kontext.dev/kontext-sdk/react";
import { KontextStatus } from "@kontext.dev/kontext-sdk/components";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, Mail, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function KontextManageSheet({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { isConnected, isLoading, connectGmail, disconnect, refreshProfile } = useKontext();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Kontext Connection</SheetTitle>
          <SheetDescription>
            Enable personalized responses based on your communications and preferences.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-2 space-y-5 px-4 pb-4">
          {isConnected ? (
            <>
              <section className="rounded-lg border bg-background/60 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="bg-emerald-500 inline-block h-2.5 w-2.5 rounded-full" />
                  <span className="text-sm font-medium">Personalized responses enabled</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <KontextStatus />
                </div>
              </section>
              <section className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  Management
                </div>
                <p className="mb-3 text-sm text-muted-foreground">
                  Refresh your profile to pull recent context or disconnect anytime.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => refreshProfile?.()} disabled={isLoading}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => disconnect()} disabled={isLoading}>
                    <LogOut className="mr-1.5 h-3.5 w-3.5" /> Disconnect
                  </Button>
                </div>
              </section>
            </>
          ) : (
            <section className="rounded-lg border bg-muted/40 px-6 py-6">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-medium">Connect Gmail</h3>
              </div>
              <p className="mb-4 max-w-md text-sm text-muted-foreground">
                Tailor responses using your recent context. You control your data and can disconnect anytime.
              </p>
              <Button onClick={() => connectGmail()} disabled={isLoading}>Connect Gmail</Button>
            </section>
          )}
        </div>
        <SheetFooter className="mt-6" />
      </SheetContent>
    </Sheet>
  );
}
