import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Megaphone, Send } from "lucide-react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TargetRole = "seller" | "mechanic" | "delivery_agent" | "buyer";

const roleLabels: Record<TargetRole, string> = {
  seller: "Sellers",
  mechanic: "Mechanics",
  delivery_agent: "Delivery Agents",
  buyer: "Buyers",
};

const roleDescriptions: Record<TargetRole, string> = {
  seller: "Send store, order, return, or platform updates to sellers.",
  mechanic: "Send workshop, service, return, or parts updates to mechanics.",
  delivery_agent: "Send delivery workflow and limited admin alerts to delivery agents.",
  buyer: "Send marketplace, order, refund, or account information to buyers.",
};

const parseRole = (value: string | null): TargetRole => {
  if (value === "seller" || value === "mechanic" || value === "delivery_agent" || value === "buyer") return value;
  return "seller";
};

export default function AdminInfoToUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRole = parseRole(searchParams.get("role"));
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const remaining = useMemo(() => 500 - message.length, [message.length]);

  const handleRoleChange = (role: TargetRole) => {
    setSearchParams({ role });
    setNotice(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);

    if (!title.trim()) {
      setNotice({ type: "error", text: "Information title is required." });
      return;
    }

    if (!message.trim()) {
      setNotice({ type: "error", text: "Information message is required." });
      return;
    }

    setSending(true);
    try {
      const { data } = await api.post("/admin/info-to-users", {
        role: selectedRole,
        title: title.trim(),
        message: message.trim(),
      });
      setTitle("");
      setMessage("");
      setNotice({ type: "success", text: data?.message || "Information sent successfully." });
    } catch (error: any) {
      setNotice({ type: "error", text: error?.response?.data?.message || "Failed to send information." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Info to Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send role-based admin information directly into user notifications.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Target Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.keys(roleLabels) as TargetRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleChange(role)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  selectedRole === role
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                <span className="font-semibold">{roleLabels[role]}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{roleDescriptions[role]}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-5 w-5 text-primary" />
              Send to {roleLabels[selectedRole]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {notice ? (
                <div
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    notice.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {notice.text}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="info-title">Title</Label>
                <Input
                  id="info-title"
                  value={title}
                  maxLength={120}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Example: Scheduled maintenance notice"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="info-message">Message</Label>
                  <span className="text-xs text-muted-foreground">{remaining} characters left</span>
                </div>
                <Textarea
                  id="info-message"
                  value={message}
                  maxLength={500}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Write a clear update for the selected user role."
                  className="min-h-[180px]"
                />
              </div>

              <Button type="submit" disabled={sending} className="gap-2">
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : `Send to ${roleLabels[selectedRole]}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
