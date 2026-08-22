"""
Test suite for app/backend/analysis_pipeline.py

Covers all four functions: load_prompt(), call_openrouter(), parse_response(), analyze_transcript()
Uses pytest-mock for all HTTP mocking - no real API calls.
"""

import pytest
from unittest.mock import patch, mock_open, MagicMock
import requests
from pathlib import Path

from analysis_pipeline import (
    load_prompt,
    call_openrouter,
    parse_response,
    analyze_transcript,
    OpenRouterError,
    OpenRouterRateLimitError,
)


# =============================================================================
# Fixtures for mock response payloads
# =============================================================================

@pytest.fixture
def success_response():
    """Mock successful 200 response from OpenRouter API."""
    return {
        "choices": [
            {
                "message": {
                    "content": "Test content",
                    "role": "assistant"
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {}
    }


@pytest.fixture
def rate_limit_response_short_wait():
    """Mock 429 rate limit response with short wait time (<=10s)."""
    return {
        "error": {
            "message": "Rate limit exceeded: free-models-per-day...",
            "code": 429,
            "metadata": {
                "headers": {
                    "X-RateLimit-Limit": "50",
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": "1234567890123"  # ~1 second from now
                }
            },
            "limit_source": "openrouter_free_tier_daily"
        },
        "user_id": "test-user"
    }


@pytest.fixture
def rate_limit_response_daily_exhausted():
    """Mock 429 rate limit response indicating daily quota exhaustion (>10s wait)."""
    return {
        "error": {
            "message": "Rate limit exceeded: free-models-per-day...",
            "code": 429,
            "metadata": {
                "headers": {
                    "X-RateLimit-Limit": "50",
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": "9999999999999"  # ~185 days from now
                }
            },
            "limit_source": "openrouter_free_tier_daily"
        },
        "user_id": "test-user"
    }


@pytest.fixture
def malformed_response():
    """Mock response missing required fields."""
    return {"unexpected": "structure"}


@pytest.fixture
def well_formed_transcript_response():
    """Mock response with all three sections properly delimited."""
    return """===REQUIREMENTS_SPEC===
# Requirements Specification

## Problem Statement
- **Current State:** Users need to analyze transcripts
- **Pain Points:** Manual analysis is slow
- **Impact:** Reduced productivity

## Goals
- **Primary Goals:** Automate transcript analysis
- **Non-Goals:** Real-time processing

## Requirements
| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Analyze transcript | Must | |
| NFR-001 | Response time < 5s | Must | |
===END_REQUIREMENTS_SPEC===

===TASK_BREAKDOWN===
### BACKEND-001: Create API endpoint
**Description:** Create POST /api/analyze endpoint
**Depends on:** None
**Acceptance Criteria:**
- [ ] Endpoint accepts transcript
- [ ] Returns JSON response

### FRONTEND-001: Create input form
**Description:** Create React form for transcript input
**Depends on:** BACKEND-001
**Acceptance Criteria:**
- [ ] Form has textarea
- [ ] Form submits to API
===END_TASK_BREAKDOWN===

===SOW===
# Statement of Work

## Project Name
ABAA Transcript Analysis

## Project Term
Start: 2024-01-01, End: 2024-02-01

## Service Description
Analysis of client meeting transcripts.

## Staffing
| # | Role | Location | Rate | Duration | Headcount |
|---|------|----------|------|----------|-----------|
| 1 | Developer | Remote | $100 | 1 month | 1 |

## Milestones and Deliverables
| Milestone/Deliverable | Description | Target Date |
|-----------------------|-------------|-------------|
| MVP | Basic functionality | 2024-01-15 |
===END_SOW===
"""


# =============================================================================
# load_prompt() tests
# =============================================================================

class TestLoadPrompt:
    """Tests for load_prompt() function."""

    def test_load_prompt_returns_content(self):
        """load_prompt() should successfully load and return prompt content."""
        # Use the actual prompt file path
        prompt_path = Path(__file__).parent.parent / "prompts" / "transcript_analysis.txt"

        # If the file exists, test with it
        if prompt_path.exists():
            content = load_prompt()
            assert isinstance(content, str)
            assert len(content) > 0
            assert "TRANSCRIPT:" in content
            assert "===REQUIREMENTS_SPEC===" in content
            assert "===TASK_BREAKDOWN===" in content
            assert "===SOW===" in content

    def test_load_prompt_raises_filenotfound_for_missing_file(self, monkeypatch):
        """load_prompt() should raise FileNotFoundError if prompt file doesn't exist."""
        with patch("analysis_pipeline.Path") as mock_path:
            mock_path_instance = MagicMock()
            mock_path_instance.parent = mock_path_instance          # .parent routes back to itself
            mock_path_instance.__truediv__.return_value = mock_path_instance  # each "/" routes back to itself
            mock_path_instance.exists.return_value = False
            mock_path.return_value = mock_path_instance

            with pytest.raises(FileNotFoundError) as exc_info:
                load_prompt()

            assert "Prompt file not found" in str(exc_info.value)


# =============================================================================
# call_openrouter() tests
# =============================================================================

class TestCallOpenrouter:
    """Tests for call_openrouter() function."""

    @patch("analysis_pipeline.requests.post")
    @patch("analysis_pipeline.os.getenv")
    def test_call_openrouter_success(self, mock_getenv, mock_post, success_response):
        """call_openrouter() should extract and return content from successful response."""
        mock_getenv.side_effect = lambda key, default=None: {
            "OPENROUTER_API_KEY": "test-api-key",
            "OPENROUTER_MODEL": "poolside/laguna-xs-2.1:free",
            "OPENROUTER_TIMEOUT": "30"
        }.get(key, default)

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = success_response
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        result = call_openrouter("test prompt")

        assert result == "Test content"
        mock_post.assert_called_once()

    @patch("analysis_pipeline.requests.post")
    @patch("analysis_pipeline.os.getenv")
    def test_call_openrouter_429_short_wait_retries(self, mock_getenv, mock_post, rate_limit_response_short_wait):
        """call_openrouter() should retry with exponential backoff for short wait 429 errors."""
        mock_getenv.side_effect = lambda key, default=None: {
            "OPENROUTER_API_KEY": "test-api-key",
            "OPENROUTER_MODEL": "poolside/laguna-xs-2.1:free",
            "OPENROUTER_TIMEOUT": "30"
        }.get(key, default)

        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.json.return_value = rate_limit_response_short_wait
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)
        mock_post.return_value = mock_response

        with patch("analysis_pipeline.time.sleep") as mock_sleep:
            with pytest.raises(OpenRouterRateLimitError):
                call_openrouter("test prompt")

            # Should have retried 3 times (1s, 2s, 4s delays)
            assert mock_sleep.call_count == 3
            mock_sleep.assert_any_call(1)
            mock_sleep.assert_any_call(2)
            mock_sleep.assert_any_call(4)

    @patch("analysis_pipeline.requests.post")
    @patch("analysis_pipeline.os.getenv")
    def test_call_openrouter_429_daily_quota_skips_retry(self, mock_getenv, mock_post, rate_limit_response_daily_exhausted):
        """call_openrouter() should skip retries for daily quota exhaustion (>10s wait)."""
        mock_getenv.side_effect = lambda key, default=None: {
            "OPENROUTER_API_KEY": "test-api-key",
            "OPENROUTER_MODEL": "poolside/laguna-xs-2.1:free",
            "OPENROUTER_TIMEOUT": "30"
        }.get(key, default)

        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.json.return_value = rate_limit_response_daily_exhausted
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)
        mock_post.return_value = mock_response

        with patch("analysis_pipeline.time.sleep") as mock_sleep:
            with pytest.raises(OpenRouterRateLimitError) as exc_info:
                call_openrouter("test prompt")

            # Should NOT have retried - daily quota exhausted
            assert mock_sleep.call_count == 0
            assert "daily quota exhausted" in str(exc_info.value)

    @patch("analysis_pipeline.requests.post")
    @patch("analysis_pipeline.os.getenv")
    def test_call_openrouter_timeout_raises_error(self, mock_getenv, mock_post):
        """call_openrouter() should raise OpenRouterError for timeout."""
        mock_getenv.side_effect = lambda key, default=None: {
            "OPENROUTER_API_KEY": "test-api-key",
            "OPENROUTER_MODEL": "poolside/laguna-xs-2.1:free",
            "OPENROUTER_TIMEOUT": "30"
        }.get(key, default)

        mock_post.side_effect = requests.exceptions.Timeout("Connection timed out")

        with patch("analysis_pipeline.time.sleep") as mock_sleep:
            with pytest.raises(OpenRouterError):
                call_openrouter("test prompt")

            # Should not retry on timeout
            assert mock_sleep.call_count == 0

    @patch("analysis_pipeline.requests.post")
    @patch("analysis_pipeline.os.getenv")
    def test_call_openrouter_connection_error_raises_error(self, mock_getenv, mock_post):
        """call_openrouter() should raise OpenRouterError for connection errors."""
        mock_getenv.side_effect = lambda key, default=None: {
            "OPENROUTER_API_KEY": "test-api-key",
            "OPENROUTER_MODEL": "poolside/laguna-xs-2.1:free",
            "OPENROUTER_TIMEOUT": "30"
        }.get(key, default)

        mock_post.side_effect = requests.exceptions.ConnectionError("Connection failed")

        with patch("analysis_pipeline.time.sleep") as mock_sleep:
            with pytest.raises(OpenRouterError):
                call_openrouter("test prompt")

            # Should not retry on connection error
            assert mock_sleep.call_count == 0

    @patch("analysis_pipeline.requests.post")
    @patch("analysis_pipeline.os.getenv")
    def test_call_openrouter_500_error_raises_error(self, mock_getenv, mock_post):
        """call_openrouter() should raise OpenRouterError for 500 errors."""
        mock_getenv.side_effect = lambda key, default=None: {
            "OPENROUTER_API_KEY": "test-api-key",
            "OPENROUTER_MODEL": "poolside/laguna-xs-2.1:free",
            "OPENROUTER_TIMEOUT": "30"
        }.get(key, default)

        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)
        mock_post.return_value = mock_response

        with patch("analysis_pipeline.time.sleep") as mock_sleep:
            with pytest.raises(OpenRouterError):
                call_openrouter("test prompt")

            # Should not retry on 500 error
            assert mock_sleep.call_count == 0

    @patch("analysis_pipeline.requests.post")
    @patch("analysis_pipeline.os.getenv")
    def test_call_openrouter_rate_limit_before_base_error(self, mock_getenv, mock_post, rate_limit_response_short_wait):
        """OpenRouterRateLimitError should be caught before OpenRouterError (subclass check)."""
        mock_getenv.side_effect = lambda key, default=None: {
            "OPENROUTER_API_KEY": "test-api-key",
            "OPENROUTER_MODEL": "poolside/laguna-xs-2.1:free",
            "OPENROUTER_TIMEOUT": "30"
        }.get(key, default)

        mock_response = MagicMock()
        mock_response.status_code = 429
        mock_response.json.return_value = rate_limit_response_short_wait
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(response=mock_response)
        mock_post.return_value = mock_response

        with patch("analysis_pipeline.time.sleep"):
            # This should raise OpenRouterRateLimitError, not OpenRouterError
            with pytest.raises(OpenRouterRateLimitError):
                call_openrouter("test prompt")

            # Verify it's the specific subclass, not the base class
            try:
                call_openrouter("test prompt")
            except OpenRouterRateLimitError:
                pass  # Correct
            except OpenRouterError:
                pytest.fail("Should have raised OpenRouterRateLimitError, not OpenRouterError")

    @patch("analysis_pipeline.requests.post")
    @patch("analysis_pipeline.os.getenv")
    def test_call_openrouter_missing_api_key(self, mock_getenv, mock_post):
        """call_openrouter() should raise ValueError if API key is missing."""
        mock_getenv.side_effect = lambda key, default=None: {
            "OPENROUTER_API_KEY": None,
            "OPENROUTER_MODEL": "poolside/laguna-xs-2.1:free",
            "OPENROUTER_TIMEOUT": "30"
        }.get(key, default)

        with pytest.raises(ValueError) as exc_info:
            call_openrouter("test prompt")

        assert "OPENROUTER_API_KEY" in str(exc_info.value)


# =============================================================================
# parse_response() tests
# =============================================================================

class TestParseResponse:
    """Tests for parse_response() function."""

    def test_parse_response_all_sections(self, well_formed_transcript_response):
        """parse_response() should correctly extract all three sections."""
        result = parse_response(well_formed_transcript_response)

        assert "requirements_spec" in result
        assert "task_breakdown" in result
        assert "sow" in result

        assert len(result["requirements_spec"]) > 0
        assert len(result["task_breakdown"]) > 0
        assert len(result["sow"]) > 0

        assert "Requirements Specification" in result["requirements_spec"]
        assert "BACKEND-001" in result["task_breakdown"]
        assert "Statement of Work" in result["sow"]

    def test_parse_response_missing_requirements_spec(self):
        """parse_response() should handle missing REQUIREMENTS_SPEC section."""
        input_text = """===TASK_BREAKDOWN===
Some task content
===END_TASK_BREAKDOWN===

===SOW===
Some SOW content
===END_SOW===
"""
        result = parse_response(input_text)

        assert result["requirements_spec"] == ""
        assert len(result["task_breakdown"]) > 0
        assert len(result["sow"]) > 0

    def test_parse_response_missing_task_breakdown(self):
        """parse_response() should handle missing TASK_BREAKDOWN section."""
        input_text = """===REQUIREMENTS_SPEC===
Some requirements content
===END_REQUIREMENTS_SPEC===

===SOW===
Some SOW content
===END_SOW===
"""
        result = parse_response(input_text)

        assert len(result["requirements_spec"]) > 0
        assert result["task_breakdown"] == ""
        assert len(result["sow"]) > 0

    def test_parse_response_missing_sow(self):
        """parse_response() should handle missing SOW section."""
        input_text = """===REQUIREMENTS_SPEC===
Some requirements content
===END_REQUIREMENTS_SPEC===

===TASK_BREAKDOWN===
Some task content
===END_TASK_BREAKDOWN===
"""
        result = parse_response(input_text)

        assert len(result["requirements_spec"]) > 0
        assert len(result["task_breakdown"]) > 0
        assert result["sow"] == ""

    def test_parse_response_no_delimiters(self):
        """parse_response() should return empty sections for input with no delimiters."""
        input_text = "This is just some random text without any delimiters"
        result = parse_response(input_text)

        assert result["requirements_spec"] == ""
        assert result["task_breakdown"] == ""
        assert result["sow"] == ""

    def test_parse_response_preserves_hash_characters(self):
        """parse_response() should preserve # characters in content (regression test)."""
        input_text = """===REQUIREMENTS_SPEC===
# Requirements with # symbols

## Section #1
Content with # character

### Subsection #2
More # content
===END_REQUIREMENTS_SPEC===

===TASK_BREAKDOWN===
- Task 1
===END_TASK_BREAKDOWN===

===SOW===
- SOW content
===END_SOW===
"""
        result = parse_response(input_text)

        assert "#" in result["requirements_spec"]
        assert "# Requirements with # symbols" in result["requirements_spec"]
        assert "Section #1" in result["requirements_spec"]
        assert "Subsection #2" in result["requirements_spec"]

    def test_parse_response_empty_input(self):
        """parse_response() should handle empty input gracefully."""
        result = parse_response("")

        assert result["requirements_spec"] == ""
        assert result["task_breakdown"] == ""
        assert result["sow"] == ""


# =============================================================================
# analyze_transcript() tests
# =============================================================================

class TestAnalyzeTranscript:
    """Tests for analyze_transcript() orchestration function."""

    @patch("analysis_pipeline.call_openrouter")
    @patch("analysis_pipeline.load_prompt")
    def test_analyze_transcript_happy_path(self, mock_load_prompt, mock_call_openrouter, well_formed_transcript_response):
        """analyze_transcript() should return all three parsed sections on success."""
        mock_load_prompt.return_value = "Test prompt template"
        mock_call_openrouter.return_value = well_formed_transcript_response

        result = analyze_transcript("Test transcript content")

        assert "requirements_spec" in result
        assert "task_breakdown" in result
        assert "sow" in result

        assert len(result["requirements_spec"]) > 0
        assert len(result["task_breakdown"]) > 0
        assert len(result["sow"]) > 0

        mock_load_prompt.assert_called_once()
        mock_call_openrouter.assert_called_once()

    @patch("analysis_pipeline.call_openrouter")
    @patch("analysis_pipeline.load_prompt")
    def test_analyze_transcript_propagates_rate_limit_error(self, mock_load_prompt, mock_call_openrouter):
        """analyze_transcript() should propagate OpenRouterRateLimitError without swallowing it."""
        mock_load_prompt.return_value = "Test prompt template"
        mock_call_openrouter.side_effect = OpenRouterRateLimitError("Rate limit exceeded")

        with pytest.raises(OpenRouterRateLimitError) as exc_info:
            analyze_transcript("Test transcript")

        assert "Rate limit exceeded" in str(exc_info.value)

    @patch("analysis_pipeline.call_openrouter")
    @patch("analysis_pipeline.load_prompt")
    def test_analyze_transcript_propagates_openrouter_error(self, mock_load_prompt, mock_call_openrouter):
        """analyze_transcript() should propagate OpenRouterError without swallowing it."""
        mock_load_prompt.return_value = "Test prompt template"
        mock_call_openrouter.side_effect = OpenRouterError("API error")

        with pytest.raises(OpenRouterError) as exc_info:
            analyze_transcript("Test transcript")

        assert "API error" in str(exc_info.value)

    @patch("analysis_pipeline.call_openrouter")
    @patch("analysis_pipeline.load_prompt")
    def test_analyze_transcript_with_empty_response(self, mock_load_prompt, mock_call_openrouter):
        """analyze_transcript() should handle empty response from API."""
        mock_load_prompt.return_value = "Test prompt template"
        mock_call_openrouter.return_value = ""

        result = analyze_transcript("Test transcript")

        assert result["requirements_spec"] == ""
        assert result["task_breakdown"] == ""
        assert result["sow"] == ""
