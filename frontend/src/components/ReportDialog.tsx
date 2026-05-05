import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Flag, Loader2 } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ReportCategory = "ACCOUNT" | "PRODUCT" | "SERVICE" | "DELIVERY";

interface ReportDialogProps {
  category: ReportCategory;
  targetId: string;
  title?: string;
  description?: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  triggerSize?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ReportDialog({
  category,
  targetId,
  title = "Report",
  description = "Tell us what went wrong. Admin will review your report.",
  triggerLabel = "Report",
  triggerVariant = "outline",
  triggerSize = "sm",
  className,
}: ReportDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openDialog = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Please sign in to submit a report.",
      });
      navigate("/login");
      return;
    }
    setOpen(true);
  };

  const submit = async () => {
    if (!reason.trim()) {
      toast({
        variant: "destructive",
        title: "Reason required",
        description: "Please enter a reason for this report.",
      });
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/reports", {
        category,
        targetId,
        reason: reason.trim(),
      });
      toast({ title: "Report submitted", description: "Thanks — your report has been sent to Admin." });
      setOpen(false);
      setReason("");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to submit",
        description: e?.response?.data?.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        className={className}
        onClick={openDialog}
      >
        <Flag className="h-4 w-4 mr-2" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reportReason">Reason</Label>
            <Textarea
              id="reportReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
              placeholder="Describe the issue (fraud, misleading listing, unsafe behavior, spam, etc.)"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
