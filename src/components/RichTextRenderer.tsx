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

  return parse(cleanedContent, {
    replace: (domNode: any) => {
      
      // CASE A: Force Paragraph Spacing
      if (domNode.name === 'p') {
        return (
          <p className="mb-4 min-h-[1.5rem]">
            {domToReact(domNode.children)}
          </p>
        );
      }

      // CASE B: Standard Links (<a>)
      if (domNode.name === 'a') {
        const { href, title } = domNode.attribs || {};
        let entityId = null;

        if (title) {
          const titleMatch = title.match(/[:#](\d+)/); 
          if (titleMatch) entityId = parseInt(titleMatch[1]);
        }
        if (!entityId && href) {
           const hrefMatch = href.match(/entity\/(\d+)/); 
           if (hrefMatch) entityId = parseInt(hrefMatch[1]);
        }

        if (entityId) {
          return (
            <EntityLink id={entityId} name={title || 'Entity'}>
              {domToReact(domNode.children)}
            </EntityLink>
          );
        }
      }

      // CASE C: The "Green Text" Fix
      // We look for EITHER the data-type OR the class that Tiptap adds.
      if (domNode.name === 'span' && domNode.attribs) {
        const { class: className, 'data-type': dataType, 'data-id': dataId, 'data-label': dataLabel } = domNode.attribs;

        // Check 1: Is it a Tiptap mention?
        if (dataType === 'mention' || (className && className.includes('bg-green-100'))) {
          const id = parseInt(dataId);
          
          if (id && !isNaN(id)) {
            return (
              <EntityLink id={id} name={dataLabel || 'Entity'}>
                 <span className="text-blue-700 font-bold hover:underline">
                   @{dataLabel || 'Entity'}
                 </span>
              </EntityLink>
            );
          }
        }
      }
    }
  });
}