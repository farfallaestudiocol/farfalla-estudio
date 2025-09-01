
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
                <Collapsible key={item.title} defaultOpen={isGroupActive(item)}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger className="w-full">
                      <SidebarMenuButton 
                        className="w-full justify-between" 
                        isActive={isActive(item.url)}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="size-4" />
                          <span className={collapsed ? 'hidden' : ''}>{item.title}</span>
                        </div>
                        <ChevronRight className={`size-4 transition-transform group-data-[state=open]:rotate-90 ${collapsed ? 'hidden' : ''}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className={collapsed ? 'hidden' : ''}>
                      <SidebarMenuSub>
                        {item.children.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton 
                              isActive={isActive(subItem.url)}
                              onClick={() => navigate(subItem.url)}
                            >
                              <span>{subItem.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
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
                    onClick={() => navigate(item.url)}
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
