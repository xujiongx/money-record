"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";

type MarkdownTextProps = {
  content: string;
  /** 包裹层 class（如气泡内字数颜色由父级控制时可传 `text-inherit`） */
  className?: string;
};

/**
 * 将 Markdown 字符串渲染为 HTML 结构（无 raw HTML、无 remark-gfm 表格等扩展）。
 * 用于聊天助手等对排版有基本要求、但需限制 XSS 的场景。
 */
export function MarkdownText({ content, className = "" }: MarkdownTextProps) {
  return (
    <div className={["chat-markdown min-w-0 break-words", className].filter(Boolean).join(" ")}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-2 whitespace-pre-wrap last:mb-0">{children}</p>
          ),
          h1: ({ children }) => (
            <h3 className="mb-1.5 mt-3 border-b border-orange-100/80 pb-1 text-base font-semibold first:mt-0">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-1.5 mt-3 text-base font-semibold first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-2 list-disc space-y-0.5 pl-4 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal space-y-0.5 pl-4 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-stone-900">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="mb-2 border-l-[3px] border-orange-200/90 pl-2.5 text-stone-600 last:mb-0">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-orange-100/90" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-orange-600 underline decoration-orange-300 underline-offset-2 hover:text-orange-700"
            >
              {children}
            </a>
          ),
          pre: ({ children }) => (
            <pre className="mb-2 overflow-x-auto rounded-lg bg-stone-900/90 p-2.5 text-xs text-stone-100 last:mb-0 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit">
              {children as ReactNode}
            </pre>
          ),
          code: ({ className: codeClass, children }) => {
            const isFence =
              typeof codeClass === "string" && codeClass.includes("language-");
            if (isFence) {
              return (
                <code className={`block font-mono text-xs ${codeClass ?? ""}`}>
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-orange-100/80 px-1 py-0.5 font-mono text-[0.9em] text-stone-800">
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
