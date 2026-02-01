'use client';

import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import { useEffect } from 'react';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import MentionList from './MentionList';

// Toolbar Button Component
const ToolbarButton = ({ 
  onClick, 
  isActive, 
  children 
}: { 
  onClick: (e: React.MouseEvent) => void; 
  isActive?: boolean; 
  children: React.ReactNode 
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-1.5 px-2 text-sm rounded transition-colors font-semibold ${
      isActive 
        ? 'bg-blue-100 text-blue-700' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    {children}
  </button>
);

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'bg-green-100 text-green-800 rounded px-1 py-0.5 font-medium decoration-clone',
        },
        renderLabel({ options, node }) {
          // Renders the label without the '@' symbol inside the editor
          return `${node.attrs.label ?? node.attrs.id}`;
        },
        suggestion: {
          // This command determines what happens when you press Enter on a name
          command: ({ editor, range, props }) => {
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: 'mention',
                  attrs: props, // props contains { id, label }
                },
                {
                  type: 'text',
                  text: ' ', // Adds a space after the mention
                },
              ])
              .run();
          },
          items: async ({ query }) => {
            if (query.length < 3) return [];
            const res = await fetch(`/api/mentions?query=${query}`);
            return await res.json();
          },
          render: () => {
            let component: ReactRenderer<any>;
            let popup: any;

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect as any,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },
              onUpdate(props) {
                component.updateProps(props);
                if (!props.clientRect) return;
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },
              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  popup[0].hide();
                  return true;
                }
                // @ts-ignore
                return component.ref?.onKeyDown(props);
              },
              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // safe to leave empty if only one-way sync is needed
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-slate-300 rounded-md bg-white overflow-hidden flex flex-col">
      {/* TOOLBAR */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
        >
          I
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
        >
          S
        </ToolbarButton>
        
        <div className="w-px h-6 bg-slate-300 mx-1 self-center" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
        >
          H3
        </ToolbarButton>

        <div className="w-px h-6 bg-slate-300 mx-1 self-center" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
        >
          Bullet
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
        >
          Number
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}