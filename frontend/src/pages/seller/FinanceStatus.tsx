import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SellerPlaceholderPage } from "./components/SellerPlaceholderPage";

export default function SellerFinanceStatus() {
  return (
    <SellerPlaceholderPage
      title="Finance Status"
      description="Monitor payouts, balances, and order settlement activity."
      summary={[
        { label: "Pending Payouts", value: "0" },
        { label: "Available Balance", value: "0" },
        { label: "Settled Orders", value: "0" },
        { label: "Adjustments", value: "0" },
      ]}
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Finance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            Finance details will appear here.
          </div>
        </CardContent>
      </Card>
    </SellerPlaceholderPage>
  );
}