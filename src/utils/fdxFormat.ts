/**
 * FDX Import/Export — Final Draft XML Format
 * 
 * FDX is Final Draft's native XML format.
 * We support round-trip editing.
 */

import { LexicalEditor, $getRoot, $createTextNode, SerializedLexicalNode, ParagraphNode } from 'lexical';
import {
  $createSceneHeadingNode,
  $createActionNode,
  $createCharacterNode,
  $createDialogueNode,
  $createParentheticalNode,
  $createTransitionNode,
} from '../components/editor/nodes/ScriptNodes';

// FDX Element type mapping - use ParagraphNode as base since all nodes extend it
const FDX_ELEMENT_MAP: Record<string, () => ParagraphNode> = {
  'Scene Heading': $createSceneHeadingNode,
  'Action': $createActionNode,
  'Character': $createCharacterNode,
  'Dialogue': $createDialogueNode,
  'Parenthetical': $createParentheticalNode,
  'Transition': $createTransitionNode,
  'General': $createActionNode,
};

const LEXICAL_TO_FDX: Record<string, string> = {
  'scene-heading': 'Scene Heading',
  'action': 'Action',
  'character': 'Character',
  'dialogue': 'Dialogue',
  'parenthetical': 'Parenthetical',
  'transition': 'Transition',
  'paragraph': 'General',
};

/**
 * Parse FDX file content into Lexical nodes
 */
export function parseFDX(xmlContent: string): SerializedLexicalNode[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  
  const nodes: SerializedLexicalNode[] = [];
  
  // Get all Paragraph elements
  const paragraphs = doc.querySelectorAll('Paragraph');
  
  paragraphs.forEach((para) => {
    const type = para.getAttribute('Type') || 'General';
    const textElements = para.querySelectorAll('Text');
    
    let textContent = '';
    textElements.forEach((text) => {
      textContent += text.textContent || '';
    });
    
    if (textContent.trim()) {
      nodes.push({
        type: mapFDXToLexical(type),
        version: 1,
        children: [{
          type: 'text',
          version: 1,
          text: textContent,
          format: 0,
          style: '',
          detail: 0,
          mode: 'normal',
        }],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
      } as SerializedLexicalNode);
    }
  });
  
  return nodes;
}

function mapFDXToLexical(fdxType: string): string {
  const mapping: Record<string, string> = {
    'Scene Heading': 'scene-heading',
    'Action': 'action',
    'Character': 'character',
    'Dialogue': 'dialogue',
    'Parenthetical': 'parenthetical',
    'Transition': 'transition',
    'General': 'paragraph',
  };
  return mapping[fdxType] || 'paragraph';
}

/**
 * Import FDX into a Lexical editor
 */
export function importFDX(editor: LexicalEditor, xmlContent: string): void {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  
  editor.update(() => {
    const root = $getRoot();
    root.clear();
    
    const paragraphs = doc.querySelectorAll('Paragraph');
    
    paragraphs.forEach((para) => {
      const type = para.getAttribute('Type') || 'General';
      const textElements = para.querySelectorAll('Text');
      
      let textContent = '';
      textElements.forEach((text) => {
        textContent += text.textContent || '';
      });
      
      if (textContent.trim()) {
        const createNode = FDX_ELEMENT_MAP[type] || $createActionNode;
        const node = createNode();
        
        // Create text node and append to the element
        const txtNode = $createTextNode(textContent);
        node.append(txtNode);
        root.append(node);
      }
    });
  });
}

/**
 * Export Lexical editor content to FDX format
 */
export function exportFDX(editor: LexicalEditor, title: string = 'Untitled'): string {
  let fdxContent = '';
  
  editor.getEditorState().read(() => {
    const root = $getRoot();
    const children = root.getChildren();
    
    const paragraphs = children.map((node) => {
      const type = LEXICAL_TO_FDX[node.getType()] || 'General';
      const text = node.getTextContent();
      
      return `    <Paragraph Type="${type}">
      <Text>${escapeXML(text)}</Text>
    </Paragraph>`;
    }).join('\n');
    
    fdxContent = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
${paragraphs}
  </Content>
  <TitlePage>
    <Content>
      <Paragraph Type="Title">
        <Text>${escapeXML(title)}</Text>
      </Paragraph>
    </Content>
  </TitlePage>
  <HeaderAndFooter FooterFirstPage="Yes" FooterVisible="Yes" HeaderFirstPage="No" HeaderVisible="No" StartingPage="1">
    <Footer>
      <Paragraph Type="Footer">
        <Text AdornmentStyle="0" Color="#000000" Font="Courier Final Draft" Size="12" Style=""></Text>
      </Paragraph>
    </Footer>
    <Header>
      <Paragraph Type="Header">
        <Text AdornmentStyle="0" Color="#000000" Font="Courier Final Draft" Size="12" Style=""></Text>
      </Paragraph>
    </Header>
  </HeaderAndFooter>
</FinalDraft>`;
  });
  
  return fdxContent;
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Download FDX file
 */
export function downloadFDX(editor: LexicalEditor, filename: string = 'screenplay'): void {
  const content = exportFDX(editor, filename);
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.fdx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Load FDX from file input
 */
export function loadFDXFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
