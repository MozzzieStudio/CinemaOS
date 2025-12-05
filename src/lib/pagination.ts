/**
 * Screenplay Pagination Library
 * 
 * Calculates accurate page counts based on industry-standard screenplay formatting.
 * A standard screenplay page = ~55 lines (with 1" margins top/bottom)
 */

export interface PaginationResult {
  pageCount: number;
  lineCount: number;
  sceneCount: number;
  estimatedRuntime: number; // minutes (1 page ≈ 1 minute)
}

export interface ElementMetrics {
  type: string;
  text: string;
  lineCount: number;
}

// Lines per element type (including spacing)
const ELEMENT_LINE_COSTS: Record<string, { base: number; charsPerLine: number }> = {
  'scene-heading': { base: 2, charsPerLine: 60 },  // Scene heading + blank line after
  'action': { base: 1, charsPerLine: 60 },          // Action wraps at ~60 chars
  'character': { base: 1, charsPerLine: 38 },       // Character name (centered, shorter)
  'dialogue': { base: 1, charsPerLine: 35 },        // Dialogue is narrower (3.5" wide)
  'parenthetical': { base: 1, charsPerLine: 25 },   // Parenthetical is even narrower
  'transition': { base: 2, charsPerLine: 60 },      // Transition + blank line
  'page-break': { base: 55, charsPerLine: 1 },      // Forces new page
  'paragraph': { base: 1, charsPerLine: 60 },       // Default paragraph
};

const LINES_PER_PAGE = 55;

/**
 * Calculate how many lines a text block takes based on element type
 */
export function calculateElementLines(type: string, text: string): number {
  const metrics = ELEMENT_LINE_COSTS[type] || ELEMENT_LINE_COSTS['paragraph'];
  const textLength = text.trim().length;
  
  if (textLength === 0) {
    return metrics.base;
  }
  
  // Calculate line wraps
  const wrappedLines = Math.ceil(textLength / metrics.charsPerLine);
  return Math.max(metrics.base, wrappedLines);
}

/**
 * Calculate pagination from an array of elements
 */
export function calculatePagination(elements: { type: string; text: string }[]): PaginationResult {
  let totalLines = 0;
  let sceneCount = 0;
  
  for (const element of elements) {
    const lines = calculateElementLines(element.type, element.text);
    totalLines += lines;
    
    if (element.type === 'scene-heading') {
      sceneCount++;
    }
    
    // Page breaks force a new page
    if (element.type === 'page-break') {
      // Round up to nearest page
      totalLines = Math.ceil(totalLines / LINES_PER_PAGE) * LINES_PER_PAGE;
    }
  }
  
  const pageCount = Math.max(1, Math.ceil(totalLines / LINES_PER_PAGE));
  
  return {
    pageCount,
    lineCount: totalLines,
    sceneCount,
    estimatedRuntime: pageCount, // 1 page ≈ 1 minute rule
  };
}

/**
 * Extract elements from Lexical editor state for pagination
 */
export function extractElementsFromRoot(rootChildren: any[]): { type: string; text: string }[] {
  return rootChildren.map(node => {
    // Get the node type and normalize it (remove 'script-' prefix for PDF/pagination)
    let type = node.getType ? node.getType() : 'paragraph';
    type = type.replace('script-', ''); // 'script-scene-heading' -> 'scene-heading'
    
    return {
      type,
      text: node.getTextContent ? node.getTextContent() : '',
    };
  });
}
