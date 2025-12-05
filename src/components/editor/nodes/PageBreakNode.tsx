/**
 * PageBreakNode — Manual page break for screenplay
 * 
 * Inserts a page break with visual indicator
 */

import {
  DecoratorNode,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  createCommand,
  COMMAND_PRIORITY_LOW,
  LexicalEditor,
} from 'lexical';
import { ReactNode } from 'react';

export type SerializedPageBreakNode = Spread<
  {
    type: 'page-break';
    version: 1;
  },
  SerializedLexicalNode
>;

export const INSERT_PAGE_BREAK_COMMAND = createCommand<void>('INSERT_PAGE_BREAK');

export class PageBreakNode extends DecoratorNode<ReactNode> {
  static getType(): string {
    return 'page-break';
  }

  static clone(node: PageBreakNode): PageBreakNode {
    return new PageBreakNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  static importJSON(_serializedNode: SerializedPageBreakNode): PageBreakNode {
    return $createPageBreakNode();
  }

  exportJSON(): SerializedPageBreakNode {
    return {
      type: 'page-break',
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'page-break-container';
    div.style.pageBreakAfter = 'always';
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  getTextContent(): string {
    return '\n';
  }

  isInline(): boolean {
    return false;
  }

  decorate(): ReactNode {
    return <PageBreakComponent nodeKey={this.__key} />;
  }
}

export function $createPageBreakNode(): PageBreakNode {
  return new PageBreakNode();
}

export function $isPageBreakNode(node: LexicalNode | null | undefined): node is PageBreakNode {
  return node instanceof PageBreakNode;
}

// React component for rendering page break
interface PageBreakComponentProps {
  nodeKey: string;
}

function PageBreakComponent({ nodeKey }: PageBreakComponentProps) {
  return (
    <div 
      className="page-break my-6 relative select-none"
      data-lexical-page-break={nodeKey}
      contentEditable={false}
    >
      {/* Dashed line */}
      <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-white/20" />
      
      {/* Label */}
      <div className="relative flex justify-center">
        <span className="px-4 py-1 bg-[#141414] text-[10px] uppercase tracking-widest text-white/30 font-medium">
          Page Break
        </span>
      </div>
      
      {/* Scissors icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
        ✂️
      </div>
    </div>
  );
}

// Plugin to register the page break command
export function registerPageBreakCommand(editor: LexicalEditor): () => void {
  return editor.registerCommand(
    INSERT_PAGE_BREAK_COMMAND,
    () => {
      editor.update(() => {
        const pageBreakNode = $createPageBreakNode();
        const selection = editor.getEditorState()._selection;
        if (selection) {
          selection.insertNodes([pageBreakNode]);
        }
      });
      return true;
    },
    COMMAND_PRIORITY_LOW
  );
}
