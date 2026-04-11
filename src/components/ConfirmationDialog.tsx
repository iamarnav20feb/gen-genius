import { Button } from "@/components/ui/button";
import {
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  message: string;
  onConfirm: () => void;
  confirmText: string;
  variant?: "default" | "destructive" | "amber";
}

export default function ConfirmationDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  message,
  onConfirm,
  confirmText,
  variant = "default"
}: ConfirmationDialogProps) {
  const getButtonClass = () => {
    switch (variant) {
      case "destructive":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "amber":
        return "bg-amber-600 hover:bg-amber-700 text-white";
      default:
        return "bg-primary text-primary-foreground hover:bg-primary/90";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-background border-2 border-border">
        <DialogHeader>
          <DialogTitle className={`text-xl font-bold text-foreground ${variant === 'destructive' ? 'text-red-600' : ''}`}>{title}</DialogTitle>
          <DialogDescription className="text-xs text-foreground uppercase tracking-widest font-bold">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-foreground/70 font-medium">
            {message}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            className="rounded-xl font-bold text-xs uppercase tracking-widest border-2 border-border"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            className={`rounded-xl font-bold text-xs uppercase tracking-widest ${getButtonClass()}`}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
