import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  Users,
  User,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Eye,
} from "lucide-react";
import api from "@/services/api";

// ─── Types ─────────────────────────────────────────────────────────
type UserRole = "buyer" | "seller" | "mechanic" | "admin" | "delivery_agent";
type ApprovalStatus = "pending" | "approved" | "rejected";

interface AdminUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  createdAt: string;
  shopName?: string;
  shopLocation?: string;
  workshopName?: string;
  workshopLocation?: string;
  specialization?: string;
  experienceYears?: number;
}

type TabKey = "all" | "pending" | "seller" | "mechanic" | "delivery_agent" | "buyer";

const tabFromQuery = (value: string | null): TabKey => {
  if (value === "seller" || value === "mechanic" || value === "delivery_agent" || value === "pending" || value === "buyer") {
    return value;
  }
  return "all";
};

// ─── Helpers ────────────────────────────────────────────────────────
const roleLabel: Record<UserRole, string> = {
  buyer: "Buyer",
  seller: "Seller",
  mechanic: "Mechanic",
  admin: "Admin",
  delivery_agent: "Delivery Agent",
};

const approvalBadgeClass: Record<ApprovalStatus, string> = {
  approved: "bg-green-500/15 text-green-600 border-green-500/20",
  pending: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
  rejected: "bg-red-500/15 text-red-600 border-red-500/20",
};

const approvalIcon: Record<ApprovalStatus, JSX.Element> = {
  approved: <CheckCircle className="h-3.5 w-3.5" />,
  pending: <Clock className="h-3.5 w-3.5" />,
  rejected: <XCircle className="h-3.5 w-3.5" />,
};

// ─── Component ──────────────────────────────────────────────────────
export default function UsersManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>(() => tabFromQuery(searchParams.get("tab")));

  // Approve / Reject modal state
  const [modalUser, setModalUser] = useState<AdminUser | null>(null);
  const [modalAction, setModalAction] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Toggle active confirmation
  const [toggleUser, setToggleUser] = useState<AdminUser | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // View user details modal
  const [detailUser, setDetailUser] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Fetch Users ──────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (activeTab === "pending") {
        const res = await api.get("/admin/pending");
        setUsers(res.data.users);
        setLoading(false);
        return;
      }
      if (activeTab === "seller") params.role = "seller";
      if (activeTab === "mechanic") params.role = "mechanic";
      if (activeTab === "delivery_agent") params.role = "delivery_agent";
      if (activeTab === "buyer") params.role = "buyer";
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/admin/users", { params });
      const allUsers: AdminUser[] = res.data.users;
      setUsers(allUsers);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  useEffect(() => {
    const nextTab = tabFromQuery(searchParams.get("tab"));
    if (nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      const current = nextParams.get("tab");

      if (activeTab === "all") {
        if (current) nextParams.delete("tab");
        return nextParams;
      }

      if (current !== activeTab) {
        nextParams.set("tab", activeTab);
      }

      return nextParams;
    }, { replace: true });
  }, [activeTab, setSearchParams]);

  const pageTitle = (() => {
    if (activeTab === "seller") return "Sellers";
    if (activeTab === "mechanic") return "Mechanics";
    if (activeTab === "delivery_agent") return "Delivery Agents";
    if (activeTab === "buyer") return "Buyers";
    if (activeTab === "pending") return "Pending Approvals";
    return "User Management";
  })();

  // ── Approve / Reject ─────────────────────────────────────────────
  const openApproval = (user: AdminUser, action: "approve" | "reject") => {
    setModalUser(user);
    setModalAction(action);
    setNotes("");
    setActionError(null);
  };

  const submitApproval = async () => {
    if (!modalUser || !modalAction) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.put(`/admin/approve/${modalUser._id}`, {
        action: modalAction,
        notes: notes.trim() || undefined,
      });
      setModalUser(null);
      setModalAction(null);
      fetchUsers();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Toggle Active ─────────────────────────────────────────────────
  const submitToggle = async () => {
    if (!toggleUser) return;
    setToggleLoading(true);
    try {
      await api.put(`/admin/toggle-active/${toggleUser._id}`);
      setToggleUser(null);
      fetchUsers();
    } catch {
      // silently refresh
      setToggleUser(null);
      fetchUsers();
    } finally {
      setToggleLoading(false);
    }
  };

  // ── View User Details ─────────────────────────────────────────────
  const openUserDetail = async (userId: string) => {
    setDetailLoading(true);
    setDetailUser(null);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setDetailUser(res.data.user);
    } catch {
      setDetailUser(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search, review, and approve accounts
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Table Card */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3 py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-1/4" />
                    <div className="h-2.5 bg-muted rounded w-1/3" />
                  </div>
                  <div className="h-5 w-16 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No users found</p>
              <p className="text-sm mt-1">
                {activeTab === "pending"
                  ? "No accounts are awaiting approval right now."
                  : "Try adjusting your search or filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed min-w-[920px]">
                <colgroup>
                  <col className="w-[44%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                  <col className="w-[16%]" />
                </colgroup>
                <thead>
                  <tr className="text-muted-foreground text-xs border-b border-border">
                    <th className="text-left py-3 px-3 font-medium">User</th>
                    <th className="text-center py-3 px-3 font-medium">Approval</th>
                    <th className="text-center py-3 px-3 font-medium">Active</th>
                    <th className="text-center py-3 px-3 font-medium">Details</th>
                    <th className="text-right py-3 px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const needsApproval = (u.role === "seller" || u.role === "mechanic" || u.role === "delivery_agent") && u.approvalStatus === "pending";
                    const isApprovalRole = (u.role === "seller" || u.role === "mechanic" || u.role === "delivery_agent");
                    return (
                      <tr
                        key={u._id}
                        className={`h-14 border-b border-border/50 last:border-0 transition-colors ${
                          needsApproval ? "bg-yellow-500/5 hover:bg-yellow-500/10" : "hover:bg-muted/30"
                        }`}
                      >
                        {/* User */}
                        <td className="py-3 px-3 text-left">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-primary">
                                {(u.firstName || u.fullName || "?").charAt(0)}{(u.lastName || "").charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium leading-tight truncate">{u.fullName}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        {/* Approval Status */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center">
                            {isApprovalRole ? (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${approvalBadgeClass[u.approvalStatus]}`}>
                                {approvalIcon[u.approvalStatus]}
                                {u.approvalStatus.charAt(0).toUpperCase() + u.approvalStatus.slice(1)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>

                        {/* Active Toggle */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => setToggleUser(u)}
                              title={u.isActive ? "Click to disable" : "Click to enable"}
                              className={`inline-flex items-center justify-center gap-1.5 text-xs font-medium transition-colors px-2.5 py-0.5 rounded-full border ${
                                u.isActive
                                  ? "bg-green-500/15 text-green-600 border-green-500/20"
                                  : "bg-red-500/15 text-red-600 border-red-500/20"
                              }`}
                            >
                              {u.isActive ? (
                                <ToggleRight className="h-4 w-4" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                              {u.isActive ? "Enabled" : "Disabled"}
                            </button>
                          </div>
                        </td>

                        {/* Details */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-9 px-0"
                              onClick={() => openUserDetail(u._id)}
                              title="View details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isApprovalRole ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-3 text-xs border-green-500/40 text-green-600 hover:bg-green-500/10 hover:border-green-500"
                                  onClick={() => openApproval(u, "approve")}
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-3 text-xs border-red-500/40 text-red-600 hover:bg-red-500/10 hover:border-red-500"
                                  onClick={() => openApproval(u, "reject")}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                  Reject
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Approve / Reject Modal ─────────────────────────────────── */}
      <Dialog open={!!modalUser} onOpenChange={(open) => !open && setModalUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalAction === "approve" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {modalAction === "approve" ? "Approve Account" : "Reject / Revoke Account"}
            </DialogTitle>
            <DialogDescription>
              Review user details and confirm your approval decision.
            </DialogDescription>
          </DialogHeader>

          {modalUser && (
            <div className="space-y-4 py-2">
              {/* User info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {(modalUser.firstName || modalUser.fullName || "?").charAt(0)}{(modalUser.lastName || "").charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{modalUser.fullName}</p>
                  <p className="text-xs text-muted-foreground">{modalUser.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Role: {roleLabel[modalUser.role]}</p>
                </div>
              </div>

              {/* Role-specific info */}
              {modalUser.role === "seller" && (modalUser.shopName || modalUser.shopLocation) && (
                <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 space-y-0.5">
                  {modalUser.shopName && <p><span className="font-medium text-foreground">Shop:</span> {modalUser.shopName}</p>}
                  {modalUser.shopLocation && <p><span className="font-medium text-foreground">Location:</span> {modalUser.shopLocation}</p>}
                </div>
              )}
              {modalUser.role === "mechanic" && (modalUser.workshopName || modalUser.specialization) && (
                <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 space-y-0.5">
                  {modalUser.workshopName && <p><span className="font-medium text-foreground">Workshop:</span> {modalUser.workshopName}</p>}
                  {modalUser.specialization && <p><span className="font-medium text-foreground">Specialization:</span> {modalUser.specialization}</p>}
                  {modalUser.experienceYears && <p><span className="font-medium text-foreground">Experience:</span> {modalUser.experienceYears} year(s)</p>}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm">
                  Admin Note{" "}
                  <span className="text-muted-foreground font-normal">(optional — sent to user via email)</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    modalAction === "approve"
                      ? "e.g. Welcome! Your documents have been reviewed and verified."
                      : "e.g. Incomplete documentation. Please resubmit with valid business license."
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Email notice */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                An email notification will be automatically sent to{" "}
                <strong className="ml-1">{modalUser.email}</strong>
              </div>

              {actionError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  {actionError}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalUser(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={submitApproval}
              disabled={actionLoading}
              className={modalAction === "approve"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"}
            >
              {actionLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : modalAction === "approve" ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {actionLoading
                ? "Processing..."
                : modalAction === "approve"
                ? "Confirm Approval"
                : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Toggle Active Confirmation ─────────────────────────────── */}
      <Dialog open={!!toggleUser} onOpenChange={(open) => !open && setToggleUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {toggleUser?.isActive ? (
                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ToggleRight className="h-5 w-5 text-green-500" />
              )}
              {toggleUser?.isActive ? "Deactivate User?" : "Activate User?"}
            </DialogTitle>
            <DialogDescription>
              Confirm account access change for this user.
            </DialogDescription>
          </DialogHeader>
          {toggleUser && (
            <p className="text-sm text-muted-foreground py-2">
              {toggleUser.isActive
                ? `This will prevent ${toggleUser.fullName} from logging in to their account.`
                : `This will restore login access for ${toggleUser.fullName}.`}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setToggleUser(null)} disabled={toggleLoading}>
              Cancel
            </Button>
            <Button
              onClick={submitToggle}
              disabled={toggleLoading}
              variant={toggleUser?.isActive ? "destructive" : "default"}
            >
              {toggleLoading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
              {toggleUser?.isActive ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── User Detail Modal ──────────────────────────────────────── */}
      <Dialog open={!!detailUser || detailLoading} onOpenChange={(open) => !open && setDetailUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              User Details
            </DialogTitle>
            <DialogDescription>
              View full account and role-specific details.
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : detailUser ? (
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              {/* User header */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {detailUser.firstName?.charAt(0)}{detailUser.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{detailUser.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{detailUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-muted/50 text-muted-foreground border-border">
                      {roleLabel[detailUser.role as UserRole]}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${detailUser.isActive ? 'bg-green-500/15 text-green-600 border-green-500/20' : 'bg-red-500/15 text-red-600 border-red-500/20'}`}>
                      {detailUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info rows */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                  <p className="font-medium">{detailUser.phone || '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Email Verified</p>
                  <p className="font-medium">{detailUser.isEmailVerified ? '✅ Yes' : '❌ No'}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                  <p className="font-medium">{detailUser.address || '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Approval</p>
                  <p className="font-medium capitalize">{detailUser.approvalStatus}</p>
                </div>
              </div>

              {/* Approval info */}
              {detailUser.approvalNotes && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                  <p className="text-xs text-muted-foreground mb-0.5">Approval Notes</p>
                  <p className="font-medium">{detailUser.approvalNotes}</p>
                </div>
              )}
              {detailUser.approvedAt && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                  <p className="text-xs text-muted-foreground mb-0.5">Approved At</p>
                  <p className="font-medium">{new Date(detailUser.approvedAt).toLocaleString()}</p>
                </div>
              )}

              {/* Seller-specific */}
              {detailUser.role === 'seller' && (
                <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-3 space-y-1 text-sm">
                  <p className="font-semibold text-purple-600 text-xs mb-2">🏪 Seller Details</p>
                  {detailUser.shopName && <p><span className="text-muted-foreground">Shop:</span> {detailUser.shopName}</p>}
                  {detailUser.shopDescription && <p><span className="text-muted-foreground">Description:</span> {detailUser.shopDescription}</p>}
                  {detailUser.shopLocation && <p><span className="text-muted-foreground">Location:</span> {detailUser.shopLocation}</p>}
                </div>
              )}

              {/* Mechanic-specific */}
              {detailUser.role === 'mechanic' && (
                <div className="bg-orange-500/5 border border-orange-500/10 rounded-lg p-3 space-y-1 text-sm">
                  <p className="font-semibold text-orange-600 text-xs mb-2">🔧 Mechanic Details</p>
                  {detailUser.specialization && <p><span className="text-muted-foreground">Specialization:</span> {detailUser.specialization}</p>}
                  {detailUser.experienceYears != null && <p><span className="text-muted-foreground">Experience:</span> {detailUser.experienceYears} year(s)</p>}
                  {detailUser.workshopName && <p><span className="text-muted-foreground">Workshop:</span> {detailUser.workshopName}</p>}
                  {detailUser.workshopLocation && <p><span className="text-muted-foreground">Location:</span> {detailUser.workshopLocation}</p>}
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Joined</p>
                  <p className="font-medium">{detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Last Updated</p>
                  <p className="font-medium">{detailUser.updatedAt ? new Date(detailUser.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</p>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailUser(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
