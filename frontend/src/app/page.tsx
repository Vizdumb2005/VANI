"use client";

import dynamic from "next/dynamic";

const ProductionDashboard = dynamic(() => import("../App"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="flex items-center gap-3 text-secondary font-mono text-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-pastel-green-text animate-pulse"></span>
        <span>Loading VAANI Sovereign Operations Dashboard...</span>
      </div>
    </div>
  ),
});

export default function Page() {
  return <ProductionDashboard />;
}
