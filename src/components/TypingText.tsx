import { useState, useEffect, Suspense, lazy } from "react";
import { motion } from "motion/react";
import rehypeRaw from "rehype-raw";

const ReactMarkdown = lazy(() => import("react-markdown"));

export default function TypingText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      // Speed up typing for better performance - add multiple characters at once
      const charsToAdd = Math.max(1, Math.ceil(text.length / 100));
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, index + charsToAdd));
        setIndex((prev) => prev + charsToAdd);
      }, 5); 
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, onComplete]);

  return (
    <Suspense fallback={<div className="animate-pulse bg-muted h-4 w-full rounded" />}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <ReactMarkdown rehypePlugins={[rehypeRaw as any]}>{displayedText}</ReactMarkdown>
        </Suspense>
      </motion.div>
    </Suspense>
  );
}
