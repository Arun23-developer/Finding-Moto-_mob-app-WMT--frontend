import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Reply, Eye, Loader2, Phone } from "lucide-react";
import api from "@/services/api";

type VisitorMessage = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: "NEW" | "READ";
  createdAt: string;
};

const statusStyles: Record<VisitorMessage["status"], string> = {
  NEW: "bg-primary/15 text-primary border-primary/20",
  READ: "bg-success/15 text-success border-success/20",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function ContactManagement() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<VisitorMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/visitor-messages");
      setMessages(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const filteredMessages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((message) =>
      [message.name, message.email, message.phone || "", message.message, message.status].some((field) =>
        field.toLowerCase().includes(q)
      )
    );
  }, [messages, query]);

  const stats = useMemo(
    () => [
      { label: "Total Messages", value: messages.length },
      { label: "New", value: messages.filter((message) => message.status === "NEW").length },
      { label: "Read", value: messages.filter((message) => message.status === "READ").length },
      { label: "With Phone", value: messages.filter((message) => Boolean(message.phone)).length },
    ],
    [messages]
  );

  const openMessage = async (message: VisitorMessage) => {
    window.alert(
      `From: ${message.name} <${message.email}>${message.phone ? `\nPhone: ${message.phone}` : ""}\n\n${message.message}`
    );

    if (message.status === "NEW") {
      await api.put(`/admin/visitor-messages/${message._id}/read`);
      setMessages((prev) =>
        prev.map((item) => (item._id === message._id ? { ...item, status: "READ" } : item))
      );
    }
  };

  const replyTo = (message: VisitorMessage) => {
    const subject = encodeURIComponent("Re: Finding Moto contact message");
    const body = encodeURIComponent(`Hi ${message.name},\n\nThanks for contacting Finding Moto.\n\n`);
    window.location.href = `mailto:${message.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Visitor Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">View contact form messages sent by site visitors</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="font-display mt-1 text-xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search visitor messages..."
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading visitor messages...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No visitor messages found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((message) => (
                <div
                  key={message._id}
                  className="flex cursor-pointer items-start gap-4 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{message.name}</p>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusStyles[message.status]}`}
                      >
                        {message.status === "NEW" ? "New" : "Read"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{message.message}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{message.email}</span>
                      {message.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {message.phone}
                        </span>
                      ) : null}
                      <span>{formatDate(message.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openMessage(message)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => replyTo(message)}>
                      <Reply className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
