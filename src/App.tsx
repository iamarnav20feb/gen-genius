import { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  BookOpen, 
  GraduationCap,
  History, 
  Globe, 
  Scale, 
  TrendingUp, 
  FlaskConical, 
  Calculator, 
  Plus,
  MessageSquare,
  FileText,
  HelpCircle,
  Menu,
  ChevronRight,
  User,
  Bot,
  Sun,
  Moon,
  Trash2,
  Edit2,
  Check,
  X,
  MoreVertical,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  LogIn,
  RefreshCw,
  Download,
  Upload,
  FileDown,
  Paperclip,
  Image as ImageIcon,
  Video,
  Square,
  Loader2,
  FileText as FileIcon,
  Library,
  Compass,
  Coins,
  Atom,
  Sigma,
  Puzzle,
  BrainCircuit,
  Mic,
  Volume2,
  VolumeX,
  StopCircle,
  Laptop,
  Newspaper,
  ChevronDown,
  Sparkles,
  Languages,
  MicOff,
  Waves,
  Power,
  Cloud,
  ShieldCheck,
  CloudOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getExamHelpStream, getExamHelpStatic } from "./services/geminiService";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  orderBy,
  getDocFromServer
} from "firebase/firestore";
import { db, auth, signInWithGoogle, logOut } from "./lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { cn } from "@/lib/utils";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

// Helper to sanitize data for Firestore (remove undefined values)
const sanitizeForFirestore = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore);
  } else if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    const sanitized: any = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    });
    return sanitized;
  }
  return data;
};

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
const SettingsDialog = lazy(() => import("./components/SettingsDialog"));
const RecycleBinDialog = lazy(() => import("./components/RecycleBinDialog"));
const ConfirmationDialog = lazy(() => import("./components/ConfirmationDialog"));

interface FileAttachment {
  name: string;
  type: string;
  data: string; // base64
  preview?: string;
}

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  relatedTopics?: string[];
  attachments?: FileAttachment[];
  status?: "sending" | "sent" | "error";
}

interface Chat {
  id: string;
  userId: string;
  title: string;
  subject?: string;
  messages: Message[];
  createdAt: Date;
  deletedAt?: number;
}

const SUBJECTS = [
  { name: "Polity", icon: Scale, color: "text-blue-500", bg: "bg-blue-50" },
  { name: "History", icon: Library, color: "text-amber-500", bg: "bg-amber-50" },
  { name: "Geography", icon: Compass, color: "text-emerald-500", bg: "bg-emerald-50" },
  { name: "Economy", icon: Coins, color: "text-purple-500", bg: "bg-purple-50" },
  { name: "Science", icon: Atom, color: "text-cyan-500", bg: "bg-cyan-50" },
  { name: "Math", icon: Sigma, color: "text-rose-500", bg: "bg-rose-50" },
  { name: "Reasoning", icon: Puzzle, color: "text-indigo-500", bg: "bg-indigo-50" },
  { name: "Computer", icon: Laptop, color: "text-slate-500", bg: "bg-slate-50" },
  { name: "Current Affairs", icon: Newspaper, color: "text-orange-500", bg: "bg-orange-50" },
];

const QUICK_ACTIONS = [
  { name: "MCQs", prompt: "Generate 5 MCQs on ", icon: HelpCircle },
  { name: "Notes", prompt: "Give structured revision notes on ", icon: FileText },
  { name: "Latest News", prompt: "What are the most important current affairs for exams from the last 24 hours?", icon: Newspaper },
  { name: "Quiz", prompt: "Start a quiz on ", icon: BrainCircuit },
];

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  photoURL?: string;
}

const GeniusLogo = ({ collapsed = false }: { collapsed?: boolean }) => (
  <div className={cn("flex items-center gap-3", collapsed && "flex-col gap-2")}>
    <div className="relative">
      <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-lg animate-pulse" />
      <div className={cn(
        "relative bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-xl border-2 border-white/10 overflow-hidden",
        collapsed ? "w-10 h-10" : "w-12 h-12"
      )}>
        <Bot className={cn("text-white", collapsed ? "w-5 h-5" : "w-7 h-7")} />
        <motion.div 
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full"
        />
      </div>
    </div>
    {!collapsed && (
      <div className="flex flex-col">
        <span className="text-[10px] font-black tracking-[0.3em] leading-none text-muted-foreground uppercase">Generation</span>
        <span className="text-2xl font-black tracking-tighter leading-none bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">GENIUS</span>
      </div>
    )}
  </div>
);

// --- Optimized Components ---

const ChatMessage = memo(({ 
  msg, 
  idx, 
  messagesCount, 
  activeChatId, 
  setChats, 
  isSpeaking, 
  speakText, 
  handleRetry, 
  handleSend,
  relatedTopics 
}: { 
  msg: Message, 
  idx: number, 
  messagesCount: number,
  activeChatId: string | null,
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>,
  isSpeaking: string | null,
  speakText: (text: string, id: string) => void,
  handleRetry: () => void,
  handleSend: (text: string) => void,
  relatedTopics: string[]
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex flex-col max-w-[85%] gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-3 rounded-2xl border transition-all relative group/msg ${
          msg.role === "user" 
            ? "bg-[#F5F5F5] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] border-transparent shadow-sm" 
            : "bg-background text-foreground border-border shadow-sm"
        }`}>
          <div className={cn(
            "markdown-body prose prose-sm max-w-none",
            msg.role === "user" 
              ? "text-[16px] font-bold leading-relaxed text-[#000000] dark:text-[#FFFFFF] prose-p:text-[#000000] dark:prose-p:text-[#FFFFFF] prose-headings:text-[#000000] dark:prose-headings:text-[#FFFFFF] prose-strong:text-[#000000] dark:prose-strong:text-[#FFFFFF]" 
              : "prose-headings:text-foreground prose-strong:text-foreground prose-p:text-foreground leading-relaxed"
          )}>
            {msg.attachments && msg.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {msg.attachments.map((file, fIdx) => (
                  <div key={fIdx} className="relative group">
                    {file.preview ? (
                      <img 
                        src={file.preview} 
                        alt={file.name} 
                        className="w-20 h-20 object-cover rounded-xl border border-border shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-20 h-20 flex flex-col items-center justify-center bg-muted rounded-xl border border-border p-2 text-center">
                        {file.type.includes('pdf') ? <FileIcon className="w-6 h-6 mb-1" /> : <Paperclip className="w-6 h-6 mb-1" />}
                        <span className="text-[8px] font-bold truncate w-full">{file.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {msg.isTyping && !msg.content ? (
              <div className="flex gap-1 items-center py-2 px-1">
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-primary rounded-full" />
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-primary rounded-full" />
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-primary rounded-full" />
              </div>
            ) : (
              <ReactMarkdown rehypePlugins={[rehypeRaw as any]}>{msg.content}</ReactMarkdown>
            )}
          </div>
          
          {msg.role === "model" && !msg.isTyping && (
            <div className="absolute -right-10 top-0 opacity-0 group-hover/msg:opacity-100 transition-opacity flex flex-col gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 rounded-full bg-background border border-border shadow-sm",
                  isSpeaking === msg.id && "text-primary border-primary"
                )}
                onClick={() => speakText(msg.content, msg.id)}
              >
                {isSpeaking === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </Button>
            </div>
          )}
        </div>

        {msg.status === "error" && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry}
            className="mt-1 text-[10px] font-bold border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg h-7"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Retry
          </Button>
        )}

        {msg.role === "model" && idx === messagesCount - 1 && !msg.isTyping && msg.status !== "error" && relatedTopics.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 flex flex-wrap gap-1.5"
          >
            {relatedTopics.map((topic) => (
              <button 
                key={topic} 
                className="bg-background hover:bg-muted border border-border px-3 py-1 rounded-full text-[9px] font-bold transition-all text-foreground"
                onClick={() => handleSend(`Tell me more about ${topic}`)}
              >
                {topic}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

ChatMessage.displayName = "ChatMessage";

const SidebarItem = memo(({ 
  chat, 
  activeChatId, 
  isCollapsed, 
  setActiveChatId, 
  setIsSidebarOpen, 
  setChatToDelete, 
  setIsDeleteDialogOpen 
}: {
  chat: Chat,
  activeChatId: string | null,
  isCollapsed: boolean,
  setActiveChatId: (id: string) => void,
  setIsSidebarOpen: (open: boolean) => void,
  setChatToDelete: (id: string) => void,
  setIsDeleteDialogOpen: (open: boolean) => void
}) => (
  <Tooltip key={chat.id}>
    <TooltipTrigger render={
      <motion.div
        variants={{
          hidden: { opacity: 0, x: -10 },
          visible: { opacity: 1, x: 0 }
        }}
        whileHover={{ x: 4 }}
        className={cn(
          "group relative flex items-center w-full rounded-lg transition-all duration-200 cursor-pointer",
          activeChatId === chat.id 
            ? "bg-black dark:bg-white text-white dark:text-black" 
            : "text-foreground hover:bg-muted",
          isCollapsed && "justify-center h-9"
        )}
        onClick={() => {
          setActiveChatId(chat.id);
          setIsSidebarOpen(false);
        }}
      >
        <div className={cn("flex-1 flex items-center min-w-0 px-3 h-9", isCollapsed && "px-0 justify-center")}>
          <MessageSquare className={cn("w-3 h-3 shrink-0", !isCollapsed && "mr-3")} />
          {!isCollapsed && (
            <span className={cn(
              "text-[11px] font-bold truncate",
              activeChatId === chat.id ? "text-white dark:text-black" : "text-foreground"
            )}>{chat.title}</span>
          )}
        </div>
        
        {!isCollapsed && (
          <div className="flex items-center pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md hover:bg-background/20"
              onClick={(e) => {
                e.stopPropagation();
                setChatToDelete(chat.id);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </motion.div>
    } />
    {isCollapsed && <TooltipContent side="right">{chat.title}</TooltipContent>}
  </Tooltip>
));

SidebarItem.displayName = "SidebarItem";

const ChatInput = memo(({ 
  onSend, 
  isLoading, 
  isAssistantActive, 
  setIsAssistantActive, 
  isListening, 
  toggleListening,
  handleFileChange,
  attachedFiles,
  removeFile,
  handleTaskAction,
  stopGeneration,
  recognitionRef,
  setIsListening,
  input,
  setInput
}: {
  onSend: (text: string) => void,
  isLoading: boolean,
  isAssistantActive: boolean,
  setIsAssistantActive: (active: boolean) => void,
  isListening: boolean,
  toggleListening: () => void,
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  attachedFiles: FileAttachment[],
  removeFile: (idx: number) => void,
  handleTaskAction: (prompt: string) => void,
  stopGeneration: () => void,
  recognitionRef: React.RefObject<any>,
  setIsListening: (listening: boolean) => void,
  input: string,
  setInput: (val: string) => void
}) => {
  const handleSubmit = () => {
    if ((input.trim() || attachedFiles.length > 0) && !isLoading) {
      onSend(input);
    }
  };

  return (
    <div className="p-6 bg-background z-30">
      <div className="max-w-2xl mx-auto space-y-4">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="relative group">
                {file.preview ? (
                  <img 
                    src={file.preview} 
                    alt={file.name} 
                    className="w-16 h-16 object-cover rounded-xl border-2 border-border"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 flex flex-col items-center justify-center bg-muted rounded-xl border-2 border-border p-1 text-center">
                    {file.type.includes('pdf') ? <FileIcon className="w-6 h-6 mb-1" /> : <Paperclip className="w-6 h-6 mb-1" />}
                    <span className="text-[8px] font-bold truncate w-full">{file.name}</span>
                  </div>
                )}
                <button 
                  onClick={() => removeFile(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 max-w-2xl mx-auto mb-2">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.name}
              variant="outline"
              size="sm"
              className="rounded-full text-[10px] font-bold uppercase tracking-wider h-8 border-border hover:bg-muted"
              onClick={() => handleTaskAction(action.prompt)}
            >
              <action.icon className="w-3 h-3 mr-2" />
              {action.name}
            </Button>
          ))}
        </div>

        <div className="relative flex items-center gap-2">
          <div className="flex items-center gap-1">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept="image/*,.pdf,.txt"
              onChange={handleFileChange}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger render={
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-xl hover:bg-muted text-foreground"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Paperclip className="w-6 h-6" />
                    </Button>
                  </motion.div>
                } />
                <TooltipContent>Attach Files</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger render={
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-xl hover:bg-muted transition-all",
                        isAssistantActive ? "text-primary bg-primary/10" : "text-foreground"
                      )}
                      onClick={() => {
                        if (isAssistantActive && isListening) {
                          recognitionRef.current?.stop();
                          setIsListening(false);
                        }
                        setIsAssistantActive(!isAssistantActive);
                      }}
                    >
                      <Sparkles className={cn("w-6 h-6", isAssistantActive && "animate-pulse")} />
                    </Button>
                  </motion.div>
                } />
                <TooltipContent>{isAssistantActive ? "Exit Genius Assistant" : "Talk to Genius Assistant"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="relative flex-1">
            <Input
              placeholder="Ask anything..."
              className="bg-background border-2 border-border focus-visible:ring-0 focus-visible:border-black dark:focus-visible:border-white text-lg h-16 rounded-2xl pr-28 font-bold placeholder:text-foreground/40 text-foreground shadow-md"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSubmit())}
            />
            
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger render={
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-12 w-12 rounded-xl hover:bg-muted transition-all",
                          isListening ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-foreground"
                        )}
                        onClick={toggleListening}
                      >
                        {isListening ? <StopCircle className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}
                      </Button>
                    </motion.div>
                  } />
                  <TooltipContent>{isListening ? "Stop Listening" : "Voice Input"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isLoading ? (
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-12 w-12 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all"
                  onClick={stopGeneration}
                >
                  <Square className="w-5 h-5 fill-current" />
                </Button>
              ) : (
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-12 w-12 rounded-xl hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all text-foreground"
                  onClick={handleSubmit}
                  disabled={!input.trim() && attachedFiles.length === 0}
                >
                  <Send className="w-6 h-6" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
            <Loader2 className="w-3 h-3 animate-spin" />
            Generating Response...
          </div>
        )}
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";

interface SidebarContentProps {
  isMobile?: boolean;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  user: FirebaseUser | null;
  isSyncing: boolean;
  activeChat: Chat | null;
  activeChats: Chat[];
  activeChatId: string | null;
  createNewChat: (initialMessage?: Message, subject?: string) => Chat;
  setIsSidebarOpen: (open: boolean) => void;
  setActiveChatId: (id: string | null) => void;
  setChatToDelete: (id: string | null) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
  handleGoogleLogin: () => void;
  loginError: string | null;
  setIsSettingsOpen: (open: boolean) => void;
  handleLogout: () => void;
}

const SidebarContent = memo(({ 
  isMobile = false,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  user,
  isSyncing,
  activeChat,
  activeChats,
  activeChatId,
  createNewChat,
  setIsSidebarOpen,
  setActiveChatId,
  setChatToDelete,
  setIsDeleteDialogOpen,
  handleGoogleLogin,
  loginError,
  setIsSettingsOpen,
  handleLogout
}: SidebarContentProps) => {
  const isCollapsed = !isMobile && isSidebarCollapsed;

  return (
    <TooltipProvider delay={0}>
      <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] border-r dark:border-white/5 transition-all duration-300 ease-in-out">
        {/* Sidebar Header */}
        <div className={cn("p-6", isCollapsed && "p-4 flex flex-col items-center")}>
          <div className="flex items-center justify-between w-full">
            <AnimatePresence mode="wait">
              {!isCollapsed ? (
                <motion.div 
                  key="full-logo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between w-full overflow-hidden"
                >
                  <div className="flex flex-col">
                    <GeniusLogo />
                    {user && (
                      <div className="flex items-center mt-1 space-x-1.5">
                        {isSyncing ? (
                          <>
                            <RefreshCw className="w-2.5 h-2.5 text-blue-500 animate-spin" />
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Syncing...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Cloud Secured</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-muted"
                    onClick={() => setIsSidebarCollapsed(true)}
                  >
                    <PanelLeftClose className="w-4 h-4 text-foreground/50" />
                  </Button>
                </motion.div>
              ) : (
                <Tooltip>
                  <TooltipTrigger render={
                    <motion.div 
                      key="collapsed-logo"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center space-y-4"
                    >
                      <div 
                        className="cursor-pointer"
                        onClick={() => setIsSidebarCollapsed(false)}
                      >
                        <GeniusLogo collapsed />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-muted"
                        onClick={() => setIsSidebarCollapsed(false)}
                      >
                        <PanelLeftOpen className="w-4 h-4 text-foreground/50" />
                      </Button>
                    </motion.div>
                  } />
                  <TooltipContent side="right">Expand Sidebar</TooltipContent>
                </Tooltip>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Scrollable Area */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          className="flex-1 overflow-y-auto px-3 space-y-2 pb-6 custom-scrollbar"
        >
          {/* Subjects Section */}
          <div className="space-y-1">
            {SUBJECTS.map((sub) => (
              <Tooltip key={sub.name}>
                <TooltipTrigger render={
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    whileHover={{ x: 4, backgroundColor: "var(--muted)" }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-lg"
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start hover:bg-transparent group transition-all duration-300 rounded-lg h-10 px-3 text-foreground relative overflow-hidden",
                        activeChat?.subject === sub.name 
                          ? "bg-black dark:bg-white text-white dark:text-black shadow-md" 
                          : "text-foreground",
                        isCollapsed && "px-0 justify-center"
                      )}
                      onClick={() => {
                        createNewChat(undefined, sub.name);
                        setIsSidebarOpen(false);
                      }}
                    >
                      <sub.icon className={cn(
                        "w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110", 
                        !isCollapsed && "mr-3", 
                        activeChat?.subject === sub.name ? "text-current" : sub.color
                      )} />
                      {!isCollapsed && (
                        <span className="font-bold text-xs">{sub.name}</span>
                      )}
                      {activeChat?.subject === sub.name && (
                        <motion.div 
                          layoutId="active-subject-glow"
                          className="absolute inset-0 bg-white/10 dark:bg-black/10 pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </Button>
                  </motion.div>
                } />
                {isCollapsed && <TooltipContent side="right">{sub.name}</TooltipContent>}
              </Tooltip>
            ))}
          </div>

          {/* History Section */}
          <div className="pt-2 space-y-0.5">
            {activeChats.filter(c => !c.subject).map((chat) => (
              <SidebarItem 
                key={chat.id}
                chat={chat}
                activeChatId={activeChatId}
                isCollapsed={isCollapsed}
                setActiveChatId={setActiveChatId}
                setIsSidebarOpen={setIsSidebarOpen}
                setChatToDelete={setChatToDelete}
                setIsDeleteDialogOpen={setIsDeleteDialogOpen}
              />
            ))}
          </div>
        </motion.div>

        {/* Sidebar Footer (Settings & Profile) */}
        <div className="p-4 mt-auto border-t border-border space-y-2">
          <p className="text-[8px] text-center text-foreground/30 font-bold uppercase tracking-widest mb-2">made by Arnav</p>
          {!user ? (
            <div className="space-y-2">
              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-[10px] text-destructive font-medium leading-tight"
                >
                  {loginError}
                </motion.div>
              )}
              <Button 
                variant="outline" 
                className={cn("w-full justify-start h-10 rounded-xl text-xs font-bold uppercase tracking-widest border-border text-foreground", isCollapsed && "w-10 p-0 justify-center")}
                onClick={handleGoogleLogin}
              >
                <LogIn className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && <span>Login</span>}
              </Button>
            </div>
          ) : (
            <div className={cn("flex items-center gap-3 p-2 rounded-xl bg-muted border border-border", isCollapsed && "p-1 justify-center")}>
              <Avatar className="w-8 h-8 rounded-lg">
                <AvatarImage src={user.photoURL || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">{user.displayName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-foreground">{user.displayName}</p>
                  <p className="text-[9px] text-foreground/70 truncate">{user.email}</p>
                </div>
              )}
            </div>
          )}

          <Button 
            variant="ghost" 
            className={cn("w-full justify-start h-10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-muted text-foreground", isCollapsed && "w-10 p-0 justify-center")}
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Settings</span>}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
});

SidebarContent.displayName = "SidebarContent";

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("gen_genius_profile");
    return saved ? JSON.parse(saved) : { name: "", email: "", bio: "", photoURL: "" };
  });

  const [chats, setChats] = useState<Chat[]>([]);
  const chatsRef = useRef<Chat[]>(chats);
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    return localStorage.getItem("gen_genius_active_chat");
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("gen_genius_theme");
    return (saved as "light" | "dark") || "light";
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("gen_genius_sidebar_collapsed") === "true";
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [chatToReset, setChatToReset] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAssistantActive, setIsAssistantActive] = useState(false);
  const [assistantLanguage, setAssistantLanguage] = useState<"en-IN" | "hi-IN">("en-IN");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastActiveChatId = useRef<string | null>(null);

  // Handle scroll events to show/hide "Jump to Latest" button
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
      // Show button if user is more than 300px away from bottom
      const isNearBottom = scrollHeight - clientHeight - scrollTop < 300;
      setShowJumpToBottom(!isNearBottom);
    }
  }, []);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = assistantLanguage;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (isAssistantActive) {
          if (transcript.trim()) {
            handleSend(transcript);
          } else {
            speakText("I didn't catch that. Please repeat.", "error-repeat");
          }
        } else {
          setInput(prev => prev + (prev ? " " : "") + transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error("Speech recognition error", event.error);
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Auto-restart listening if assistant is active and not busy
        if (isAssistantActive && !isSpeaking && !isLoading) {
          setTimeout(() => {
            if (isAssistantActive && !isListening && !isSpeaking && !isLoading) {
              try {
                recognitionRef.current?.start();
              } catch (e) {}
            }
          }, 1000);
        }
      };
    }
  }, [isAssistantActive, isSpeaking, isLoading, assistantLanguage]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = assistantLanguage;
    }
  }, [assistantLanguage]);

  useEffect(() => {
    // Pre-load voices
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
  }, []);

  const toggleAssistant = () => {
    if (isAssistantActive) {
      // Shut down everything
      setIsAssistantActive(false);
      setIsListening(false);
      setIsSpeaking(null);
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
    } else {
      setIsAssistantActive(true);
      // Listening will start via useEffect or manual trigger
    }
  };

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        window.speechSynthesis.cancel();
        setIsSpeaking(null);
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Failed to start speech recognition", e);
      }
    }
  }, [isListening]);

  const speakText = useCallback((text: string, messageId: string) => {
    if (isSpeaking === messageId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language
    utterance.lang = assistantLanguage;
    
    // Voice selection for "Genius" (Male Indian Voice)
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    const isFemale = (name: string) => 
      name.includes("Female") || name.includes("Girl") || name.includes("Woman") || 
      name.includes("Zira") || name.includes("Veena") || name.includes("Heera");

    if (assistantLanguage === "hi-IN") {
      // Try to find a male Hindi voice
      selectedVoice = voices.find(v => v.lang === "hi-IN" && !isFemale(v.name) && (v.name.includes("Male") || v.name.includes("Guy") || v.name.includes("Rishi"))) ||
                      voices.find(v => v.lang === "hi-IN" && !isFemale(v.name));
    } else {
      // Try to find a male Indian English voice (en-IN)
      selectedVoice = voices.find(v => v.lang === "en-IN" && !isFemale(v.name) && (v.name.includes("Male") || v.name.includes("Guy") || v.name.includes("Rishi") || v.name.includes("Prabhat"))) ||
                      voices.find(v => v.lang === "en-IN" && !isFemale(v.name)) ||
                      // Fallback to any male English voice
                      voices.find(v => v.lang.startsWith("en") && !isFemale(v.name) && (v.name.includes("Male") || v.name.includes("Guy")));
    }
    
    if (selectedVoice) utterance.voice = selectedVoice;
    
    // Professional, friendly tutor settings
    utterance.pitch = 0.9; // Slightly lower for a more masculine, mature tone
    utterance.rate = 1.05;  // Slightly faster for real-time feel
    
    utterance.onend = () => {
      setIsSpeaking(null);
      // Restart listening after speaking if assistant is active
      if (isAssistantActive && !isListening && !isLoading) {
        setTimeout(() => {
          if (isAssistantActive && !isListening && !isSpeaking && !isLoading) {
            try {
              recognitionRef.current?.start();
            } catch (e) {}
          }
        }, 500);
      }
    };
    utterance.onerror = () => setIsSpeaking(null);
    
    // Clean markdown for better speech
    const cleanText = text.replace(/[#*`_~\[\]()]/g, '').replace(/Related Topics:.*/i, '');
    utterance.text = cleanText;
    
    setIsSpeaking(messageId);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, assistantLanguage, isAssistantActive, isListening, isLoading]);

  // Auth Listener and Firestore Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        setLoginError(null);
        // Sync Profile
        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const newProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || "",
              email: currentUser.email || "",
              photoURL: currentUser.photoURL || "",
              bio: "",
              createdAt: new Date().toISOString()
            };
            setIsSyncing(true);
            await setDoc(userDocRef, newProfile);
            setIsSyncing(false);
            setProfile({ 
              name: newProfile.name, 
              email: newProfile.email, 
              bio: "", 
              photoURL: newProfile.photoURL 
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else {
        setChats([]);
        setProfile({ name: "", email: "", bio: "", photoURL: "" });
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Chats Sync
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const chatsQuery = query(
      collection(db, "chats"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const updatedChats = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          messages: (data.messages || []).map((m: any) => ({
            ...m,
            timestamp: m.timestamp?.toDate() || new Date()
          }))
        } as Chat;
      });

      setChats(prev => {
        // 1. Start with updated chats from Firestore
        const merged = updatedChats.map(newChat => {
          const localChat = prev.find(c => c.id === newChat.id);
          if (!localChat) return newChat;

          // Merge messages: keep local messages that haven't reached Firestore yet
          const mergedMessages = [...newChat.messages];
          localChat.messages.forEach(localMsg => {
            if (!mergedMessages.some(m => m.id === localMsg.id)) {
              mergedMessages.push(localMsg);
            }
          });

          // Sort by timestamp
          mergedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

          return {
            ...newChat,
            messages: mergedMessages
          };
        });

        // 2. Keep chats that are ONLY in local state (not yet in Firestore)
        // This is critical for brand new chats that are still being saved
        const localOnly = prev.filter(localChat => 
          !updatedChats.some(newChat => newChat.id === localChat.id) &&
          // Only keep them if they were created recently (last 60 seconds)
          // or if they have messages (meaning they are active)
          (new Date().getTime() - localChat.createdAt.getTime() < 60000 || localChat.messages.length > 0)
        );

        // 3. Combine and ensure uniqueness
        const combined = [...merged];
        localOnly.forEach(lc => {
          if (!combined.some(c => c.id === lc.id)) {
            combined.push(lc);
          }
        });

        return combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "chats");
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  // Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  // Persistence Effects (Local storage as fallback/cache)
  useEffect(() => {
    if (profile.name) {
      localStorage.setItem("gen_genius_profile", JSON.stringify(profile));
      if (user) {
        setIsSyncing(true);
        const updateData = sanitizeForFirestore({ ...profile, uid: user.uid });
        setDoc(doc(db, "users", user.uid), updateData, { merge: true })
          .catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`))
          .finally(() => setIsSyncing(false));
      }
    }
  }, [profile, user]);

  useEffect(() => {
    localStorage.setItem("gen_genius_sidebar_collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const activeChat = useMemo(() => {
    const chat = chats.find(c => c.id === activeChatId && !c.deletedAt);
    return chat || null;
  }, [chats, activeChatId]);

  const activeChats = useMemo(() => {
    return chats.filter(c => !c.deletedAt);
  }, [chats]);

  const deletedChats = useMemo(() => {
    return chats.filter(c => !!c.deletedAt);
  }, [chats]);

  const messages = useMemo(() => {
    if (activeChat) return activeChat.messages;
    return [];
  }, [activeChat]);

  const renderedMessages = useMemo(() => {
    // Limit DOM load by only rendering the last 30 messages (WhatsApp-level performance)
    return messages.slice(-30);
  }, [messages]);

  const relatedTopics = useMemo(() => {
    if (messages.length === 0) return [];
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "model" && !lastMsg.isTyping) {
      return lastMsg.relatedTopics || [];
    }
    return [];
  }, [messages]);

  // Debounce localStorage updates to prevent blocking the main thread during streaming
  useEffect(() => {
    if (chats.length > 0) {
      const timeout = setTimeout(() => {
        localStorage.setItem("gen_genius_chats", JSON.stringify(chats));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [chats]);

  useEffect(() => {
    setStreamingMessage(null);
    if (abortController) {
      abortController.abort();
    }
    if (activeChatId) {
      localStorage.setItem("gen_genius_active_chat", activeChatId);
    } else {
      localStorage.removeItem("gen_genius_active_chat");
    }
  }, [activeChatId]);

  useEffect(() => {
    localStorage.setItem("gen_genius_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const scrollToBottom = useCallback((force = false, smooth = true) => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
      // Increased threshold to 150px for better detection on mobile
      const isNearBottom = scrollHeight - clientHeight - scrollTop < 150;
      
      if (force || isNearBottom) {
        scrollRef.current.scrollTo({
          top: scrollHeight,
          behavior: smooth ? "smooth" : "auto",
        });
      }
    }
  }, []);

  useEffect(() => {
    // When switching chats, start at the top
    if (activeChatId !== lastActiveChatId.current) {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      lastActiveChatId.current = activeChatId;
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const isUserMessage = lastMessage?.role === "user";
    const isTyping = lastMessage?.isTyping;

    // Force scroll if it's a user message, if AI is currently typing, or if we are in loading state
    // This ensures we keep scrolling as content grows during streaming
    const force = isUserMessage || isTyping || isLoading;

    const timeout = requestAnimationFrame(() => scrollToBottom(force, true));
    return () => cancelAnimationFrame(timeout);
  }, [messages, streamingMessage, isLoading, activeChatId, scrollToBottom]);

  const createNewChat = useCallback((initialMessage?: Message, subject?: string) => {
    // If it's a subject session, check if one already exists
    if (subject) {
      const existingChat = chatsRef.current.find(c => c.subject === subject && !c.deletedAt);
      if (existingChat) {
        setActiveChatId(existingChat.id);
        return existingChat;
      }
    }

    const newChatId = crypto.randomUUID();
    const newChat: Chat = {
      id: newChatId,
      userId: user?.uid || "anonymous",
      title: subject 
        ? `${subject} Session`
        : (initialMessage 
            ? initialMessage.content.slice(0, 30) + (initialMessage.content.length > 30 ? "..." : "") 
            : "New Session"),
      subject: subject || null,
      messages: initialMessage ? [initialMessage] : [],
      createdAt: new Date(),
    };

    if (user) {
      setIsSyncing(true);
      setDoc(doc(db, "chats", newChatId), sanitizeForFirestore(newChat))
        .catch(e => handleFirestoreError(e, OperationType.WRITE, `chats/${newChatId}`))
        .finally(() => setIsSyncing(false));
      
      // Still update local state for immediate feedback
      setChats(prev => {
        // Prevent duplicates
        if (prev.some(c => c.id === newChatId)) return prev;
        return [newChat, ...prev];
      });
    } else {
      setChats(prev => {
        if (prev.some(c => c.id === newChatId)) return prev;
        return [newChat, ...prev];
      });
    }
    
    setActiveChatId(newChat.id);
    return newChat;
  }, [user]); // Removed chats dependency

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const fortyEightHours = 48 * 60 * 60 * 1000;
      setChats(prev => prev.filter(c => !c.deletedAt || (now - c.deletedAt < fortyEightHours)));
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: FileAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const promise = new Promise<FileAttachment>((resolve) => {
        reader.onload = (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          const attachment: FileAttachment = {
            name: file.name,
            type: file.type,
            data: base64,
          };
          
          if (file.type.startsWith('image/')) {
            attachment.preview = event.target?.result as string;
          }
          
          resolve(attachment);
        };
      });
      
      reader.readAsDataURL(file);
      newAttachments.push(await promise);
    }
    
    setAttachedFiles(prev => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  };

  const handleSend = useCallback(async (text: string = input) => {
    const finalPrompt = text.trim();
    if ((!finalPrompt && attachedFiles.length === 0) || isLoading) return;

    // Clear input immediately to prevent double-sending
    setInput("");
    setAttachedFiles([]);
    setIsLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: finalPrompt,
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
      status: "sent"
    };

    let currentChatId = activeChatId;
    let currentSubject = activeChat?.subject;

    if (!currentChatId) {
      const newChat = createNewChat(userMessage);
      currentChatId = newChat.id;
    } else {
      // Update locally first for instant feedback
      setChats(prev => prev.map(c => {
        if (c.id === currentChatId) {
          const hasUserMessage = c.messages.some(m => m.role === "user");
          const newTitle = !hasUserMessage ? (finalPrompt || "File Analysis").slice(0, 30) + (finalPrompt.length > 30 ? "..." : "") : c.title;
          const updatedMessages = [...c.messages, userMessage];
          return { ...c, title: newTitle, messages: updatedMessages.length > 100 ? updatedMessages.slice(-100) : updatedMessages };
        }
        return c;
      }));

      if (user) {
        const chatRef = doc(db, "chats", currentChatId);
        // Use a functional update to get the latest messages from Firestore state if possible
        // or just append to the existing document using arrayUnion if the structure allowed it.
        // Since we store messages as an array field, we need to be careful.
        
        // We'll get the latest messages from our ref to ensure we don't overwrite
        const latestChat = chatsRef.current.find(c => c.id === currentChatId);
        if (latestChat) {
          setIsSyncing(true);
          const updatedMessages = [...latestChat.messages, userMessage];
          const limitedMessages = updatedMessages.length > 100 ? updatedMessages.slice(-100) : updatedMessages;
          
          const updateData = sanitizeForFirestore({
            messages: limitedMessages,
            title: !latestChat.messages.some(m => m.role === "user") ? (finalPrompt || "File Analysis").slice(0, 30) + (finalPrompt.length > 30 ? "..." : "") : latestChat.title
          });

          setDoc(chatRef, updateData, { merge: true })
            .catch(e => handleFirestoreError(e, OperationType.WRITE, `chats/${currentChatId}`))
            .finally(() => setIsSyncing(false));
        }
      }
    }

    const currentFiles = [...attachedFiles];
    const aiMessageId = crypto.randomUUID();

    try {
      const chatToUse = chatsRef.current.find(c => c.id === currentChatId);
      const history = chatToUse ? chatToUse.messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })) : [];

      const stream = await getExamHelpStream(
        finalPrompt || "Analyze the attached files.", 
        history, 
        currentSubject,
        currentFiles.map(f => ({ mimeType: f.type, data: f.data })),
        isAssistantActive
      );
      
      let fullResponse = "";
      
      const aiMessage: Message = {
        id: aiMessageId,
        role: "model",
        content: "",
        timestamp: new Date(),
        isTyping: true,
        status: "sending"
      };

      setStreamingMessage(aiMessage);

      console.log("GenGenius: Stream received, starting iteration...");
      try {
        for await (const chunk of stream) {
          if (controller.signal.aborted) break;
          const chunkText = chunk.text;
          if (chunkText) {
            console.log(`GenGenius: Received chunk (${chunkText.length} chars)`);
            fullResponse += chunkText;
            setStreamingMessage(prev => prev ? { ...prev, content: fullResponse } : null);
          }
        }
      } catch (streamError) {
        console.warn("GenGenius: Streaming failed, trying static fallback...", streamError);
        // Fallback to static if streaming is blocked by network
        const staticText = await getExamHelpStatic(
          finalPrompt || "Analyze the attached files.",
          history,
          currentSubject,
          currentFiles.map(f => ({ mimeType: f.type, data: f.data }))
        );
        if (staticText) {
          fullResponse = staticText;
          setStreamingMessage(prev => prev ? { ...prev, content: fullResponse } : null);
        }
      }
      console.log(`GenGenius: Response finished. Total length: ${fullResponse.length}`);

      if (!controller.signal.aborted) {
        const topicsMatch = fullResponse.match(/Related Topics:\s*(.*)/i);
        const topics = topicsMatch ? topicsMatch[1].split(",").map(t => t.trim()).filter(t => t.length > 0) : [];
        const cleanResponse = fullResponse.replace(/Related Topics:\s*(.*)/i, "").trim();

        const finalAiMessage: Message = {
          id: aiMessageId,
          role: "model",
          content: cleanResponse || "I'm sorry, I couldn't generate a complete response. Let's try that again!",
          timestamp: new Date(),
          relatedTopics: topics,
          isTyping: false,
          status: "sent"
        };

        // Update locally first
        let finalMessages: Message[] = [];
        setChats(prev => prev.map(c => {
          if (c.id === currentChatId) {
            finalMessages = [...c.messages, finalAiMessage];
            return { ...c, messages: finalMessages.length > 100 ? finalMessages.slice(-100) : finalMessages };
          }
          return c;
        }));

        if (user && currentChatId) {
          const chatRef = doc(db, "chats", currentChatId);
          // Use chatsRef to get the latest messages (including the user message sent earlier)
          const latestChat = chatsRef.current.find(c => c.id === currentChatId);
          if (latestChat) {
            setIsSyncing(true);
            const updatedMessages = [...latestChat.messages, finalAiMessage];
            const limitedMessages = updatedMessages.length > 100 ? updatedMessages.slice(-100) : updatedMessages;
            
            const updateData = sanitizeForFirestore({
              messages: limitedMessages
            });

            setDoc(chatRef, updateData, { merge: true })
              .catch(e => handleFirestoreError(e, OperationType.WRITE, `chats/${currentChatId}`))
              .finally(() => setIsSyncing(false));
          }
        }
        
        setStreamingMessage(null);

        // Auto-speak if Genius Assistant is active
        if (isAssistantActive) {
          speakText(cleanResponse, aiMessageId);
        }
      }
    } catch (error: any) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log("Generation stopped by user");
      } else {
        console.error("AI Generation Error:", error);
        
        let errorContent = "I'm having trouble connecting to my brain right now. 🧠 Please check your connection and try again.";
        
        if (error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("429") || error?.message?.includes("quota")) {
          errorContent = "I've reached my temporary limit for free answers. Please wait a minute and try again.";
        } else if (error?.message?.includes("API key")) {
          errorContent = "⚠️ **API Key Error:** My connection to the AI is broken. Please ensure the API key is correctly set in the environment.";
        } else if (error?.message?.includes("fetch") || error?.message?.includes("NetworkError") || error?.message?.includes("Failed to fetch")) {
          errorContent = "⚠️ **Network Blocked:** I can't reach Google's AI servers. Since you are on a Chromebook, your school or network might be blocking 'generativelanguage.googleapis.com'. Try using a different Wi-Fi or a personal hotspot.";
        }

        const errorMessage: Message = {
          id: aiMessageId,
          role: "model",
          content: errorContent,
          timestamp: new Date(),
          status: "error",
          isTyping: false
        };

        // Add the error message to the chat history so the user can see it
        setChats(prev => prev.map(c => {
          if (c.id === currentChatId) {
            // Check if the message already exists (unlikely but safe)
            const exists = c.messages.some(m => m.id === aiMessageId);
            if (exists) {
              return {
                ...c,
                messages: c.messages.map(m => m.id === aiMessageId ? errorMessage : m)
              };
            } else {
              return {
                ...c,
                messages: [...c.messages, errorMessage]
              };
            }
          }
          return c;
        }));
        
        setStreamingMessage(null);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }, [input, attachedFiles, isLoading, activeChatId, activeChat, isAssistantActive, speakText, createNewChat]); // Removed chats dependency

  const restoreChat = (id: string) => {
    if (user) {
      setIsSyncing(true);
      setDoc(doc(db, "chats", id), { deletedAt: null }, { merge: true })
        .catch(e => handleFirestoreError(e, OperationType.WRITE, `chats/${id}`))
        .finally(() => setIsSyncing(false));
    } else {
      setChats(prev => prev.map(c => c.id === id ? { ...c, deletedAt: undefined } : c));
    }
  };

  const permanentlyDeleteChat = (id: string) => {
    if (user) {
      // For permanent delete, we can use deleteDoc
      setChats(prev => prev.filter(c => c.id !== id));
    } else {
      setChats(prev => prev.filter(c => c.id !== id));
    }
  };

  const startEditing = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(id);
    setEditTitle(title);
  };

  const saveTitle = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editingChatId && editTitle.trim()) {
      if (user) {
        setIsSyncing(true);
        setDoc(doc(db, "chats", editingChatId), { title: editTitle.trim() }, { merge: true })
          .catch(e => handleFirestoreError(e, OperationType.WRITE, `chats/${editingChatId}`))
          .finally(() => setIsSyncing(false));
      } else {
        setChats(prev => prev.map(c => c.id === editingChatId ? { ...c, title: editTitle.trim() } : c));
      }
    }
    setEditingChatId(null);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (lastUserMessage) {
      // Remove the last error message if it exists
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            messages: c.messages.filter(m => m.status !== "error")
          };
        }
        return c;
      }));
      handleSend(lastUserMessage.content);
    }
  };

  const handleTaskAction = (promptPrefix: string) => {
    const trimmedInput = input.trim().toLowerCase();
    const trimmedPrefix = promptPrefix.trim().toLowerCase();
    
    if (!trimmedInput) {
      setInput(promptPrefix);
    } else if (trimmedInput.includes(trimmedPrefix)) {
      // If the input already contains this prefix (case-insensitive), just send it
      handleSend(input);
    } else {
      // Otherwise append and send
      handleSend(promptPrefix + input);
    }
  };

  const handleGoogleLogin = useCallback(async () => {
    setLoginError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === "auth/popup-closed-by-user") {
        setLoginError("Login window was closed. Please try again and complete the sign-in.");
      } else if (error.code === "auth/cancelled-via-interactive-request") {
        setLoginError("Login was cancelled. Please try again.");
      } else if (error.code === "auth/popup-blocked") {
        setLoginError("The login popup was blocked by your browser. Please allow popups for this site and try again.");
      } else if (error.code === "auth/unauthorized-domain") {
        setLoginError(`This domain (${window.location.hostname}) is not authorized in your Firebase Console. Please add it to the "Authorized domains" list in Authentication > Settings.`);
      } else {
        setLoginError(`An unexpected error occurred: ${error.message}. (Domain: ${window.location.hostname})`);
      }
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Logout failed", error);
    }
  }, []);

  const exportChatAsTxt = (chat: Chat) => {
    const content = chat.messages.map(m => {
      const role = m.role === "user" ? "YOU" : "GENGENIUS";
      const time = m.timestamp.toLocaleString();
      return `[${time}] ${role}:\n${m.content}\n\n${"-".repeat(50)}\n\n`;
    }).join("");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fileName = chat.subject ? `${chat.subject.replace(/\s+/g, '_')}_Session.txt` : `Chat_${chat.id}.txt`;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAllData = () => {
    const data = JSON.stringify(chats, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GenGenius_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedChats = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedChats)) {
          // Basic validation and date restoration
          const validatedChats = importedChats.map((chat: any) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            messages: chat.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }))
          }));

          setChats(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const newChats = validatedChats.filter((c: any) => !existingIds.has(c.id));
            return [...newChats, ...prev];
          });
          alert("Data imported successfully!");
        }
      } catch (error) {
        console.error("Import failed", error);
        alert("Failed to import data. Please ensure the file is a valid GenGenius backup.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  const exportChatAsJson = (chat: Chat) => {
    const data = JSON.stringify(chat, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fileName = chat.subject ? `${chat.subject.replace(/\s+/g, '_')}_Session.json` : `Chat_${chat.id}.json`;
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importChatFromJson = (chatId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedChat = JSON.parse(event.target?.result as string);
        if (importedChat && Array.isArray(importedChat.messages)) {
          const validatedMessages = importedChat.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));

          setChats(prev => prev.map(c => {
            if (c.id === chatId) {
              return {
                ...c,
                messages: validatedMessages
              };
            }
            return c;
          }));
          alert("Chat session restored successfully!");
        }
      } catch (error) {
        console.error("Import failed", error);
        alert("Failed to import chat. Please ensure the file is a valid GenGenius session backup.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  const resetChat = (id: string) => {
    if (user) {
      setIsSyncing(true);
      setDoc(doc(db, "chats", id), { messages: [] }, { merge: true })
        .catch(e => handleFirestoreError(e, OperationType.WRITE, `chats/${id}`))
        .finally(() => setIsSyncing(false));
    } else {
      setChats(prev => prev.map(c => c.id === id ? { ...c, messages: [] } : c));
    }
    setIsResetDialogOpen(false);
    setChatToReset(null);
  };

  const confirmDeleteChat = (id: string) => {
    if (user) {
      setIsSyncing(true);
      setDoc(doc(db, "chats", id), { deletedAt: Date.now() }, { merge: true })
        .catch(e => handleFirestoreError(e, OperationType.WRITE, `chats/${id}`))
        .finally(() => setIsSyncing(false));
    } else {
      setChats(prev => prev.map(c => c.id === id ? { ...c, deletedAt: Date.now() } : c));
    }
    if (activeChatId === id) {
      setActiveChatId(null);
    }
    setIsDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  return (
    <div className={`flex h-screen w-full bg-[#FAFAFA] dark:bg-[#0a0a0a] text-foreground overflow-hidden font-sans selection:bg-black dark:selection:bg-white selection:text-white dark:selection:text-black ${theme}`}>
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarCollapsed ? 80 : 288,
        }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 1
        }}
        className="hidden md:flex border-r dark:border-white/5 bg-white dark:bg-[#0a0a0a] flex-col z-20 relative overflow-hidden"
      >
        <SidebarContent 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          user={user}
          isSyncing={isSyncing}
          activeChat={activeChat}
          activeChats={activeChats}
          activeChatId={activeChatId}
          createNewChat={createNewChat}
          setIsSidebarOpen={setIsSidebarOpen}
          setActiveChatId={setActiveChatId}
          setChatToDelete={setChatToDelete}
          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
          handleGoogleLogin={handleGoogleLogin}
          loginError={loginError}
          setIsSettingsOpen={setIsSettingsOpen}
          handleLogout={handleLogout}
        />
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background z-10">
          <div className="flex items-center space-x-4">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger render={
                <Button variant="ghost" size="icon" className="md:hidden rounded-lg hover:bg-muted">
                  <Menu className="w-5 h-5 text-foreground" />
                </Button>
              } />
              <SheetContent side="left" className="p-0 w-72 border-r border-border shadow-2xl bg-background">
                <SidebarContent 
                  isMobile 
                  isSidebarCollapsed={isSidebarCollapsed}
                  setIsSidebarCollapsed={setIsSidebarCollapsed}
                  user={user}
                  isSyncing={isSyncing}
                  activeChat={activeChat}
                  activeChats={activeChats}
                  activeChatId={activeChatId}
                  createNewChat={createNewChat}
                  setIsSidebarOpen={setIsSidebarOpen}
                  setActiveChatId={setActiveChatId}
                  setChatToDelete={setChatToDelete}
                  setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                  handleGoogleLogin={handleGoogleLogin}
                  loginError={loginError}
                  setIsSettingsOpen={setIsSettingsOpen}
                  handleLogout={handleLogout}
                />
              </SheetContent>
            </Sheet>
            <div className="flex items-center space-x-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeChat?.subject || "logo"}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeChat?.subject ? (
                    <span className="text-sm font-bold tracking-tight text-foreground">
                      {activeChat.subject}
                    </span>
                  ) : (
                    <div className="scale-75 origin-left">
                      <GeniusLogo />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {activeChat && (
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-8 h-8 hover:bg-muted"
                  >
                    <MoreVertical className="w-4 h-4 text-foreground" />
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-48 bg-background border-2 border-border rounded-xl p-1 shadow-xl">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 px-2 py-1.5">
                      Session Options
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border mx-1" />
                    
                    <DropdownMenuItem 
                      className="flex items-center px-2 py-2 rounded-lg text-xs font-bold text-foreground cursor-pointer focus:bg-muted"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = (e) => importChatFromJson(activeChat.id, e as any);
                        input.click();
                      }}
                    >
                      <Upload className="w-3.5 h-3.5 mr-2" />
                      Import Chat
                    </DropdownMenuItem>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex items-center px-2 py-2 rounded-lg text-xs font-bold text-foreground cursor-pointer focus:bg-muted">
                        <Download className="w-3.5 h-3.5 mr-2" />
                        Export Chat
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-background border-2 border-border rounded-xl p-1 shadow-xl">
                        <DropdownMenuItem 
                          className="flex items-center px-2 py-2 rounded-lg text-xs font-bold text-foreground cursor-pointer focus:bg-muted"
                          onClick={() => exportChatAsJson(activeChat)}
                        >
                          <FileText className="w-3.5 h-3.5 mr-2" />
                          JSON Format
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center px-2 py-2 rounded-lg text-xs font-bold text-foreground cursor-pointer focus:bg-muted"
                          onClick={() => exportChatAsTxt(activeChat)}
                        >
                          <FileDown className="w-3.5 h-3.5 mr-2" />
                          TXT Format
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator className="bg-border mx-1" />

                    <DropdownMenuItem 
                      className="flex items-center px-2 py-2 rounded-lg text-xs font-bold text-amber-600 cursor-pointer focus:bg-amber-50 dark:focus:bg-amber-900/20"
                      onClick={() => {
                        setChatToReset(activeChat.id);
                        setIsResetDialogOpen(true);
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-2" />
                      Reset / Restart Chat
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      className="flex items-center px-2 py-2 rounded-lg text-xs font-bold text-red-600 cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20"
                      onClick={() => {
                        setChatToDelete(activeChat.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-8 h-8 hover:bg-muted"
              onClick={toggleTheme}
            >
              {theme === "light" ? <Moon className="w-4 h-4 text-foreground" /> : <Sun className="w-4 h-4 text-foreground" />}
            </Button>
          </div>
        </header>

        {/* Chat Area */}
        <div 
          className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth custom-scrollbar relative" 
          ref={scrollRef}
        >
          <AnimatePresence mode="wait">
            {isAssistantActive ? (
              <motion.div
                key="assistant-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-12"
              >
                <div className="relative">
                  {/* Ripple Effects */}
                  <AnimatePresence>
                    {(isListening || isSpeaking) && (
                      <>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1.5, opacity: 0.2 }}
                          exit={{ scale: 2, opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute inset-0 bg-primary rounded-full blur-2xl"
                        />
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1.8, opacity: 0.1 }}
                          exit={{ scale: 2.5, opacity: 0 }}
                          transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                          className="absolute inset-0 bg-accent rounded-full blur-3xl"
                        />
                      </>
                    )}
                  </AnimatePresence>

                  <motion.div
                    animate={{ 
                      scale: isListening ? [1, 1.05, 1] : 1,
                      y: isSpeaking ? [0, -5, 0] : 0
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="relative w-56 h-56 bg-gradient-to-br from-primary via-accent to-secondary rounded-[3rem] flex items-center justify-center border-8 border-white/20 shadow-[0_0_50px_rgba(0,86,179,0.3)] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
                    <Bot className="relative w-28 h-28 text-white drop-shadow-2xl" />
                    
                    {/* Status Indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            height: (isListening || isSpeaking) ? [4, 12, 4] : 4,
                            opacity: (isListening || isSpeaking) ? 1 : 0.3
                          }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className="w-1.5 bg-white rounded-full"
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                      GENIUS ASSISTANT
                    </h2>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
                      {isListening ? "Listening to you..." : isSpeaking ? "Genius is speaking" : "Ready to help"}
                    </p>
                  </div>

                  <div className="min-h-[120px] flex items-center justify-center px-6">
                    <AnimatePresence mode="wait">
                      {isSpeaking ? (
                        <motion.div
                          key="speaking-text"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-foreground text-2xl font-bold max-w-md mx-auto leading-tight italic"
                        >
                          "{messages[messages.length - 1]?.content.slice(0, 120)}..."
                        </motion.div>
                      ) : isListening ? (
                        <motion.div
                          key="listening-text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center gap-4"
                        >
                          <div className="flex gap-2">
                            {[0, 1, 2].map(i => (
                              <motion.div
                                key={i}
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                className="w-3 h-3 bg-primary rounded-full"
                              />
                            ))}
                          </div>
                          <p className="text-lg font-medium text-muted-foreground">Go ahead, I'm listening...</p>
                        </motion.div>
                      ) : (
                        <motion.p
                          key="status-text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-lg font-medium text-muted-foreground"
                        >
                          Tap the button below to start talking
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                  {!isAssistantActive ? (
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full px-16 h-24 text-2xl font-black bg-primary text-white hover:bg-primary/90 shadow-2xl border-4 border-primary/20"
                      onClick={toggleAssistant}
                    >
                      <Mic className="w-10 h-10 mr-4" /> START ASSISTANT
                    </Button>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <Button
                        variant="outline"
                        size="lg"
                        className={cn(
                          "rounded-full px-16 h-24 text-2xl font-black transition-all shadow-2xl border-4 group relative overflow-hidden",
                          isListening ? "bg-red-500 text-white border-red-400 scale-110" : 
                          isSpeaking ? "bg-primary text-white border-primary/20" :
                          "bg-background hover:bg-primary hover:text-white border-primary/10"
                        )}
                        onClick={() => {
                          if (isSpeaking) {
                            window.speechSynthesis.cancel();
                            setIsSpeaking(null);
                          } else {
                            toggleListening();
                          }
                        }}
                      >
                        <div className="relative z-10 flex items-center">
                          {isListening ? (
                            <motion.div 
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              className="flex items-center"
                            >
                              <StopCircle className="w-10 h-10 mr-4" /> STOP
                            </motion.div>
                          ) : isSpeaking ? (
                            <><VolumeX className="w-10 h-10 mr-4" /> STOP GENIUS</>
                          ) : (
                            <><Mic className="w-10 h-10 mr-4 group-hover:scale-125 transition-transform" /> START TALKING</>
                          )}
                        </div>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 font-bold hover:text-red-600 hover:bg-red-50"
                        onClick={toggleAssistant}
                      >
                        <Power className="w-4 h-4 mr-2" /> STOP ASSISTANT
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="lg" className="rounded-full h-14 px-6 font-bold gap-2 hover:bg-muted">
                          <Languages className="w-5 h-5" />
                          {assistantLanguage === "en-IN" ? "English" : "हिन्दी"}
                        </Button>
                      } />
                      <DropdownMenuContent align="center" className="w-48 bg-background border-2 border-border rounded-xl p-1 shadow-xl">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 px-2 py-1.5">Language / भाषा</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-border mx-1" />
                        </DropdownMenuGroup>
                        <DropdownMenuItem 
                          className="flex items-center px-2 py-2 rounded-lg text-xs font-bold text-foreground cursor-pointer focus:bg-muted"
                          onClick={() => setAssistantLanguage("en-IN")}
                        >
                          English (India) {assistantLanguage === "en-IN" && "✓"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center px-2 py-2 rounded-lg text-xs font-bold text-foreground cursor-pointer focus:bg-muted"
                          onClick={() => setAssistantLanguage("hi-IN")}
                        >
                          Hindi (हिन्दी) {assistantLanguage === "hi-IN" && "✓"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="chat-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl mx-auto space-y-6 pb-12"
              >
                <div className="space-y-6 py-10">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center text-foreground/20 shadow-inner"
                      >
                        <BrainCircuit className="w-10 h-10" />
                      </motion.div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">GenGenius</h2>
                        <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-[0.2em]">Select a subject to start learning</p>
                      </div>
                    </div>
                  )}
                  {renderedMessages.map((msg, idx) => (
                    <ChatMessage 
                      key={msg.id}
                      msg={msg}
                      idx={idx}
                      messagesCount={renderedMessages.length}
                      activeChatId={activeChatId}
                      setChats={setChats}
                      isSpeaking={isSpeaking}
                      speakText={speakText}
                      handleRetry={() => handleSend(msg.content)}
                      handleSend={handleSend}
                      relatedTopics={relatedTopics}
                    />
                  ))}
                  
                  {streamingMessage && (
                    <ChatMessage 
                      msg={streamingMessage}
                      idx={renderedMessages.length}
                      messagesCount={renderedMessages.length + 1}
                      activeChatId={activeChatId}
                      setChats={setChats}
                      isSpeaking={isSpeaking}
                      speakText={speakText}
                      handleRetry={() => {}}
                      handleSend={handleSend}
                      relatedTopics={[]}
                    />
                  )}
                </div>
                
                {isLoading && !streamingMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="flex justify-start"
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2 px-5 py-3 bg-muted/30 rounded-2xl border border-border/50">
                        <div className="flex space-x-1.5">
                          {[0, 1, 2].map((i) => (
                            <motion.div 
                              key={i}
                              animate={{ 
                                scale: [1, 1.5, 1],
                                opacity: [0.4, 1, 0.4]
                              }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 1, 
                                delay: i * 0.2,
                                ease: "easeInOut"
                              }}
                              className="w-1.5 h-1.5 bg-primary rounded-full" 
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 ml-2">
                          Genius is thinking...
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Jump to Latest Button */}
          <AnimatePresence>
            {showJumpToBottom && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="fixed bottom-32 right-8 z-50"
              >
                <Button
                  size="icon"
                  className="rounded-full w-10 h-10 shadow-lg bg-black dark:bg-white text-white dark:text-black hover:scale-110 transition-transform"
                  onClick={() => scrollToBottom(true, true)}
                >
                  <ChevronDown className="w-6 h-6" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area - Hidden in Assistant Mode */}
        {!isAssistantActive && (
          <ChatInput 
            onSend={handleSend}
            isLoading={isLoading}
            isAssistantActive={isAssistantActive}
            setIsAssistantActive={setIsAssistantActive}
            isListening={isListening}
            toggleListening={toggleListening}
            handleFileChange={handleFileChange}
            attachedFiles={attachedFiles}
            removeFile={removeFile}
            handleTaskAction={handleTaskAction}
            stopGeneration={stopGeneration}
            recognitionRef={recognitionRef}
            setIsListening={setIsListening}
            input={input}
            setInput={setInput}
          />
        )}
    </main>

      {/* Lazy Loaded Dialogs */}
      <Suspense fallback={null}>
        <SettingsDialog
          isOpen={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          user={user}
          profile={profile}
          setProfile={setProfile}
          exportAllData={exportAllData}
          importData={importData}
          setIsRecycleBinOpen={setIsRecycleBinOpen}
          handleLogout={handleLogout}
          handleGoogleLogin={handleGoogleLogin}
          loginError={loginError}
        />

        <ConfirmationDialog
          isOpen={isResetDialogOpen}
          onOpenChange={setIsResetDialogOpen}
          title="Reset Chat?"
          description="This will clear all messages in this session."
          message="Are you sure you want to reset this session? This action cannot be undone."
          onConfirm={() => chatToReset && resetChat(chatToReset)}
          confirmText="Reset Session"
          variant="amber"
        />

        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Delete Chat?"
          description="This will move the session to the Recycle Bin."
          message="Are you sure you want to delete this session? You can restore it from the Recycle Bin within 48 hours."
          onConfirm={() => chatToDelete && confirmDeleteChat(chatToDelete)}
          confirmText="Delete Session"
          variant="destructive"
        />

        <RecycleBinDialog
          isOpen={isRecycleBinOpen}
          onOpenChange={setIsRecycleBinOpen}
          deletedChats={deletedChats}
          restoreChat={restoreChat}
          permanentlyDeleteChat={permanentlyDeleteChat}
        />
      </Suspense>
    </div>
  );
}

export default App;



