/**
 * ScriptFormattingPlugin — Auto-format screenplay elements
 * 
 * Professional screenplay formatting on Tab and Enter:
 * - Tab cycles: Action → Character → Dialogue → Parenthetical → Action
 * - After Scene Heading → Action
 * - After Character → Dialogue
 * - Enter preserves element or cycles
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isParagraphNode,
  COMMAND_PRIORITY_HIGH,
  KEY_TAB_COMMAND,
  KEY_ENTER_COMMAND,
  LexicalNode,
  ParagraphNode,
} from "lexical";
import { useEffect } from "react";
import {
  $createSceneHeadingNode,
  $createActionNode,
  $createCharacterNode,
  $createDialogueNode,
  $createParentheticalNode,
  $isSceneHeadingNode,
  $isCharacterNode,
  $isDialogueNode,
  $isParentheticalNode,
} from "../nodes/ScriptNodes";

type ElementType = 'scene' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'shot';

// Scene heading patterns
const SCENE_HEADING_PATTERNS = [
  /^(INT|EXT|INT\.?\/EXT|I\/E)[\.\s]/i,
  /^(INTERIOR|EXTERIOR)/i,
];

// Transition patterns
const TRANSITION_PATTERNS = [
  /^(CUT TO|FADE TO|DISSOLVE TO|SMASH CUT TO|MATCH CUT TO|JUMP CUT TO|FADE OUT|FADE IN|FLASHBACK)/i,
  /(CUT TO|FADE OUT|FADE IN):?\s*$/i,
];

// Shot patterns
const SHOT_PATTERNS = [
  /^(CLOSE ON|CLOSE UP|WIDE SHOT|MEDIUM SHOT|POV|ANGLE ON|INSERT|FLASHBACK|DREAM SEQUENCE|BACK TO|END FLASHBACK)/i,
];

function getElementType(node: LexicalNode | null): ElementType {
  if (!node) return 'action';
  if ($isSceneHeadingNode(node)) return 'scene';
  if ($isCharacterNode(node)) return 'character';
  if ($isDialogueNode(node)) return 'dialogue';
  if ($isParentheticalNode(node)) return 'parenthetical';
  return 'action';
}

function createNodeForType(type: ElementType): ParagraphNode {
  switch (type) {
    case 'scene':
      return $createSceneHeadingNode();
    case 'character':
      return $createCharacterNode();
    case 'dialogue':
      return $createDialogueNode();
    case 'parenthetical':
      return $createParentheticalNode();
    case 'action':
    default:
      return $createActionNode();
  }
}

// Tab cycling order
const TAB_CYCLE: Record<ElementType, ElementType> = {
  'action': 'character',
  'character': 'dialogue',
  'dialogue': 'parenthetical',
  'parenthetical': 'action',
  'scene': 'action',
  'transition': 'scene',
  'shot': 'action',
};

// Enter behavior: what comes next
const ENTER_NEXT: Record<ElementType, ElementType> = {
  'scene': 'action',
  'action': 'action',
  'character': 'dialogue',
  'dialogue': 'action',
  'parenthetical': 'dialogue',
  'transition': 'scene',
  'shot': 'action',
};

export default function ScriptFormattingPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Auto-detect element type based on content
    const removeTextListener = editor.registerNodeTransform(ParagraphNode, (node) => {
      const text = node.getTextContent().trim().toUpperCase();
      
      // Skip if already a specialized node
      if (!$isParagraphNode(node)) return;
      
      // Check for scene heading
      for (const pattern of SCENE_HEADING_PATTERNS) {
        if (pattern.test(text)) {
          const sceneNode = $createSceneHeadingNode();
          node.getChildren().forEach(child => sceneNode.append(child));
          node.replace(sceneNode);
          return;
        }
      }
      
      // Check for transition
      for (const pattern of TRANSITION_PATTERNS) {
        if (pattern.test(text)) {
          // Keep as action but add transition style
          node.setFormat('right');
          return;
        }
      }
      
      // Check for shot
      for (const pattern of SHOT_PATTERNS) {
        if (pattern.test(text)) {
          const sceneNode = $createSceneHeadingNode();
          node.getChildren().forEach(child => sceneNode.append(child));
          node.replace(sceneNode);
          return;
        }
      }
    });

    // Tab key handler
    const removeTabListener = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event: KeyboardEvent) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        event.preventDefault();

        const anchorNode = selection.anchor.getNode();
        const topNode = anchorNode.getTopLevelElement();
        
        if (!topNode) return false;

        const currentType = getElementType(topNode);
        const nextType = TAB_CYCLE[currentType];
        
        // If the current node is empty, convert it
        if (topNode.getTextContent().trim() === '') {
          const newNode = createNodeForType(nextType);
          topNode.replace(newNode);
          newNode.selectStart();
        } else {
          // Insert a new node of the next type after current
          const newNode = createNodeForType(nextType);
          topNode.insertAfter(newNode);
          newNode.selectStart();
        }

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Enter key handler
    const removeEnterListener = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const anchorNode = selection.anchor.getNode();
        const topNode = anchorNode.getTopLevelElement();
        
        if (!topNode) return false;

        const text = topNode.getTextContent().trim();
        const currentType = getElementType(topNode);

        // Double-enter on empty: go to Action
        if (text === '') {
          // Convert to action if not already
          if (currentType !== 'action') {
            const actionNode = $createActionNode();
            topNode.replace(actionNode);
            actionNode.selectStart();
            event?.preventDefault();
            return true;
          }
          return false; // Let default handle
        }

        // Detect character name (ALL CAPS at start of line)
        if (currentType === 'action' && /^[A-Z][A-Z\s]+$/.test(text) && text.length > 1) {
          // Convert current to character
          const charNode = $createCharacterNode();
          topNode.getChildren().forEach(child => charNode.append(child));
          topNode.replace(charNode);
          
          // Insert dialogue after
          const dialogueNode = $createDialogueNode();
          charNode.insertAfter(dialogueNode);
          dialogueNode.selectStart();
          
          event?.preventDefault();
          return true;
        }

        // Smart enter behavior
        const nextType = ENTER_NEXT[currentType];
        const newNode = createNodeForType(nextType);
        topNode.insertAfter(newNode);
        newNode.selectStart();
        
        event?.preventDefault();
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    return () => {
      removeTextListener();
      removeTabListener();
      removeEnterListener();
    };
  }, [editor]);

  return null;
}
