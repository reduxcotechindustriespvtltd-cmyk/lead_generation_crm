"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type WhatsAppMessage = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  content: string;
  status: "RECEIVED" | "SENT" | "FAILED";
  errorMessage: string | null;
  createdAt: string;
  sentBy: { id: string; name: string } | null;
};

export function LeadWhatsAppChat({
  leadId,
  initialMessages,
}: {
  leadId: string;
  initialMessages: WhatsAppMessage[];
}) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>(initialMessages);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/whatsapp/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      // Silent — polling refresh is non-critical UI.
    }
  }, [leadId]);

  useEffect(() => {
    // Fetch-on-mount + poll: an unavoidable setState-in-effect for loading
    // server data on mount, not a derived-state anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function submit() {
    if (!content.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/whatsapp/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send WhatsApp message");
        return;
      }
      setMessages((prev) => [...prev, data.message]);
      setContent("");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">WhatsApp</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {messages.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No WhatsApp messages yet" size="sm" />
        ) : (
          <ScrollArea className="h-96 pr-3">
            <div className="flex flex-col gap-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col gap-0.5",
                    message.direction === "OUTBOUND" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                      message.direction === "OUTBOUND"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.content}
                  </div>
                  <span className="text-muted-foreground px-1 text-xs">
                    {message.direction === "OUTBOUND" && message.sentBy
                      ? `${message.sentBy.name} · `
                      : ""}
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    {message.status === "FAILED" && (
                      <span className="text-destructive"> · Failed to send</span>
                    )}
                  </span>
                  {message.status === "FAILED" && message.errorMessage && (
                    <span className="text-destructive max-w-[80%] px-1 text-xs">
                      {message.errorMessage}
                    </span>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}

        <div className="space-y-2 border-t pt-4">
          <Textarea
            placeholder="Reply on WhatsApp..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={submit} disabled={isSending || !content.trim()}>
              {isSending && <Loader2 className="animate-spin" />}
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
