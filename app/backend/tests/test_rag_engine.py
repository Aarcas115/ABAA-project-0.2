from pathlib import Path
import pytest
import rag_engine
from rag_engine import RagEngine

FENCE = chr(96) * 3
REPO_ROOT = Path(__file__).resolve().parents[3]
ALPHA_TEXT = "## Apple Basics\nApples are red fruit. Apples grow on trees in orchards.\n\n## Banana Basics\nBananas are yellow fruit that grow in bunches on tropical plants.\n"
BETA_TEXT = "# Gamma Guide\nGamma rays are a form of radiation studied in physics.\n\n## Delta Notes\nDelta is the fourth letter. Delta notes cover rivers and deltas.\n"
TWO_SECTIONS = "## Section One\nFirst line here.\nSecond line here.\n\n## Section Two\nOther body.\n"


def write_corpus(folder):
    (folder / "alpha.txt").write_text(ALPHA_TEXT, encoding="utf-8")
    (folder / "beta.md").write_text(BETA_TEXT, encoding="utf-8")
    return [folder / "alpha.txt", folder / "beta.md"]


@pytest.fixture
def synthetic_engine(tmp_path):
    return RagEngine(write_corpus(tmp_path))


@pytest.fixture
def real_engine(monkeypatch):
    monkeypatch.setattr(rag_engine, "_engine", None)
    return rag_engine.get_engine()


class TestLoadingAndChunking:
    def test_both_files_load_with_correct_source_and_heading(self, synthetic_engine):
        assert synthetic_engine.chunk_count == 4
        pairs = {(c["source"], c["heading"]) for c in synthetic_engine.chunks}
        expected = {("alpha.txt", "Apple Basics"), ("alpha.txt", "Banana Basics"),
                    ("beta.md", "Gamma Guide"), ("beta.md", "Delta Notes")}
        assert pairs == expected

    def test_chunker_ignores_hash_lines_inside_code_fences(self, tmp_path):
        content = "\n".join([
            "## Real Section",
            "Intro text for the real section.",
            "",
            FENCE + "text",
            "# Not A Heading",
            "## Also Not A Heading",
            FENCE,
            "",
            "More text after the fence.",
            "",
            "## Second Section",
            "Second body.",
            ""
        ])
        (tmp_path / "fence.md").write_text(content, encoding="utf-8")
        engine = RagEngine([tmp_path / "fence.md"])
        headings = [c["heading"] for c in engine.chunks]
        assert headings == ["Real Section", "Second Section"]
        assert "# Not A Heading" in engine.chunks[0]["text"]
        assert "More text after the fence." in engine.chunks[0]["text"]

    def test_text_before_first_heading_is_ignored(self, tmp_path):
        content = "Preamble only text.\n## One\nBody one.\n"
        (tmp_path / "preamble.md").write_text(content, encoding="utf-8")
        engine = RagEngine([tmp_path / "preamble.md"])
        assert engine.chunk_count == 1
        assert engine.chunks[0]["heading"] == "One"
        assert engine.chunks[0]["text"] == "Body one."

    def test_heading_only_sections_are_dropped(self, tmp_path):
        content = "## Parent Heading\n## Child Section\nChild body text here.\n\n## Empty Tail\n"
        (tmp_path / "hierarchy.md").write_text(content, encoding="utf-8")
        engine = RagEngine([tmp_path / "hierarchy.md"])
        headings = [c["heading"] for c in engine.chunks]
        assert headings == ["Child Section"]

    def test_crlf_file_chunks_same_as_lf_file(self, tmp_path):
        lf_path = tmp_path / "lf"
        crlf_path = tmp_path / "crlf"
        lf_path.mkdir()
        crlf_path.mkdir()
        (lf_path / "doc.md").write_bytes(TWO_SECTIONS.encode("utf-8"))
        (crlf_path / "doc.md").write_bytes(TWO_SECTIONS.replace("\n", "\r\n").encode("utf-8"))
        lf_engine = RagEngine([lf_path / "doc.md"])
        crlf_engine = RagEngine([crlf_path / "doc.md"])
        lf_tuples = [(c["source"], c["heading"], c["text"]) for c in lf_engine.chunks]
        crlf_tuples = [(c["source"], c["heading"], c["text"]) for c in crlf_engine.chunks]
        assert lf_tuples == crlf_tuples
        assert lf_engine.chunk_count == 2
        assert crlf_engine.chunk_count == 2
        for c in crlf_engine.chunks:
            assert "\r" not in c["heading"]
            assert "\r" not in c["text"]
        lf_results = lf_engine.search("second line")
        crlf_results = crlf_engine.search("second line")
        assert lf_results == crlf_results
        assert len(lf_results) == 1

    def test_missing_file_is_skipped_and_others_stay_searchable(self, tmp_path):
        alpha_path = tmp_path / "alpha.txt"
        alpha_path.write_text(ALPHA_TEXT, encoding="utf-8")
        missing = tmp_path / "missing.txt"
        engine = RagEngine([missing, alpha_path])
        assert engine.chunk_count == 2
        results = engine.search("apples")
        assert len(results) == 1

    def test_undecodable_file_is_skipped(self, tmp_path):
        alpha_path = tmp_path / "alpha.txt"
        alpha_path.write_text(ALPHA_TEXT, encoding="utf-8")
        bad = tmp_path / "bad.txt"
        bad.write_bytes(b"\xff\xfe\x00bad bytes")
        engine = RagEngine([bad, alpha_path])
        assert engine.chunk_count == 2

    def test_all_files_missing_gives_empty_engine(self, tmp_path):
        nope1 = tmp_path / "nope1.txt"
        nope2 = tmp_path / "nope2.txt"
        engine = RagEngine([nope1, nope2])
        assert engine.chunk_count == 0
        assert engine.search("anything") == []


class TestSearch:
    def test_targeted_query_returns_expected_chunk_first(self, synthetic_engine):
        results = synthetic_engine.search("apples orchards")
        assert len(results) == 1
        assert results[0]["heading"] == "Apple Basics"

    def test_zero_score_chunks_are_excluded(self, synthetic_engine):
        assert synthetic_engine.search("zebra") == []
        results = synthetic_engine.search("apples")
        assert len(results) == 1
        assert results[0]["heading"] == "Apple Basics"

    def test_top_k_is_respected(self, synthetic_engine):
        results_2 = synthetic_engine.search("fruit", top_k=2)
        assert len(results_2) == 2
        results_1 = synthetic_engine.search("fruit", top_k=1)
        assert len(results_1) == 1
        assert results_1[0] == results_2[0]

    def test_source_filter_uses_exact_file_name(self, synthetic_engine):
        results = synthetic_engine.search("delta notes", source="beta.md")
        assert len(results) > 0
        for r in results:
            assert r["source"] == "beta.md"
        assert "Delta Notes" in results[0]["heading"]
        assert synthetic_engine.search("fruit", source="beta.md") == []
        results_alpha = synthetic_engine.search("fruit", source="alpha.txt")
        assert len(results_alpha) == 2
        assert synthetic_engine.search("fruit", source="alpha") == []

    def test_blank_and_stopword_only_queries_return_empty_list(self, synthetic_engine):
        for query in ["", "   ", "the and of", "\n\t"]:
            assert synthetic_engine.search(query) == []


class TestSingleton:
    def test_get_engine_is_lazy_and_returns_same_object(self, monkeypatch):
        monkeypatch.setattr(rag_engine, "_engine", None)
        assert rag_engine._engine is None
        first = rag_engine.get_engine()
        second = rag_engine.get_engine()
        assert first is second
        assert rag_engine._engine is first

    def test_get_engine_builds_from_corpus_constants(self, tmp_path, monkeypatch):
        write_corpus(tmp_path)
        monkeypatch.setattr(rag_engine, "_engine", None)
        monkeypatch.setattr(rag_engine, "CORPUS_DIR", tmp_path)
        monkeypatch.setattr(rag_engine, "CORPUS_FILES", ("alpha.txt", "beta.md"))
        engine = rag_engine.get_engine()
        assert engine.chunk_count == 4

    def test_get_engine_does_not_raise_when_corpus_is_missing(self, tmp_path, monkeypatch):
        no_folder = tmp_path / "no_such_folder"
        monkeypatch.setattr(rag_engine, "_engine", None)
        monkeypatch.setattr(rag_engine, "CORPUS_DIR", no_folder)
        engine = rag_engine.get_engine()
        assert engine.chunk_count == 0


class TestRealCorpus:
    def test_each_source_file_returns_results_for_requirement(self, real_engine):
        assert real_engine.chunk_count > 0
        for source in ("ba-sources.txt", "ba-standards.md"):
            results = real_engine.search("requirement", source=source)
            assert len(results) > 0
            for r in results:
                assert r["source"] == source

    def test_requirement_types_query_finds_working_taxonomy(self, real_engine):
        results = real_engine.search(
            "requirement types functional non-functional data interface connectivity",
            top_k=3
        )
        found = any(
            r["source"] == "ba-standards.md" and "Working taxonomy" in r["heading"]
            for r in results
        )
        assert found

    def test_confidence_scoring_query_finds_quality_criteria(self, real_engine):
        results = real_engine.search(
            "confidence scoring complete unambiguous verifiable traceable",
            top_k=3
        )
        found = any(
            r["source"] == "ba-standards.md" and "Quality Criteria" in r["heading"]
            for r in results
        )
        assert found

    def test_runtime_ba_standards_copy_matches_canonical_doc(self):
        runtime_path = REPO_ROOT / "app" / "backend" / "knowledge" / "ba-standards.md"
        canonical_path = REPO_ROOT / "docs" / "context" / "ba-standards.md"
        runtime_text = runtime_path.read_bytes().decode("utf-8").replace("\r\n", "\n")
        canonical_text = canonical_path.read_bytes().decode("utf-8").replace("\r\n", "\n")
        assert runtime_text == canonical_text


class TestResultContract:
    def test_search_results_have_expected_keys_types_and_order(self, real_engine):
        # This stands in for the plan test "Gap analysis queries RAG for context when needed"
        # because gap_analysis.py does not exist until Task 16.
        queries = [
            "requirement",
            "clarifying questions rationale",
            "confidence scoring complete unambiguous verifiable traceable"
        ]
        for query in queries:
            results = real_engine.search(query, top_k=5)
            assert 0 < len(results) <= 5
            for r in results:
                assert set(r.keys()) == {"source", "heading", "text", "score"}
                assert isinstance(r["source"], str)
                assert isinstance(r["heading"], str)
                assert isinstance(r["text"], str)
                assert isinstance(r["score"], float)
                assert r["score"] > 0
                assert r["score"] == round(r["score"], 4)
            scores = [r["score"] for r in results]
            assert scores == sorted(scores, reverse=True)
