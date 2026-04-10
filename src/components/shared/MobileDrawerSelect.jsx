/**
 * On mobile: renders a bottom-sheet Drawer with options.
 * On desktop: falls back to the standard shadcn Select.
 */
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function MobileDrawerSelect({ value, onValueChange, placeholder, options, className, triggerClassName }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const selected = options.find(o => (o.value ?? o) === value);
  const displayLabel = selected ? (selected.label ?? selected) : (placeholder || 'Select…');

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn('bg-secondary border-border', triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {options.map(opt => {
            const v = opt.value ?? opt;
            const l = opt.label ?? opt;
            return <SelectItem key={v} value={v}>{l}</SelectItem>;
          })}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-secondary px-3 py-2 text-sm shadow-sm',
          'text-left',
          !value && 'text-muted-foreground',
          triggerClassName
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-card border-border">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-sm text-muted-foreground">{placeholder || 'Select option'}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-1 overflow-y-auto max-h-[50vh]">
            {options.map(opt => {
              const v = opt.value ?? opt;
              const l = opt.label ?? opt;
              const isSelected = v === value;
              return (
                <button
                  key={v}
                  onClick={() => { onValueChange(v); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors',
                    isSelected ? 'bg-primary/15 text-primary font-medium' : 'text-foreground hover:bg-secondary'
                  )}
                >
                  {l}
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}