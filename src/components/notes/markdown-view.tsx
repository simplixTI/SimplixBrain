"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export function MarkdownView({ content, className }: MarkdownViewProps) {
  if (!content.trim()) {
    return (
      <p className="text-sm italic text-muted-foreground">
        Nada por aqui ainda. Vá para o modo edição e comece a escrever.
      </p>
    );
  }
  return (
    <div
      className={cn(
        "prose prose-invert prose-sm max-w-none text-foreground/90",
        "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground",
        "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
        "prose-p:leading-relaxed prose-p:text-foreground/85",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-strong:text-foreground",
        "prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:rounded-md prose-pre:border prose-pre:border-border prose-pre:bg-card/80",
        "prose-blockquote:border-l-primary/60 prose-blockquote:text-muted-foreground",
        "prose-hr:border-border/60",
        "prose-li:marker:text-muted-foreground",
        "prose-ul:pl-5 prose-ol:pl-5",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
