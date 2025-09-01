import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { Menu } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { profile } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-farfalla-section-gradient">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-border">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
              <SidebarTrigger className="p-2">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              
              <div className="flex-1" />
              
              <div className="flex items-center gap-4">
                <Badge className="farfalla-badge-nuevo">
                  Administrador
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {profile?.full_name || profile?.email}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}