import { Card, CardContent } from "@/components/ui/card";

export default function DeliverySupportHelpCenterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support / Help Center</h1>
        <p className="text-sm text-muted-foreground">
          Find delivery workflow help and support guidance here.
        </p>
      </div>

      <Card className="glass-card">
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="font-medium">Support / Help Center page is ready.</p>
          <p className="mt-1 text-xs">
            Help resources can be added here without changing the existing theme.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
