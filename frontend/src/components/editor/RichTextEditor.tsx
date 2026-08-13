import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Image as ImageIcon } from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export interface RichTextEditorRef {
  focus: () => void;
  getEditor: () => Editor | null;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ content, onChange, placeholder = "Write something..." }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2],
          },
          bulletList: {
            HTMLAttributes: {
              class: "list-disc pl-5",
            },
          },
          orderedList: {
            HTMLAttributes: {
              class: "list-decimal pl-5",
            },
          },
        }),
        Image.configure({
          HTMLAttributes: {
            class: "max-w-full rounded-lg my-2",
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
      ],
      content,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
      editorProps: {
        attributes: {
          class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] p-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
        },
      },
    });

    // Expose focus method via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        editor?.chain().focus().run();
      },
      getEditor: () => editor,
    }), [editor]);

    // Update content if it changes externally
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content || "");
      }
    }, [content, editor]);

    if (!editor) return null;

    return (
      <div className="rounded-xl border border-border/60 bg-background overflow-hidden shadow-sm">
        {/* Editor Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border/50 bg-muted/40">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`h-8 w-8 p-0 text-xs ${editor.isActive("heading", { level: 1 }) ? "bg-accent text-accent-foreground font-bold" : ""}`}
            title="Heading 1"
          >
            H1
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`h-8 w-8 p-0 text-xs ${editor.isActive("heading", { level: 2 }) ? "bg-accent text-accent-foreground font-bold" : ""}`}
            title="Heading 2"
          >
            H2
          </Button>
          <div className="w-[1px] h-4 bg-border/60 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 w-8 p-0 ${editor.isActive("bold") ? "bg-accent text-accent-foreground" : ""}`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 w-8 p-0 ${editor.isActive("italic") ? "bg-accent text-accent-foreground" : ""}`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <div className="w-[1px] h-4 bg-border/60 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-8 w-8 p-0 ${editor.isActive("bulletList") ? "bg-accent text-accent-foreground" : ""}`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-8 w-8 p-0 ${editor.isActive("orderedList") ? "bg-accent text-accent-foreground" : ""}`}
            title="Ordered List"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>

        {/* Editor Body */}
        <EditorContent editor={editor} />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
