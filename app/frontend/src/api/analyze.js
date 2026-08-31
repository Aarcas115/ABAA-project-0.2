/**
 * Backend Analysis API Utility
 * 
 * Design Decision (Task 8.6):
 * ==========================
 * This utility handles the final step of the ABAA pipeline: sending the
 * transcribed text to the backend for full analysis and receiving the
 * requirements spec, task breakdown, and statement of work.
 * 
 * 1. Endpoint:
 *    - URL: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/analyze`
 *    - Method: POST
 * 
 * 2. Request Format:
 *    - Content-Type: application/json
 *    - Body: { transcript: string }
 * 
 * 3. Response Parsing:
 *    - Success: { requirements_spec, task_breakdown, sow }
 *    - Error: { error: "message" } with status 400/429/500
 * 
 * 4. Error Handling:
 *    - Non-2xx responses: throws Error with backend's error message
 *    - Network errors: throws 'Network error: unable to reach analysis service'
 */

/**
 * Analyzes a transcript by sending it to the backend analysis service.
 * 
 * @param {string} transcript - The transcript text to analyze
 * @returns {Promise<{ requirements_spec: string, task_breakdown: string, sow: string }>} 
 *   A Promise that resolves to the analysis results
 * @throws {Error} - Throws an error if:
 *   - Network error occurs
 *   - Backend returns a non-2xx response
 *   - Response cannot be parsed
 */
export async function analyzeTranscript(transcript) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const endpoint = `${apiUrl}/api/analyze`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript }),
    })

    // Handle non-2xx responses
    if (!response.ok) {
      let errorData = {}
      try {
        errorData = await response.json()
      } catch (parseError) {
        // If we can't parse the error body, use status text
        errorData = { error: `Analysis service error (status ${response.status})` }
      }
      
      const errorMessage = errorData.error || `Analysis service error (status ${response.status})`
      throw new Error(errorMessage)
    }

    // Parse and return successful response
    return response.json()
    
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: unable to reach analysis service')
    }
    
    // Re-throw other errors (including our normalized API errors)
    throw error
  }
}
