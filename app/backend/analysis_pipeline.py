import os
import requests
from pathlib import Path


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
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set")
    
    model = os.getenv("OPENROUTER_MODEL", "openrouter/poolside/laguna-xs-2.1:free")
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
    
    try:
        response = requests.post(url, headers=headers, json=body, timeout=timeout)
        response.raise_for_status()
    except requests.exceptions.Timeout:
        raise RuntimeError(f"OpenRouter API request timed out after {timeout} seconds")
    except requests.exceptions.ConnectionError as e:
        raise RuntimeError(f"Failed to connect to OpenRouter API: {e}")
    except requests.exceptions.HTTPError as e:
        raise RuntimeError(f"OpenRouter API returned HTTP error: {e}")
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
            if content and "#" in content:
                result["requirements_spec"] = content
    
    # Extract task_breakdown
    task_start = "===TASK_BREAKDOWN==="
    task_end = "===END_TASK_BREAKDOWN==="
    if task_start in raw_text and task_end in raw_text:
        start_idx = raw_text.find(task_start) + len(task_start)
        end_idx = raw_text.find(task_end)
        if start_idx < end_idx:
            content = raw_text[start_idx:end_idx].strip()
            if content and "#" in content:
                result["task_breakdown"] = content
    
    # Extract sow
    sow_start = "===SOW==="
    sow_end = "===END_SOW==="
    if sow_start in raw_text and sow_end in raw_text:
        start_idx = raw_text.find(sow_start) + len(sow_start)
        end_idx = raw_text.find(sow_end)
        if start_idx < end_idx:
            content = raw_text[start_idx:end_idx].strip()
            if content and "#" in content:
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
