/**
 * DualDialogueNode — Side-by-side dialogue for two characters
 * 
 * Lexical node for dual dialogue (concurrent speech)
 */

import {
  DecoratorNode,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  createCommand,
} from 'lexical';
import { ReactNode, useState } from 'react';

export type SerializedDualDialogueNode = Spread<
  {
    leftCharacter: string;
    leftDialogue: string;
    leftParenthetical?: string;
    rightCharacter: string;
    rightDialogue: string;
    rightParenthetical?: string;
  },
  SerializedLexicalNode
>;

export const TOGGLE_DUAL_DIALOGUE_COMMAND = createCommand<void>('TOGGLE_DUAL_DIALOGUE');

export class DualDialogueNode extends DecoratorNode<ReactNode> {
  __leftCharacter: string;
  __leftDialogue: string;
  __leftParenthetical?: string;
  __rightCharacter: string;
  __rightDialogue: string;
  __rightParenthetical?: string;

  static getType(): string {
    return 'dual-dialogue';
  }

  static clone(node: DualDialogueNode): DualDialogueNode {
    return new DualDialogueNode(
      node.__leftCharacter,
      node.__leftDialogue,
      node.__leftParenthetical,
      node.__rightCharacter,
      node.__rightDialogue,
      node.__rightParenthetical,
      node.__key
    );
  }

  constructor(
    leftCharacter: string = '',
    leftDialogue: string = '',
    leftParenthetical: string | undefined = undefined,
    rightCharacter: string = '',
    rightDialogue: string = '',
    rightParenthetical: string | undefined = undefined,
    key?: NodeKey
  ) {
    super(key);
    this.__leftCharacter = leftCharacter;
    this.__leftDialogue = leftDialogue;
    this.__leftParenthetical = leftParenthetical;
    this.__rightCharacter = rightCharacter;
    this.__rightDialogue = rightDialogue;
    this.__rightParenthetical = rightParenthetical;
  }

  static importJSON(serializedNode: SerializedDualDialogueNode): DualDialogueNode {
    return $createDualDialogueNode(
      serializedNode.leftCharacter,
      serializedNode.leftDialogue,
      serializedNode.leftParenthetical,
      serializedNode.rightCharacter,
      serializedNode.rightDialogue,
      serializedNode.rightParenthetical
    );
  }

  exportJSON(): SerializedDualDialogueNode {
    return {
      type: 'dual-dialogue',
      version: 1,
      leftCharacter: this.__leftCharacter,
      leftDialogue: this.__leftDialogue,
      leftParenthetical: this.__leftParenthetical,
      rightCharacter: this.__rightCharacter,
      rightDialogue: this.__rightDialogue,
      rightParenthetical: this.__rightParenthetical,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'dual-dialogue-container';
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  // Setters
  setLeftCharacter(character: string): void {
    const self = this.getWritable();
    self.__leftCharacter = character;
  }

  setLeftDialogue(dialogue: string): void {
    const self = this.getWritable();
    self.__leftDialogue = dialogue;
  }

  setLeftParenthetical(parenthetical: string | undefined): void {
    const self = this.getWritable();
    self.__leftParenthetical = parenthetical;
  }

  setRightCharacter(character: string): void {
    const self = this.getWritable();
    self.__rightCharacter = character;
  }

  setRightDialogue(dialogue: string): void {
    const self = this.getWritable();
    self.__rightDialogue = dialogue;
  }

  setRightParenthetical(parenthetical: string | undefined): void {
    const self = this.getWritable();
    self.__rightParenthetical = parenthetical;
  }

  // Getters
  getLeftCharacter(): string {
    return this.__leftCharacter;
  }

  getLeftDialogue(): string {
    return this.__leftDialogue;
  }

  getLeftParenthetical(): string | undefined {
    return this.__leftParenthetical;
  }

  getRightCharacter(): string {
    return this.__rightCharacter;
  }

  getRightDialogue(): string {
    return this.__rightDialogue;
  }

  getRightParenthetical(): string | undefined {
    return this.__rightParenthetical;
  }

  decorate(): ReactNode {
    return (
      <DualDialogueComponent
        leftCharacter={this.__leftCharacter}
        leftDialogue={this.__leftDialogue}
        leftParenthetical={this.__leftParenthetical}
        rightCharacter={this.__rightCharacter}
        rightDialogue={this.__rightDialogue}
        rightParenthetical={this.__rightParenthetical}
        nodeKey={this.__key}
      />
    );
  }
}

export function $createDualDialogueNode(
  leftCharacter: string = '',
  leftDialogue: string = '',
  leftParenthetical?: string,
  rightCharacter: string = '',
  rightDialogue: string = '',
  rightParenthetical?: string
): DualDialogueNode {
  return new DualDialogueNode(
    leftCharacter,
    leftDialogue,
    leftParenthetical,
    rightCharacter,
    rightDialogue,
    rightParenthetical
  );
}

export function $isDualDialogueNode(node: LexicalNode | null | undefined): node is DualDialogueNode {
  return node instanceof DualDialogueNode;
}

// React component for rendering dual dialogue
interface DualDialogueComponentProps {
  leftCharacter: string;
  leftDialogue: string;
  leftParenthetical?: string;
  rightCharacter: string;
  rightDialogue: string;
  rightParenthetical?: string;
  nodeKey: string;
}

function DualDialogueComponent({
  leftCharacter,
  leftDialogue,
  leftParenthetical,
  rightCharacter,
  rightDialogue,
  rightParenthetical,
  nodeKey,
}: DualDialogueComponentProps) {
  const [_isEditing, setIsEditing] = useState(false);


  return (
    <div 
      className="dual-dialogue grid grid-cols-2 gap-4 my-4 font-mono text-sm"
      data-lexical-dual-dialogue={nodeKey}
      onClick={() => setIsEditing(true)}
    >
      {/* Left Side */}
      <div className="dual-dialogue-left">
        <div className="text-center uppercase font-bold text-white/90 mb-1">
          {leftCharacter || 'CHARACTER 1'}
        </div>
        {leftParenthetical && (
          <div className="text-center text-white/60 text-xs mb-1">
            ({leftParenthetical})
          </div>
        )}
        <div className="text-center text-white/80 leading-relaxed">
          {leftDialogue || 'Dialogue goes here...'}
        </div>
      </div>

      {/* Right Side */}
      <div className="dual-dialogue-right">
        <div className="text-center uppercase font-bold text-white/90 mb-1">
          {rightCharacter || 'CHARACTER 2'}
        </div>
        {rightParenthetical && (
          <div className="text-center text-white/60 text-xs mb-1">
            ({rightParenthetical})
          </div>
        )}
        <div className="text-center text-white/80 leading-relaxed">
          {rightDialogue || 'Dialogue goes here...'}
        </div>
      </div>

      {/* Visual indicator */}
      <div className="col-span-2 flex items-center justify-center mt-2">
        <span className="text-[10px] text-violet-400/50 uppercase tracking-wider">
          DUAL DIALOGUE
        </span>
      </div>
    </div>
  );
}
