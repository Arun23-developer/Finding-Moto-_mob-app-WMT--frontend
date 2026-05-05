import { ReturnsClaimsManager } from "@/components/returns/ReturnsClaimsManager";

export default function MechanicReturnsClaims() {
  return (
    <ReturnsClaimsManager
      role="mechanic"
      title="Returns & Claims"
      description="Review buyer return requests, approve or reject them, and progress pickup and refund stages."
    />
  );
}
