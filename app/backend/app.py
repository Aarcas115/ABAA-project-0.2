import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import analysis_pipeline
import rag_engine

# Load environment variables
load_dotenv()

# Validate API key is present at startup
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY environment variable is required but not set")

# Load the RAG corpus at cold start (never raises; an empty corpus is reported by /api/rag/query)
rag_engine.get_engine()

# Create FastAPI app instance
app = FastAPI()

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://abaa-project-02.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request body model
class TranscriptRequest(BaseModel):
    transcript: str

# RAG query request model
class RagQueryRequest(BaseModel):
    query: str
    top_k: int = Field(default=3, ge=1, le=10)

# Health check endpoint
@app.get("/")
async def health_check():
    return {"status": "healthy"}

# Analyze endpoint
@app.post("/api/analyze")
async def analyze_transcript(request: TranscriptRequest):
    # Validate transcript is present and non-empty
    if not request.transcript or not request.transcript.strip():
        raise HTTPException(
            status_code=400,
            detail={"error": "Transcript field is required and must be non-empty"}
        )

    try:
        return analysis_pipeline.analyze_transcript(request.transcript)
    except analysis_pipeline.OpenRouterRateLimitError as e:
        raise HTTPException(
            status_code=429,
            detail={"error": str(e)}
        )
    except analysis_pipeline.OpenRouterError as e:
        raise HTTPException(
            status_code=500,
            detail={"error": str(e)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": str(e)}
        )

# RAG query endpoint
@app.post("/api/rag/query")
async def rag_query(request: RagQueryRequest):
    # Validate query is present and non-empty
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=400,
            detail={"error": "Query field is required and must be non-empty"}
        )

    # Call get_engine() on every request so tests can patch it
    engine = rag_engine.get_engine()
    if engine.chunk_count == 0:
        raise HTTPException(
            status_code=503,
            detail={"error": "RAG corpus is unavailable"}
        )

    return {"results": engine.search(request.query, request.top_k)}

# Global exception handler for HTTPException
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

# Global exception handler for RequestValidationError
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={"error": "Validation error"}
    )
