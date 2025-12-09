import { ParagraphNode, SerializedParagraphNode, TextNode, SerializedTextNode, NodeKey, EditorConfig, LexicalNode, Spread } from "lexical";

// --- Token (Mention) ---
export type SerializedTokenNode = Spread<
  {
    data: string;
  },
  SerializedTextNode
>;

export class TokenNode extends TextNode {
  __data: string;

  static getType(): string {
    return "token";
  }

  static clone(node: TokenNode): TokenNode {
    return new TokenNode(node.getTextContent(), node.__data, node.__key);
  }

  constructor(text: string, data: string, key?: NodeKey) {
    super(text, key);
    this.__data = data;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add("script-token");
    dom.dataset.id = this.__data;
    return dom;
  }

  exportJSON(): SerializedTokenNode {
    return {
      ...super.exportJSON(),
      data: this.__data,
      type: "token",
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedTokenNode): TokenNode {
    const node = $createTokenNode(serializedNode.text, serializedNode.data);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }
}

export function $createTokenNode(text: string, data: string): TokenNode {
  return new TokenNode(text, data);
}

export function $isTokenNode(node: LexicalNode | null | undefined): node is TokenNode {
  return node instanceof TokenNode;
}

// --- Scene Heading ---
export type SerializedSceneHeadingNode = Spread<
  {
    isOmitted: boolean;
    isLocked: boolean;
  },
  SerializedParagraphNode
>;

export class SceneHeadingNode extends ParagraphNode {
  __isOmitted: boolean;
  __isLocked: boolean;

  static getType(): string {
    return "scene-heading";
  }

  static clone(node: SceneHeadingNode): SceneHeadingNode {
    const clone = new SceneHeadingNode(node.__key);
    clone.__isOmitted = node.__isOmitted;
    clone.__isLocked = node.__isLocked;
    return clone;
  }

  constructor(key?: NodeKey) {
    super(key);
    this.__isOmitted = false;
    this.__isLocked = false;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add("script-scene-heading");
    if (this.__isOmitted) {
      dom.classList.add("scene-omitted");
    }
    if (this.__isLocked) {
      dom.classList.add("scene-locked");
    }
    return dom;
  }

  updateDOM(prevNode: SceneHeadingNode, dom: HTMLElement): boolean {
    if (prevNode.__isOmitted !== this.__isOmitted) {
      if (this.__isOmitted) {
        dom.classList.add("scene-omitted");
      } else {
        dom.classList.remove("scene-omitted");
      }
    }
    if (prevNode.__isLocked !== this.__isLocked) {
      if (this.__isLocked) {
        dom.classList.add("scene-locked");
      } else {
        dom.classList.remove("scene-locked");
      }
    }
    return false;
  }

  exportJSON(): SerializedSceneHeadingNode {
    return {
      ...super.exportJSON(),
      isOmitted: this.__isOmitted,
      isLocked: this.__isLocked,
      type: "scene-heading",
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedSceneHeadingNode): SceneHeadingNode {
    const node = $createSceneHeadingNode();
    node.__isOmitted = serializedNode.isOmitted || false;
    node.__isLocked = serializedNode.isLocked || false;
    return node;
  }

  setOmitted(isOmitted: boolean): void {
    const self = this.getWritable();
    self.__isOmitted = isOmitted;
  }

  isOmitted(): boolean {
    return this.__isOmitted;
  }

  setLocked(isLocked: boolean): void {
    const self = this.getWritable();
    self.__isLocked = isLocked;
  }

  isLocked(): boolean {
    return this.__isLocked;
  }
}

export function $createSceneHeadingNode(): SceneHeadingNode {
  return new SceneHeadingNode();
}

export function $isSceneHeadingNode(node: any): boolean {
  return node instanceof SceneHeadingNode;
}

// --- Action ---
export class ActionNode extends ParagraphNode {
  static getType(): string {
    return "action";
  }

  static clone(node: ActionNode): ActionNode {
    return new ActionNode(node.__key);
  }

  createDOM(config: any): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add("script-action");
    return dom;
  }
}

export function $createActionNode(): ActionNode {
  return new ActionNode();
}

// --- Character ---
export class CharacterNode extends ParagraphNode {
  static getType(): string {
    return "character";
  }

  static clone(node: CharacterNode): CharacterNode {
    return new CharacterNode(node.__key);
  }

  createDOM(config: any): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add("script-character");
    return dom;
  }
}

export function $createCharacterNode(): CharacterNode {
  return new CharacterNode();
}

// --- Dialogue ---
export type SerializedDialogueNode = Spread<
  {
    alts: string[];
    activeAltIndex: number;
  },
  SerializedParagraphNode
>;

export class DialogueNode extends ParagraphNode {
  __alts: string[];
  __activeAltIndex: number;

  static getType(): string {
    return "dialogue";
  }

  static clone(node: DialogueNode): DialogueNode {
    const clone = new DialogueNode(node.__key);
    clone.__alts = [...node.__alts];
    clone.__activeAltIndex = node.__activeAltIndex;
    return clone;
  }

  constructor(key?: NodeKey) {
    super(key);
    this.__alts = [];
    this.__activeAltIndex = -1;
  }

  createDOM(config: any): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add("script-dialogue");
    // Dataset for debugging/testing
    if (this.__alts.length > 0) {
      dom.dataset.hasAlts = "true";
      dom.dataset.altCount = this.__alts.length.toString();
    }
    return dom;
  }

  updateDOM(prevNode: DialogueNode, dom: HTMLElement): boolean {
    if (prevNode.__alts.length !== this.__alts.length) {
      if (this.__alts.length > 0) {
        dom.dataset.hasAlts = "true";
        dom.dataset.altCount = this.__alts.length.toString();
      } else {
        delete dom.dataset.hasAlts;
        delete dom.dataset.altCount;
      }
    }
    return false;
  }

  exportJSON(): SerializedDialogueNode {
    return {
      ...super.exportJSON(),
      alts: this.__alts,
      activeAltIndex: this.__activeAltIndex,
      type: "dialogue",
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedDialogueNode): DialogueNode {
    const node = $createDialogueNode();
    node.__alts = serializedNode.alts || [];
    node.__activeAltIndex = serializedNode.activeAltIndex || -1;
    return node;
  }

  addAlt(text: string): void {
    const self = this.getWritable();
    // If we're adding an alt to a node that has none, store current text as first alt
    if (self.__alts.length === 0) {
      self.__alts.push(self.getTextContent());
      self.__activeAltIndex = 0;
    }
    self.__alts.push(text);
    // Switch to new alt
    self.__activeAltIndex = self.__alts.length - 1;
    // Update text content
    // Note: This relies on the caller or a command to actually set the text of the node
    // But ideally the node state update handles it. 
    // Wait, Lexical's text content is separate from node data. 
    // We'll handle the text update in the Command/Plugin, this just updates state.
  }

  getAlts(): string[] {
    return this.__alts;
  }

  getActiveAltIndex(): number {
    return this.__activeAltIndex;
  }

  setActiveAltIndex(index: number): void {
    const self = this.getWritable();
    if (index >= 0 && index < self.__alts.length) {
      self.__activeAltIndex = index;
    }
  }
}

export function $createDialogueNode(): DialogueNode {
  return new DialogueNode();
}

// --- Parenthetical ---
export class ParentheticalNode extends ParagraphNode {
  static getType(): string {
    return "parenthetical";
  }

  static clone(node: ParentheticalNode): ParentheticalNode {
    return new ParentheticalNode(node.__key);
  }

  createDOM(config: any): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add("script-parenthetical");
    return dom;
  }
}

export function $createParentheticalNode(): ParentheticalNode {
  return new ParentheticalNode();
}

export function $isParentheticalNode(node: LexicalNode | null | undefined): node is ParentheticalNode {
  return node instanceof ParentheticalNode;
}

// --- Action helper ---
export function $isActionNode(node: LexicalNode | null | undefined): node is ActionNode {
  return node instanceof ActionNode;
}

export function $isCharacterNode(node: LexicalNode | null | undefined): node is CharacterNode {
  return node instanceof CharacterNode;
}

export function $isDialogueNode(node: LexicalNode | null | undefined): node is DialogueNode {
  return node instanceof DialogueNode;
}

// --- Transition ---
export class TransitionNode extends ParagraphNode {
  static getType(): string {
    return "transition";
  }

  static clone(node: TransitionNode): TransitionNode {
    return new TransitionNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add("script-transition");
    return dom;
  }
}

export function $createTransitionNode(): TransitionNode {
  return new TransitionNode();
}

export function $isTransitionNode(node: LexicalNode | null | undefined): node is TransitionNode {
  return node instanceof TransitionNode;
}

// --- Shot ---
export class ShotNode extends ParagraphNode {
  static getType(): string {
    return "shot";
  }

  static clone(node: ShotNode): ShotNode {
    return new ShotNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add("script-shot");
    return dom;
  }
}

export function $createShotNode(): ShotNode {
  return new ShotNode();
}

export function $isShotNode(node: LexicalNode | null | undefined): node is ShotNode {
  return node instanceof ShotNode;
}

// --- Dual Dialogue Container ---
export class DualDialogueNode extends ParagraphNode {
  static getType(): string {
    return "dual-dialogue";
  }

  static clone(node: DualDialogueNode): DualDialogueNode {
    return new DualDialogueNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add("script-dual-dialogue");
    return dom;
  }
}

export function $createDualDialogueNode(): DualDialogueNode {
  return new DualDialogueNode();
}

export function $isDualDialogueNode(node: LexicalNode | null | undefined): node is DualDialogueNode {
  return node instanceof DualDialogueNode;
}
