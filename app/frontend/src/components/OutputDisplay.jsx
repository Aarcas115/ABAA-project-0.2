import React from 'react'
import RequirementsSpec from './RequirementsSpec'
import TaskBreakdown from './TaskBreakdown'
import StatementOfWork from './StatementOfWork'

function OutputDisplay({ result }) {
  if (!result) {
    return null
  }

  return (
    <div className="space-y-6">
      <RequirementsSpec content={result.requirements_spec} />
      <TaskBreakdown content={result.task_breakdown} />
      <StatementOfWork content={result.sow} />
    </div>
  )
}

export default OutputDisplay
