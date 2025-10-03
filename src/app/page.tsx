"use client";

import { useAuth } from "@/hooks/use-auth";
import { AuthPage } from "@/components/auth-page";
import { Dashboard } from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { userId, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {userId ? <Dashboard /> : <AuthPage />}
    </main>
  );
}
