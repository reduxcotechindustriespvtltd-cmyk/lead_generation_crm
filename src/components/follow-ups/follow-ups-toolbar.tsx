"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function toDateParam(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function FollowUpsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enquiredFrom = searchParams.get("enquiredFrom");
  const enquiredTo = searchParams.get("enquiredTo");
  const range: DateRange | undefined = enquiredFrom
    ? { from: new Date(enquiredFrom), to: enquiredTo ? new Date(enquiredTo) : new Date(enquiredFrom) }
    : undefined;

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (search !== (searchParams.get("q") ?? "")) {
        updateParams({ q: search || null });
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function handleRangeSelect(selected: DateRange | undefined) {
    updateParams({
      enquiredFrom: selected?.from ? toDateParam(selected.from) : null,
      enquiredTo: selected?.to ? toDateParam(selected.to) : selected?.from ? toDateParam(selected.from) : null,
    });
  }

  const hasDateFilter = !!enquiredFrom;

  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search name, phone..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Popover>
        <PopoverTrigger render={<Button variant="outline" className="justify-start font-normal" />}>
          <CalendarIcon className="size-4" />
          {hasDateFilter ? (
            <span>
              {formatDate(enquiredFrom!)}
              {enquiredTo && enquiredTo !== enquiredFrom ? ` – ${formatDate(enquiredTo)}` : ""}
            </span>
          ) : (
            <span className="text-muted-foreground">Enquiry date</span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="range" selected={range} onSelect={handleRangeSelect} numberOfMonths={2} />
        </PopoverContent>
      </Popover>

      {hasDateFilter && (
        <Button
          variant="ghost"
          size="icon-sm"
          title="Clear date filter"
          onClick={() => updateParams({ enquiredFrom: null, enquiredTo: null })}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
