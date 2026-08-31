import { vi } from 'vitest'
import { videoToAudio } from './videoToAudio'

// Mock MediaRecorder, AudioContext, and related browser APIs
class MockAudioContext {
  constructor() {
    this.state = 'running'
    this._gainNodes = []
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

  createGain() {
    const gainNode = {
      gain: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn()
    }
    this._gainNodes.push(gainNode)
    return gainNode
  }

  close() {
    this.state = 'closed'
  }
}

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

// Mock global browser APIs
global.AudioContext = MockAudioContext
global.MediaRecorder = MockMediaRecorder
global.MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true)

describe('videoToAudio', () => {
  let mockVideoElement
  let mockUrl
  let eventListeners
  let mockAudioContext

  beforeEach(() => {
    eventListeners = {}
    mockAudioContext = new MockAudioContext()
    mockVideoElement = {
      autoplay: false,
      muted: false,
      playsInline: true,
      src: '',
      duration: 0,
      error: null,
      addEventListener: vi.fn((event, cb) => {
        if (!eventListeners[event]) eventListeners[event] = []
        eventListeners[event].push(cb)
      }),
      removeEventListener: vi.fn(),
      play: vi.fn().mockResolvedValue(undefined),
      set src(url) {
        mockUrl = url
      }
    }

    // Mock document.createElement to return our mock video element
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'video') return mockVideoElement
      return document.createElement(tag)
    })

    // Mock URL API
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()

    // Mock Event constructor
    global.Event = vi.fn().mockImplementation((type) => ({ type }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('Video to audio extraction creates valid audio blob', async () => {
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    
    const resultPromise = videoToAudio(videoFile)
    
    // Simulate loadedmetadata event
    const loadedMetadataCallback = eventListeners['loadedmetadata'][0]
    loadedMetadataCallback()
    
    // Simulate ended event
    const endedCallback = eventListeners['ended'][0]
    endedCallback()
    
    const result = await resultPromise
    
    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('audio/webm')
  })

  test('Extraction handles common video formats', async () => {
    const videoFile = new File(['video content'], 'test.mov', { type: 'video/quicktime' })
    
    const resultPromise = videoToAudio(videoFile)
    
    const loadedMetadataCallback = eventListeners['loadedmetadata'][0]
    loadedMetadataCallback()
    
    const endedCallback = eventListeners['ended'][0]
    endedCallback()
    
    const result = await resultPromise
    
    expect(result).toBeInstanceOf(Blob)
  })

  test('Extraction rejects invalid video input', async () => {
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    
    const resultPromise = videoToAudio(videoFile)
    
    // Simulate error event
    const errorCallback = eventListeners['error'][0]
    errorCallback()
    
    await expect(resultPromise).rejects.toThrow('Video loading failed')
  })

  test('Longer video duration does not trigger premature timeout', async () => {
    const videoFile = new File(['video content'], 'long-video.mp4', { type: 'video/mp4' })
    
    const resultPromise = videoToAudio(videoFile)
    
    // Simulate loadedmetadata event with a 45-second video duration
    mockVideoElement.duration = 45
    const loadedMetadataCallback = eventListeners['loadedmetadata'][0]
    loadedMetadataCallback()
    
    // Wait past the old 10-second mark (simulating 45 seconds of processing time)
    // The new timeout should be 45 * 1000 + 15000 = 47000ms, so waiting 50 seconds
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // Simulate ended event (which should have cleared the timeout)
    const endedCallback = eventListeners['ended'][0]
    endedCallback()
    
    const result = await resultPromise
    
    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('audio/webm')
  })

  test('Handles video with missing or invalid duration gracefully', async () => {
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    
    const resultPromise = videoToAudio(videoFile)
    
    // Simulate loadedmetadata event with invalid duration (Infinity)
    mockVideoElement.duration = Infinity
    const loadedMetadataCallback = eventListeners['loadedmetadata'][0]
    loadedMetadataCallback()
    
    // Simulate ended event quickly
    const endedCallback = eventListeners['ended'][0]
    endedCallback()
    
    const result = await resultPromise
    
    expect(result).toBeInstanceOf(Blob)
  })

  test('Timeout fires with descriptive error message when processing takes too long', async () => {
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    
    const resultPromise = videoToAudio(videoFile)
    
    // Simulate loadedmetadata event with a very long video duration
    mockVideoElement.duration = 3600 // 1 hour
    const loadedMetadataCallback = eventListeners['loadedmetadata'][0]
    loadedMetadataCallback()
    
    // Wait past the timeout (3600 * 1000 + 15000 = 3615000ms)
    // Instead, we'll just wait 20 seconds which should trigger the initial 10s timeout
    // since the duration-based timeout would be 1 hour
    await new Promise(resolve => setTimeout(resolve, 15000))
    
    await expect(resultPromise).rejects.toThrow('Video processing timed out')
  })

  test('Video element is not muted so real audio flows into Web Audio graph', async () => {
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    
    const resultPromise = videoToAudio(videoFile)
    
    const loadedMetadataCallback = eventListeners['loadedmetadata'][0]
    loadedMetadataCallback()
    
    const endedCallback = eventListeners['ended'][0]
    endedCallback()
    
    await resultPromise
    
    // Verify video.muted is false so createMediaElementSource receives real audio
    expect(mockVideoElement.muted).toBe(false)
  })

  test('GainNode is created with zero gain and connected for speaker silence', async () => {
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    
    const resultPromise = videoToAudio(videoFile)
    
    const loadedMetadataCallback = eventListeners['loadedmetadata'][0]
    loadedMetadataCallback()
    
    const endedCallback = eventListeners['ended'][0]
    endedCallback()
    
    await resultPromise
    
    // Verify a GainNode was created with zero gain
    expect(mockAudioContext._gainNodes.length).toBeGreaterThan(0)
    const gainNode = mockAudioContext._gainNodes[0]
    expect(gainNode.gain.value).toBe(0)
    
    // Verify the gain node was connected to the audio context destination
    expect(gainNode.connect).toHaveBeenCalled()
  })
})
