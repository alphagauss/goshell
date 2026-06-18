import { useEffect, useRef } from "react";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { cn } from "@/lib/utils";

export function FileCodeEditor({
  value,
  onChange,
  readOnly = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hostRef.current) {
      return undefined;
    }

    const theme = EditorView.theme({
      "&": {
        height: "100%",
        backgroundColor: "var(--bg-terminal)",
        color: "var(--text-primary)",
        borderRadius: "8px",
        overflow: "hidden",
      },
      ".cm-scroller": {
        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
        fontSize: "13px",
      },
      ".cm-content, .cm-gutter": {
        paddingTop: "10px",
        paddingBottom: "10px",
      },
      ".cm-gutters": {
        backgroundColor: "var(--surface-1)",
        color: "var(--text-muted)",
        borderRight: "1px solid var(--border-subtle)",
      },
      ".cm-activeLine": {
        backgroundColor: "var(--surface-2)",
      },
      ".cm-focused .cm-selectionBackground, ::selection": {
        backgroundColor: "var(--primary-bg)",
      },
    });

    const extensions: Extension[] = [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      EditorView.lineWrapping,
      theme,
      EditorView.editable.of(!readOnly),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) {
          return;
        }

        onChangeRef.current(update.state.doc.toString());
      }),
    ];

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: hostRef.current,
    });
    viewRef.current = view;

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [readOnly]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }

    const currentValue = view.state.doc.toString();
    if (currentValue === value) {
      return;
    }

    view.dispatch({
      changes: { from: 0, to: currentValue.length, insert: value },
    });
  }, [value]);

  return <div ref={hostRef} className={cn("file-code-editor", className)} />;
}
