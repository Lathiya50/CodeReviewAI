"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
}

function getInitials(name: string, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0]?.toUpperCase() || "U";
}

export function UserMenu({ user }: { user: User }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/5 transition-colors outline-none">
          <Avatar className="h-7 w-7 ring-1 ring-border/50">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="text-[10px] font-semibold bg-primary/15 text-primary">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
            {user.name}
          </span>
          <ChevronDown className="hidden sm:block h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive gap-2 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
