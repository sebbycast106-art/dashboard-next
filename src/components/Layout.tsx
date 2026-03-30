"use client";

import Sidebar from "@/components/Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111827]">
      <Sidebar />
      <main className="lg:ml-60 p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
