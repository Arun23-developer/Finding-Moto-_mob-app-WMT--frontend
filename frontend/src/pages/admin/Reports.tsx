import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Flag,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import api from "@/services/api";

type ReportCategory = "ACCOUNT" | "PRODUCT" | "SERVICE" | "DELIVERY";
type ReportStatus = "PENDING" | "RESOLVED" | "REJECTED";

type UserRole = "buyer" | "seller" | "mechanic" | "admin" | "delivery_agent";

type TabKey =
  | "seller"
  | "mechanic"
  | "delivery_agent"
  | "product"
  | "service"
  | "delivery";

const tabFromQuery = (value: string | null): TabKey => {
  if (
    value === "seller" ||
    value === "mechanic" ||
    value === "delivery_agent" ||
    value === "product" ||
    value === "service" ||
    value === "delivery"
  ) {
    return value;
  }
  return "seller";
};

const statusBadgeClass: Record<ReportStatus, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
  RESOLVED: "bg-green-500/15 text-green-600 border-green-500/20",
  REJECTED: "bg-red-500/15 text-red-600 border-red-500/20",
};

const statusLabel: Record<ReportStatus, string> = {
  PENDING: "Pending",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

type PopUser = {
  _id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
};

type PopProduct = { _id: string; name?: string };

type PopService = { _id: string; name?: string };

type PopDelivery = {
  _id: string;
  orderId?: string;
  status?: string;
  agentId?: { _id: string; fullName?: string; email?: string; role?: UserRole };
};

type ReportRow = {
  _id: string;
  category: ReportCategory;
  reason: string;
  status: ReportStatus;
  adminNotes?: string | null;
  adminAction?: string;
  createdAt: string;
  reportedBy: PopUser;
  reportedUser: PopUser;
  reportedProduct?: PopProduct | null;
  reportedService?: PopService | null;
  reportedDelivery?: PopDelivery | null;
};

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>(() => tabFromQuery(searchParams.get("tab")));

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<null | "resolve" | "reject" | "block">(null);

  const query = useMemo(() => {
    const params: Record<string, string> = {};

    if (activeTab === "seller") {
      params.category = "ACCOUNT";
      params.reportedUserRole = "seller";
    } else if (activeTab === "mechanic") {
      params.category = "ACCOUNT";
      params.reportedUserRole = "mechanic";
    } else if (activeTab === "delivery_agent") {
      params.category = "ACCOUNT";
      params.reportedUserRole = "delivery_agent";
    } else if (activeTab === "product") {
      params.category = "PRODUCT";
    } else if (activeTab === "service") {
      params.category = "SERVICE";
    } else if (activeTab === "delivery") {
      params.category = "DELIVERY";
    }

    return params;
  }, [activeTab]);

  const pageTitle = useMemo(() => {
    if (activeTab === "seller") return "Seller Reports";
    if (activeTab === "mechanic") return "Mechanic Reports";
    if (activeTab === "delivery_agent") return "Delivery Agent Reports";
    if (activeTab === "product") return "Product Reports";
    if (activeTab === "service") return "Service Reports";
    return "Delivery Reports";
  }, [activeTab]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "seller", label: "Seller Reports" },
    { key: "mechanic", label: "Mechanic Reports" },
    { key: "delivery_agent", label: "Delivery Agent Reports" },
    { key: "product", label: "Product Reports" },
    { key: "service", label: "Service Reports" },
    { key: "delivery", label: "Delivery Reports" },
  ];

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/reports", { params: query });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setReports(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const nextTab = tabFromQuery(searchParams.get("tab"));
    if (nextTab !== activeTab) setActiveTab(nextTab);
  }, [searchParams, activeTab]);

  const setTab = (tab: TabKey) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const getUserLabel = (u?: PopUser | null) => {
    if (!u) return "—";
    const name = u.fullName || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
    return name || u.email || "—";
  };

  const getReportedItemLabel = (r: ReportRow) => {
    if (r.category === "ACCOUNT") return "Account";
    if (r.category === "PRODUCT") return r.reportedProduct?.name || "Product";
    if (r.category === "SERVICE") return r.reportedService?.name || "Service";
    if (r.category === "DELIVERY") return r.reportedDelivery?.orderId ? `Order ${r.reportedDelivery.orderId}` : "Delivery";
    return "—";
  };

  const openReview = (report: ReportRow) => {
    setSelectedReport(report);
    setReviewNotes(report.adminNotes || "");
    setReviewOpen(true);
  };

  const updateStatus = async (status: "RESOLVED" | "REJECTED") => {
    if (!selectedReport) return;
    setActionLoading(status === "RESOLVED" ? "resolve" : "reject");
    try {
      await api.put(`/admin/reports/${selectedReport._id}/status`, {
        status,
        adminNotes: reviewNotes.trim() ? reviewNotes.trim() : undefined,
      });
      setReviewOpen(false);
      setSelectedReport(null);
      await fetchReports();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to update report");
    } finally {
      setActionLoading(null);
    }
  };

  const blockAccount = async () => {
    if (!selectedReport) return;
    setActionLoading("block");
    try {
      await api.put(`/admin/reports/${selectedReport._id}/block`);
      setReviewOpen(false);
      setSelectedReport(null);
      await fetchReports();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to block account");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">{pageTitle}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchReports} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flag className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader className="pb-3" />
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No reports found</p>
              <p className="text-sm mt-1">Reports will appear here once users start reporting items.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed min-w-[1100px]">
                <colgroup>
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                  <col className="w-[26%]" />
                  <col className="w-[14%]" />
                  <col className="w-[8%]" />
                  <col className="w-[6%]" />
                </colgroup>
                <thead>
                  <tr className="text-muted-foreground text-xs border-b border-border">
                    <th className="text-left py-3 px-3 font-medium">Reported User</th>
                    <th className="text-left py-3 px-3 font-medium">Reported By</th>
                    <th className="text-left py-3 px-3 font-medium">Report Type</th>
                    <th className="text-left py-3 px-3 font-medium">Reason</th>
                    <th className="text-left py-3 px-3 font-medium">Reported Item</th>
                    <th className="text-center py-3 px-3 font-medium">Status</th>
                    <th className="text-right py-3 px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r._id} className="h-14 border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="py-3 px-3 text-left">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{getUserLabel(r.reportedUser)}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.reportedUser?.email || "—"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-left">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{getUserLabel(r.reportedBy)}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.reportedBy?.email || "—"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-left">
                        <span className="text-xs font-medium">{r.category}</span>
                      </td>
                      <td className="py-3 px-3 text-left">
                        <p className="text-sm text-muted-foreground line-clamp-2">{r.reason}</p>
                      </td>
                      <td className="py-3 px-3 text-left">
                        <p className="text-sm">{getReportedItemLabel(r)}</p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass[r.status]}`}>
                          {statusLabel[r.status]}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-9 px-0"
                            onClick={() => openReview(r)}
                            title="Review report"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={reviewOpen} onOpenChange={(open) => !open && setReviewOpen(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Review Report
            </DialogTitle>
            <DialogDescription>Review the report and take an action.</DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Reported User</p>
                  <p className="font-medium truncate">{getUserLabel(selectedReport.reportedUser)}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Reported By</p>
                  <p className="font-medium truncate">{getUserLabel(selectedReport.reportedBy)}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Report Type</p>
                  <p className="font-medium">{selectedReport.category}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                  <p className="font-medium">{statusLabel[selectedReport.status]}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Reported Item</p>
                  <p className="font-medium">{getReportedItemLabel(selectedReport)}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Reason</p>
                  <p className="font-medium">{selectedReport.reason}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adminNotes" className="text-sm">
                  Admin Note <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="adminNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                  placeholder="Optional internal note for this report"
                />
              </div>

              {selectedReport.reportedUser?.isActive === false && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  This account is already disabled.
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewOpen(false)} disabled={!!actionLoading}>
              Close
            </Button>
            <Button
              variant="outline"
              className="h-9 border-green-500/40 text-green-600 hover:bg-green-500/10 hover:border-green-500"
              onClick={() => updateStatus("RESOLVED")}
              disabled={!!actionLoading}
            >
              {actionLoading === "resolve" ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Resolve
            </Button>
            <Button
              variant="outline"
              className="h-9 border-red-500/40 text-red-600 hover:bg-red-500/10 hover:border-red-500"
              onClick={() => updateStatus("REJECTED")}
              disabled={!!actionLoading}
            >
              {actionLoading === "reject" ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
            <Button
              variant="outline"
              className="h-9 border-red-500/40 text-red-600 hover:bg-red-500/10 hover:border-red-500"
              onClick={blockAccount}
              disabled={!!actionLoading}
            >
              {actionLoading === "block" ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ShieldAlert className="h-4 w-4 mr-2" />
              )}
              Block Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
