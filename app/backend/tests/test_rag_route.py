import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app import app as fastapi_app

EXPECTED_KEYS = {"source", "heading", "text", "score"}
TAXONOMY_QUERY = "requirement types functional non-functional data interface connectivity"


@pytest.fixture
def client():
    return TestClient(fastapi_app)


class TestRagQueryEndpoint:
    def test_returns_200_with_results_for_valid_query(self, client):
        response = client.post("/api/rag/query", json={"query": TAXONOMY_QUERY})
        assert response.status_code == 200
        data = response.json()
        results = data["results"]
        assert isinstance(results, list)
        assert len(results) >= 1
        for item in results:
            assert set(item.keys()) == EXPECTED_KEYS
        found_taxonomy = any("Working taxonomy" in item["heading"] for item in results)
        assert found_taxonomy

    def test_default_top_k_returns_at_most_three_results(self, client):
        response = client.post("/api/rag/query", json={"query": "requirement"})
        assert response.status_code == 200
        results = response.json()["results"]
        assert 1 <= len(results) <= 3

    def test_top_k_one_returns_one_result(self, client):
        response = client.post("/api/rag/query", json={"query": "requirement", "top_k": 1})
        assert response.status_code == 200
        results = response.json()["results"]
        assert len(results) == 1

    def test_top_k_upper_bound_is_accepted(self, client):
        response = client.post("/api/rag/query", json={"query": "requirement", "top_k": 10})
        assert response.status_code == 200
        results = response.json()["results"]
        assert 1 <= len(results) <= 10

    @pytest.mark.parametrize("top_k_in_payload,expected_top_k", [(None, 3), (5, 5)])
    def test_passes_query_and_top_k_to_engine_search(self, client, top_k_in_payload, expected_top_k):
        with patch('rag_engine.get_engine') as mock_get_engine:
            engine = MagicMock()
            engine.chunk_count = 5
            engine.search.return_value = [{"source": "s.txt", "heading": "H", "text": "T", "score": 1.0}]
            mock_get_engine.return_value = engine
            payload = {"query": "gap analysis"}
            if top_k_in_payload is not None:
                payload["top_k"] = top_k_in_payload
            response = client.post("/api/rag/query", json=payload)
            assert response.status_code == 200
            assert response.json() == {"results": engine.search.return_value}
            engine.search.assert_called_once_with("gap analysis", expected_top_k)

    def test_blank_query_returns_400(self, client):
        response = client.post("/api/rag/query", json={"query": ""})
        assert response.status_code == 400
        assert response.json() == {"error": "Query field is required and must be non-empty"}

    def test_whitespace_only_query_returns_400(self, client):
        response = client.post("/api/rag/query", json={"query": "   "})
        assert response.status_code == 400
        assert response.json() == {"error": "Query field is required and must be non-empty"}

    def test_missing_query_returns_400(self, client):
        response = client.post("/api/rag/query", json={})
        assert response.status_code == 400
        assert response.json() == {"error": "Validation error"}

    @pytest.mark.parametrize("top_k", [0, 11])
    def test_top_k_out_of_range_returns_400(self, client, top_k):
        response = client.post("/api/rag/query", json={"query": "requirement", "top_k": top_k})
        assert response.status_code == 400
        assert response.json() == {"error": "Validation error"}

    def test_returns_503_when_corpus_is_empty(self, client):
        with patch('rag_engine.get_engine') as mock_get_engine:
            engine = MagicMock()
            engine.chunk_count = 0
            mock_get_engine.return_value = engine
            response = client.post("/api/rag/query", json={"query": "requirement"})
            assert response.status_code == 503
            assert "error" in response.json()
            assert response.json() == {"error": "RAG corpus is unavailable"}
            engine.search.assert_not_called()
