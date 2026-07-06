"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { visibleNavItems } from "@/components/layout/nav-items";
import type { UserRole } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

type Command = {
  id: string;
  label: string;
  group: "Go to" | "Actions";
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
};

export function CommandPalette({ role }: { role: UserRole }) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const navCommands: Command[] = visibleNavItems(role).map((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      group: "Go to",
      icon: item.icon,
      run: () => router.push(item.href),
    }));

    const actionCommands: Command[] = [
      {
        id: "toggle-theme",
        label: resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        group: "Actions",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
      {
        id: "logout",
        label: "Log out",
        group: "Actions",
        icon: LogOut,
        run: () => {
          fetch("/api/auth/logout", { method: "POST" }).finally(() => {
            router.push("/login");
            router.refresh();
          });
        },
      },
    ];

    return [...navCommands, ...actionCommands];
  }, [role, router, resolvedTheme, setTheme]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  function openPalette() {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else openPalette();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-command-palette", openPalette);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-command-palette", openPalette);
    };
  }, [open]);

  useEffect(() => {
    // Focus is a DOM side effect that can only happen once the input has
    // mounted after `open` flips true — not a derived-state update.
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(0);
  }

  function runCommand(command: Command) {
    setOpen(false);
    command.run();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filtered[activeIndex];
      if (selected) runCommand(selected);
    }
  }

  const groups = ["Go to", "Actions"] as const;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search pages and actions..."
            className="placeholder:text-muted-foreground h-11 w-full bg-transparent text-sm outline-none"
          />
          <kbd className="text-muted-foreground bg-muted rounded border px-1.5 py-0.5 text-[10px]">
            Esc
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">No matches.</p>
          )}
          {groups.map((group) => {
            const items = filtered.filter((c) => c.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="mb-1">
                <p className="text-muted-foreground px-2.5 py-1.5 text-xs font-medium">{group}</p>
                {items.map((command) => {
                  const index = filtered.indexOf(command);
                  return (
                    <button
                      key={command.id}
                      onClick={() => runCommand(command)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm",
                        index === activeIndex
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground"
                      )}
                    >
                      <command.icon className="size-4 shrink-0" />
                      {command.label}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
