"use client";

import dynamic from "next/dynamic";
import { AuthProvider } from "../auth";

const ProductionDashboard = dynamic(() => import("../App"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="flex items-center gap-3 text-secondary font-mono text-xs" role="status" aria-live="polite">
        <span className="w-2.5 h-2.5 rounded-full bg-pastel-green-text animate-pulse" aria-hidden="true"></span>
        <span>Loading VAANI Sovereign Operations Dashboard...</span>
      </div>
    </div>
  ),
});

export default function Page() {
  return (
    <AuthProvider>
      <ProductionDashboard />
    </AuthProvider>
  );
}
