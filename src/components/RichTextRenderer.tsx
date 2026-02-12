import parse, { domToReact, Element } from 'html-react-parser'; // Note: Element import helps TS
import EntityLink from '@/components/EntityLink';
import { resolveKankaMentions } from '@/lib/utils'; 

interface RichTextRendererProps {
  content: string | null;
}

export default function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content) return null;

  const cleanedContent = resolveKankaMentions(content);

  return parse(cleanedContent, {
    replace: (domNode) => {
      // TS Guard: Ensure we are working with an Element
      if (!(domNode instanceof Element) && (domNode as any).type !== 'tag') return;
      
      const node = domNode as Element; // Cast for easier access

      // CASE A: Force Paragraph Spacing
      if (node.name === 'p') {
        return (
          <p className="mb-4 min-h-[1.5rem]">
            {domToReact(node.children as any)}
          </p>
        );
      }

      // CASE B: Standard Links (Legacy Kanka or Manual)
      if (node.name === 'a') {
        const href = node.attribs.href;
        const title = node.attribs.title;
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
              {domToReact(node.children as any)}
            </EntityLink>
          );
        }
      }

      // CASE C: The "Green Text" Fix
      // We explicitly catch the span created by Tiptap
      if (node.name === 'span' && node.attribs['data-type'] === 'mention') {
        const id = parseInt(node.attribs['data-id']);
        const label = node.attribs['data-label'];

        if (id) {
          // Wrap it in EntityLink to make it interactive and Blue
          return (
            <EntityLink id={id} name={label || 'Entity'}>
               @{label}
            </EntityLink>
          );
        }
      }
    }
  });
}