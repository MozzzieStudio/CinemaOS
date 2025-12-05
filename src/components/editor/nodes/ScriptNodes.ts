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
export type SerializedSceneHeadingNode = SerializedParagraphNode;

export class SceneHeadingNode extends ParagraphNode {
  static getType(): string {
    return "scene-heading";
  }

  static clone(node: SceneHeadingNode): SceneHeadingNode {
    return new SceneHeadingNode(node.__key);
  }

  createDOM(config: any): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add("script-scene-heading");
    return dom;
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
export class DialogueNode extends ParagraphNode {
  static getType(): string {
    return "dialogue";
  }

  static clone(node: DialogueNode): DialogueNode {
    return new DialogueNode(node.__key);
  }

  createDOM(config: any): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add("script-dialogue");
    return dom;
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
