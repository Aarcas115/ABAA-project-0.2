import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import TranscriptForm from './TranscriptForm'

// Mock fetch globally
global.fetch = vi.fn()

describe('TranscriptForm', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders textarea and submit button', () => {
    render(<TranscriptForm />)
    
    expect(screen.getByLabelText(/client meeting transcript/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /analyze transcript/i })).toBeInTheDocument()
  })

  test('textarea accepts multiline input', () => {
    render(<TranscriptForm />)
    
    const textarea = screen.getByLabelText(/client meeting transcript/i)
    const multilineText = 'Line 1\nLine 2\nLine 3'
    
    fireEvent.change(textarea, { target: { value: multilineText } })
    
    expect(textarea.value).toBe(multilineText)
  })

  test('submit button remains enabled when transcript is empty (validation happens on submit)', () => {
    render(<TranscriptForm />)
    
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    
    expect(submitButton).toBeEnabled()
  })

  test('submit button is enabled when transcript has content', () => {
    render(<TranscriptForm />)
    
    const textarea = screen.getByLabelText(/client meeting transcript/i)
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    
    fireEvent.change(textarea, { target: { value: 'Test transcript' } })
    
    expect(submitButton).toBeEnabled()
  })

  test('shows error when submitting empty transcript', () => {
    render(<TranscriptForm />)
    
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    fireEvent.click(submitButton)
    
    expect(screen.getByText(/please enter a transcript/i)).toBeInTheDocument()
  })

  test('makes POST request to correct endpoint with transcript data', async () => {
    const mockResponse = {
      requirements_spec: '# Requirements',
      task_breakdown: '- Task 1',
      sow: 'Scope: ...'
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<TranscriptForm />)
    
    const textarea = screen.getByLabelText(/client meeting transcript/i)
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    
    fireEvent.change(textarea, { target: { value: 'Test transcript content' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/analyze',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transcript: 'Test transcript content' }),
        })
      )
    })
  })

  test('displays loading state during API call', async () => {
    fetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<TranscriptForm />)
    
    const textarea = screen.getByLabelText(/client meeting transcript/i)
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    
    fireEvent.change(textarea, { target: { value: 'Test transcript' } })
    fireEvent.click(submitButton)
    
    expect(screen.getByText(/analyzing.../i)).toBeDisabled()
    expect(textarea).toBeDisabled()
  })

  test('displays error message from backend', async () => {
    const errorMessage = 'API key not configured'
    
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: errorMessage }),
    })

    render(<TranscriptForm />)
    
    const textarea = screen.getByLabelText(/client meeting transcript/i)
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    
    fireEvent.change(textarea, { target: { value: 'Test transcript' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  test('displays result after successful API call', async () => {
    const mockResponse = {
      requirements_spec: '# Requirements\n- Requirement 1',
      task_breakdown: '- Task 1\n- Task 2',
      sow: '## Statement of Work\nScope: ...'
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<TranscriptForm />)
    
    const textarea = screen.getByLabelText(/client meeting transcript/i)
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    
    fireEvent.change(textarea, { target: { value: 'Test transcript' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
    })
  })
})
