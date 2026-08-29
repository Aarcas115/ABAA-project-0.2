import React, { useState } from 'react'
import { detectFileType, getMaxFileSize } from '../utils/fileDetection'
import { videoToAudio } from '../utils/videoToAudio'
import { transcribeAudio } from '../api/transcription'

function TranscriptForm({ onResult }) {
  const [transcript, setTranscript] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [inputType, setInputType] = useState('text') // 'text', 'audio', or 'video'
  const [extractedAudio, setExtractedAudio] = useState(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Handle file input
    if (selectedFile) {
      if (inputType === 'video') {
        // Extract audio from video before processing
        setIsExtracting(true)
        setError(null)
        
        try {
          const audioBlob = await videoToAudio(selectedFile)
          setExtractedAudio(audioBlob)
          
          // Transition from extraction to transcription phase
          setIsExtracting(false)
          setIsTranscribing(true)
          
          const transcribedText = await transcribeAudio(audioBlob)
          if (onResult) {
            onResult({ transcript: transcribedText })
          }
        } catch (err) {
          setError(err.message || 'Failed to process video for transcription')
          if (onResult) {
            onResult(null)
          }
        } finally {
          setIsExtracting(false)
          setIsTranscribing(false)
        }
        return
      }
      
      if (inputType === 'audio') {
        // Transcribe audio file via Groq
        setError(null)
        
        try {
          setIsTranscribing(true)
          const transcribedText = await transcribeAudio(selectedFile)
          if (onResult) {
            onResult({ transcript: transcribedText })
          }
        } catch (err) {
          setError(err.message || 'Failed to transcribe audio')
          if (onResult) {
            onResult(null)
          }
        } finally {
          setIsTranscribing(false)
        }
        return
      }
    }

    // Handle text input
    if (!transcript.trim()) {
      setError('Please enter a transcript')
      return
    }

    if (onResult) {
      onResult({ transcript })
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setTranscript(value)
    
    // Clear file when text is typed (mutual exclusivity)
    if (value.trim() && selectedFile) {
      setSelectedFile(null)
      setExtractedAudio(null)
      setInputType('text')
    }
    
    if (error) setError(null)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const type = detectFileType(file)
      
      // Only check file size for audio files, not video files.
      // Video files will be processed in Task 7 (video-to-audio extraction),
      // at which point the extracted audio blob will be validated against
      // the 25MB limit. Checking raw video size would produce false-positive
      // rejections for reasonable inputs.
      if (type === 'audio' && file.size > getMaxFileSize()) {
        setError('File size exceeds 25MB limit')
        return
      }

      // Clear transcript when file is dropped (mutual exclusivity)
      if (transcript) {
        setTranscript('')
      }

      setSelectedFile(file)
      setInputType(type)
      setExtractedAudio(null)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleReset = () => {
    setTranscript('')
    setSelectedFile(null)
    setExtractedAudio(null)
    setInputType('text')
    setError(null)
    setIsExtracting(false)
    setIsTranscribing(false)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="transcript" className="block text-sm font-medium text-gray-300 mb-2">
            Client Meeting Transcript
          </label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={handleInputChange}
            placeholder="Paste the client meeting transcript here..."
            rows={10}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            disabled={isExtracting || isTranscribing}
          />
        </div>

        <div className="relative">
          <input
            type="file"
            accept=".mp3,.wav,.m4a,.ogg,.flac,.mp4,.mov,.avi,.mkv,.webm"
            onChange={handleFileChange}
            disabled={isExtracting || isTranscribing}
            className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => document.querySelector('input[type="file"]')?.click()}
            disabled={isExtracting || isTranscribing}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-100 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {selectedFile ? `Selected: ${selectedFile.name}` : 'Or upload audio/video file'}
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={isExtracting || isTranscribing || (!transcript.trim() && !selectedFile)}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {isExtracting ? 'Extracting audio...' : isTranscribing ? 'Transcribing...' : 'Analyze Transcript'}
          </button>
          {(selectedFile || transcript) && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isExtracting || isTranscribing}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-100 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}

export default TranscriptForm
