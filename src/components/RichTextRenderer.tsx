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
  const cleanedContent = resolveKankaMentions(content);

  // 2. Parse the HTML into React Components
  return parse(cleanedContent, {
    replace: (domNode) => {
      
      // CASE A: Force Paragraph Spacing
      // This ensures that hitting "Enter" creates visual space.
      if (domNode.type === 'tag' && domNode.name === 'p') {
        return (
          <p className="mb-4 min-h-[1.5rem]">
            {/* @ts-ignore */}
            {domToReact(domNode.children)}
          </p>
        );
      }

      // CASE B: Standard Links (<a>) & Legacy Shortcodes
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

        // If it's an internal Entity Link
        if (entityId) {
          return (
            <EntityLink id={entityId} name={title || 'Entity'}>
              {/* @ts-ignore */}
              {domToReact(domNode.children)}
            </EntityLink>
          );
        }
        
        // External links render normally
      }

      // CASE C: Tiptap Mentions (<span data-type="mention">)
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