/**
 * Video-to-Audio Extraction Utility
 * 
 * Design Decision (Task 7.0):
 * ==========================
 * This utility extracts audio from video files using native browser APIs only:
 * 
 * 1. Pipeline:
 *    - Video File/Blob → Off-DOM HTMLVideoElement (loaded via object URL)
 *    - HTMLVideoElement → AudioContext (via createMediaElementSource)
 *    - AudioContext → MediaStreamAudioDestinationNode (audio-only destination for recording)
 *    - MediaStreamAudioDestinationNode → MediaRecorder (captures audio stream)
 *    - MediaRecorder → Audio Blob (assembled from recorded chunks)
 *    - Note: The video element is NOT muted (video.muted = false) so that createMediaElementSource
 *      receives real decoded audio. Speaker silence is achieved via a separate zero-gain path
 *      (GainNode with gain.value = 0) connected to audioContext.destination, rather than muting
 *      the video element itself. Muting the video element would silence the Web Audio graph too,
 *      resulting in silent audio being recorded.
 * 
 * 2. MIME Type Selection:
 *    - Chosen: 'audio/webm' (with opus codec when available)
 *    - Rationale: 
 *      * Groq's Whisper API accepts 'audio/webm' format
 *      * WebM is broadly supported across modern browsers
 *      * Opus codec provides excellent quality at low bitrates
 *      * Fallback to 'audio/webm;codecs=opus' if available, otherwise generic 'audio/webm'
 * 
 * 3. Error Handling:
 *    - Video load failures are caught via the video element's 'error' event
 *    - Promise rejects with descriptive error message
 *    - Two-phase timeout protection:
 *      * Initial 10-second timeout guards against video failing to load metadata
 *      * After metadata loads, a duration-scaled timeout (duration + 15s buffer) prevents hanging on stalled playback
 *      * If duration is unavailable or invalid, defaults to 10-minute processing timeout
 * 
 * 4. Browser Compatibility:
 *    - Requires MediaRecorder API support
 *    - Requires AudioContext API support
 *    - Works in all modern browsers (Chrome, Firefox, Safari, Edge)
 */

/**
 * Extracts audio from a video file using native browser APIs.
 * 
 * @param {File|Blob} videoFile - The video file or blob to extract audio from
 * @returns {Promise<Blob>} - A Promise that resolves to an audio Blob with MIME type 'audio/webm'
 * @throws {Error} - Rejects with error if video fails to load or process
 */
export async function videoToAudio(videoFile) {
  return new Promise((resolve, reject) => {
    // Create off-DOM video element
    const video = document.createElement('video');
    
    // Set video to not autoplay, NOT muted (muted would silence the Web Audio graph)
    video.autoplay = false;
    video.muted = false;
    video.playsInline = true;
    
    // Create object URL for the video file
    const videoUrl = URL.createObjectURL(videoFile);
    
    // Initial short timeout (10 seconds) to guard against video failing to load metadata
    let processingTimeout = setTimeout(() => {
      clearTimeout(processingTimeout);
      URL.revokeObjectURL(videoUrl);
      reject(new Error('Video processing timed out — playback did not complete within the expected duration'));
    }, 10000);
    
    // Set up error handling for video loading failures
    video.addEventListener('error', (event) => {
      clearTimeout(processingTimeout);
      URL.revokeObjectURL(videoUrl);
      const errorMessage = video.error?.message || 'Failed to load video file';
      reject(new Error(`Video loading failed: ${errorMessage}`));
    });
    
    // Set up load event to start audio extraction
    video.addEventListener('loadedmetadata', () => {
      try {
        // Clear the initial load timeout immediately since we've successfully loaded metadata
        clearTimeout(processingTimeout);
        
        // Calculate processing timeout based on actual video duration
        // Use video.duration (seconds) + 15 second buffer, converted to milliseconds
        // Fall back to 10 minutes if duration is not a finite number
        const durationMs = video.duration;
        const timeoutMs = (typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs > 0)
          ? (durationMs * 1000) + 15000
          : 600000; // 10 minutes fallback
        
        processingTimeout = setTimeout(() => {
          clearTimeout(processingTimeout);
          URL.revokeObjectURL(videoUrl);
          reject(new Error('Video processing timed out — playback did not complete within the expected duration'));
        }, timeoutMs);
        
        // Create AudioContext
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create MediaElementSourceNode from video
        const mediaSource = audioContext.createMediaElementSource(video);
        
        // Create MediaStreamAudioDestinationNode to capture audio for recording
        const destination = audioContext.createMediaStreamDestination();
        
        // Create a GainNode for speaker silence (zero gain path to speakers)
        const silencer = audioContext.createGain();
        silencer.gain.value = 0;
        
        // Connect the source to the destination for recording (full volume)
        mediaSource.connect(destination);
        
        // Connect the source to the silencer for speaker output (zero volume)
        mediaSource.connect(silencer);
        silencer.connect(audioContext.destination);
        
        // Determine the best MIME type for MediaRecorder
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        }
        
        // Create MediaRecorder with the audio stream
        const mediaRecorder = new MediaRecorder(destination.stream, { mimeType });
        
        const chunks = [];
        
        // Collect audio chunks
        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        });
        
        // Resolve with the audio blob when recording stops
        mediaRecorder.addEventListener('stop', () => {
          clearTimeout(processingTimeout);
          URL.revokeObjectURL(videoUrl);
          
          if (chunks.length === 0) {
            reject(new Error('No audio data was captured from the video'));
            return;
          }
          
          const audioBlob = new Blob(chunks, { type: mimeType });
          resolve(audioBlob);
        });
        
        // Start recording
        mediaRecorder.start();
        
        // Handle video ended event
        video.addEventListener('ended', () => {
          clearTimeout(processingTimeout);
          mediaRecorder.stop();
        });
        
        // Start playing the video (muted, so no audio output)
        video.play().catch((playError) => {
          clearTimeout(processingTimeout);
          URL.revokeObjectURL(videoUrl);
          reject(new Error(`Failed to start video playback: ${playError.message}`));
        });
        
      } catch (setupError) {
        clearTimeout(processingTimeout);
        URL.revokeObjectURL(videoUrl);
        reject(new Error(`Audio extraction setup failed: ${setupError.message}`));
      }
    });
    
    // Load the video - this must happen OUTSIDE any event handler
    video.src = videoUrl;
  });
}
