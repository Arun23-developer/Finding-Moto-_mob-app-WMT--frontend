import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SellerPlaceholderPage } from "./components/SellerPlaceholderPage";

export default function SellerSettings() {
  return (
    <SellerPlaceholderPage
      title="Settings"
      description="Manage store preferences, account details, and notification rules."
      summary={[
        { label: "Profile", value: "1" },
        { label: "Store", value: "1" },
        { label: "Notifications", value: "1" },
        { label: "Security", value: "1" },
      ]}
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Store Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            Settings controls will appear here.
          </div>
        </CardContent>
      </Card>
    </SellerPlaceholderPage>
  );
}