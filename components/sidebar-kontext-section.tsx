"use client";

import { Search, Sparkles } from "lucide-react";
import { KontextVectorSearch } from "./kontext-vector-search";
import { UserQueryToggle } from "./assistant-ui/user-query-toggle";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

export function SidebarKontextSection() {
  return (
    <div className="flex flex-col">
      {/* Logo Section - Aligned with sidebar trigger */}
      <div className="h-16 px-2 pt-1.5">
        <div className="flex h-10 w-10 items-center justify-center">
          <div className="relative group inline-block">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative p-1.5 bg-background rounded-lg ring-1 ring-border/50 shadow-sm hover:shadow-md transition-all duration-200">
              <Image
                src="/kontext-icon.svg"
                alt="Kontext"
                width={16}
                height={16}
                className="dark:invert opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col py-4">
        {/* Search Section */}
        <div className="flex flex-col space-y-3 px-3 pb-3">
          <div className="flex items-start gap-2">
            <Search className="h-3 w-3 text-muted-foreground/70 mt-0.5" />
            <div className="flex flex-col space-y-0.5">
              <span className="text-xs font-medium leading-none">Search</span>
              <span className="text-[10px] text-muted-foreground/60 leading-tight">
                Vector embeddings from + to Kontext
              </span>
            </div>
          </div>
          <div className="pl-5">
            <KontextVectorSearch />
          </div>
        </div>

        <div className="px-3">
          <Separator className="my-3" />
        </div>

        {/* Smart Context Section */}
        <div className="flex items-center justify-between px-3 pt-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-3 w-3 text-muted-foreground/70 mt-0.5" />
            <div className="flex flex-col space-y-0.5">
              <span className="text-xs font-medium leading-none">
                Smart Context
              </span>
              <span className="text-[10px] text-muted-foreground/60 leading-tight">
                Focus using your message
              </span>
            </div>
          </div>
          <UserQueryToggle />
        </div>
      </div>
    </div>
  );
}
