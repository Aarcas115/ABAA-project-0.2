import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function TaskBreakdown({ content }) {
  if (!content || !content.trim()) {
    return null
  }

  return (
    <div className="border-2 border-gray-700 rounded-lg p-4 bg-gray-800/50">
      <h3 className="text-lg font-medium mb-3 text-gray-200 border-b border-gray-700 pb-2">
        Task Breakdown
      </h3>
      <div className="prose prose-invert prose-ul:mb-4 prose-ol:mb-4 prose-li:mb-2 prose-pre:bg-gray-700 prose-pre:p-3 prose-pre:rounded">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  )
}

export default TaskBreakdown
