
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FolderOpen, 
  Layers,
  Package, 
  Shuffle,
  FileText, 
  Settings, 
  BarChart3,
  ChevronRight,
  Home,
  ShoppingCart,
  Palette,
  Monitor
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const hierarchyItems = [
  {
    title: "Categorías",
    url: "/admin/categories",
    icon: FolderOpen,
    children: [
      { title: "Ver todas", url: "/admin/categories" },
      { title: "Agregar categoría", url: "/admin/categories/new" },
    ]
  },
  {
    title: "Subcategorías", 
    url: "/admin/subcategories",
    icon: Layers,
    children: [
      { title: "Ver todas", url: "/admin/subcategories" },
      { title: "Agregar subcategoría", url: "/admin/subcategories/new" },
    ]
  },
  {
    title: "Productos",
    url: "/admin/products", 
    icon: Package,
    children: [
      { title: "Ver todos", url: "/admin/products" },
      { title: "Agregar producto", url: "/admin/products/new" },
    ]
  },
  {
    title: "Variantes",
    url: "/admin/variants",
    icon: Shuffle, 
    children: [
      { title: "Ver todas", url: "/admin/variants" },
      { title: "Agregar variante", url: "/admin/variants/new" },
    ]
  }
];

const managementItems = [
  {
    title: "Órdenes",
    url: "/admin/orders",
    icon: ShoppingCart
  },
  {
    title: "Branding",
    url: "/admin/branding",
    icon: Palette
  },
  {
    title: "Banner Principal",
    url: "/admin/banner",
    icon: Monitor
  },
  {
    title: "Contenido del Sitio",
    url: "/admin/content",
    icon: FileText
  },
  {
    title: "Configuración", 
    url: "/admin/settings",
    icon: Settings
  }
];

export function AdminSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  
  console.log('Current path:', currentPath);

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');
  const isGroupActive = (item: any) => 
    isActive(item.url) || item.children?.some((child: any) => isActive(child.url));

  const collapsed = state === "collapsed";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-white border-r border-border">
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  size="lg" 
                  isActive={currentPath === "/admin"}
                  onClick={() => navigate("/admin")}
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-farfalla-teal text-white">
                    <BarChart3 className="size-4" />
                  </div>
                  <span className={`font-semibold ${collapsed ? 'hidden' : ''}`}>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Product Hierarchy */}
        <SidebarGroup>
          <SidebarGroupLabel className={`text-farfalla-ink font-medium ${collapsed ? 'hidden' : ''}`}>
            Jerarquía de Productos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {hierarchyItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={isActive(item.url)}
                    onClick={() => {
                      console.log('Navegando a:', item.url);
                      try {
                        navigate(item.url);
                      } catch (error) {
                        console.error('Navigate failed:', error);
                        window.location.href = item.url;
                      }
                      setOpenMobile(false);
                    }}
                  >
                    <item.icon className="size-4" />
                    <span className={collapsed ? 'hidden' : ''}>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Site Management */}
        <SidebarGroup>
          <SidebarGroupLabel className={`text-farfalla-ink font-medium ${collapsed ? 'hidden' : ''}`}>
            Gestión del Sitio
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    isActive={isActive(item.url)}
                    onClick={() => {
                      console.log('Navegando a:', item.url);
                      if (item.title === 'Órdenes') {
                        // Forzar navegación directa para órdenes
                        window.location.href = item.url;
                      } else {
                        try {
                          navigate(item.url);
                        } catch (error) {
                          console.error('Navigate failed:', error);
                          window.location.href = item.url;
                        }
                      }
                      setOpenMobile(false);
                    }}
                  >
                    <item.icon className="size-4" />
                    <span className={collapsed ? 'hidden' : ''}>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Back to Site */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/")}>
                  <Home className="size-4" />
                  <span className={collapsed ? 'hidden' : ''}>Volver al Sitio</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
