import { Card, CardContent } from "@/components/ui/card";

export default function DeliverySettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage delivery agent preferences and account options.
        </p>
      </div>

      <Card className="glass-card">
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="font-medium">Settings page is ready.</p>
          <p className="mt-1 text-xs">
            Delivery settings can be added here using the current dashboard components.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
