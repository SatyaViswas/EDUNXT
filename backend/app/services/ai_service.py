import json
import logging
import time
from typing import Optional, Dict, List, Any

# Google Gemini SDK import (modern google-genai)
from google import genai
from pydantic import BaseModel, Field

from app.core.config import settings
from app.schemas.user import LearningDNA

logger = logging.getLogger(__name__)

TARA_FALLBACK_TEXT = "TARA is currently calibrating her sensors. Please try again in a moment."

# ─────────────────────────────────────────────────────────────────────────────
# SDK INITIALIZATION
# ─────────────────────────────────────────────────────────────────────────────

client = None
if settings.GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Gemini Client: {e}")

def _get_client():
    if not client:
        logger.warning("Gemini Client not initialized. Check API key.")
        return None
    return client

# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS (Matches your router expectations)
# ─────────────────────────────────────────────────────────────────────────────

class StreamRecommendation(BaseModel):
    stream: str
    confidence: float
    why: str
    key_strengths: List[str]
    growth_areas: List[str]

class CareerRecommendationResponse(BaseModel):
    student_standard: int
    primary_recommendation: StreamRecommendation
    secondary_recommendations: List[StreamRecommendation]
    overall_profile: str
    next_steps: List[str]

class TARGuidance(BaseModel):
    role: str
    current_page: str
    guidance_title: str
    guidance_text: str
    key_actions: List[str]
    tips: List[str]
    warning: Optional[str] = None

# ─────────────────────────────────────────────────────────────────────────────
# INTERNAL AI HELPER
# ─────────────────────────────────────────────────────────────────────────────

def _safe_generate_json(prompt: str, model: str = "gemini-2.5-flash") -> Optional[Dict]:
    """Generate JSON response from Gemini with markdown cleanup."""
    c = _get_client()
    if not c: 
        return None

    try:
        response = c.models.generate_content(
            model=model,
            contents=prompt
        )
        
        # Extract text from response
        text = (response.text or "").strip()
        
        # Clean markdown backticks
        cleaned_text = text.replace("```json", "").replace("```", "").strip()
        
        # Find JSON object boundaries
        start_idx = cleaned_text.find('{')
        end_idx = cleaned_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_str = cleaned_text[start_idx:end_idx]
            return json.loads(json_str)
        
        return None
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response from Gemini: {e}")
        return None
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        return None

# ─────────────────────────────────────────────────────────────────────────────
# EXPORTED FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def get_career_recommendations(learning_dna: LearningDNA, standard: int) -> Optional[CareerRecommendationResponse]:
    if standard < 8: return None
    prompt = f"Analyze Grade {standard} DNA: {learning_dna.dict()}. Return career JSON."
    result = _safe_generate_json(prompt)
    if result:
        return CareerRecommendationResponse(**result)
    return get_fallback_career_recommendation(learning_dna, standard)

def get_student_guidance(user: Any, page: str) -> Optional[TARGuidance]:
    prompt = f"Student on {page} page. Provide guidance JSON with keys: guidance_title, guidance_text, key_actions, tips, warning."
    result = _safe_generate_json(prompt)
    if result:
        result["role"] = "Student"
        result["current_page"] = page
        return TARGuidance(**result)
    return None

def get_student_answer(user: Any, page: str, question: str) -> str:
    """Answers a specific student question."""
    c = _get_client()
    if not c: 
        return TARA_FALLBACK_TEXT
    
    try:
        prompt = f"Student on {page} page asks: {question}. Answer helpfully in 4-8 lines. No markdown code blocks."
        response = c.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return (response.text or "").strip()
    except Exception as e:
        logger.error(f"Failed to generate student answer: {e}")
        return TARA_FALLBACK_TEXT

def generate_batch_roadmap(
    avg_dna: Dict[str, float],
    common_grade: str,
    duration_weeks: int,
) -> Optional[Dict[str, Any]]:
    prompt = (
        "You are a Course Architect. "
        f"Design a full-term curriculum roadmap (start to end of syllabus) for Grade {common_grade} "
        f"students with an average learning pace of {avg_dna}. "
        f"Target duration: {duration_weeks} weeks. "
        "Provide a week-by-week timeline. Format: JSON only."
    )
    return _safe_generate_json(prompt, model="gemini-2.5-flash")

def generate_learning_path(student_dna: dict, level: str) -> Optional[Dict[str, Any]]:
    prompt = f"Grade {level} Student DNA: {student_dna}. Generate 4-week JSON roadmap."
    return _safe_generate_json(prompt)

def get_tara_response_for_role(user_role: str, current_page: str, context: Optional[Dict] = None) -> Optional[TARGuidance]:
    """Provides role-specific TARA guidance."""
    prompt = f"Role: {user_role}, Page: {current_page}. Context: {context}. Provide guidance JSON."
    result = _safe_generate_json(prompt)
    if result:
        return TARGuidance(**result)
    return None

# ─────────────────────────────────────────────────────────────────────────────
# UTILITIES
# ─────────────────────────────────────────────────────────────────────────────

def get_fallback_career_recommendation(learning_dna: LearningDNA, standard: int) -> CareerRecommendationResponse:
    return CareerRecommendationResponse(
        student_standard=standard,
        primary_recommendation=StreamRecommendation(
            stream="MPC", confidence=70.0, why="Fallback reasoning.",
            key_strengths=["Logical"], growth_areas=["Verbal"]
        ),
        secondary_recommendations=[],
        overall_profile="AI is offline; using rule-based profile.",
        next_steps=["Check with a mentor."]
    )

def is_gemini_available() -> bool:
    return client is not None