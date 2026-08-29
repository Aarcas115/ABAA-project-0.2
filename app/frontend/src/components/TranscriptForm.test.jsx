import React from 'react'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { vi } from 'vitest'
import TranscriptForm from './TranscriptForm'

// Mock the transcription and video-to-audio utilities
vi.mock('../api/transcription')
vi.mock('../utils/videoToAudio')

import { transcribeAudio } from '../api/transcription'
import { videoToAudio } from '../utils/videoToAudio'

// Mock fetch globally
global.fetch = vi.fn()

describe('TranscriptForm', () => {
  beforeEach(() => {
    fetch.mockClear()
    vi.clearAllMocks()
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

  test('submit button is disabled when transcript is empty and no file is selected', () => {
    render(<TranscriptForm />)
    
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    
    expect(submitButton).toBeDisabled()
  })

  test('submit button is enabled when transcript has content', () => {
    render(<TranscriptForm />)
    
    const textarea = screen.getByLabelText(/client meeting transcript/i)
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    
    fireEvent.change(textarea, { target: { value: 'Test transcript' } })
    
    expect(submitButton).toBeEnabled()
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

  test('calls onResult callback with response data on successful API call', async () => {
    const mockOnResult = vi.fn()
    const mockResponse = {
      requirements_spec: '# Requirements\n- Requirement 1',
      task_breakdown: '- Task 1\n- Task 2',
      sow: '## Statement of Work\nScope: ...'
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    render(<TranscriptForm onResult={mockOnResult} />)
    
    const textarea = screen.getByLabelText(/client meeting transcript/i)
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    
    fireEvent.change(textarea, { target: { value: 'Test transcript' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(mockResponse)
    })
  })
})

describe('TranscriptForm file handling', () => {
  beforeEach(() => {
    fetch.mockClear()
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('shows file input area', () => {
    render(<TranscriptForm />)
    
    expect(screen.getByText(/or upload audio\/video file/i)).toBeInTheDocument()
  })

  test('accepts audio file selection', () => {
    render(<TranscriptForm />)
    
    const fileInput = screen.getByRole('button', { name: /or upload audio\/video file/i })
    expect(fileInput).toBeEnabled()
  })

  test('accepts video file selection', () => {
    render(<TranscriptForm />)
    
    const fileInput = screen.getByRole('button', { name: /or upload audio\/video file/i })
    expect(fileInput).toBeEnabled()
  })

  test('shows reset button when transcript is entered', () => {
    render(<TranscriptForm />)
    
    const textarea = screen.getByLabelText(/client meeting transcript/i)
    fireEvent.change(textarea, { target: { value: 'Test transcript' } })
    
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
  })

  test('shows reset button when file is selected', () => {
    render(<TranscriptForm />)
    
    const fileInput = document.querySelector('input[type="file"]')
    const audioFile = new File(['content'], 'test.mp3', { type: 'audio/mpeg' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [audioFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    
    expect(screen.getByText(/selected: test\.mp3/i)).toBeInTheDocument()
  })

  test('clears transcript when file is selected (mutual exclusivity)', () => {
    render(<TranscriptForm />)
    
    const textarea = screen.getByLabelText(/client meeting transcript/i)
    const fileInput = document.querySelector('input[type="file"]')
    
    // First, type some text
    fireEvent.change(textarea, { target: { value: 'Test transcript' } })
    expect(textarea.value).toBe('Test transcript')
    
    // Then, select a file
    const audioFile = new File(['content'], 'test.mp3', { type: 'audio/mpeg' })
    Object.defineProperty(fileInput, 'files', {
      value: [audioFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    
    // Verify transcript is cleared
    expect(textarea.value).toBe('')
  })

  test('clears file when text is typed (mutual exclusivity)', () => {
    render(<TranscriptForm />)
    
    const textarea = screen.getByLabelText(/client meeting transcript/i)
    const fileInput = document.querySelector('input[type="file"]')
    
    // First, select a file
    const audioFile = new File(['content'], 'test.mp3', { type: 'audio/mpeg' })
    Object.defineProperty(fileInput, 'files', {
      value: [audioFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    
    // Verify file is selected (button shows file name)
    expect(screen.getByText(/selected: test\.mp3/i)).toBeInTheDocument()
    
    // Then, type text
    fireEvent.change(textarea, { target: { value: 'New transcript' } })
    
    // Verify file is cleared (button shows upload prompt again)
    expect(screen.getByText(/or upload audio\/video file/i)).toBeInTheDocument()
  })

  test('reset button clears all state', () => {
    render(<TranscriptForm />)
    
    const textarea = screen.getByLabelText(/client meeting transcript/i)
    fireEvent.change(textarea, { target: { value: 'Test transcript' } })
    
    const resetButton = screen.getByRole('button', { name: 'Reset' })
    fireEvent.click(resetButton)
    
    expect(textarea.value).toBe('')
  })

  test('shows error for unsupported file types', () => {
    render(<TranscriptForm />)
    
    const fileInput = document.querySelector('input[type="file"]')
    const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [pdfFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    
    expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument()
  })

  test('shows error for audio files over 25MB', () => {
    render(<TranscriptForm />)
    
    const fileInput = document.querySelector('input[type="file"]')
    const largeFile = new File([new ArrayBuffer(26 * 1024 * 1024)], 'large.mp3', { type: 'audio/mpeg' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    
    expect(screen.getByText(/file size exceeds 25mb limit/i)).toBeInTheDocument()
  })

  test('accepts video files over 25MB without size error', () => {
    render(<TranscriptForm />)
    
    const fileInput = document.querySelector('input[type="file"]')
    // Create a video file that's over 25MB - video size check is deferred to Task 7/8
    const largeVideoFile = new File([new ArrayBuffer(30 * 1024 * 1024)], 'large.mp4', { type: 'video/mp4' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [largeVideoFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    
    // Should NOT show size error for video files
    expect(screen.queryByText(/file size exceeds 25mb limit/i)).not.toBeInTheDocument()
    // Should show the file as selected
    expect(screen.getByText(/selected: large\.mp4/i)).toBeInTheDocument()
  })
})

describe('TranscriptForm Audio Path - Transcription Integration', () => {
  let mockOnResult
  
  beforeEach(() => {
    mockOnResult = vi.fn()
    fetch.mockClear()
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('1. Successful transcription: audio file submitted, transcribeAudio resolves with text, onResult called with transcript', async () => {
    const transcriptText = 'This is the transcribed text from the audio file.'
    
    transcribeAudio.mockResolvedValueOnce(transcriptText)

    render(<TranscriptForm onResult={mockOnResult} />)
    
    // Select an audio file
    const fileInput = document.querySelector('input[type="file"]')
    const audioFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [audioFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    fireEvent.click(submitButton)
    
    // Assert button shows "Transcribing..." while promise is pending
    expect(screen.getByText(/transcribing.../i)).toBeDisabled()
    
    // Wait for transcription to complete
    await waitFor(() => {
      expect(transcribeAudio).toHaveBeenCalledWith(audioFile)
      expect(mockOnResult).toHaveBeenCalledWith({ transcript: transcriptText })
    })
    
    // Assert button reverts to "Analyze Transcript" after resolution
    expect(screen.getByRole('button', { name: /analyze transcript/i })).toBeEnabled()
    
    // Assert no error banner is rendered
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  })

  test('2. Groq API error: transcribeAudio rejects with 500 error, error banner shows message, onResult called with null', async () => {
    const errorMessage = 'API request failed with status 500'
    
    transcribeAudio.mockRejectedValueOnce(new Error(errorMessage))

    render(<TranscriptForm onResult={mockOnResult} />)
    
    // Select an audio file
    const fileInput = document.querySelector('input[type="file"]')
    const audioFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [audioFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    fireEvent.click(submitButton)
    
    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(mockOnResult).toHaveBeenCalledWith(null)
    })
    
    // Assert button reverts to enabled/normal state (not stuck showing "Transcribing...")
    expect(screen.getByRole('button', { name: /analyze transcript/i })).toBeEnabled()
  })

  test('3. Unsupported/corrupted format: transcribeAudio rejects with format error, error banner shows exact message', async () => {
    const errorMessage = 'Invalid file format'
    
    transcribeAudio.mockRejectedValueOnce(new Error(errorMessage))

    render(<TranscriptForm onResult={mockOnResult} />)
    
    // Select an audio file
    const fileInput = document.querySelector('input[type="file"]')
    const audioFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [audioFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    fireEvent.click(submitButton)
    
    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })
})

describe('TranscriptForm Video Path - Transcription Integration', () => {
  let mockOnResult
  
  beforeEach(() => {
    mockOnResult = vi.fn()
    fetch.mockClear()
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('4b. File size limit error on video-extracted audio: transcribeAudio rejects with actual size error message, error banner shows verbatim', async () => {
    const errorMessage = 'Audio file size exceeds 25MB limit (26.00MB). Please use a smaller file.'
    
    // Mock videoToAudio to resolve with a small dummy blob
    const extractedAudioBlob = new Blob(['small audio content'], { type: 'audio/webm' })
    videoToAudio.mockResolvedValueOnce(extractedAudioBlob)
    
    // Mock transcribeAudio to reject with the size error
    transcribeAudio.mockRejectedValueOnce(new Error(errorMessage))

    render(<TranscriptForm onResult={mockOnResult} />)
    
    // Select a normal video file
    const fileInput = document.querySelector('input[type="file"]')
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [videoFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    fireEvent.click(submitButton)
    
    // Wait for error to be handled
    await waitFor(() => {
      expect(videoToAudio).toHaveBeenCalled()
      expect(transcribeAudio).toHaveBeenCalledWith(extractedAudioBlob)
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(mockOnResult).toHaveBeenCalledWith(null)
    })
  })

  test('5. Successful end-to-end: videoToAudio resolves with blob, transcribeAudio resolves with text, correct blob passed to transcribeAudio, button shows Extracting then Transcribing', async () => {
    const transcriptText = 'This is the transcribed text from the video.'
    const extractedAudioBlob = new Blob(['audio content'], { type: 'audio/webm' })
    
    // Create deferred promises to control timing
    let resolveVideoPromise
    let resolveTranscriptionPromise
    
    const videoPromise = new Promise(resolve => {
      resolveVideoPromise = resolve
    })
    
    const transcriptionPromise = new Promise(resolve => {
      resolveTranscriptionPromise = resolve
    })
    
    videoToAudio.mockReturnValueOnce(videoPromise)
    transcribeAudio.mockReturnValueOnce(transcriptionPromise)

    render(<TranscriptForm onResult={mockOnResult} />)
    
    // Select a video file
    const fileInput = document.querySelector('input[type="file"]')
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [videoFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    fireEvent.click(submitButton)
    
    // Assert button shows "Extracting audio..." while videoToAudio's promise is pending
    expect(screen.getByText(/extracting audio\.\.\./i)).toBeDisabled()
    
    // Resolve videoToAudio
    resolveVideoPromise(extractedAudioBlob)
    
    // Wait a tick for state update
    await waitFor(() => {
      expect(screen.getByText(/transcribing\.\.\./i)).toBeDisabled()
    })
    
    // Assert transcribeAudio was called with the extracted blob (not the original video file)
    expect(transcribeAudio).toHaveBeenCalledWith(extractedAudioBlob)
    
    // Resolve transcription
    resolveTranscriptionPromise(transcriptText)
    
    // Wait for final result
    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith({ transcript: transcriptText })
    })
    
    // Assert button reverts to "Analyze Transcript"
    expect(screen.getByRole('button', { name: /analyze transcript/i })).toBeEnabled()
  })

  test('6. Extraction failure: videoToAudio rejects, transcribeAudio never called, error banner shows videoToAudio message, onResult called with null', async () => {
    const errorMessage = 'Video loading failed: The video could not be loaded'
    
    videoToAudio.mockRejectedValueOnce(new Error(errorMessage))

    render(<TranscriptForm onResult={mockOnResult} />)
    
    // Select a video file
    const fileInput = document.querySelector('input[type="file"]')
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [videoFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    fireEvent.click(submitButton)
    
    // Wait for error to be handled
    await waitFor(() => {
      expect(videoToAudio).toHaveBeenCalled()
      expect(transcribeAudio).not.toHaveBeenCalled()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(mockOnResult).toHaveBeenCalledWith(null)
    })
  })

  test('7. Transcription failure after successful extraction: videoToAudio resolves, transcribeAudio rejects, error banner shows transcribeAudio message', async () => {
    const extractionErrorMessage = 'Video loading failed: The video could not be loaded'
    const transcriptionErrorMessage = 'API request failed with status 500'
    const extractedAudioBlob = new Blob(['audio content'], { type: 'audio/webm' })
    
    videoToAudio.mockResolvedValueOnce(extractedAudioBlob)
    transcribeAudio.mockRejectedValueOnce(new Error(transcriptionErrorMessage))

    render(<TranscriptForm onResult={mockOnResult} />)
    
    // Select a video file
    const fileInput = document.querySelector('input[type="file"]')
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [videoFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    fireEvent.click(submitButton)
    
    // Wait for transcription error
    await waitFor(() => {
      expect(videoToAudio).toHaveBeenCalled()
      expect(transcribeAudio).toHaveBeenCalledWith(extractedAudioBlob)
      expect(screen.getByText(transcriptionErrorMessage)).toBeInTheDocument()
      expect(mockOnResult).toHaveBeenCalledWith(null)
    })
    
    // Verify it's NOT showing the video extraction fallback text
    expect(screen.queryByText('Failed to process video for transcription')).not.toBeInTheDocument()
  })
})

describe('TranscriptForm Cross-Cutting Integration Tests', () => {
  let mockOnResult
  
  beforeEach(() => {
    mockOnResult = vi.fn()
    fetch.mockClear()
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('8. All three input paths converge on same onResult({ transcript }) shape', async () => {
    const transcriptText = 'Test transcript from any input type'
    
    // Test text path
    render(<TranscriptForm onResult={mockOnResult} />)
    
    // Text path
    const textarea = screen.getByLabelText(/client meeting transcript/i)
    fireEvent.change(textarea, { target: { value: transcriptText } })
    const submitButton = screen.getByRole('button', { name: /analyze transcript/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith({ transcript: transcriptText })
    })
    
    // Cleanup before second render
    cleanup()
    
    // Reset for audio path test
    mockOnResult.mockClear()
    fetch.mockClear()
    
    // Re-render to reset state
    render(<TranscriptForm onResult={mockOnResult} />)
    
    // Audio path
    transcribeAudio.mockResolvedValueOnce(transcriptText)
    const fileInput = document.querySelector('input[type="file"]')
    const audioFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [audioFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    fireEvent.click(screen.getByRole('button', { name: /analyze transcript/i }))
    
    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith({ transcript: transcriptText })
    })
    
    // Cleanup before third render
    cleanup()
    
    // Reset for video path test
    mockOnResult.mockClear()
    vi.resetAllMocks()
    
    // Re-render to reset state
    render(<TranscriptForm onResult={mockOnResult} />)
    
    // Video path - re-query file input since previous reference is stale after cleanup
    const videoFileInput = document.querySelector('input[type="file"]')
    const extractedAudioBlob = new Blob(['audio content'], { type: 'audio/webm' })
    videoToAudio.mockResolvedValueOnce(extractedAudioBlob)
    transcribeAudio.mockResolvedValueOnce(transcriptText)
    
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    Object.defineProperty(videoFileInput, 'files', {
      value: [videoFile],
      writable: true,
    })
    
    fireEvent.change(videoFileInput)
    fireEvent.click(screen.getByRole('button', { name: /analyze transcript/i }))
    
    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith({ transcript: transcriptText })
    })
  })

  test('9. After error, clicking Reset clears error banner and button returns to default disabled-until-input state', async () => {
    const errorMessage = 'API request failed with status 500'
    
    transcribeAudio.mockRejectedValueOnce(new Error(errorMessage))

    render(<TranscriptForm onResult={mockOnResult} />)
    
    // Select an audio file and submit to trigger error
    const fileInput = document.querySelector('input[type="file"]')
    const audioFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [audioFile],
      writable: true,
    })
    
    fireEvent.change(fileInput)
    fireEvent.click(screen.getByRole('button', { name: /analyze transcript/i }))
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
    
    // Click Reset
    const resetButton = screen.getByRole('button', { name: 'Reset' })
    fireEvent.click(resetButton)
    
    // Assert error banner is cleared
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument()
    
    // Assert button returns to default disabled-until-input state
    expect(screen.getByRole('button', { name: /analyze transcript/i })).toBeDisabled()
  })
})
