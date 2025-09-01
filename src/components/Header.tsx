import { useState, useEffect } from "react";
import { Search, ShoppingCart, User, Menu, X, LogOut, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cartCount] = useState(3); // Mock cart count
  const [categories, setCategories] = useState<Category[]>([]);
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id, name, slug')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (categoriesData) {
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Split categories for responsive display
  const visibleCategories = categories.slice(0, 4);
  const hiddenCategories = categories.slice(4);

  return (
    <header className="bg-background border-b border-border/50 sticky top-0 z-50 backdrop-blur-lg bg-background/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src="/lovable-uploads/f9953d83-e6cc-4f4f-85ac-c7a1f7220021.png" 
              alt="Farfalla Estudio - Manualidades en papel personalizadas"
              className="h-12 md:h-16 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {visibleCategories.map((category) => (
              <a
                key={category.id}
                href={`/categoria/${category.slug}`}
                className="text-muted-foreground hover:text-primary font-inter font-medium transition-colors duration-200"
              >
                {category.name}
              </a>
            ))}
            {hiddenCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-muted-foreground hover:text-primary font-inter font-medium p-0 h-auto">
                    Más <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-50 bg-background">
                  {hiddenCategories.map((category) => (
                    <DropdownMenuItem key={category.id} asChild>
                      <a href={`/categoria/${category.slug}`} className="w-full">
                        {category.name}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* Search Bar - Desktop only */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Buscar productos..."
                className="farfalla-input pl-10 w-full"
              />
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            {/* Search Icon - Mobile & Tablet */}
            <DropdownMenu open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Search className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="Buscar productos..."
                    className="farfalla-input pl-10 w-full"
                    autoFocus
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Account */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-farfalla-ink hover:text-primary">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">{profile?.full_name || "Usuario"}</div>
                    <div className="text-muted-foreground">{user.email}</div>
                  </div>
                  <DropdownMenuSeparator />
                  {profile?.role === 'admin' && (
                    <>
                      <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
                        <Settings className="mr-2 h-4 w-4" />
                        Panel Admin
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-farfalla-ink hover:text-primary"
                onClick={() => window.location.href = '/auth'}
              >
                <User className="h-5 w-5" />
              </Button>
            )}

            {/* Shopping Cart */}
            <Button variant="ghost" size="icon" className="relative text-farfalla-ink hover:text-primary">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-farfalla-pink text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-poppins font-medium">
                  {cartCount}
                </span>
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-farfalla-ink"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="Buscar productos..."
              className="farfalla-input pl-10 w-full"
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-t border-border/50">
          <div className="px-4 py-4 space-y-3">
            {categories.map((category) => (
              <a
                key={category.id}
                href={`/categoria/${category.slug}`}
                className="block text-muted-foreground hover:text-primary font-inter font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {category.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;