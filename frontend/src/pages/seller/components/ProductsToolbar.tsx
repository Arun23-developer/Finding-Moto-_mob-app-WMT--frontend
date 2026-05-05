import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

interface ProductsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAddProduct: () => void;
}

export function ProductsToolbar({ search, onSearchChange, onAddProduct }: ProductsToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between transition-all duration-300">
      <div className="relative flex-1 group">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search product name, brand, SKU or category..."
          className="w-full h-11 rounded-xl border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all placeholder:text-muted-foreground/60"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button 
          type="button" 
          onClick={onAddProduct}
          className="h-11 rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 px-6"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </Button>
      </div>
    </div>
  );
}
