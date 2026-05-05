import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, RotateCcw, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { createAuthedSocket, type ReturnWorkflowSocketEvent } from "@/lib/socket";
import {
  RETURN_REASONS,
  RETURN_STATUS_LABELS,
  RETURN_STATUS_STYLES,
  type ReturnRequest,
} from "@/lib/returns";
import { ReturnStatusTimeline } from "@/components/returns/ReturnStatusTimeline";

interface DeliveredOrder {
  _id: string;
  items: { product: string; name: string; price: number; qty: number; image?: string }[];
  totalAmount: number;
  createdAt: string;
  status?: string;
}

const lettersOnlyPattern = /^[A-Za-z\s.'-]+$/;
const accountNumberPattern = /^\d{8,16}$/;
const MIN_RETURN_IMAGES = 5;
const MAX_RETURN_IMAGES = 8;

const onlyLetters = (value: string) => value.replace(/[^A-Za-z\s.'-]/g, "");
const onlyDigits = (value: string) => value.replace(/\D/g, "").slice(0, 16);
const RETURNABLE_ORDER_STATUSES = new Set(["delivered"]);

const BuyerReturnsClaims = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [orders, setOrders] = useState<DeliveredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    orderId: "",
    reason: "",
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    branchName: "",
    ifscOrSwiftCode: "",
    fullAddress: "",
    city: "",
    district: "",
    postalCode: "",
    comments: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const returnCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const requestedOrderId = searchParams.get("orderId") || "";
  const activeReturnId = searchParams.get("returnId") || "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [returnsRes, ordersRes] = await Promise.all([
        api.get("/returns/my"),
        api.get("/orders/my", { params: { status: "all" } }),
      ]);
      setReturns(Array.isArray(returnsRes.data.data) ? returnsRes.data.data : []);
      const rows = Array.isArray(ordersRes.data.data) ? ordersRes.data.data : [];
      setOrders(rows.filter((order: DeliveredOrder) => RETURNABLE_ORDER_STATUSES.has(String(order.status || "").toLowerCase())));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!activeReturnId || loading) return;
    const card = returnCardRefs.current[activeReturnId];
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeReturnId, loading, returns]);

  useEffect(() => {
    if (!requestedOrderId) return;
    setForm((current) => ({ ...current, orderId: requestedOrderId }));
    setFormOpen(true);
  }, [requestedOrderId]);

  useEffect(() => {
    const socket = createAuthedSocket();
    if (!socket) return;

    socket.on("return:workflow", (event: ReturnWorkflowSocketEvent) => {
      if (event.audience !== "buyer") return;
      fetchData();
      toast({
        title: event.title,
        description: event.message,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchData, toast]);

  useEffect(() => {
    const urls = photos.map((photo) => URL.createObjectURL(photo));
    setPhotoPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photos]);

  const returnedOrderIds = useMemo(() => new Set(returns.map((item) => item.order?._id)), [returns]);

  const eligibleOrders = useMemo(
    () => orders.filter((order) => !returnedOrderIds.has(order._id)),
    [orders, returnedOrderIds]
  );
  const selectedOrder = useMemo(
    () => eligibleOrders.find((order) => order._id === form.orderId) || null,
    [eligibleOrders, form.orderId]
  );

  const openFormForOrder = (orderId?: string) => {
    setErrors({});
    setPhotos([]);
    setForm((current) => ({ ...current, orderId: orderId || eligibleOrders[0]?._id || current.orderId }));
    setFormOpen(true);
  };

  const handlePhotoSelection = (files: FileList | null) => {
    const selected = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
    if (selected.length > MAX_RETURN_IMAGES) {
      toast({
        title: "Too many images",
        description: `You can upload a maximum of ${MAX_RETURN_IMAGES} return images.`,
        variant: "destructive",
      });
    }
    setPhotos(selected.slice(0, MAX_RETURN_IMAGES));
    setErrors((current) => {
      const next = { ...current };
      delete next.referencePhotos;
      return next;
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const closeForm = (nextOpen: boolean) => {
    setFormOpen(nextOpen);
    if (!nextOpen) {
      setSearchParams({});
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.orderId) nextErrors.orderId = "Select a delivered order";
    if (!selectedOrder) nextErrors.orderId = "Only delivered orders that are not already returned can be selected";
    if (!form.reason) nextErrors.reason = "Return reason is required";
    if (photos.length < MIN_RETURN_IMAGES || photos.length > MAX_RETURN_IMAGES) {
      nextErrors.referencePhotos = `Upload ${MIN_RETURN_IMAGES} to ${MAX_RETURN_IMAGES} return images`;
    }
    if (!form.accountHolderName.trim()) {
      nextErrors.accountHolderName = "Account holder name is required";
    } else if (!lettersOnlyPattern.test(form.accountHolderName.trim())) {
      nextErrors.accountHolderName = "Only letters and spaces are allowed";
    }
    if (!form.bankName.trim()) {
      nextErrors.bankName = "Bank name is required";
    } else if (!lettersOnlyPattern.test(form.bankName.trim())) {
      nextErrors.bankName = "Only letters and spaces are allowed";
    }
    if (!form.accountNumber.trim()) {
      nextErrors.accountNumber = "Account number is required";
    } else if (!accountNumberPattern.test(form.accountNumber.trim())) {
      nextErrors.accountNumber = "Enter 8 to 16 digits only";
    }
    if (!form.fullAddress.trim()) nextErrors.fullAddress = "Required";
    if (!form.city.trim()) nextErrors.city = "Required";
    if (!form.district.trim()) nextErrors.district = "Required";
    if (!form.postalCode.trim()) nextErrors.postalCode = "Required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = new FormData();
    payload.append("orderId", form.orderId);
    payload.append("reason", form.reason);
    payload.append("accountHolderName", form.accountHolderName);
    payload.append("bankName", form.bankName);
    payload.append("accountNumber", form.accountNumber);
    payload.append("branchName", form.branchName);
    payload.append("ifscOrSwiftCode", form.ifscOrSwiftCode);
    payload.append("fullAddress", form.fullAddress);
    payload.append("city", form.city);
    payload.append("district", form.district);
    payload.append("postalCode", form.postalCode);
    payload.append("comments", form.comments);
    photos.forEach((photo) => payload.append("referencePhotos", photo));

    try {
      setSubmitting(true);
      const response = await api.post("/returns", payload);
      const createdReturn = response.data?.data as ReturnRequest | undefined;
      toast({
        title: "Return request submitted",
        description: "Track the request below while the seller or mechanic reviews it.",
      });
      setForm({
        orderId: "",
        reason: "",
        accountHolderName: "",
        bankName: "",
        accountNumber: "",
        branchName: "",
        ifscOrSwiftCode: "",
        fullAddress: "",
        city: "",
        district: "",
        postalCode: "",
        comments: "",
      });
      setPhotos([]);
      closeForm(false);
      if (createdReturn?._id) {
        setReturns((current) => [createdReturn, ...current.filter((item) => item._id !== createdReturn._id)]);
        setOrders((current) => current.filter((order) => order._id !== createdReturn.order?._id));
        setSearchParams({ returnId: createdReturn._id });
      } else {
        await fetchData();
      }
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error?.response?.data?.message || "Unable to submit the return request.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" className="mb-3 px-0" onClick={() => navigate("/my-orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Orders
          </Button>
          <h1 className="text-2xl font-bold">Return & Claims</h1>
          <p className="text-sm text-muted-foreground">Track pickup, return delivery, and refund progress from one place.</p>
        </div>
        <Button onClick={() => openFormForOrder()}>
          <RotateCcw className="mr-2 h-4 w-4" />
          New Return Request
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Your Return Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && returns.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <RotateCcw className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No returns or claims yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Delivered orders will let you start a return request here.</p>
            </div>
          )}

          {!loading &&
            returns.map((item) => {
              return (
                <div
                  key={item._id}
                  ref={(node) => {
                    returnCardRefs.current[item._id] = node;
                  }}
                  className={`rounded-2xl border bg-background/80 p-5 transition-all ${
                    activeReturnId === item._id
                      ? "border-blue-400 shadow-lg shadow-blue-500/10 ring-2 ring-blue-100"
                      : "border-border"
                  }`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Return #{item._id.slice(-8).toUpperCase()} for Order #{item.order?._id?.slice(-8).toUpperCase()}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">{item.reason}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Requested on {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${RETURN_STATUS_STYLES[item.status] || "bg-muted text-foreground border-border"}`}>
                      {RETURN_STATUS_LABELS[item.status] || item.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                    <ReturnStatusTimeline item={item} />

                    <div className="space-y-4 rounded-xl bg-muted/30 p-4 text-sm">
                      <div>
                        <p className="font-medium">Pickup Address</p>
                        <p className="mt-1 text-muted-foreground">
                          {item.pickupAddress.fullAddress}, {item.pickupAddress.city}, {item.pickupAddress.district} {item.pickupAddress.postalCode}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Refund Account</p>
                        <p className="mt-1 text-muted-foreground">
                          {item.bankDetails.accountHolderName} · {item.bankDetails.bankName}
                        </p>
                        <p className="text-muted-foreground">{item.bankDetails.accountNumber}</p>
                      </div>
                      <div>
                        <p className="font-medium">Return Images</p>
                        <p className="mt-1 text-muted-foreground">
                          {item.referencePhotos.length} uploaded image{item.referencePhotos.length === 1 ? "" : "s"} are shown in the tracking panel.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={closeForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Return Request Form</DialogTitle>
            <DialogDescription>Fill in the required details to submit a return or claim.</DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Order</label>
                <select
                  value={form.orderId}
                  onChange={(event) => setForm((current) => ({ ...current, orderId: event.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select delivered order</option>
                  {eligibleOrders.map((order) => (
                    <option key={order._id} value={order._id}>
                      Order #{order._id.slice(-8).toUpperCase()} · LKR {order.totalAmount.toLocaleString()}
                    </option>
                  ))}
                </select>
                {errors.orderId && <p className="text-xs text-destructive">{errors.orderId}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Return Reason</label>
                <select
                  value={form.reason}
                  onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select reason</option>
                  {RETURN_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
              </div>
            </div>

            {selectedOrder ? (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Selected Order Details</p>
                    <p className="mt-1 font-semibold">Order #{selectedOrder._id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedOrder.createdAt).toLocaleString()} · LKR {selectedOrder.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <span className="w-fit rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Delivered
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={`${item.product}-${item.name}`} className="flex items-center justify-between gap-3 rounded-lg bg-background/70 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate font-medium">{item.name}</span>
                      <span className="shrink-0 text-muted-foreground">Qty {item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Only delivered orders that have not already been returned are eligible.
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Reference Photos</label>
              <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-border p-5 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handlePhotoSelection(event.target.files);
                    event.target.value = "";
                  }}
                />
                <div>
                  <Upload className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload 5 to 8 return images</p>
                  <p className="text-xs text-muted-foreground">{photos.length}/{MAX_RETURN_IMAGES} image(s) selected</p>
                </div>
              </label>
              {errors.referencePhotos && <p className="text-xs text-destructive">{errors.referencePhotos}</p>}
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {photoPreviews.map((preview, index) => (
                    <div key={preview} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                      <img src={preview} alt={`Return preview ${index + 1}`} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Bank Account Details for Refund</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Input placeholder="Account Holder Name" value={form.accountHolderName} onChange={(event) => setForm((current) => ({ ...current, accountHolderName: onlyLetters(event.target.value) }))} />{errors.accountHolderName && <p className="mt-1 text-xs text-destructive">{errors.accountHolderName}</p>}</div>
                <div><Input placeholder="Bank Name" value={form.bankName} onChange={(event) => setForm((current) => ({ ...current, bankName: onlyLetters(event.target.value) }))} />{errors.bankName && <p className="mt-1 text-xs text-destructive">{errors.bankName}</p>}</div>
                <div><Input inputMode="numeric" placeholder="Account Number (8-16 digits)" value={form.accountNumber} onChange={(event) => setForm((current) => ({ ...current, accountNumber: onlyDigits(event.target.value) }))} />{errors.accountNumber && <p className="mt-1 text-xs text-destructive">{errors.accountNumber}</p>}</div>
                <div><Input placeholder="Branch Name" value={form.branchName} onChange={(event) => setForm((current) => ({ ...current, branchName: event.target.value }))} /></div>
                <div className="md:col-span-2"><Input placeholder="IFSC / SWIFT Code" value={form.ifscOrSwiftCode} onChange={(event) => setForm((current) => ({ ...current, ifscOrSwiftCode: event.target.value }))} /></div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Pickup Address</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2"><Input placeholder="Full Address" value={form.fullAddress} onChange={(event) => setForm((current) => ({ ...current, fullAddress: event.target.value }))} />{errors.fullAddress && <p className="mt-1 text-xs text-destructive">{errors.fullAddress}</p>}</div>
                <div><Input placeholder="City" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />{errors.city && <p className="mt-1 text-xs text-destructive">{errors.city}</p>}</div>
                <div><Input placeholder="District" value={form.district} onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))} />{errors.district && <p className="mt-1 text-xs text-destructive">{errors.district}</p>}</div>
                <div className="md:col-span-2"><Input placeholder="PIN Code / Postal Code" value={form.postalCode} onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))} />{errors.postalCode && <p className="mt-1 text-xs text-destructive">{errors.postalCode}</p>}</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                rows={4}
                placeholder="Describe the issue and why you want to return this order"
                value={form.comments}
                onChange={(event) => setForm((current) => ({ ...current, comments: event.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => closeForm(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Return Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyerReturnsClaims;
