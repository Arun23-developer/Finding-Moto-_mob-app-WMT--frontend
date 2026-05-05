import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MechanicPlaceholderPage } from "./components/MechanicPlaceholderPage";

export default function MechanicSupportHelpCenter() {
  return (
    <MechanicPlaceholderPage
      title="Support / Help Center"
      description="Access support resources and workshop help information."
      summary={[
        { label: "Open Tickets", value: "0" },
        { label: "Updates", value: "0" },
        { label: "Guides", value: "0" },
        { label: "Resolved", value: "0" },
      ]}
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Support / Help Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            Help center content will appear here.
          </div>
        </CardContent>
      </Card>
    </MechanicPlaceholderPage>
  );
}
