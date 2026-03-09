"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  Eraser,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
};

const sanitizeOutput = (html: string, text: string) => {
  if (text.trim().length === 0) {
    return "";
  }
  return html;
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something helpful...",
  className,
  autoFocus = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "richtext__content",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      const text = currentEditor.getText();
      onChange(sanitizeOutput(html, text));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const currentText = editor.getText().trim();
    if (!value) {
      if (currentText.length > 0) {
        editor.commands.setContent("", { emitUpdate: false });
      }
      return;
    }
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor || !autoFocus) return;
    const timer = setTimeout(() => {
      editor.commands.focus("end");
    }, 0);
    return () => clearTimeout(timer);
  }, [editor, autoFocus]);

  if (!editor) {
    return <div className={`richtext ${className ?? ""}`} />;
  }

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter link URL", previous ?? "");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim(), target: "_blank", rel: "noopener noreferrer" })
      .run();
  };

  const currentHeading = editor.isActive("heading", { level: 2 })
    ? "h2"
    : editor.isActive("heading", { level: 3 })
      ? "h3"
      : "p";

  return (
    <div className={`richtext ${className ?? ""}`}>
      <div className="richtext__toolbar">
        <button
          type="button"
          className="richtext__button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          className="richtext__button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="Redo"
        >
          <Redo2 size={16} />
        </button>
        <div className="richtext__divider" />
        <select
          className="richtext__select"
          value={currentHeading}
          onChange={(event) => {
            const next = event.target.value;
            if (next === "h2") {
              editor.chain().focus().setHeading({ level: 2 }).run();
            } else if (next === "h3") {
              editor.chain().focus().setHeading({ level: 3 }).run();
            } else {
              editor.chain().focus().setParagraph().run();
            }
          }}
          aria-label="Text style"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
        </select>
        <button
          type="button"
          className={`richtext__button ${editor.isActive("bold") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          className={`richtext__button ${editor.isActive("italic") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          className={`richtext__button ${editor.isActive("underline") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Underline"
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          type="button"
          className={`richtext__button ${editor.isActive("strike") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
        <button
          type="button"
          className={`richtext__button ${editor.isActive("link") ? "active" : ""}`}
          onClick={setLink}
          aria-label="Link"
        >
          <Link2 size={16} />
        </button>
        <button
          type="button"
          className={`richtext__button ${
            editor.isActive("bulletList") ? "active" : ""
          }`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          className={`richtext__button ${
            editor.isActive("orderedList") ? "active" : ""
          }`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Ordered list"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          className={`richtext__button ${
            editor.isActive("taskList") ? "active" : ""
          }`}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          aria-label="Checklist"
        >
          <CheckSquare size={16} />
        </button>
        <button
          type="button"
          className={`richtext__button ${
            editor.isActive("blockquote") ? "active" : ""
          }`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Quote"
        >
          <Quote size={16} />
        </button>
        <button
          type="button"
          className="richtext__button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          aria-label="Divider"
        >
          <Minus size={16} />
        </button>
        <div className="richtext__divider" />
        <button
          type="button"
          className={`richtext__button ${
            editor.isActive({ textAlign: "left" }) ? "active" : ""
          }`}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          aria-label="Align left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          className={`richtext__button ${
            editor.isActive({ textAlign: "center" }) ? "active" : ""
          }`}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          aria-label="Align center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          className={`richtext__button ${
            editor.isActive({ textAlign: "right" }) ? "active" : ""
          }`}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          aria-label="Align right"
        >
          <AlignRight size={16} />
        </button>
        <button
          type="button"
          className="richtext__button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          aria-label="Clear formatting"
        >
          <Eraser size={16} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
