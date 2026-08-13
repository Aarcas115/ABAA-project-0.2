import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Validate API key is present at startup
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY environment variable is required but not set")

# Create FastAPI app instance
app = FastAPI()

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request body model
class TranscriptRequest(BaseModel):
    transcript: str

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
    
    # Return placeholder/stub JSON response
    return {
        "requirements_spec": "stub",
        "task_breakdown": "stub",
        "sow": "stub"
    }

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
