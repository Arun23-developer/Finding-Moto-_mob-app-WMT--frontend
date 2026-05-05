import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const AdminNotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent admin route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Admin page not found</p>
        <a href="/admin" className="text-primary underline hover:text-primary/90">
          Return to Admin Dashboard
        </a>
      </div>
    </div>
  );
};

export default AdminNotFound;
