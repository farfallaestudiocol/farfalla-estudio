import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';
import { formatPrice } from '@/lib/pricing';
import type { CartItem } from '@/hooks/useCart';

interface CartItemCardProps {
  item: CartItem;
  currency: string;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onPersonalizationChange: (itemId: string, notes: string) => void;
}

export function CartItemCard({ item, currency, onQuantityChange, onRemove, onPersonalizationChange }: CartItemCardProps) {
  const [notes, setNotes] = useState(item.personalization_notes ?? '');
  const unitPrice = item.variant?.price || item.product.price;

  const saveNotesIfChanged = () => {
    if (notes !== (item.personalization_notes ?? '')) onPersonalizationChange(item.id, notes);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Link to={`/producto/${item.product.slug}`} className="flex-shrink-0">
            <img
              src={item.product.images[0] ? convertGoogleDriveUrlToBase64(item.product.images[0]) : '/placeholder.svg'}
              alt={item.product.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
          </Link>

          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <Link to={`/producto/${item.product.slug}`} className="hover:text-farfalla-teal transition-colors">
                <h3 className="font-poppins font-semibold text-farfalla-ink truncate">{item.product.name}</h3>
              </Link>
              {item.variant && <p className="text-sm text-muted-foreground">Variante: {item.variant.name}</p>}
              {item.theme && <p className="text-sm text-muted-foreground">Tema: {item.theme.name}</p>}
              <p className="text-lg font-poppins font-semibold text-farfalla-ink">{formatPrice(unitPrice, currency)}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">Personalización:</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotesIfChanged}
                placeholder="Detalles de personalización..."
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center border border-border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="h-8 w-8 rounded-r-none"
                aria-label="Disminuir cantidad"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="px-3 py-1 text-sm font-medium min-w-12 text-center">{item.quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                className="h-8 w-8 rounded-l-none"
                aria-label="Aumentar cantidad"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="text-right">
              <p className="font-poppins font-semibold text-farfalla-ink">{formatPrice(unitPrice * item.quantity, currency)}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(item.id)}
                className="text-red-500 hover:text-red-700 h-8 w-8"
                aria-label="Eliminar producto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
