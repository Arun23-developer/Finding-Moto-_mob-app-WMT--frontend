import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MechanicPlaceholderPage } from "./components/MechanicPlaceholderPage";

export default function MechanicSettings() {
  return (
    <MechanicPlaceholderPage
      title="Settings"
      description="Manage your mechanic account settings and preferences."
      summary={[
        { label: "Profile", value: "Ready" },
        { label: "Security", value: "Ready" },
        { label: "Notifications", value: "Ready" },
        { label: "Preferences", value: "Ready" },
      ]}
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            Settings options will appear here.
          </div>
        </CardContent>
      </Card>
    </MechanicPlaceholderPage>
  );
}
