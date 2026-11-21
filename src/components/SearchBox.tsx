import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBoxProps {
  autoFocus?: boolean;
  onSearch?: () => void;
}

// Caja de búsqueda: al enviar (Enter) lleva a /buscar?q=...
const SearchBox = ({ autoFocus, onSearch }: SearchBoxProps) => {
  const navigate = useNavigate();
  const [value, setValue] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    navigate(`/buscar?q=${encodeURIComponent(q)}`);
    onSearch?.();
  };

  return (
    <form onSubmit={submit} role="search" className="relative w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="search"
        enterKeyHint="search"
        placeholder="Buscar productos..."
        className="farfalla-input pl-10 w-full"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus={autoFocus}
        aria-label="Buscar productos"
      />
    </form>
  );
};

export default SearchBox;
