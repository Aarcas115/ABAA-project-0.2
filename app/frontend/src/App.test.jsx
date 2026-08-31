import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

// Mock the TranscriptForm component
vi.mock('./components/TranscriptForm', () => ({
  default: ({ onResult }) => (
    <div>
      <textarea data-testid="transcript-input" />
      <button 
        data-testid="submit-button"
        onClick={() => onResult({ transcript: 'test transcript' })}
      >
        Submit
      </button>
      <button 
        data-testid="trigger-null"
        onClick={() => onResult(null)}
      >
        Trigger Null
      </button>
    </div>
  )
}))

// Mock the analyzeTranscript function
vi.mock('./api/analyze', () => ({
  analyzeTranscript: vi.fn(),
}))

import { analyzeTranscript } from './api/analyze'

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('renders without crashing, no analysis output shown initially', () => {
    render(<App />)
    
    expect(screen.getByText(/Transcript Input/i)).toBeInTheDocument()
    expect(screen.getByText(/Analysis Output/i)).toBeInTheDocument()
    expect(screen.queryByText(/requirements specification/i)).not.toBeInTheDocument()
  })

  test('when onResult receives a valid { transcript }, calls analyzeTranscript with that transcript, shows "Analyzing transcript..." while pending, and renders the real requirements_spec/task_breakdown/sow content once resolved', async () => {
    const mockResponse = {
      requirements_spec: '# Requirements\n- Requirement 1',
      task_breakdown: '- Task 1\n- Task 2',
      sow: '## Statement of Work\nScope: ...'
    }
    
    analyzeTranscript.mockResolvedValueOnce(mockResponse)

    render(<App />)
    
    // Trigger the submit button which calls onResult with a transcript
    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)
    
    // Assert "Analyzing transcript..." is shown while pending
    expect(screen.getByText(/analyzing transcript\.\.\./i)).toBeInTheDocument()
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(analyzeTranscript).toHaveBeenCalledWith('test transcript')
    })
    
    // Assert the response is rendered
    expect(screen.getByText(/Requirements Specification/i)).toBeInTheDocument()
    expect(screen.getByText(/Requirement 1/)).toBeInTheDocument()
    expect(screen.getByText(/Task Breakdown/i)).toBeInTheDocument()
    expect(screen.getByText(/Task 1/)).toBeInTheDocument()
    expect(screen.getAllByText(/Statement of Work/i).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/Scope: \.\.\./)).toBeInTheDocument()
  })

  test('when onResult receives null (TranscriptForm-side failure), does NOT call analyzeTranscript, and does not show stale/previous analysis output', async () => {
    const mockResponse = {
      requirements_spec: '# Requirements\n- Requirement 1',
      task_breakdown: '- Task 1\n- Task 2',
      sow: '## Statement of Work\nScope: ...'
    }
    
    analyzeTranscript.mockResolvedValueOnce(mockResponse)

    render(<App />)
    
    // First, trigger a successful analysis
    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(analyzeTranscript).toHaveBeenCalled()
    })
    
    // Now trigger a null result (TranscriptForm-side failure)
    const nullButton = screen.getByTestId('trigger-null')
    fireEvent.click(nullButton)
    
    // Should not call analyzeTranscript again
    expect(analyzeTranscript).toHaveBeenCalledTimes(1)
    
    // Should not show analysis output
    expect(screen.queryByText(/Requirements Specification/i)).not.toBeInTheDocument()
  })

  test('when analyzeTranscript rejects, shows the error message and does not render stale analysis output', async () => {
    const errorMessage = 'Network error: unable to reach analysis service'
    
    analyzeTranscript.mockRejectedValueOnce(new Error(errorMessage))

    render(<App />)
    
    // Trigger the submit button which calls onResult with a transcript
    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)
    
    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
    
    // Should not show analysis output
    expect(screen.queryByText(/Requirements Specification/i)).not.toBeInTheDocument()
  })

  test('verify analysisError clears if a subsequent successful analysis happens after a prior failure', async () => {
    const errorMessage = 'Network error: unable to reach analysis service'
    const mockResponse = {
      requirements_spec: '# Requirements\n- Requirement 1',
      task_breakdown: '- Task 1\n- Task 2',
      sow: '## Statement of Work\nScope: ...'
    }
    
    // First call fails
    analyzeTranscript.mockRejectedValueOnce(new Error(errorMessage))
    // Second call succeeds
    analyzeTranscript.mockResolvedValueOnce(mockResponse)

    render(<App />)
    
    // Trigger the submit button which calls onResult with a transcript
    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)
    
    // Wait for first error
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
    
    // Trigger another analysis (simulating a new transcript)
    fireEvent.click(submitButton)
    
    // Wait for successful analysis
    await waitFor(() => {
      expect(analyzeTranscript).toHaveBeenCalledTimes(2)
    })
    
    // Error message should be gone
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument()
    
    // Success content should be shown
    expect(screen.getByText(/Requirements Specification/i)).toBeInTheDocument()
  })
})
