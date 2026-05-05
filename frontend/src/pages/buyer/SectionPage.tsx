import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

interface SectionPageProps {
  title: string;
  description: string;
}

export default function SectionPage({ title, description }: SectionPageProps) {
  const location = useLocation();
  const accountTab = useMemo(() => new URLSearchParams(location.search).get("tab"), [location.search]);

  const displayContent = useMemo(() => {
    if (location.pathname !== "/buyer/account") {
      return { title, description };
    }

    if (accountTab === "profile") {
      return {
        title: "Profile",
        description: "Manage your buyer profile details and account information.",
      };
    }

    if (accountTab === "settings") {
      return {
        title: "Settings",
        description: "Manage your buyer preferences and account settings.",
      };
    }

    return { title, description };
  }, [accountTab, description, location.pathname, title]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{displayContent.title}</h1>
        <p className="text-sm text-muted-foreground">{displayContent.description}</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">{displayContent.title}</CardTitle>
          <CardDescription>{displayContent.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="dashboard-muted-surface rounded-xl p-8 text-sm text-muted-foreground">
            This section is ready.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
