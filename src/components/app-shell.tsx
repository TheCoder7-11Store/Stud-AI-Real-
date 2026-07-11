import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { LogIn, LogOut, MessageSquarePlus, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import {
  useLocalThreads,
  useHydrated,
  deleteLocalThread,
} from "@/lib/threads-store";
import { deleteThread, listThreads } from "@/lib/threads.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const hydrated = useHydrated();
  const localThreads = useLocalThreads();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const cloud = useQuery({
    queryKey: ["threads", user?.id],
    queryFn: () => listThreads(),
    enabled: !!user,
    staleTime: 10_000,
  });

  const threads = user
    ? (cloud.data ?? []).map((t) => ({ id: t.id, title: t.title, updatedAt: t.updated_at }))
    : hydrated
      ? localThreads.map((t) => ({ id: t.id, title: t.title, updatedAt: t.updatedAt }))
      : [];

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const removeThread = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      try {
        await deleteThread({ data: { id } });
        qc.invalidateQueries({ queryKey: ["threads", user.id] });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete");
        return;
      }
    } else {
      deleteLocalThread(id);
    }
    if (activeId === id) navigate({ to: "/" });
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeId]);

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform sm:static sm:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0",
        )}
      >
        <div className="flex items-center gap-2 px-4 pb-2 pt-4">
          <img src={logo} alt="" width={28} height={28} className="rounded-md" />
          <span className="text-sm font-semibold tracking-tight">Stud AI</span>
        </div>

        <div className="px-3 pt-3">
          <Link to="/">
            <Button variant="secondary" className="w-full justify-start gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              New chat
            </Button>
          </Link>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto px-2 pb-2">
          {!user && !hydrated ? null : threads.length === 0 ? (
            <p className="px-3 py-6 text-xs text-muted-foreground">
              No chats yet. Start a conversation below.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {threads.map((t) => (
                <li key={t.id}>
                  <div
                    className={cn(
                      "group flex items-center rounded-md text-sm transition-colors",
                      activeId === t.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent/60",
                    )}
                  >
                    <Link
                      to="/chat/$threadId"
                      params={{ threadId: t.id }}
                      className="flex-1 truncate px-3 py-2"
                    >
                      {t.title || "New chat"}
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => removeThread(t.id, e)}
                      className="mr-1 rounded p-1.5 text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t p-3">
          {loading ? null : user ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{user.email}</p>
                <p className="text-[10px] text-muted-foreground">Synced across devices</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={signOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/auth" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <LogIn className="h-4 w-4" />
                Sign in to sync
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-2 sm:hidden">
          <button
            className="rounded-md p-2 hover:bg-accent"
            onClick={() => setSidebarOpen((s) => !s)}
            aria-label="Toggle chats"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="" width={22} height={22} className="rounded" />
            <span className="text-sm font-semibold">Stud AI</span>
          </div>
          <div className="w-9" />
        </header>
        {children}
      </main>
    </div>
  );
}