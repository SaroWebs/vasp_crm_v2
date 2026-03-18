import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import { Bold, Italic, Underline, List, ListOrdered, Undo, Redo } from 'lucide-react';
import { useEffect } from 'react';
import { type Editor } from '@tiptap/react';

interface TiptapEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    editable?: boolean;
}

// Hook to sync editor content with prop
function useEditorContentSync(editor: Editor | null, content: string) {
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);
}

export default function TiptapEditor({
    content,
    onChange,
    placeholder = 'Enter text...',
    className = '',
    editable = true,
}: TiptapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Typography,
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] px-3 py-2 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4',
            },
        },
    });

    useEditorContentSync(editor, content);

    if (!editor) {
        return null;
    }

    return (
        <div className={`border rounded-md overflow-hidden ${className}`}>
            {editable && (
                <div className="flex items-center gap-1 border-b bg-gray-50 p-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
                        title="Bold"
                    >
                        <Bold className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
                        title="Italic"
                    >
                        <Italic className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
                        title="Strikethrough"
                    >
                        <Underline className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
                        title="Bullet List"
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
                        title="Ordered List"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50"
                        title="Undo"
                    >
                        <Undo className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50"
                        title="Redo"
                    >
                        <Redo className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className={editable ? '' : 'p-3'}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
