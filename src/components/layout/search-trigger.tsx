"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchTrigger() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="text-muted-foreground w-40 justify-between font-normal sm:w-56"
      onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
    >
      <span className="flex items-center gap-2">
        <Search className="size-3.5" />
        Search
      </span>
      <kbd className="bg-muted rounded border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
    </Button>
  );
}
