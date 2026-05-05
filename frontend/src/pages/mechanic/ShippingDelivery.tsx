import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MechanicPlaceholderPage } from "./components/MechanicPlaceholderPage";

export default function MechanicShippingDelivery() {
  return (
    <MechanicPlaceholderPage
      title="Shipping & Delivery"
      description="Track shipping progress and delivery updates for your workshop orders."
      summary={[
        { label: "Ready to Ship", value: "0" },
        { label: "In Transit", value: "0" },
        { label: "Delivered", value: "0" },
        { label: "Issues", value: "0" },
      ]}
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Shipping & Delivery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            Shipping and delivery details will appear here.
          </div>
        </CardContent>
      </Card>
    </MechanicPlaceholderPage>
  );
}
