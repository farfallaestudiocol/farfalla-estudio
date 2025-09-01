import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FolderOpen, 
  Layers,
  Package, 
  Shuffle,
  FileText, 
  Settings, 
  BarChart3,
  ChevronRight,
  Home
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
  const currentPath = location.pathname;

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
                <SidebarMenuButton asChild size="lg" isActive={currentPath === "/admin"}>
                  <Link to="/admin">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-farfalla-teal text-white">
                      <BarChart3 className="size-4" />
                    </div>
                    {!collapsed && <span className="font-semibold">Dashboard</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Product Hierarchy */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-farfalla-ink font-medium">
              Jerarquía de Productos
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {hierarchyItems.map((item) => (
                <Collapsible key={item.title} defaultOpen={isGroupActive(item)}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton 
                        className="w-full justify-between" 
                        isActive={isActive(item.url)}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="size-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </div>
                        {!collapsed && <ChevronRight className="size-4 transition-transform group-data-[state=open]:rotate-90" />}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    
                    {!collapsed && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isActive(subItem.url)}>
                                <Link to={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Site Management */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-farfalla-ink font-medium">
              Gestión del Sitio
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="size-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
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
                <SidebarMenuButton asChild>
                  <Link to="/">
                    <Home className="size-4" />
                    {!collapsed && <span>Volver al Sitio</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}