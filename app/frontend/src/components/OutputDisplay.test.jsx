import React from 'react'
import { render, screen } from '@testing-library/react'
import OutputDisplay from './OutputDisplay'

describe('OutputDisplay', () => {
  const mockResult = {
    requirements_spec: '# Requirements\n- Requirement 1\n- Requirement 2',
    task_breakdown: '- Task 1\n- Task 2\n- Task 3',
    sow: '## Scope Overview\n\nScope:\n- Deliverable 1\n- Deliverable 2\n\n## Timeline\n\n| Phase | Duration |\n|-------|----------|\n| Design | 2 weeks |\n| Development | 4 weeks |'
  }

  test('renders all three output sections when result is provided', () => {
    render(<OutputDisplay result={mockResult} />)
    
    expect(screen.getByText('Requirements Specification')).toBeInTheDocument()
    expect(screen.getByText('Task Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Statement of Work')).toBeInTheDocument()
  })

  test('renders Markdown content correctly, including GFM tables', () => {
    render(<OutputDisplay result={mockResult} />)
    
    // Verify the table is rendered as an actual <table> element
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
    
    // Verify table structure
    expect(screen.getByText('Phase')).toBeInTheDocument()
    expect(screen.getByText('Design')).toBeInTheDocument()
    expect(screen.getByText('Development')).toBeInTheDocument()
    
    // Verify heading and list content also render
    expect(screen.getByText('Statement of Work')).toBeInTheDocument()
    expect(screen.getByText('Scope Overview')).toBeInTheDocument()
  })

  test('each output section has its own distinct heading/label', () => {
    render(<OutputDisplay result={mockResult} />)
    
    // Verify each section has its own heading element
    const requirementsHeading = screen.getByRole('heading', { name: 'Requirements Specification' })
    const taskHeading = screen.getByRole('heading', { name: 'Task Breakdown' })
    const sowHeading = screen.getByRole('heading', { name: 'Statement of Work' })
    
    expect(requirementsHeading).toBeInTheDocument()
    expect(taskHeading).toBeInTheDocument()
    expect(sowHeading).toBeInTheDocument()
    
    // Verify they are distinct elements
    expect(requirementsHeading).not.toBe(taskHeading)
    expect(taskHeading).not.toBe(sowHeading)
    expect(requirementsHeading).not.toBe(sowHeading)
  })

  test('renders nothing when result is null', () => {
    const { container } = render(<OutputDisplay result={null} />)
    
    // Verify no section headings are rendered
    expect(screen.queryByText('Requirements Specification')).not.toBeInTheDocument()
    expect(screen.queryByText('Task Breakdown')).not.toBeInTheDocument()
    expect(screen.queryByText('Statement of Work')).not.toBeInTheDocument()
    
    // Verify the container has no content
    expect(container.firstChild).toBeNull()
  })
})
