"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { AtSign, Loader2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Note = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: { id: string; name: string };
};

type Option = { id: string; name: string };

export function LeadNotes({
  leadId,
  notes,
  users,
  currentUserId,
}: {
  leadId: string;
  notes: Note[];
  users: Option[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [mentioned, setMentioned] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  function toggleMention(id: string) {
    setMentioned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mentionedUserIds: Array.from(mentioned) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to add note");
        return;
      }
      setContent("");
      setMentioned(new Set());
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveEdit(noteId: string) {
    const res = await fetch(`/api/leads/${leadId}/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    if (!res.ok) {
      toast.error("Failed to update note");
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note... "
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          {users.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <AtSign className="text-muted-foreground size-3.5" />
              {users
                .filter((u) => u.id !== currentUserId)
                .map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleMention(u.id)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs",
                      mentioned.has(u.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {u.name}
                  </button>
                ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button size="sm" onClick={submit} disabled={isSubmitting || !content.trim()}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Add Note
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t pt-4">
          {notes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="bg-muted/40 rounded-md p-3 text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">{note.user.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </span>
                    {note.userId === currentUserId && editingId !== note.id && (
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setEditContent(note.content);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(null)}>
                        <X className="size-3.5" />
                      </Button>
                      <Button size="icon-sm" onClick={() => saveEdit(note.id)}>
                        <Check className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{note.content}</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
