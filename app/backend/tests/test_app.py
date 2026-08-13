import pytest
from fastapi.testclient import TestClient
from app import app


@pytest.fixture
def client():
    return TestClient(app)


class TestHealthCheck:
    def test_health_check_returns_200(self, client):
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


class TestAnalyzeEndpoint:
    def test_analyze_returns_200_with_valid_transcript(self, client):
        response = client.post(
            "/api/analyze",
            json={"transcript": "This is a test transcript"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "requirements_spec" in data
        assert "task_breakdown" in data
        assert "sow" in data
        assert data["requirements_spec"] == "stub"
        assert data["task_breakdown"] == "stub"
        assert data["sow"] == "stub"

    def test_analyze_returns_400_for_empty_transcript(self, client):
        response = client.post(
            "/api/analyze",
            json={"transcript": ""}
        )
        assert response.status_code == 400
        assert "error" in response.json()

    def test_analyze_returns_400_for_missing_transcript(self, client):
        response = client.post(
            "/api/analyze",
            json={}
        )
        assert response.status_code == 400
        assert "error" in response.json()


class TestApiKeyLoading:
    def test_api_key_loaded_from_environment(self):
        # This test verifies the API key is loaded at startup
        # The app will fail to start if the key is missing
        from app import OPENROUTER_API_KEY
        assert OPENROUTER_API_KEY is not None
        assert OPENROUTER_API_KEY != ""

    def test_missing_api_key_raises_valueerror(self, monkeypatch):
        # Remove the API key from environment
        monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
        
        # Import the app module fresh - should raise ValueError
        import importlib
        import sys
        
        # Remove app from sys.modules to force re-import
        if 'app' in sys.modules:
            del sys.modules['app']
        
        with pytest.raises(ValueError) as exc_info:
            import app
        
        assert "OPENROUTER_API_KEY" in str(exc_info.value)
