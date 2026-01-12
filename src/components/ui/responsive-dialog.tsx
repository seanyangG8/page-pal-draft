import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface ResponsiveDialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogBodyProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

const ResponsiveDialogContext = React.createContext<{ isMobile: boolean }>({
  isMobile: false,
});

export function ResponsiveDialog({
  open,
  onOpenChange,
  children,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();
  const scrollYRef = React.useRef(0);

  // iOS-correct body scroll lock: position fixed + restore scrollY
  React.useEffect(() => {
    if (!isMobile) return;
    if (!open) return;

    scrollYRef.current = window.scrollY;
    const previousStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      overflow: document.body.style.overflow,
    };

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = previousStyles.position;
      document.body.style.top = previousStyles.top;
      document.body.style.left = previousStyles.left;
      document.body.style.right = previousStyles.right;
      document.body.style.overflow = previousStyles.overflow;
      window.scrollTo(0, scrollYRef.current);
    };
  }, [open, isMobile]);

  if (isMobile) {
    return (
      <ResponsiveDialogContext.Provider value={{ isMobile: true }}>
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      </ResponsiveDialogContext.Provider>
    );
  }

  return (
    <ResponsiveDialogContext.Provider value={{ isMobile: false }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    </ResponsiveDialogContext.Provider>
  );
}

export function ResponsiveDialogContent({
  className,
  children,
}: ResponsiveDialogContentProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <DrawerContent className={cn("flex flex-col overflow-hidden", className)}>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {children}
        </div>
      </DrawerContent>
    );
  }

  return (
    <DialogContent className={cn("sm:max-w-md max-h-[90vh] overflow-y-auto", className)}>
      {children}
    </DialogContent>
  );
}

export function ResponsiveDialogHeader({
  className,
  children,
}: ResponsiveDialogHeaderProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <DrawerHeader className={cn("flex-shrink-0 px-4 pt-0 pb-2", className)}>
        {children}
      </DrawerHeader>
    );
  }

  return <DialogHeader className={className}>{children}</DialogHeader>;
}

export function ResponsiveDialogTitle({
  className,
  children,
}: ResponsiveDialogTitleProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <DrawerTitle className={cn("text-lg", className)}>
        {children}
      </DrawerTitle>
    );
  }

  return <DialogTitle className={className}>{children}</DialogTitle>;
}

export function ResponsiveDialogDescription({
  className,
  children,
}: ResponsiveDialogDescriptionProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return <DrawerDescription className={className}>{children}</DrawerDescription>;
  }

  return <DialogDescription className={className}>{children}</DialogDescription>;
}

export function ResponsiveDialogBody({
  className,
  children,
}: ResponsiveDialogBodyProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <div className={cn("flex-1 min-h-0 overflow-y-auto ios-scroll px-4", className)}>
        {children}
      </div>
    );
  }

  return <div className={cn("py-4", className)}>{children}</div>;
}

export function ResponsiveDialogFooter({
  className,
  children,
}: ResponsiveDialogFooterProps) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <div className={cn("flex-shrink-0 flex flex-col gap-2 px-4 pt-3 pb-4 pb-safe border-t border-border/50 bg-background", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4", className)}>
      {children}
    </div>
  );
}
