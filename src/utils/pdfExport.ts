/**
 * PDF Export — Industry-standard screenplay format
 * 
 * Generates a properly formatted screenplay PDF:
 * - US Letter (8.5" x 11")
 * - Courier 12pt font
 * - Proper margins
 * - Page numbers
 */

import { LexicalEditor, $getRoot } from 'lexical';
import {
  $isSceneHeadingNode,
  $isActionNode,
  $isCharacterNode,
  $isDialogueNode,
  $isParentheticalNode,
  $isTransitionNode,
} from '../components/editor/nodes/ScriptNodes';

interface PDFLine {
  text: string;
  type: string;
  indent: number;
}

// Element margin mappings for PDF generation

const ELEMENT_MARGINS = {
  'scene-heading': { left: 0, right: 0 },
  'action': { left: 0, right: 0 },
  'character': { left: 2.2, right: 0 }, // 3.7" from left edge
  'dialogue': { left: 1.0, right: 2.0 }, // 2.5" column
  'parenthetical': { left: 1.6, right: 2.0 },
  'transition': { left: 4.0, right: 0 }, // Right-aligned
  'paragraph': { left: 0, right: 0 },
};

function getNodeType(node: any): string {
  if ($isSceneHeadingNode(node)) return 'scene-heading';
  if ($isActionNode(node)) return 'action';
  if ($isCharacterNode(node)) return 'character';
  if ($isDialogueNode(node)) return 'dialogue';
  if ($isParentheticalNode(node)) return 'parenthetical';
  if ($isTransitionNode(node)) return 'transition';
  return 'paragraph';
}

/**
 * Extract screenplay content for PDF generation
 */
export function extractContentForPDF(editor: LexicalEditor): PDFLine[] {
  const lines: PDFLine[] = [];
  
  editor.getEditorState().read(() => {
    const root = $getRoot();
    const children = root.getChildren();
    
    children.forEach((node) => {
      const type = getNodeType(node);
      const text = node.getTextContent();
      const margins = ELEMENT_MARGINS[type as keyof typeof ELEMENT_MARGINS] || { left: 0, right: 0 };
      
      if (text.trim()) {
        lines.push({
          text: type === 'scene-heading' || type === 'character' ? text.toUpperCase() : text,
          type,
          indent: margins.left,
        });
      }
    });
  });
  
  return lines;
}

/**
 * Generate PDF using browser's print functionality
 * This creates a print-optimized HTML page
 */
export function generatePrintHTML(editor: LexicalEditor, title: string = 'Untitled'): string {
  const lines = extractContentForPDF(editor);
  
  const contentHTML = lines.map((line) => {
    let className = '';
    
    switch (line.type) {
      case 'scene-heading':
        className = 'scene-heading';
        break;
      case 'action':
        className = 'action';
        break;
      case 'character':
        className = 'character';
        break;
      case 'dialogue':
        className = 'dialogue';
        break;
      case 'parenthetical':
        className = 'parenthetical';
        break;
      case 'transition':
        className = 'transition';
        break;
      default:
        className = 'action';
    }
    
    return `<p class="${className}">${escapeHTML(line.text)}</p>`;
  }).join('\n');
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(title)}</title>
  <style>
    @page {
      size: letter;
      margin: 1in 1in 1in 1.5in;
    }
    
    @media print {
      body { margin: 0; }
      .page-break { page-break-before: always; }
    }
    
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12pt;
      line-height: 1;
      color: #000;
      background: #fff;
      max-width: 6in;
      margin: 0 auto;
      padding: 1in;
    }
    
    p {
      margin: 0 0 12pt 0;
      orphans: 2;
      widows: 2;
    }
    
    .scene-heading {
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 24pt;
      margin-bottom: 12pt;
    }
    
    .action {
      /* Full width */
    }
    
    .character {
      text-transform: uppercase;
      margin-left: 2.2in;
      margin-top: 12pt;
      margin-bottom: 0;
    }
    
    .dialogue {
      margin-left: 1in;
      margin-right: 1.5in;
      margin-bottom: 12pt;
    }
    
    .parenthetical {
      margin-left: 1.6in;
      margin-right: 2in;
      font-style: italic;
    }
    
    .transition {
      text-align: right;
      text-transform: uppercase;
      margin-top: 12pt;
    }
    
    /* Title Page */
    .title-page {
      text-align: center;
      padding-top: 3in;
      page-break-after: always;
    }
    
    .title-page h1 {
      font-size: 24pt;
      text-transform: uppercase;
      margin-bottom: 24pt;
    }
    
    .title-page .author {
      font-size: 12pt;
    }
  </style>
</head>
<body>
  <div class="title-page">
    <h1>${escapeHTML(title)}</h1>
    <p class="author">Written by</p>
    <p class="author">Author Name</p>
  </div>
  
  <div class="content">
${contentHTML}
  </div>
</body>
</html>`;
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Open print dialog with screenplay content
 */
export function printScreenplay(editor: LexicalEditor, title?: string): void {
  const html = generatePrintHTML(editor, title);
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Export as PDF by creating a downloadable PDF
 * Uses browser's print-to-PDF functionality
 */
export function exportPDF(editor: LexicalEditor, title: string = 'screenplay'): void {
  const html = generatePrintHTML(editor, title);
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Add instruction overlay
    const overlay = printWindow.document.createElement('div');
    overlay.innerHTML = `
      <div style="position:fixed;top:0;left:0;right:0;background:#333;color:#fff;padding:10px;text-align:center;font-family:sans-serif;z-index:9999;">
        Press <strong>Ctrl+P</strong> (or ⌘+P on Mac) and select "Save as PDF" to export
        <button onclick="window.print()" style="margin-left:20px;padding:5px 15px;cursor:pointer;">Print / Save PDF</button>
        <button onclick="this.parentElement.remove()" style="margin-left:10px;padding:5px 10px;cursor:pointer;">×</button>
      </div>
    `;
    printWindow.document.body.appendChild(overlay);
  }
}
