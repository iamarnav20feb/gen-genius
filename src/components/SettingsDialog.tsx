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
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: FirebaseUser | null;
  profile: { name: string; email: string; bio: string; photoURL?: string };
  setProfile: React.Dispatch<React.SetStateAction<{ name: string; email: string; bio: string; photoURL?: string }>>;
  exportAllData: () => void;
  importData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsRecycleBinOpen: (open: boolean) => void;
  handleLogout: () => void;
  handleGoogleLogin: () => void;
  loginError: string | null;
  manualKey: string;
  setManualKey: (val: string) => void;
  onSaveManualKey: () => void;
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
  loginError,
  manualKey,
  setManualKey,
  onSaveManualKey
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

              {user && (
                <div className="grid gap-3 p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border-2 border-primary/20">
                  <div className="flex flex-col gap-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">AI API Access</Label>
                    <p className="text-[11px] font-medium text-foreground/70 leading-relaxed">
                      To begin using GenGenius, you must provide your own personal Google Gemini API key. 
                      This keeps your personal usage completely private and ensures you always have maximum speeds.
                    </p>
                    <div className="pt-2 border-t border-border/50">
                      <Label htmlFor="manualKey" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                        {localStorage.getItem("gen_genius_user_api_key") ? "✅ Currently Linked API Key" : "Personal Gemini API Key"}
                      </Label>
                      <div className="flex gap-2">
                        {localStorage.getItem("gen_genius_user_api_key") ? (
                          <Input
                            id="manualKey"
                            type="text"
                            value={localStorage.getItem("gen_genius_user_api_key") || ""}
                            readOnly
                            disabled
                            className="bg-muted/50 border-2 border-border rounded-lg text-xs h-9 font-mono opacity-100 cursor-not-allowed select-all"
                          />
                        ) : (
                          <>
                            <Input
                              id="manualKey"
                              type="text"
                              value={manualKey}
                              onChange={(e) => setManualKey(e.target.value)}
                              placeholder="AIzaSy..."
                              className="bg-background border-2 border-border rounded-lg text-xs h-9 font-bold"
                            />
                            <Button 
                              onClick={onSaveManualKey}
                              disabled={!manualKey}
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 rounded-lg font-bold text-[10px]"
                            >
                              Save Key
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Session Management</h4>
              <Button 
                variant="outline" 
                className="w-full justify-start h-11 rounded-xl font-bold text-xs uppercase tracking-widest border-2 border-border text-foreground"
                onClick={() => setIsRecycleBinOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Recycle Bin (Deleted Chats)
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
                    localStorage.removeItem("gen_genius_user_api_key");
                    setManualKey("");
                    handleLogout();
                    onOpenChange(false);
                    setTimeout(() => window.location.reload(), 100);
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
