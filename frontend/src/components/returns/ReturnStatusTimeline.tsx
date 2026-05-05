import { CheckCircle2, Circle, Clock, RotateCcw, Truck, XCircle } from "lucide-react";
import {
  RETURN_STATUS_LABELS,
  RETURN_STATUS_STYLES,
  RETURN_TIMELINE,
  type ReturnRequest,
} from "@/lib/returns";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/imageUrl";

const RETURN_STEP_DETAILS: Record<string, string> = {
  RETURN_REQUESTED: "Your return request is waiting for seller review.",
  RETURN_APPROVED: "The seller approved your return request.",
  RETURN_PICKUP_ASSIGNED: "A delivery agent has been assigned for pickup.",
  RETURN_PICKED_UP: "The item has been collected from your pickup address.",
  RETURN_DELIVERED: "The returned item has reached the seller.",
  REFUND_INITIATED: "Your refund is being processed.",
  REFUND_COMPLETED: "Your refund has been completed.",
};

const REQUESTED_LABELS: Record<string, string> = {
  RETURN_APPROVED: "Approved",
  RETURN_PICKUP_ASSIGNED: "Delivery Agent Assigned",
  RETURN_DELIVERED: "Returned to Seller",
  REFUND_INITIATED: "Refund Processing",
};

function getChangedAt(item: ReturnRequest, status: string) {
  return item.statusHistory?.find((entry) => entry.status === status)?.changedAt;
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ReturnStatusTimeline({
  item,
  compact = false,
}: {
  item: ReturnRequest;
  compact?: boolean;
}) {
  const currentIndex =
    item.status === "RETURN_IN_TRANSIT"
      ? RETURN_TIMELINE.indexOf("RETURN_PICKED_UP")
      : RETURN_TIMELINE.indexOf(item.status as (typeof RETURN_TIMELINE)[number]);
  const isRejected = item.status === "RETURN_REJECTED";
  const rejectedAt = item.statusHistory?.find((entry) => entry.status === "RETURN_REJECTED")?.changedAt || item.updatedAt;

  return (
    <div className={cn("rounded-2xl border border-border bg-background", compact ? "p-4" : "p-5")}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Return Status</p>
          <h4 className="mt-1 text-base font-semibold text-foreground">
            Order #{item.order?._id?.slice(-8).toUpperCase() || "RETURN"}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
        </div>
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
            RETURN_STATUS_STYLES[item.status] || "border-border bg-muted text-foreground"
          )}
        >
          {isRejected ? <XCircle className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
          {RETURN_STATUS_LABELS[item.status] || item.status}
        </span>
      </div>

      {isRejected ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Return request rejected</p>
              <p className="mt-1 text-xs leading-5">
                This request was reviewed and rejected. Pickup and refund steps will not continue.
              </p>
              {formatDate(rejectedAt) && <p className="mt-2 text-xs font-medium">{formatDate(rejectedAt)}</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative space-y-0">
          {RETURN_TIMELINE.map((status, index) => {
            const isComplete = currentIndex >= index;
            const isCurrent = item.status === status;
            const changedAt = getChangedAt(item, status);
            const label = REQUESTED_LABELS[status] || RETURN_STATUS_LABELS[status] || status;

            return (
              <div key={status} className="relative flex gap-3 pb-5 last:pb-0">
                {index < RETURN_TIMELINE.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-[11px] top-7 h-[calc(100%-1.75rem)] w-px",
                      isComplete ? "bg-green-500" : "bg-border"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background",
                    isComplete && "border-green-600 bg-green-600 text-white",
                    isCurrent && "ring-4 ring-green-100",
                    !isComplete && "border-border text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : status === "RETURN_PICKUP_ASSIGNED" || status === "RETURN_PICKED_UP" ? (
                    <Truck className="h-3.5 w-3.5" />
                  ) : status === "REFUND_INITIATED" ? (
                    <Clock className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-2.5 w-2.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className={cn("text-sm font-semibold", isComplete ? "text-foreground" : "text-muted-foreground")}>
                      {label}
                    </p>
                    {formatDate(changedAt) && <p className="text-xs text-muted-foreground">{formatDate(changedAt)}</p>}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{RETURN_STEP_DETAILS[status]}</p>
                  {isCurrent && <p className="mt-1 text-xs font-medium text-green-700">Current stage</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {item.referencePhotos?.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Uploaded Return Images</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {item.referencePhotos.length} image{item.referencePhotos.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className={cn("grid gap-2", compact ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4")}>
            {item.referencePhotos.map((photo, index) => (
              <a
                key={`${photo}-${index}`}
                href={resolveMediaUrl(photo, "")}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
              >
                <img
                  src={resolveMediaUrl(photo, "")}
                  alt={`Return evidence ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                  {index + 1}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
