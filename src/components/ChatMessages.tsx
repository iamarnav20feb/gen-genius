import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Message, Chat } from '../App';
import { BrainCircuit } from 'lucide-react';
import { ChatMessage } from './ChatMessage';

interface ChatMessagesProps {
  messages: Message[];
  renderedMessages: Message[];
  streamingMessage: Message | null;
  isLoading: boolean;
  activeChatId: string | null;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  isSpeaking: string | null;
  speakText: (text: string, id: string) => void;
  handleSend: (text: string) => void;
  relatedTopics: string[];
}

export const ChatMessages = memo(({
  messages,
  renderedMessages,
  streamingMessage,
  isLoading,
  activeChatId,
  setChats,
  isSpeaking,
  speakText,
  handleSend,
  relatedTopics
}: ChatMessagesProps) => {
  return (
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
          key={streamingMessage.id}
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
      
      {isLoading && !streamingMessage && (
        <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2 px-5 py-3 bg-muted/30 rounded-2xl border border-border/50">
              <div className="flex space-x-1.5">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i}
                    className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 ml-2">
                Genius is thinking...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
