import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { videoToAudio } from './videoToAudio.js'

// Mock AudioContext
class MockAudioContext {
  constructor() {
    this.state = 'running'
  }

  createMediaElementSource(videoElement) {
    return {
      connect: vi.fn(),
      disconnect: vi.fn()
    }
  }

  createMediaStreamDestination() {
    return {
      stream: { getTracks: () => [], getAudioTracks: () => [], id: 'mock-stream-id' },
      connect: vi.fn(),
      disconnect: vi.fn()
    }
  }

  close() {
    this.state = 'closed'
  }
}

// Mock MediaRecorder
class MockMediaRecorder {
  constructor(stream, options) {
    this.stream = stream
    this.options = options
    this.state = 'inactive'
    this._listeners = {}
  }

  start() {
    this.state = 'recording'
  }

  stop() {
    this.state = 'inactive'
    // Dispatch 'dataavailable' event with mock audio data
    const mockAudioData = new Blob(['mock audio data'], { type: 'audio/webm' })
    const dataEvent = { data: mockAudioData }
    if (this._listeners['dataavailable']) {
      this._listeners['dataavailable'].forEach(cb => cb(dataEvent))
    }
    // Dispatch 'stop' event
    const stopEvent = new Event('stop')
    if (this._listeners['stop']) {
      this._listeners['stop'].forEach(cb => cb(stopEvent))
    }
  }

  addEventListener(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = []
    }
    this._listeners[event].push(callback)
  }

  removeEventListener(event, callback) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback)
    }
  }

  dispatchEvent(event) {
    const eventType = event.type
    if (this._listeners[eventType]) {
      this._listeners[eventType].forEach(cb => cb(event))
    }
  }
}

describe('videoToAudio', () => {
  let originalAudioContext
  let originalMediaRecorder
  let originalURL
  let capturedVideoElement
  let createElementSpy

  beforeEach(() => {
    // Store original implementations
    originalAudioContext = window.AudioContext
    originalMediaRecorder = window.MediaRecorder
    originalURL = window.URL

    // Set up mocks
    window.AudioContext = MockAudioContext
    window.webkitAudioContext = MockAudioContext
    window.MediaRecorder = MockMediaRecorder
    window.MediaRecorder.isTypeSupported = vi.fn(() => true)
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-video-url')
    window.URL.revokeObjectURL = vi.fn()

    // Capture the real original implementation BEFORE installing the spy
    const originalCreateElement = document.createElement.bind(document)
    
    // Spy on document.createElement to capture the video element
    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'video') {
        capturedVideoElement = element
        // Override play method since jsdom's HTMLVideoElement doesn't implement it
        capturedVideoElement.play = vi.fn(() => Promise.resolve())
      }
      return element
    })
  })

  afterEach(() => {
    // Restore original implementations
    window.AudioContext = originalAudioContext
    window.webkitAudioContext = originalAudioContext
    window.MediaRecorder = originalMediaRecorder
    window.URL = originalURL
    createElementSpy.mockRestore()
    vi.useRealTimers()
  })

  describe('Video to audio extraction creates valid audio blob', () => {
    it('should resolve with a Blob of correct MIME type for audio/webm', async () => {
      // Override isTypeSupported to only accept plain 'audio/webm', forcing the fallback path
      window.MediaRecorder.isTypeSupported = vi.fn((mimeType) => mimeType === 'audio/webm')

      const videoFile = new File(['mock video content'], 'test-video.mp4', { type: 'video/mp4' })

      const resultPromise = videoToAudio(videoFile)

      // capturedVideoElement is set by the createElement spy in beforeEach
      // Simulate loadedmetadata event
      capturedVideoElement.dispatchEvent(new Event('loadedmetadata'))

      // Wait a tick for async operations
      await new Promise(resolve => setTimeout(resolve, 0))

      // Simulate ended event
      capturedVideoElement.dispatchEvent(new Event('ended'))

      // Wait for the promise to resolve
      const audioBlob = await resultPromise

      expect(audioBlob).toBeInstanceOf(Blob)
      expect(audioBlob.type).toBe('audio/webm')
    })

    it('should resolve with a Blob of correct MIME type for audio/webm;codecs=opus when supported', async () => {
      // Mock isTypeSupported to return true for opus codec
      window.MediaRecorder.isTypeSupported = vi.fn((mimeType) => {
        return mimeType === 'audio/webm;codecs=opus'
      })

      const videoFile = new File(['mock video content'], 'test-video.mp4', { type: 'video/mp4' })

      const resultPromise = videoToAudio(videoFile)

      // capturedVideoElement is set by the createElement spy in beforeEach
      // Simulate loadedmetadata event
      capturedVideoElement.dispatchEvent(new Event('loadedmetadata'))

      // Wait a tick for async operations
      await new Promise(resolve => setTimeout(resolve, 0))

      // Simulate ended event
      capturedVideoElement.dispatchEvent(new Event('ended'))

      // Wait for the promise to resolve
      const audioBlob = await resultPromise

      expect(audioBlob).toBeInstanceOf(Blob)
      expect(audioBlob.type).toBe('audio/webm;codecs=opus')
    })
  })

  describe('Extraction handles common video formats', () => {
    it('should work with video/mp4 format', async () => {
      const videoFile = new File(['mock video content'], 'test-video.mp4', { type: 'video/mp4' })

      const resultPromise = videoToAudio(videoFile)

      // capturedVideoElement is set by the createElement spy in beforeEach
      capturedVideoElement.dispatchEvent(new Event('loadedmetadata'))
      await new Promise(resolve => setTimeout(resolve, 0))
      capturedVideoElement.dispatchEvent(new Event('ended'))

      const audioBlob = await resultPromise

      expect(audioBlob).toBeInstanceOf(Blob)
      expect(audioBlob.type).toMatch(/^audio\/webm/)
    })

    it('should work with video/webm format', async () => {
      const videoFile = new File(['mock video content'], 'test-video.webm', { type: 'video/webm' })

      const resultPromise = videoToAudio(videoFile)

      // capturedVideoElement is set by the createElement spy in beforeEach
      capturedVideoElement.dispatchEvent(new Event('loadedmetadata'))
      await new Promise(resolve => setTimeout(resolve, 0))
      capturedVideoElement.dispatchEvent(new Event('ended'))

      const audioBlob = await resultPromise

      expect(audioBlob).toBeInstanceOf(Blob)
      expect(audioBlob.type).toMatch(/^audio\/webm/)
    })

    it('should work with video/quicktime format', async () => {
      const videoFile = new File(['mock video content'], 'test-video.mov', { type: 'video/quicktime' })

      const resultPromise = videoToAudio(videoFile)

      // capturedVideoElement is set by the createElement spy in beforeEach
      capturedVideoElement.dispatchEvent(new Event('loadedmetadata'))
      await new Promise(resolve => setTimeout(resolve, 0))
      capturedVideoElement.dispatchEvent(new Event('ended'))

      const audioBlob = await resultPromise

      expect(audioBlob).toBeInstanceOf(Blob)
      expect(audioBlob.type).toMatch(/^audio\/webm/)
    })
  })

  describe('Extraction rejects invalid video input', () => {
    it('should reject with error message when video element dispatches error event', async () => {
      const videoFile = new File(['mock video content'], 'corrupted-video.mp4', { type: 'video/mp4' })

      const resultPromise = videoToAudio(videoFile)

      // capturedVideoElement is set by the createElement spy in beforeEach
      // Simulate error event - use Object.defineProperty since jsdom's error property may be read-only
      Object.defineProperty(capturedVideoElement, 'error', {
        value: { message: 'Media decode error' },
        configurable: true
      })
      capturedVideoElement.dispatchEvent(new Event('error'))

      await expect(resultPromise).rejects.toThrow('Video loading failed: Media decode error')
    })

    it('should reject with timeout error when video processing takes too long', async () => {
      vi.useFakeTimers()

      const videoFile = new File(['mock video content'], 'slow-video.mp4', { type: 'video/mp4' })

      const resultPromise = videoToAudio(videoFile)

      // capturedVideoElement is set by the createElement spy in beforeEach
      // Simulate loadedmetadata event but don't dispatch ended
      capturedVideoElement.dispatchEvent(new Event('loadedmetadata'))

      // Advance time by 10 seconds (the timeout duration)
      vi.advanceTimersByTime(10000)

      await expect(resultPromise).rejects.toThrow('Video processing timed out after 10 seconds')
    })
  })
})
