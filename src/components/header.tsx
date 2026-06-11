"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart2, Code2, FolderGit2, GitPullRequest } from "lucide-react";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
}

interface HeaderProps {
  user: User;
}

const navItems = [
  { href: "/repos", label: "Repositories", shortLabel: "Repos", icon: FolderGit2 },
  { href: "/reviews", label: "Reviews", shortLabel: "Reviews", icon: GitPullRequest },
  { href: "/analytics", label: "Analytics", shortLabel: "Analytics", icon: BarChart2 },
];

function useActive(pathname: string) {
  return (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const isActive = useActive(pathname);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll on the app-shell scroll region (not the window, since the
  // shell uses overflow-hidden on the body and an internal scroll container).
  useEffect(() => {
    const el = document.getElementById("app-scroll");
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 8);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "z-50 w-full shrink-0 border-b transition-all duration-300",
          scrolled
            ? "border-border bg-background/95 backdrop-blur-xl shadow-sm"
            : "border-border/50 bg-background/60 backdrop-blur-md",
        )}
      >
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/repos" className="flex items-center gap-2 group shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30 group-hover:ring-primary/60 transition-all duration-200">
                <Code2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="hidden sm:block font-semibold text-sm tracking-tight">
                CodeReview<span className="text-gradient">AI</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                    {active && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-md bg-primary/10 ring-1 ring-primary/25 -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
            <UserMenu user={user} />
          </div>
        </div>
      </motion.header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
        <div className="flex items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon className="h-5 w-5 shrink-0" />
                {item.shortLabel}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
