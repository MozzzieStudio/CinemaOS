/**
 * ActBreakNode — Lexical node for Act Breaks
 * 
 * Renders centered, bold ACT markers (ACT ONE, ACT TWO, etc.)
 */

import {
  ParagraphNode,
  SerializedParagraphNode,
  NodeKey,
  EditorConfig,
  LexicalNode,
  Spread,
  createCommand,
  LexicalCommand,
} from "lexical";

export type SerializedActBreakNode = Spread<
  {
    actNumber: number;
  },
  SerializedParagraphNode
>;

export const INSERT_ACT_BREAK_COMMAND: LexicalCommand<number> = createCommand('INSERT_ACT_BREAK');

const ACT_LABELS: Record<number, string> = {
  1: 'ACT ONE',
  2: 'ACT TWO',
  3: 'ACT THREE',
  4: 'ACT FOUR',
  5: 'ACT FIVE',
};

export class ActBreakNode extends ParagraphNode {
  __actNumber: number;

  static getType(): string {
    return "act-break";
  }

  static clone(node: ActBreakNode): ActBreakNode {
    const clone = new ActBreakNode(node.__actNumber, node.__key);
    return clone;
  }

  constructor(actNumber: number = 1, key?: NodeKey) {
    super(key);
    this.__actNumber = actNumber;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add("script-act-break");
    dom.setAttribute("data-act", String(this.__actNumber));
    return dom;
  }

  updateDOM(prevNode: ActBreakNode, dom: HTMLElement): boolean {
    if (prevNode.__actNumber !== this.__actNumber) {
      dom.setAttribute("data-act", String(this.__actNumber));
    }
    return false;
  }

  exportJSON(): SerializedActBreakNode {
    return {
      ...super.exportJSON(),
      actNumber: this.__actNumber,
      type: "act-break",
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedActBreakNode): ActBreakNode {
    return new ActBreakNode(serializedNode.actNumber || 1);
  }

  getActNumber(): number {
    return this.__actNumber;
  }

  setActNumber(actNumber: number): void {
    const self = this.getWritable();
    self.__actNumber = actNumber;
  }

  getActLabel(): string {
    return ACT_LABELS[this.__actNumber] || `ACT ${this.__actNumber}`;
  }

  // Prevent deleting the node with backspace when empty
  canBeEmpty(): boolean {
    return false;
  }
}

export function $createActBreakNode(actNumber: number = 1): ActBreakNode {
  return new ActBreakNode(actNumber);
}

export function $isActBreakNode(node: LexicalNode | null | undefined): node is ActBreakNode {
  return node instanceof ActBreakNode;
}
