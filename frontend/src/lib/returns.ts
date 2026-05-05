export const RETURN_REASONS = [
  "Damaged Product",
  "Wrong Product Delivered",
  "Product Quality Issue",
  "Not as Described",
  "Defective Product",
  "Other",
] as const;

export const RETURN_TIMELINE = [
  "RETURN_REQUESTED",
  "RETURN_APPROVED",
  "RETURN_PICKUP_ASSIGNED",
  "RETURN_PICKED_UP",
  "RETURN_DELIVERED",
  "REFUND_INITIATED",
  "REFUND_COMPLETED",
] as const;

export const RETURN_STATUS_LABELS: Record<string, string> = {
  RETURN_REQUESTED: "Return Requested",
  RETURN_APPROVED: "Approved",
  RETURN_REJECTED: "Return Rejected",
  RETURN_PICKUP_ASSIGNED: "Delivery Agent Assigned",
  RETURN_PICKED_UP: "Picked Up",
  RETURN_IN_TRANSIT: "In Transit",
  RETURN_DELIVERED: "Returned to Seller",
  REFUND_INITIATED: "Refund Processing",
  REFUND_COMPLETED: "Refund Completed",
};

export const RETURN_STATUS_STYLES: Record<string, string> = {
  RETURN_REQUESTED: "bg-amber-50 text-amber-700 border-amber-200",
  RETURN_APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  RETURN_REJECTED: "bg-red-50 text-red-700 border-red-200",
  RETURN_PICKUP_ASSIGNED: "bg-cyan-50 text-cyan-700 border-cyan-200",
  RETURN_PICKED_UP: "bg-indigo-50 text-indigo-700 border-indigo-200",
  RETURN_IN_TRANSIT: "bg-violet-50 text-violet-700 border-violet-200",
  RETURN_DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REFUND_INITIATED: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  REFUND_COMPLETED: "bg-green-50 text-green-700 border-green-200",
};

export const NEXT_RETURN_STATUS: Record<string, { status: string; label: string } | null> = {
  RETURN_REQUESTED: null,
  RETURN_APPROVED: null,
  RETURN_REJECTED: null,
  RETURN_PICKUP_ASSIGNED: null,
  RETURN_PICKED_UP: null,
  RETURN_DELIVERED: { status: "REFUND_INITIATED", label: "Initiate Refund" },
  REFUND_INITIATED: { status: "REFUND_COMPLETED", label: "Complete Refund" },
  REFUND_COMPLETED: null,
};

export interface ReturnRequest {
  _id: string;
  order: {
    _id: string;
    items?: { product: string; name: string; price: number; qty: number; image?: string }[];
    totalAmount?: number;
    status?: string;
    shippingAddress?: string;
    paymentMethod?: string;
    createdAt?: string;
  };
  buyer?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postCode?: string;
  };
  seller?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    shopName?: string;
    workshopName?: string;
    role?: string;
  };
  ownerRole?: "seller" | "mechanic";
  assigned_agent_id?: string;
  assigned_agent?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    vehicleType?: string;
    vehicleNumber?: string;
  };
  reason: string;
  referencePhotos: string[];
  bankDetails: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    branchName?: string;
    ifscOrSwiftCode?: string;
  };
  pickupAddress: {
    fullAddress: string;
    city: string;
    district: string;
    postalCode: string;
  };
  comments?: string;
  status: string;
  statusHistory: { status: string; changedAt: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
}
