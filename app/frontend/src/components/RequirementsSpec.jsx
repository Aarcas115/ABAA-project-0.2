import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function RequirementsSpec({ content }) {
  if (!content || !content.trim()) {
    return null
  }

  return (
    <div className="border-2 border-gray-700 rounded-lg p-4 bg-gray-800/50">
      <h3 className="text-lg font-medium mb-3 text-gray-200 border-b border-gray-700 pb-2">
        Requirements Specification
      </h3>
      <div className="prose prose-invert prose-headings:font-semibold prose-a:text-blue-400 hover:prose-a:text-blue-300">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  )
}

export default RequirementsSpec
