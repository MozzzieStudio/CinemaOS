/**
 * ScriptNotesPlugin — Inline notes system for Cinema OS
 * 
 * Final Draft 13 parity: ScriptNotes with popovers, color-coding, and Navigator integration
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, LexicalCommand, createCommand } from "lexical";

export interface ScriptNote {
  id: string;
  elementKey: string;
  content: string;
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'orange';
  emoji?: string;
  createdAt: string;
  author: string;
}

export const ADD_NOTE_COMMAND: LexicalCommand<void> = createCommand('ADD_NOTE_COMMAND');
export const DELETE_NOTE_COMMAND: LexicalCommand<string> = createCommand('DELETE_NOTE_COMMAND');

// Global notes store (in real app, this would be SurrealDB)
let notesStore: ScriptNote[] = [];

export function getNotesForElement(elementKey: string): ScriptNote[] {
  return notesStore.filter(note => note.elementKey === elementKey);
}

export function getAllNotes(): ScriptNote[] {
  return [...notesStore];
}

export function addNote(note: Omit<ScriptNote, 'id' | 'createdAt'>): ScriptNote {
  const newNote: ScriptNote = {
    ...note,
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  notesStore.push(newNote);
  // Trigger re-render event
  window.dispatchEvent(new CustomEvent('notes-updated'));
  return newNote;
}

export function deleteNote(noteId: string): void {
  notesStore = notesStore.filter(note => note.id !== noteId);
  window.dispatchEvent(new CustomEvent('notes-updated'));
}

export default function ScriptNotesPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      ADD_NOTE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            const topLevelElement = node.getTopLevelElement();
            if (topLevelElement) {
              const elementKey = topLevelElement.getKey();
              // Trigger popover to open (via event)
              window.dispatchEvent(new CustomEvent('open-note-popover', { 
                detail: { elementKey } 
              }));
            }
          }
        });
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      DELETE_NOTE_COMMAND,
      (noteId: string) => {
        deleteNote(noteId);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}
