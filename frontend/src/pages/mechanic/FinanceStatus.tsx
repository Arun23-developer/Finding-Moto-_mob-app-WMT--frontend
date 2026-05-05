import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MechanicPlaceholderPage } from "./components/MechanicPlaceholderPage";

export default function MechanicFinanceStatus() {
  return (
    <MechanicPlaceholderPage
      title="Finance status"
      description="Review current payouts and financial status updates."
      summary={[
        { label: "Pending", value: "0" },
        { label: "Processing", value: "0" },
        { label: "Paid", value: "0" },
        { label: "Disputes", value: "0" },
      ]}
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Finance status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            Finance status details will appear here.
          </div>
        </CardContent>
      </Card>
    </MechanicPlaceholderPage>
  );
}
