import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-black text-accent">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link to="/" className="text-accent underline hover:text-accent/90 font-medium">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
