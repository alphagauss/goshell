import { cn } from "@/lib/utils";
import type { CompletionSuggestion } from "@/components/ssh/terminal/hooks/useCommandCompletion";

export function CompletionPopup({
  visible,
  suggestions,
  selectedIndex,
  position,
  onSelect,
}: {
  visible: boolean;
  suggestions: CompletionSuggestion[];
  selectedIndex: number;
  position: { top: number; left: number };
  onSelect: (index: number) => void;
}) {
  if (!visible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="terminal-completion-popup" style={{ top: position.top, left: position.left }}>
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion.type}-${suggestion.value}`}
          type="button"
          className={cn("terminal-completion-popup__item", index === selectedIndex && "is-active")}
          onClick={() => onSelect(index)}
        >
          <strong>{suggestion.display}</strong>
          <span>{suggestion.description}</span>
        </button>
      ))}
    </div>
  );
}
