import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SellerPlaceholderPage } from "./components/SellerPlaceholderPage";

export default function SellerSupportHelpCenter() {
  return (
    <SellerPlaceholderPage
      title="Support Help Center"
      description="Find help topics and support resources for seller operations."
      summary={[
        { label: "Open Tickets", value: "0" },
        { label: "Guides", value: "0" },
        { label: "FAQs", value: "0" },
        { label: "Escalations", value: "0" },
      ]}
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Support Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            Support resources will appear here.
          </div>
        </CardContent>
      </Card>
    </SellerPlaceholderPage>
  );
}