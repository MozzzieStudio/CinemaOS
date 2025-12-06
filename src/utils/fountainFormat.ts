/**
 * Fountain Format Parser & Exporter
 * 
 * Implements the Fountain markup syntax for screenplays.
 * Reference: https://fountain.io/syntax
 * 
 * Syntax:
 * - Scene headings: INT./EXT. or forced with .
 * - Action: Regular paragraphs
 * - Character: ALL CAPS on own line (or forced with @)
 * - Dialogue: Lines after character
 * - Parenthetical: (in parentheses)
 * - Transition: > RIGHT ALIGNED or ending with TO:
 * - Notes: [[double brackets]]
 * - Boneyard: /* comments * /
 * - Centered: >centered text<
 * - Page break: ===
 */

export interface FountainElement {
  type: 'scene-heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 
        'transition' | 'note' | 'page-break' | 'centered' | 'title-page';
  text: string;
  sceneNumber?: string;
  dual?: boolean;
}

export interface FountainTitlePage {
  title?: string;
  credit?: string;
  author?: string;
  source?: string;
  draftDate?: string;
  contact?: string;
  [key: string]: string | undefined;
}

export interface FountainDocument {
  titlePage?: FountainTitlePage;
  elements: FountainElement[];
}

/**
 * Parse Fountain text into structured elements
 */
export function parseFountain(text: string): FountainDocument {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const elements: FountainElement[] = [];
  let titlePage: FountainTitlePage | undefined;
  
  let i = 0;
  let inTitlePage = true;
  let inBoneyard = false;
  let currentCharacter: string | null = null;
  let titlePageData: Record<string, string> = {};

  // Check for title page (starts with key: value pairs)
  if (lines[0]?.includes(':')) {
    titlePage = {};
    while (i < lines.length) {
      const line = lines[i];
      
      // Empty line ends title page
      if (line.trim() === '') {
        i++;
        inTitlePage = false;
        break;
      }

      const match = line.match(/^([A-Za-z\s]+):\s*(.*)$/);
      if (match && inTitlePage) {
        const key = match[1].toLowerCase().replace(/\s+/g, '');
        const value = match[2];
        titlePageData[key] = value;
        i++;
      } else {
        inTitlePage = false;
        break;
      }
    }
    
    if (Object.keys(titlePageData).length > 0) {
      titlePage = {
        title: titlePageData.title,
        credit: titlePageData.credit,
        author: titlePageData.author || titlePageData.authors,
        source: titlePageData.source,
        draftDate: titlePageData.draftdate || titlePageData.date,
        contact: titlePageData.contact,
      };
    }
  }

  // Parse elements
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (trimmed === '') {
      currentCharacter = null;
      i++;
      continue;
    }

    // Boneyard (comments)
    if (trimmed.startsWith('/*')) {
      inBoneyard = true;
      i++;
      continue;
    }
    if (inBoneyard) {
      if (trimmed.endsWith('*/')) {
        inBoneyard = false;
      }
      i++;
      continue;
    }

    // Notes [[text]]
    const noteMatch = trimmed.match(/^\[\[(.+)\]\]$/);
    if (noteMatch) {
      elements.push({ type: 'note', text: noteMatch[1] });
      i++;
      continue;
    }

    // Page break ===
    if (trimmed === '===' || trimmed === '===') {
      elements.push({ type: 'page-break', text: '' });
      i++;
      continue;
    }

    // Centered text >text<
    const centeredMatch = trimmed.match(/^>(.+)<$/);
    if (centeredMatch) {
      elements.push({ type: 'centered', text: centeredMatch[1].trim() });
      i++;
      continue;
    }

    // Transition (ends with TO: or starts with >)
    if (trimmed.match(/^>/) && !trimmed.endsWith('<')) {
      elements.push({ type: 'transition', text: trimmed.slice(1).trim() });
      i++;
      continue;
    }
    if (trimmed.match(/TO:$/i) && trimmed === trimmed.toUpperCase()) {
      elements.push({ type: 'transition', text: trimmed });
      i++;
      continue;
    }

    // Scene heading (INT./EXT. or forced with .)
    const sceneMatch = trimmed.match(/^(\.)?(?:(INT|EXT|EST|INT\.\/EXT|INT\/EXT|I\/E)[.\s]+)?(.+?)(?:\s*#(.+)#)?$/i);
    if (sceneMatch) {
      const forced = sceneMatch[1] === '.';
      const prefix = sceneMatch[2];
      const location = sceneMatch[3];
      const sceneNum = sceneMatch[4];

      if (forced || prefix) {
        const sceneText = prefix ? `${prefix.toUpperCase()}. ${location}` : location;
        elements.push({ 
          type: 'scene-heading', 
          text: sceneText,
          sceneNumber: sceneNum
        });
        currentCharacter = null;
        i++;
        continue;
      }
    }

    // Character (ALL CAPS or forced with @)
    const characterMatch = trimmed.match(/^(@)?([A-Z][A-Z0-9\s\-.']+)(\s*\([^)]+\))?(\s*\^)?$/);
    if (characterMatch) {
      const forced = characterMatch[1] === '@';
      const name = characterMatch[2];
      const extension = characterMatch[3] || '';
      const dual = characterMatch[4] === '^';

      // Must be ALL CAPS (or forced)
      if (forced || name === name.toUpperCase()) {
        // Check if next line is dialogue or parenthetical
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && (nextLine.startsWith('(') || (nextLine && !nextLine.match(/^[A-Z]+[A-Z\s]*$/)))) {
          currentCharacter = name;
          elements.push({ 
            type: 'character', 
            text: name + extension,
            dual
          });
          i++;
          continue;
        }
      }
    }

    // Parenthetical (inside dialogue block)
    if (currentCharacter && trimmed.startsWith('(') && trimmed.endsWith(')')) {
      elements.push({ type: 'parenthetical', text: trimmed });
      i++;
      continue;
    }

    // Dialogue (after character)
    if (currentCharacter) {
      elements.push({ type: 'dialogue', text: trimmed });
      i++;
      continue;
    }

    // Default: Action
    elements.push({ type: 'action', text: trimmed });
    i++;
  }

  return { titlePage, elements };
}

/**
 * Export elements to Fountain format
 */
export function exportFountain(elements: FountainElement[], titlePage?: FountainTitlePage): string {
  const lines: string[] = [];

  // Title page
  if (titlePage) {
    if (titlePage.title) lines.push(`Title: ${titlePage.title}`);
    if (titlePage.credit) lines.push(`Credit: ${titlePage.credit}`);
    if (titlePage.author) lines.push(`Author: ${titlePage.author}`);
    if (titlePage.source) lines.push(`Source: ${titlePage.source}`);
    if (titlePage.draftDate) lines.push(`Draft date: ${titlePage.draftDate}`);
    if (titlePage.contact) lines.push(`Contact: ${titlePage.contact}`);
    
    if (lines.length > 0) {
      lines.push(''); // Empty line after title page
    }
  }

  let lastType: string | null = null;
  let lastWasDialogue = false;

  for (const element of elements) {
    // Add blank line before scene headings (except at start)
    if (element.type === 'scene-heading' && lines.length > 0) {
      lines.push('');
    }

    // Add blank line before character (unless after another dialogue element)
    if (element.type === 'character' && lastType && !lastWasDialogue) {
      lines.push('');
    }

    switch (element.type) {
      case 'scene-heading':
        let heading = element.text.toUpperCase();
        // Ensure it starts with INT./EXT.
        if (!heading.match(/^(INT|EXT|EST|INT\.\/EXT|INT\/EXT|I\/E)[.\s]/i)) {
          heading = '.' + heading; // Force scene heading
        }
        if (element.sceneNumber) {
          heading += ` #${element.sceneNumber}#`;
        }
        lines.push(heading);
        break;

      case 'action':
        // Add blank line before action (unless after scene heading)
        if (lastType && lastType !== 'scene-heading' && !lastWasDialogue) {
          lines.push('');
        }
        lines.push(element.text);
        break;

      case 'character':
        let charLine = element.text.toUpperCase();
        if (element.dual) {
          charLine += ' ^';
        }
        lines.push(charLine);
        break;

      case 'dialogue':
        lines.push(element.text);
        break;

      case 'parenthetical':
        let paren = element.text;
        if (!paren.startsWith('(')) paren = '(' + paren;
        if (!paren.endsWith(')')) paren = paren + ')';
        lines.push(paren);
        break;

      case 'transition':
        lines.push('> ' + element.text.toUpperCase());
        break;

      case 'note':
        lines.push(`[[${element.text}]]`);
        break;

      case 'page-break':
        lines.push('');
        lines.push('===');
        lines.push('');
        break;

      case 'centered':
        lines.push(`>${element.text}<`);
        break;
    }

    lastType = element.type;
    lastWasDialogue = ['character', 'dialogue', 'parenthetical'].includes(element.type);
  }

  return lines.join('\n');
}

/**
 * Convert Fountain elements to our internal format
 */
export function fountainToScript(doc: FountainDocument): { type: string; text: string }[] {
  return doc.elements
    .filter(e => e.type !== 'note') // Filter out notes for now
    .map(e => ({
      type: e.type,
      text: e.text,
    }));
}

/**
 * Convert our internal format to Fountain elements
 */
export function scriptToFountain(elements: { type: string; text: string }[]): FountainElement[] {
  return elements.map(e => ({
    type: e.type as FountainElement['type'],
    text: e.text,
  }));
}

/**
 * Load Fountain file
 */
export async function loadFountainFile(file: File): Promise<FountainDocument> {
  const text = await file.text();
  return parseFountain(text);
}

/**
 * Download as Fountain file
 */
export function downloadFountain(elements: FountainElement[], filename: string, titlePage?: FountainTitlePage): void {
  const content = exportFountain(elements, titlePage);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.fountain') ? filename : `${filename}.fountain`;
  a.click();
  URL.revokeObjectURL(url);
}
