/**
 * Groq Whisper API Transcription Utility
 * 
 * Design Decision (Task 8.0):
 * ==========================
 * This utility handles audio-to-text transcription via Groq's Whisper API.
 * 
 * 1. Endpoint:
 *    - URL: https://api.groq.com/openai/v1/audio/transcriptions
 *    - Method: POST
 * 
 * 2. Model:
 *    - whisper-large-v3-turbo (optimized for speed and accuracy)
 * 
 * 3. Authentication:
 *    - Authorization: Bearer ${import.meta.env.VITE_GROQ_API_KEY}
 *    - API key read from environment variable (never hardcoded)
 * 
 * 4. Request Format:
 *    - multipart/form-data via FormData
 *    - Fields:
 *      * file: audio Blob (mp3, wav, m4a, ogg, flac)
 *      * model: "whisper-large-v3-turbo"
 *      * response_format: "json"
 * 
 * 5. Response Parsing:
 *    - Success: { text: "..." } - returns the transcribed text string
 *    - Error: { error: { message, type, code } } - throws normalized Error
 * 
 * 6. Pre-flight Validation:
 *    - 25MB size check performed INSIDE this function, before any network call
 *    - Rejects immediately with clear error if file exceeds limit
 *    - Prevents unnecessary network round trips for oversized files
 */

/**
 * Maximum file size for audio uploads (25MB in bytes)
 * Groq's Whisper API has a 25MB limit for audio files
 */
const MAX_FILE_SIZE = 25 * 1024 * 1024

/**
 * Transcribes an audio file using Groq's Whisper API.
 * 
 * @param {Blob} audioBlob - The audio file blob to transcribe
 * @returns {Promise<string>} - A Promise that resolves to the transcribed text
 * @throws {Error} - Throws an error if:
 *   - File size exceeds 25MB limit
 *   - API key is missing
 *   - Network error occurs
 *   - API returns an error response
 */
export async function transcribeAudio(audioBlob) {
  // Pre-flight size check - reject before any network call
  if (audioBlob.size > MAX_FILE_SIZE) {
    throw new Error(`Audio file size exceeds 25MB limit (${(audioBlob.size / (1024 * 1024)).toFixed(2)}MB). Please use a smaller file.`)
  }

  // Get API key from environment
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) {
    throw new Error('Groq API key not configured. Please set VITE_GROQ_API_KEY environment variable.')
  }

  // Build FormData payload
  const formData = new FormData()
  formData.append('file', audioBlob, audioBlob.name || 'audio.webm')
  formData.append('model', 'whisper-large-v3-turbo')
  formData.append('response_format', 'json')

  try {
    // Send POST request to Groq Whisper API
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    })

    // Handle non-2xx responses
    if (!response.ok) {
      let errorData = {}
      try {
        errorData = await response.json()
      } catch (parseError) {
        // If we can't parse the error body, use status text
        errorData = { error: { message: response.statusText, type: 'api_error', code: response.status } }
      }
      
      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`
      throw new Error(errorMessage)
    }

    // Parse successful response
    const data = await response.json()
    
    // Return the transcribed text
    return data.text
    
  } catch (error) {
    // Handle network errors or other fetch failures
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to transcription service. Please check your connection.')
    }
    
    // Re-throw other errors (including our normalized API errors)
    throw error
  }
}
