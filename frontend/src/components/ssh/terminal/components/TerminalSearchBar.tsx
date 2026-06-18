import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";

export function TerminalSearchBar({
  visible,
  query,
  resultCount,
  currentIndex,
  onQueryChange,
  onNext,
  onPrev,
  onClose,
  inputRef,
}: {
  visible: boolean;
  query: string;
  resultCount: number | null;
  currentIndex: number | null;
  onQueryChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
}) {
  if (!visible) {
    return null;
  }

  return (
    <div className="terminal-search-bar">
      <div className="terminal-search-bar__inner">
        <Search size={14} />
        <input
          ref={inputRef as RefObject<HTMLInputElement>}
          className="terminal-search-bar__input input-base"
          value={query}
          placeholder="搜索命令或输出"
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onNext();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            }
          }}
        />
        {typeof resultCount === "number" && typeof currentIndex === "number" ? (
          <span className="terminal-search-bar__counter">
            {resultCount > 0 ? `${currentIndex + 1}/${resultCount}` : "0/0"}
          </span>
        ) : null}
        <Button size="icon" variant="ghost" title="上一个" onClick={onPrev}>
          <ChevronUp size={14} />
        </Button>
        <Button size="icon" variant="ghost" title="下一个" onClick={onNext}>
          <ChevronDown size={14} />
        </Button>
        <Button size="icon" variant="ghost" title="关闭" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}
