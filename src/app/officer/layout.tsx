"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/hooks/useAppState";

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  const { role, hydrated } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && role !== "officer") {
      router.replace("/login");
    }
  }, [hydrated, role, router]);

  if (!hydrated || role !== "officer") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-sky)] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
