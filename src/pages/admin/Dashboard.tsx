import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  FolderOpen, 
  FileText, 
  Settings, 
  Users, 
  BarChart3,
  Plus,
  Eye,
  Edit
} from 'lucide-react';

const Dashboard = () => {
  const { profile } = useAuth();
  const [counts, setCounts] = useState({
    products: 0,
    categories: 0,
    content: 0,
    settings: 0
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [productsResult, categoriesResult, contentResult, settingsResult] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true }),
          supabase.from('site_content').select('id', { count: 'exact', head: true }),
          supabase.from('site_settings').select('id', { count: 'exact', head: true })
        ]);

        setCounts({
          products: productsResult.count || 0,
          categories: categoriesResult.count || 0,
          content: contentResult.count || 0,
          settings: settingsResult.count || 0
        });
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
  }, []);

  const adminCards = [
    {
      title: 'Productos',
      description: 'Gestionar productos y su información',
      icon: <Package className="h-8 w-8" />,
      href: '/admin/products',
      color: 'bg-farfalla-teal/10 text-farfalla-teal',
      count: counts.products.toString(),
      actions: [
        { label: 'Ver todos', href: '/admin/products', icon: <Eye className="h-4 w-4" /> },
        { label: 'Agregar', href: '/admin/products/new', icon: <Plus className="h-4 w-4" /> }
      ]
    },
    {
      title: 'Categorías',
      description: 'Administrar categorías de productos',
      icon: <FolderOpen className="h-8 w-8" />,
      href: '/admin/categories',
      color: 'bg-farfalla-pink/10 text-farfalla-pink',
      count: counts.categories.toString(),
      actions: [
        { label: 'Ver todas', href: '/admin/categories', icon: <Eye className="h-4 w-4" /> },
        { label: 'Agregar', href: '/admin/categories/new', icon: <Plus className="h-4 w-4" /> }
      ]
    },
    {
      title: 'Contenido del Sitio',
      description: 'Editar secciones y contenido de la página',
      icon: <FileText className="h-8 w-8" />,
      href: '/admin/content',
      color: 'bg-primary/10 text-primary',
      count: counts.content.toString(),
      actions: [
        { label: 'Ver contenido', href: '/admin/content', icon: <Eye className="h-4 w-4" /> },
        { label: 'Editar', href: '/admin/content', icon: <Edit className="h-4 w-4" /> }
      ]
    },
    {
      title: 'Configuración',
      description: 'Ajustes generales del sitio web',
      icon: <Settings className="h-8 w-8" />,
      href: '/admin/settings',
      color: 'bg-muted text-muted-foreground',
      count: counts.settings.toString(),
      actions: [
        { label: 'Ver configuración', href: '/admin/settings', icon: <Settings className="h-4 w-4" /> }
      ]
    }
  ];

  const stats = [
    { label: 'Productos Activos', value: counts.products.toString(), change: '+3 este mes' },
    { label: 'Categorías', value: counts.categories.toString(), change: 'Sin cambios' },
    { label: 'Secciones de Contenido', value: counts.content.toString(), change: '+2 actualizadas' },
    { label: 'Configuraciones', value: counts.settings.toString(), change: '5 modificadas' }
  ];

  return (
    <div className="min-h-screen farfalla-section-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
                Panel de Administración
              </h1>
              <p className="text-muted-foreground mt-2">
                Bienvenido/a, {profile?.full_name || profile?.email}
              </p>
            </div>
            <Badge className="farfalla-badge-nuevo">
              Administrador
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="farfalla-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-farfalla-ink">
                      {stat.value}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-farfalla-teal/60" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {adminCards.map((card, index) => (
            <Card key={index} className="farfalla-card hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl ${card.color}`}>
                      {card.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-poppins text-farfalla-ink">
                        {card.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {card.description}
                        </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {card.count}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {card.actions.map((action, actionIndex) => (
                    <Button
                      key={actionIndex}
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Link to={action.href}>
                        {action.icon}
                        {action.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="farfalla-card">
            <CardHeader>
              <CardTitle className="text-xl font-poppins text-farfalla-ink">
                Acciones Rápidas
              </CardTitle>
              <CardDescription>
                Herramientas de administración más utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button asChild className="farfalla-btn-primary">
                  <Link to="/admin/products/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Producto
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin/categories/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Categoría
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin/content">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Contenido
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Sitio Web
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;