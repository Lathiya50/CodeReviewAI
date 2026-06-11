import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { Header } from "@/components/header";
import { SessionGuard } from "@/components/session-guard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-dot opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.03] rounded-full blur-3xl" />
      </div>

      <SessionGuard />
      <Header user={session.user} />

      {/* The single app-level scroll region */}
      <main
        id="app-scroll"
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
