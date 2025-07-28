"use client"

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  minHeight?: string
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  editable = true,
  className,
  minHeight = '200px'
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML())
      }
    },
  })

  if (!editor) {
    return null
  }

  const MenuBar = () => {
    if (!editable) return null

    return (
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'p-2 rounded text-sm font-medium transition-colors',
            editor.isActive('bold')
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'p-2 rounded text-sm font-medium transition-colors',
            editor.isActive('italic')
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 4h-9M14 20H5M15 4L9 20" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            'p-2 rounded text-sm font-medium transition-colors',
            editor.isActive('heading', { level: 2 })
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
          type="button"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            'p-2 rounded text-sm font-medium transition-colors',
            editor.isActive('heading', { level: 3 })
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
          type="button"
        >
          H3
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'p-2 rounded text-sm font-medium transition-colors',
            editor.isActive('bulletList')
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            'p-2 rounded text-sm font-medium transition-colors',
            editor.isActive('orderedList')
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            'p-2 rounded text-sm font-medium transition-colors',
            editor.isActive('blockquote')
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
          </svg>
        </button>
        <div className="flex-1"></div>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          className="p-2 rounded text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          type="button"
          disabled={!editor.can().undo()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          className="p-2 rounded text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          type="button"
          disabled={!editor.can().redo()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className={cn(
      'border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent',
      className
    )}>
      <MenuBar />
      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none p-4 dark:prose-invert',
          'prose-headings:text-gray-900 dark:prose-headings:text-white',
          'prose-p:text-gray-700 dark:prose-p:text-gray-300',
          'prose-li:text-gray-700 dark:prose-li:text-gray-300',
          'prose-strong:text-gray-900 dark:prose-strong:text-white'
        )}
        style={{ minHeight }}
      />
    </div>
  )
}

export { RichTextEditor }