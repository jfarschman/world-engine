// src/components/RichTextRenderer.tsx
import parse, { domToReact } from 'html-react-parser';
import EntityLink from '@/components/EntityLink';
import { resolveKankaMentions } from '@/lib/utils'; 

interface RichTextRendererProps {
  content: string | null;
}

export default function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content) return null;

  // 1. Pre-process the string to fix legacy [shortcodes]
  // This turns [character:123|Name] into <a href="/entity/123">Name</a>
  const cleanedContent = resolveKankaMentions(content);

  // 2. Parse the HTML into React Components
  return parse(cleanedContent, {
    replace: (domNode) => {
      
      // CASE A: Standard Links (<a>) & Legacy Shortcodes (which became <a> above)
      if (domNode.type === 'tag' && domNode.name === 'a') {
        const href = domNode.attribs.href;
        const title = domNode.attribs.title;
        
        let entityId = null;

        // Try to find ID in title "Character #123"
        if (title) {
          const titleMatch = title.match(/[:#](\d+)/); 
          if (titleMatch) entityId = parseInt(titleMatch[1]);
        }

        // Try to find ID in href "/entity/123"
        if (!entityId && href) {
           const hrefMatch = href.match(/entity\/(\d+)/); 
           if (hrefMatch) entityId = parseInt(hrefMatch[1]);
        }

        if (entityId) {
          return (
            <EntityLink id={entityId} name={title || 'Entity'}>
              {/* @ts-ignore */}
              {domToReact(domNode.children)}
            </EntityLink>
          );
        }
      }

      // CASE B: Tiptap Mentions (<span data-type="mention">)
      // This strips the styling and the '@' symbol for read-only views
      if (
        domNode.type === 'tag' && 
        domNode.name === 'span' && 
        domNode.attribs['data-type'] === 'mention'
      ) {
        const id = parseInt(domNode.attribs['data-id']);
        const label = domNode.attribs['data-label'];

        if (id) {
          return (
            <EntityLink id={id} name={label || 'Entity'}>
              {label}
            </EntityLink>
          );
        }
      }
    }
  });
}