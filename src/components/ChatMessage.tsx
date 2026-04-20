import React, { memo } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { 
  File as FileIcon, 
  Paperclip, 
  VolumeX, 
  Volume2, 
  RefreshCw 
} from 'lucide-react';
import { Message, Chat } from '../App';
import { cn } from '../lib/utils';
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  msg: Message;
  idx: number;
  messagesCount: number;
  activeChatId: string | null;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  isSpeaking: string | null;
  speakText: (text: string, id: string) => void;
  handleRetry: () => void;
  handleSend: (text: string) => void;
  relatedTopics: string[];
}

export const ChatMessage = memo(({ 
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
}: ChatMessageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
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
