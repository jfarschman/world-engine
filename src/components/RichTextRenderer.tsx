import parse, { domToReact, HTMLReactParserOptions } from 'html-react-parser';
import EntityLink from '@/components/EntityLink';
import { resolveKankaMentions } from '@/lib/utils'; 

interface RichTextRendererProps {
  content: string | null;
}

export default function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content) return null;

  const cleanedContent = resolveKankaMentions(content);

  // We define the options separately so we can pass them recursively!
  const options: HTMLReactParserOptions = {
    replace: (domNode: any) => {
      
      // CASE A: Paragraphs (Fixed to allow recursion)
      if (domNode.name === 'p') {
        return (
          <p className="mb-4 min-h-[1.5rem]">
            {/* IMPORTANT: We pass 'options' here so the parser checks the children too! */}
            {domToReact(domNode.children, options)}
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
              {/* Recurse here too, just in case */}
              {domToReact(domNode.children, options)}
            </EntityLink>
          );
        }
      }
      // CASE C: The "Green Text" Fix
      if (domNode.name === 'span') {
        const attribs = domNode.attribs || {};

        if (
          attribs['data-type'] === 'mention' || 
          (attribs['class'] && attribs['class'].includes('bg-green-100'))
        ) {
          const id = parseInt(attribs['data-id']);
          const label = attribs['data-label'];

          if (id && !isNaN(id)) {
            return (
              <EntityLink id={id} name={label || 'Entity'}>
                 {/* REMOVED THE @ SYMBOL BELOW */}
                 <span className="text-blue-700 font-bold hover:underline cursor-pointer">
                   {label || 'Entity'}
                 </span>
              </EntityLink>
            );
          }
        }
      }
    }
  };

  return parse(cleanedContent, options);
}