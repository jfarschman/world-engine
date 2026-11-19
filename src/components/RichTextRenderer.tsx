import parse, { domToReact, HTMLReactParserOptions } from 'html-react-parser';
import sanitizeHtml from 'sanitize-html';
import EntityLink from '@/components/EntityLink';
import { resolveKankaMentions } from '@/lib/utils';

interface RichTextRendererProps {
  content: string | null;
}

export default function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content) return null;

  const resolved = resolveKankaMentions(content);
  const cleanedContent = sanitizeHtml(resolved, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img', 'h1', 'h2', 'span', 'del', 's', 'u', 'sub', 'sup', 'hr',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      span: ['class', 'data-type', 'data-id', 'data-label', 'style'],
      a: ['href', 'name', 'target', 'title', 'class'],
      img: ['src', 'alt', 'width', 'height', 'class'],
    },
  });

  const options: HTMLReactParserOptions = {
    replace: (domNode: any) => {
      // CASE A: Paragraphs
      if (domNode.name === 'p') {
        return (
          <p className="mb-4 min-h-[1.5rem]">
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
              {domToReact(domNode.children, options)}
            </EntityLink>
          );
        }
      }

      // CASE C: Mentions (<span>)
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
                <span className="text-blue-700 font-bold hover:underline cursor-pointer">
                  {label || 'Entity'}
                </span>
              </EntityLink>
            );
          }
        }
      }
    },
  };

  return parse(cleanedContent, options);
}