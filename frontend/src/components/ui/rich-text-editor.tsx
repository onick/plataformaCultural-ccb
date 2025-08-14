'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Importar dinámicamente para evitar SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
      <div className="h-12 bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 rounded-t-lg flex items-center px-3">
        <div className="flex space-x-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
          ))}
        </div>
      </div>
      <div className="h-64 bg-white dark:bg-gray-800 rounded-b-lg flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Cargando editor...</p>
      </div>
    </div>
  )
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  height?: number;
}

const RichTextEditor = forwardRef<any, RichTextEditorProps>(({
  value,
  onChange,
  placeholder = "Escribe el contenido del artículo...",
  className = "",
  error,
  disabled = false,
  height = 300
}, ref) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Configuración del toolbar
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': ['', 'center', 'right', 'justify'] }], // Agregar justificar
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet',
    'indent',
    'direction', 'align',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  if (!isMounted) {
    return (
      <div className={`border border-gray-300 dark:border-gray-600 rounded-lg ${className}`}>
        <div className="h-12 bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 rounded-t-lg flex items-center px-3">
          <div className="flex space-x-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-b-lg flex items-center justify-center" style={{ height: height }}>
          <p className="text-gray-500 dark:text-gray-400">Cargando editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rich-text-editor ${className}`}>
      <div className={`quill-wrapper ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg overflow-hidden`}>
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
          readOnly={disabled}
          style={{
            height: height,
            '--quill-bg': 'white',
            '--quill-border': 'transparent'
          } as any}
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
      
      <style jsx global>{`
        .rich-text-editor .ql-container {
          font-family: inherit;
          border: none !important;
        }
        
        .rich-text-editor .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding: 8px 12px;
          background: #f9fafb;
        }
        
        .dark .rich-text-editor .ql-toolbar {
          background: #374151;
          border-bottom-color: #4b5563 !important;
        }
        
        .rich-text-editor .ql-editor {
          border: none !important;
          padding: 16px 12px;
          min-height: ${height - 42}px;
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
        }
        
        .dark .rich-text-editor .ql-editor {
          background: #1f2937;
          color: #f3f4f6;
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        
        .dark .rich-text-editor .ql-editor.ql-blank::before {
          color: #6b7280;
        }
        
        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #6b7280;
        }
        
        .rich-text-editor .ql-toolbar .ql-fill {
          fill: #6b7280;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #d1d5db;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-fill {
          fill: #d1d5db;
        }
        
        .rich-text-editor .ql-toolbar button:hover .ql-stroke {
          stroke: #3b82f6;
        }
        
        .rich-text-editor .ql-toolbar button:hover .ql-fill {
          fill: #3b82f6;
        }
        
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #3b82f6;
        }
        
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #3b82f6;
        }
        
        .rich-text-editor .ql-toolbar .ql-picker-label {
          color: #6b7280;
        }
        
        .dark .rich-text-editor .ql-toolbar .ql-picker-label {
          color: #d1d5db;
        }
        
        .rich-text-editor .ql-editor h1 {
          font-size: 2.5em;
          font-weight: bold;
          margin: 1.2em 0 0.6em 0;
          line-height: 1.2;
        }
        
        .rich-text-editor .ql-editor h2 {
          font-size: 2em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
          line-height: 1.3;
        }
        
        .rich-text-editor .ql-editor h3 {
          font-size: 1.6em;
          font-weight: bold;
          margin: 0.9em 0 0.4em 0;
          line-height: 1.4;
        }
        
        .rich-text-editor .ql-editor h4 {
          font-size: 1.3em;
          font-weight: bold;
          margin: 0.8em 0 0.4em 0;
          line-height: 1.4;
        }
        
        .rich-text-editor .ql-editor h5 {
          font-size: 1.1em;
          font-weight: bold;
          margin: 0.7em 0 0.3em 0;
          line-height: 1.5;
        }
        
        .rich-text-editor .ql-editor h6 {
          font-size: 1em;
          font-weight: bold;
          margin: 0.6em 0 0.3em 0;
          line-height: 1.5;
        }
        
        /* Alineación de texto */
        .rich-text-editor .ql-editor .ql-align-center {
          text-align: center;
        }
        
        .rich-text-editor .ql-editor .ql-align-right {
          text-align: right;
        }
        
        .rich-text-editor .ql-editor .ql-align-justify {
          text-align: justify;
          text-justify: inter-word;
        }
        
        .rich-text-editor .ql-editor p {
          margin: 0.5em 0;
          line-height: 1.6;
        }
        
        .rich-text-editor .ql-editor ul, 
        .rich-text-editor .ql-editor ol {
          padding-left: 1.5em;
        }
        
        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          background: #f8fafc;
        }
        
        .dark .rich-text-editor .ql-editor blockquote {
          background: #1e293b;
          border-left-color: #60a5fa;
        }
        
        .rich-text-editor .ql-editor pre {
          background: #f1f5f9;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          overflow-x: auto;
        }
        
        .dark .rich-text-editor .ql-editor pre {
          background: #0f172a;
          border-color: #334155;
        }
        
        .rich-text-editor .ql-editor a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .rich-text-editor .ql-editor a:hover {
          color: #1d4ed8;
        }
        
        .dark .rich-text-editor .ql-editor a {
          color: #60a5fa;
        }
        
        .dark .rich-text-editor .ql-editor a:hover {
          color: #93c5fd;
        }
        
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor; 