import { describe, it, expect } from 'vitest'
import { detectFileType, getMaxFileSize, isAudioFile, isVideoFile, isFileSizeValid } from './fileDetection'

describe('detectFileType', () => {
  it('returns "text" for null/undefined file', () => {
    expect(detectFileType(null)).toBe('text')
    expect(detectFileType(undefined)).toBe('text')
  })

  it('returns "audio" for audio MIME types', () => {
    const mp3 = new File(['content'], 'test.mp3', { type: 'audio/mpeg' })
    const wav = new File(['content'], 'test.wav', { type: 'audio/wav' })
    const m4a = new File(['content'], 'test.m4a', { type: 'audio/mp4' })
    const ogg = new File(['content'], 'test.ogg', { type: 'audio/ogg' })
    const flac = new File(['content'], 'test.flac', { type: 'audio/flac' })

    expect(detectFileType(mp3)).toBe('audio')
    expect(detectFileType(wav)).toBe('audio')
    expect(detectFileType(m4a)).toBe('audio')
    expect(detectFileType(ogg)).toBe('audio')
    expect(detectFileType(flac)).toBe('audio')
  })

  it('returns "audio" for audio file extensions (fallback)', () => {
    const mp3 = new File(['content'], 'test.mp3', { type: '' })
    const wav = new File(['content'], 'test.wav', { type: '' })
    const m4a = new File(['content'], 'test.m4a', { type: '' })
    const ogg = new File(['content'], 'test.ogg', { type: '' })
    const flac = new File(['content'], 'test.flac', { type: '' })

    expect(detectFileType(mp3)).toBe('audio')
    expect(detectFileType(wav)).toBe('audio')
    expect(detectFileType(m4a)).toBe('audio')
    expect(detectFileType(ogg)).toBe('audio')
    expect(detectFileType(flac)).toBe('audio')
  })

  it('returns "video" for video MIME types', () => {
    const mp4 = new File(['content'], 'test.mp4', { type: 'video/mp4' })
    const mov = new File(['content'], 'test.mov', { type: 'video/quicktime' })
    const avi = new File(['content'], 'test.avi', { type: 'video/x-msvideo' })
    const mkv = new File(['content'], 'test.mkv', { type: 'video/x-matroska' })
    const webm = new File(['content'], 'test.webm', { type: 'video/webm' })

    expect(detectFileType(mp4)).toBe('video')
    expect(detectFileType(mov)).toBe('video')
    expect(detectFileType(avi)).toBe('video')
    expect(detectFileType(mkv)).toBe('video')
    expect(detectFileType(webm)).toBe('video')
  })

  it('returns "video" for video file extensions (fallback)', () => {
    const mp4 = new File(['content'], 'test.mp4', { type: '' })
    const mov = new File(['content'], 'test.mov', { type: '' })
    const avi = new File(['content'], 'test.avi', { type: '' })
    const mkv = new File(['content'], 'test.mkv', { type: '' })
    const webm = new File(['content'], 'test.webm', { type: '' })

    expect(detectFileType(mp4)).toBe('video')
    expect(detectFileType(mov)).toBe('video')
    expect(detectFileType(avi)).toBe('video')
    expect(detectFileType(mkv)).toBe('video')
    expect(detectFileType(webm)).toBe('video')
  })

  it('throws error for executable files', () => {
    const exe = new File(['content'], 'test.exe', { type: 'application/octet-stream' })
    
    expect(() => detectFileType(exe)).toThrow('Unsupported file type: application/octet-stream')
  })

  it('throws error for PDF files', () => {
    const pdf = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    
    expect(() => detectFileType(pdf)).toThrow('Unsupported file type: application/pdf')
  })

  it('throws error for unsupported MIME types', () => {
    const doc = new File(['content'], 'test.doc', { type: 'application/msword' })
    
    expect(() => detectFileType(doc)).toThrow('Unsupported file type: application/msword')
  })

  it('throws error for unsupported extension with no MIME type', () => {
    const xyz = new File(['content'], 'test.xyz', { type: '' })
    
    expect(() => detectFileType(xyz)).toThrow('Unsupported file type: test.xyz')
  })
})

describe('getMaxFileSize', () => {
  it('returns 25MB in bytes', () => {
    expect(getMaxFileSize()).toBe(25 * 1024 * 1024)
  })
})

describe('isAudioFile', () => {
  it('returns true for audio files', () => {
    const mp3 = new File(['content'], 'test.mp3', { type: 'audio/mpeg' })
    expect(isAudioFile(mp3)).toBe(true)
  })

  it('returns false for video files', () => {
    const mp4 = new File(['content'], 'test.mp4', { type: 'video/mp4' })
    expect(isAudioFile(mp4)).toBe(false)
  })

  it('returns false for unsupported files', () => {
    const exe = new File(['content'], 'test.exe', { type: 'application/octet-stream' })
    expect(isAudioFile(exe)).toBe(false)
  })
})

describe('isVideoFile', () => {
  it('returns true for video files', () => {
    const mp4 = new File(['content'], 'test.mp4', { type: 'video/mp4' })
    expect(isVideoFile(mp4)).toBe(true)
  })

  it('returns false for audio files', () => {
    const mp3 = new File(['content'], 'test.mp3', { type: 'audio/mpeg' })
    expect(isVideoFile(mp3)).toBe(false)
  })

  it('returns false for unsupported files', () => {
    const exe = new File(['content'], 'test.exe', { type: 'application/octet-stream' })
    expect(isVideoFile(exe)).toBe(false)
  })
})

describe('isFileSizeValid', () => {
  it('returns true for files under 25MB', () => {
    const smallFile = new File(['content'], 'small.mp3', { type: 'audio/mpeg' })
    // Create a file with size less than 25MB
    const file = new File([new ArrayBuffer(10 * 1024 * 1024)], 'small.mp3', { type: 'audio/mpeg' })
    expect(isFileSizeValid(file)).toBe(true)
  })

  it('returns true for files exactly at 25MB (boundary case)', () => {
    // Create a file exactly at 25MB
    const file = new File([new ArrayBuffer(25 * 1024 * 1024)], 'exact.mp3', { type: 'audio/mpeg' })
    expect(isFileSizeValid(file)).toBe(true)
  })

  it('returns false for files over 25MB', () => {
    // Create a file over 25MB
    const file = new File([new ArrayBuffer(26 * 1024 * 1024)], 'large.mp3', { type: 'audio/mpeg' })
    expect(isFileSizeValid(file)).toBe(false)
  })
})
