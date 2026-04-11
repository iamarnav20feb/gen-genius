import { 
  RefreshCw, 
  Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Chat {
  id: string;
  title: string;
  deletedAt?: number;
}

interface RecycleBinDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deletedChats: Chat[];
  restoreChat: (id: string) => void;
  permanentlyDeleteChat: (id: string) => void;
}

export default function RecycleBinDialog({
  isOpen,
  onOpenChange,
  deletedChats,
  restoreChat,
  permanentlyDeleteChat
}: RecycleBinDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background border-2 border-border max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-foreground">Recycle Bin</DialogTitle>
          <DialogDescription className="text-xs text-foreground uppercase tracking-widest font-bold">
            Deleted chats are kept for 48 hours
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-2 custom-scrollbar scroll-smooth">
          {deletedChats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-foreground/50 font-bold uppercase tracking-widest">Recycle bin is empty</p>
            </div>
          ) : (
            deletedChats.map(chat => (
              <div key={chat.id} className="flex items-center justify-between p-3 rounded-xl bg-muted border border-border">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-xs font-bold truncate text-foreground">{chat.title}</p>
                  <p className="text-[9px] text-foreground/50 font-bold uppercase">
                    Deleted {new Date(chat.deletedAt!).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger render={
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg hover:bg-green-500 hover:text-white"
                          onClick={() => restoreChat(chat.id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      } />
                      <TooltipContent>Restore</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger render={
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg hover:bg-red-500 hover:text-white"
                          onClick={() => permanentlyDeleteChat(chat.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      } />
                      <TooltipContent>Delete Permanently</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="p-6 pt-2 border-t border-border">
          <Button 
            className="w-full h-11 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-widest border-2 border-black dark:border-white"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
