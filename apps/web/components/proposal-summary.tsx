import ReactMarkdown from "react-markdown";

type ProposalSummaryProps = {
  content: string;
};

export function ProposalSummary({ content }: ProposalSummaryProps) {
  return (
    <ReactMarkdown
      components={{
        h2: ({ children }) => (
          <h3 className="mt-4 text-sm font-semibold text-foreground first:mt-0">
            {children}
          </h3>
        ),
        h3: ({ children }) => (
          <h4 className="mt-3 text-sm font-medium text-foreground">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {children}
          </ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        strong: ({ children }) => (
          <strong className="font-medium text-foreground">{children}</strong>
        ),
        code: ({ children }) => (
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
            {children}
          </code>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
