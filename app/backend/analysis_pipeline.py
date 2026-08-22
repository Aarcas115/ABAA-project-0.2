import os
import time
import requests
from pathlib import Path


class OpenRouterError(RuntimeError):
    """Base exception for OpenRouter API failures."""
    pass


class OpenRouterRateLimitError(OpenRouterError):
    """Raised specifically when OpenRouter returns HTTP 429."""
    pass


def load_prompt() -> str:
    """
    Reads the transcript analysis prompt template from disk.

    Returns:
        str: The contents of the prompt file.

    Raises:
        FileNotFoundError: If the prompt file does not exist.
    """
    prompt_path = Path(__file__).parent / "prompts" / "transcript_analysis.txt"

    if not prompt_path.exists():
        raise FileNotFoundError(f"Prompt file not found at {prompt_path}")

    return prompt_path.read_text(encoding="utf-8")


def call_openrouter(prompt: str) -> str:
    """
    Calls the OpenRouter API with the given prompt.

    Args:
        prompt: The prompt to send to the OpenRouter API.

    Returns:
        str: The raw text content from the OpenRouter response.

    Raises:
        ValueError: If OPENROUTER_API_KEY is not set.
        RuntimeError: If the API request fails or returns an unexpected response.
        OpenRouterRateLimitError: If rate limit is exceeded (429).
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set")

    model = os.getenv("OPENROUTER_MODEL", "poolside/laguna-xs-2.1:free")
    timeout = int(os.getenv("OPENROUTER_TIMEOUT", "30"))

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4000,
    }

    max_retries = 3
    retry_delays = [1, 2, 4]  # Exponential backoff: 1s, 2s, 4s

    for attempt in range(max_retries + 1):
        try:
            response = requests.post(url, headers=headers, json=body, timeout=timeout)
            response.raise_for_status()
        except requests.exceptions.Timeout:
            raise OpenRouterError(f"OpenRouter API request timed out after {timeout} seconds")
        except requests.exceptions.ConnectionError as e:
            raise OpenRouterError(f"Failed to connect to OpenRouter API: {e}")
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 429:
                # Parse X-RateLimit-Reset from response JSON
                reset_time_ms = None
                try:
                    error_data = e.response.json()
                    if "error" in error_data and "metadata" in error_data["error"] and "headers" in error_data["error"]["metadata"]:
                        headers_data = error_data["error"]["metadata"]["headers"]
                        if "X-RateLimit-Reset" in headers_data:
                            reset_time_ms = int(headers_data["X-RateLimit-Reset"])
                except (KeyError, ValueError, TypeError):
                    pass

                # Calculate wait time from reset timestamp
                if reset_time_ms is not None:
                    reset_time_sec = reset_time_ms / 1000
                    current_time = time.time()
                    wait_time = reset_time_sec - current_time

                    # Fail-fast: if reset is more than 10 seconds away, it's a daily quota issue
                    if wait_time > 10:
                        raise OpenRouterRateLimitError(
                            f"OpenRouter API rate limit exceeded: daily quota exhausted, "
                            f"resets at {reset_time_sec:.0f} (Unix timestamp). "
                            f"No retries attempted for long-term quota issue."
                        ) from e

                # If we're here, either no reset time or wait <= 10 seconds
                # Proceed with retry loop using exponential backoff
                if attempt < max_retries:
                    delay = retry_delays[attempt]
                    time.sleep(delay)
                    continue

                # All retries exhausted
                raise OpenRouterRateLimitError(
                    f"OpenRouter API rate limit exceeded after {max_retries + 1} attempts"
                ) from e
            raise OpenRouterError(f"OpenRouter API returned HTTP error: {e}") from e
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"OpenRouter API request failed: {e}")

        try:
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            return content
        except (KeyError, IndexError, ValueError) as e:
            raise RuntimeError(f"Unexpected response structure from OpenRouter API: {e}")


def parse_response(raw_text: str) -> dict:
    """
    Extracts the three output sections from the raw LLM response.

    Args:
        raw_text: The raw text response from the LLM.

    Returns:
        dict: A dictionary with keys "requirements_spec", "task_breakdown", "sow".
              Each value is the trimmed content between its delimiter pair.
              Missing or malformed sections result in empty strings.
    """
    result = {
        "requirements_spec": "",
        "task_breakdown": "",
        "sow": "",
    }

    # Extract requirements_spec
    req_start = "===REQUIREMENTS_SPEC==="
    req_end = "===END_REQUIREMENTS_SPEC==="
    if req_start in raw_text and req_end in raw_text:
        start_idx = raw_text.find(req_start) + len(req_start)
        end_idx = raw_text.find(req_end)
        if start_idx < end_idx:
            content = raw_text[start_idx:end_idx].strip()
            result["requirements_spec"] = content

    # Extract task_breakdown
    task_start = "===TASK_BREAKDOWN==="
    task_end = "===END_TASK_BREAKDOWN==="
    if task_start in raw_text and task_end in raw_text:
        start_idx = raw_text.find(task_start) + len(task_start)
        end_idx = raw_text.find(task_end)
        if start_idx < end_idx:
            content = raw_text[start_idx:end_idx].strip()
            result["task_breakdown"] = content

    # Extract sow
    sow_start = "===SOW==="
    sow_end = "===END_SOW==="
    if sow_start in raw_text and sow_end in raw_text:
        start_idx = raw_text.find(sow_start) + len(sow_start)
        end_idx = raw_text.find(sow_end)
        if start_idx < end_idx:
            content = raw_text[start_idx:end_idx].strip()
            result["sow"] = content

    return result


def analyze_transcript(transcript: str) -> dict:
    """
    Orchestrates the full transcript analysis pipeline.

    Args:
        transcript: The client meeting transcript to analyze.

    Returns:
        dict: A dictionary with keys "requirements_spec", "task_breakdown", "sow".
    """
    prompt_template = load_prompt()
    prompt = prompt_template.replace("{transcript}", transcript)
    raw_response = call_openrouter(prompt)
    return parse_response(raw_response)
