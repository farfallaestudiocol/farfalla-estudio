
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
  ShoppingCart
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
    url: "categories",
    icon: FolderOpen,
    children: [
      { title: "Ver todas", url: "categories" },
      { title: "Agregar categoría", url: "categories/new" },
    ]
  },
  {
    title: "Subcategorías", 
    url: "subcategories",
    icon: Layers,
    children: [
      { title: "Ver todas", url: "subcategories" },
      { title: "Agregar subcategoría", url: "subcategories/new" },
    ]
  },
  {
    title: "Productos",
    url: "products", 
    icon: Package,
    children: [
      { title: "Ver todos", url: "products" },
      { title: "Agregar producto", url: "products/new" },
    ]
  },
  {
    title: "Variantes",
    url: "variants",
    icon: Shuffle, 
    children: [
      { title: "Ver todas", url: "variants" },
      { title: "Agregar variante", url: "variants/new" },
    ]
  }
];

const managementItems = [
  {
    title: "Órdenes",
    url: "orders",
    icon: ShoppingCart
  },
  {
    title: "Contenido del Sitio",
    url: "content",
    icon: FileText
  },
  {
    title: "Configuración", 
    url: "settings",
    icon: Settings
  }
];

export function AdminSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  
  console.log('Current path:', currentPath);

  const isActive = (path: string) => {
    if (path === "dashboard" || path === "") return currentPath === "/admin";
    return currentPath === `/admin/${path}` || currentPath.startsWith(`/admin/${path}/`);
  };
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
                  onClick={() => navigate("")}
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
                    onClick={(e) => {
                      console.log('Navegando a:', item.url);
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(item.url);
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
                    onClick={(e) => {
                      console.log('Navegando a:', item.url);
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(item.url);
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
