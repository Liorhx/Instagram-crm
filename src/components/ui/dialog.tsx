import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  return (
    <DialogContext.Provider value={{ open: isOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ asChild, children, ...props }: any) {
  const ctx = React.useContext(DialogContext);
  return (
    <div onClick={() => ctx?.setOpen(true)} className="inline-block cursor-pointer" {...props}>
      {children}
    </div>
  );
}

export function DialogContent({ className, children, ...props }: any) {
  const ctx = React.useContext(DialogContext);
  if (!ctx?.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => ctx.setOpen(false)}
      />
      <div
        className={cn(
          "relative z-50 w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl animate-in fade-in-0 zoom-in-95",
          className
        )}
        {...props}
      >
        {children}
        <button
          onClick={() => ctx.setOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: any) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: any) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: any) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: any) {
  return <p className={cn("text-sm text-zinc-500", className)} {...props} />;
}
