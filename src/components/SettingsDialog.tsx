import { motion } from "motion/react";
import { 
  Download, 
  Upload, 
  Trash2, 
  LogOut, 
  LogIn 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { User as FirebaseUser } from "firebase/auth";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: FirebaseUser | null;
  profile: { name: string; bio: string };
  setProfile: React.Dispatch<React.SetStateAction<{ name: string; bio: string }>>;
  exportAllData: () => void;
  importData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsRecycleBinOpen: (open: boolean) => void;
  handleLogout: () => void;
  handleGoogleLogin: () => void;
  loginError: string | null;
}

export default function SettingsDialog({
  isOpen,
  onOpenChange,
  user,
  profile,
  setProfile,
  exportAllData,
  importData,
  setIsRecycleBinOpen,
  handleLogout,
  handleGoogleLogin,
  loginError
}: SettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background border-2 border-border p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-foreground">Profile & Settings</DialogTitle>
          <DialogDescription className="text-xs text-foreground uppercase tracking-widest font-bold">
            Customize your experience and manage data
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar scroll-smooth">
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 rounded-2xl border-2 border-border">
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{profile.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">{user?.displayName || "Guest User"}</h3>
                  <p className="text-xs text-foreground font-medium">{user?.email || "Not logged in"}</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-foreground">Display Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-background border-2 border-border rounded-xl text-sm font-bold text-foreground"
                  placeholder="Your name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio" className="text-[10px] font-bold uppercase tracking-widest text-foreground">About You</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  className="bg-background border-2 border-border rounded-xl text-sm min-h-[100px] resize-none font-bold text-foreground"
                  placeholder="Tell us about your exam goals..."
                />
              </div>
            </div>

            <Separator className="bg-border" />

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Data Management</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="h-11 rounded-xl font-bold text-xs uppercase tracking-widest border-2 border-border text-foreground"
                  onClick={exportAllData}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <div className="relative">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <Button 
                    variant="outline" 
                    className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-widest border-2 border-border text-foreground"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start h-11 rounded-xl font-bold text-xs uppercase tracking-widest border-2 border-border text-foreground"
                onClick={() => setIsRecycleBinOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Recycle Bin
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Account</h4>
              {loginError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-3">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">{loginError}</p>
                </div>
              )}
              {user ? (
                <Button 
                  variant="destructive" 
                  className="w-full justify-start h-11 rounded-xl font-bold text-xs uppercase tracking-widest"
                  onClick={() => {
                    handleLogout();
                    onOpenChange(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11 rounded-xl font-bold text-xs uppercase tracking-widest border-2 border-border text-foreground"
                  onClick={() => {
                    handleGoogleLogin();
                    onOpenChange(false);
                  }}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Continue with Google
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 border-t border-border">
          <Button 
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest border-2 border-primary"
            onClick={() => onOpenChange(false)}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
