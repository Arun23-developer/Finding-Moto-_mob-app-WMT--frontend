import { ReturnsClaimsManager } from "@/components/returns/ReturnsClaimsManager";

export default function SellerReturnsClaims() {
  return (
    <ReturnsClaimsManager
      role="seller"
      title="Returns & Claims"
      description="Review buyer return requests, approve or reject them, assign pickup, and complete refunds."
    />
  );
}
