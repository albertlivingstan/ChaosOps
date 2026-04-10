/**
 * On mobile: renders content as a bottom-sheet Drawer.
 * On desktop: renders as a standard Dialog.
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

export default function MobileDrawerDialog({ open, onOpenChange, title, icon, children, footer }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-card border-border text-foreground">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2 text-base">{icon}{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2 overflow-y-auto max-h-[65vh]">
            {children}
          </div>
          {footer && (
            <DrawerFooter className="border-t border-border pt-3">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{icon}{title}</DialogTitle>
        </DialogHeader>
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}