"""
AI_SERVICE_DOCUMENTATION
========================

Comprehensive guide to the AI service utilities for the 3-part portal system.

Location: app/services/ai_service.py

Uses Google Gemini 3.1 Pro for:
1. Career Recommender: AI-powered stream recommendations based on learning DNA
2. TARA: Contextual assistant providing role-specific, page-specific guidance


═══════════════════════════════════════════════════════════════════════════════
1. CAREER RECOMMENDER
═══════════════════════════════════════════════════════════════════════════════

Function Signature:
────────────────
get_career_recommendations(
    learning_dna: LearningDNA,
    standard: int,
    student_name: Optional[str] = None,
) -> Optional[CareerRecommendationResponse]

Purpose:
────────
Analyzes a student's learning DNA (6-dimensional cognitive profile) and provides
structured recommendations for which academic stream to pursue (MPC, BiPC, CEC).

Uses Gemini 3.1 Pro for deep AI analysis with fallback heuristics if API unavailable.

Parameters:
───────────
- learning_dna (LearningDNA): Student's cognitive profile with 6 dimensions:
    • logical: 0-100 (Logical reasoning & mathematics ability)
    • verbal: 0-100 (Language, communication, writing skills)
    • creative: 0-100 (Creative thinking, out-of-box solutions)
    • visual_spatial: 0-100 (Visualization, spatial reasoning)
    • memory: 0-100 (Information retention)
    • pattern: 0-100 (Pattern recognition, sequences)

- standard (int): Class/Grade level (typically 1-12, validates that >= 8)

- student_name (str, optional): Name for personalized response

Returns:
────────
CareerRecommendationResponse {
    "student_standard": 10,
    "primary_recommendation": {
        "stream": "MPC",
        "confidence": 85,
        "why": "Your strong logical and pattern recognition abilities are ideal for mathematical and scientific analysis.",
        "key_strengths": ["Logical Reasoning", "Pattern Recognition", "Memory"],
        "growth_areas": ["Creative thinking in applications", "Verbal expression for exams"]
    },
    "secondary_recommendations": [
        {
            "stream": "BiPC",
            "confidence": 70,
            "why": "Alternative option with your strong analytical skills",
            "key_strengths": ["Visual-Spatial", "Memory"],
            "growth_areas": ["Logical reasoning for physics"]
        },
        {
            "stream": "CEC",
            "confidence": 60,
            "why": "Could work with focus on quantitative aspects",
            "key_strengths": ["Verbal Communication", "Analytical Thinking"],
            "growth_areas": ["Mathematical accuracy"]
        }
    ],
    "overall_profile": "Your profile shows strong aptitude in logical reasoning and pattern recognition, suggesting a preference for analytical and systematic thinking.",
    "next_steps": [
        "Explore sample syllabus for the recommended stream",
        "Discuss with your mentors about stream selection",
        "Consider attending a subject-specific workshop"
    ]
}

Stream Options:
───────────────
MPC (Math, Physics, Chemistry):
  ✓ Best for: Logical, analytical, pattern-oriented students
  ✓ Score: (logical + pattern + memory) / 3
  ✓ Ideal if: Logical reasoning and pattern recognition are top strengths

BiPC (Biology, Physics, Chemistry):
  ✓ Best for: Visual-spatial, memory-strong, systematic thinkers
  ✓ Score: (visual_spatial + memory + logical) / 3
  ✓ Ideal if: Visual-spatial reasoning and memory are top strengths

CEC (Commerce, Economics, Computer Science):
  ✓ Best for: Verbal, logical, detail-oriented students
  ✓ Score: (verbal + logical + creative) / 3
  ✓ Ideal if: Verbal communication and logical reasoning are balanced

AI Analysis:
─────────────
When Gemini API is available (GEMINI_API_KEY set in .env):
- Uses Gemini 3.1 Pro for deep cognitive profile analysis
- Analyzes all 6 dimensions holistically
- Returns confidence scores (0-100) for each stream
- Provides detailed reasoning and personalized insights

Fallback Mode (if Gemini unavailable):
- Uses heuristic algorithms to rank streams
- Calculates weighted scores for each stream
- Provides generic but accurate recommendations
- Falls back gracefully without interrupting user experience


Usage Example - In FastAPI Endpoint:
────────────────────────────────────

from app.schemas.user import LearningDNA
from app.services.ai_service import get_career_recommendations

# Get student's learning DNA (from database or request)
dna = LearningDNA(
    logical=75.5,
    verbal=62.3,
    creative=58.0,
    visual_spatial=81.2,
    memory=68.4,
    pattern=72.1
)

# Get recommendations
recommendation = get_career_recommendations(
    learning_dna=dna,
    standard=10,
    student_name="Raj Kumar"
)

if recommendation:
    print(f"Primary: {recommendation.primary_recommendation.stream}")
    print(f"Confidence: {recommendation.primary_recommendation.confidence}%")
    print(f"Why: {recommendation.primary_recommendation.why}")


═══════════════════════════════════════════════════════════════════════════════
2. TARA: CONTEXTUAL ASSISTANT
═══════════════════════════════════════════════════════════════════════════════

Function Signature:
────────────────
get_tara_guidance(
    user_role: str,
    current_page: str,
    context: Optional[Dict[str, Any]] = None,
) -> Optional[TARGuidance]

Purpose:
────────
TARA (Teach, Advise, Recommend, Assist) provides context-aware, role-specific
guidance to help users navigate and effectively use the portal.

Different guidance for each role and page to maximize engagement and success.

Parameters:
───────────
- user_role (str): One of ["Student", "Mentor", "NGO"]
  ✓ Student: User role accessing student portal
  ✓ Mentor: User role accessing mentor portal
  ✓ NGO: NGO administrator accessing NGO admin portal

- current_page (str): Current page/section the user is viewing
  
  Student pages:
    - "dashboard": Main student dashboard
    - "learning-dna": Learning DNA profile view
    - "career-logic": Career recommendations page
    - "daily-missions": Daily tasks/missions

  Mentor pages:
    - "profile": Mentor profile & approval status
    - "batches": View assigned student batches
    - "update-progress": Update student mastery levels
    - "impact-score": View mentor impact metrics

  NGO pages:
    - "dashboard": Main NGO dashboard with stats
    - "at-risk": List of at-risk students
    - "pending-mentors": Mentor applications awaiting review
    - "verify-mentor": Approve/reject mentor applications

- context (dict, optional): Additional context for personalization
  Examples:
    Student: {"student_standard": 10, "streak": 5, "xp": 1200}
    Mentor: {"mentor_status": "APPROVED", "total_students": 42, "total_batches": 3}
    NGO: {"total_students": 250, "pending_mentor_reviews": 5, "at_risk_students": 12}

Returns:
────────
TARGuidance {
    "role": "Student",
    "current_page": "career-logic",
    "guidance_title": "Find Your Perfect Stream",
    "guidance_text": "Your learning DNA reveals unique strengths. Review the recommended streams below and click on each to see how your cognitive abilities align with different academic paths.",
    "key_actions": [
        "Review your learning DNA profile to understand your strengths",
        "Compare the recommended streams and see why each is suggested",
        "Discuss the recommendations with a mentor for personalized advice"
    ],
    "tips": [
        "Pro tip: Your strong visual-spatial skills could give you an edge in lab-based learning",
        "Remember: Many successful professionals studied combinations of your recommended streams"
    ],
    "warning": null
}

Response Structure:
───────────────────
- role: The user's role (echoed back)
- current_page: The page/section the guidance applies to
- guidance_title: Short, encouraging title (e.g., "Find Your Perfect Stream")
- guidance_text: Main message in 2-3 sentences (clear and actionable)
- key_actions: List of 2-4 specific actions the user should take
- tips: 1-2 pro tips specific to this page
- warning: Optional warning if there are limitations or important notes


Context-Aware Examples:
───────────────────────

Example 1: Student on Career Logic Page
────────────────────────────────────────
user_role = "Student"
current_page = "career-logic"
context = {"student_standard": 10, "streak": 5, "xp": 1200}

Response might include:
- guidance_text: "Your learning DNA reveals unique strengths. Review the recommended 
                   streams and discuss with mentors for personalized advice."
- key_actions: [
    "Review your learning DNA profile",
    "Compare the recommended streams",
    "Discuss with a mentor"
  ]


Example 2: Mentor on Batches Page
──────────────────────────────────
user_role = "Mentor"
current_page = "batches"
context = {"mentor_status": "APPROVED", "total_students": 42, "total_batches": 3}

Response might include:
- guidance_text: "You have 42 students across 3 batches. Regularly track their progress 
                   and provide constructive feedback to maximize their learning outcomes."
- key_actions: [
    "Review each batch and identify at-risk students",
    "Provide progress updates for students",
    "Schedule 1-on-1 mentoring sessions"
  ]


Example 3: NGO on At-Risk Page
───────────────────────────────
user_role = "NGO"
current_page = "at-risk"
context = {"total_students": 250, "at_risk_students": 12, "pending_mentor_reviews": 5}

Response might include:
- guidance_text: "12 students are at risk based on engagement metrics. Proactively 
                   allocate mentors and consider intervention strategies."
- key_actions: [
    "Review the at-risk student list with their engagement data",
    "Allocate experienced mentors to at-risk students",
    "Set up check-in calls with struggling students"
  ]
- warning: "Early intervention is crucial—students with zero engagement for 7+ days 
             are significantly more likely to drop out."


AI Analysis (Gemini 3.1 Pro):
──────────────────────────────
- Understands the context and role
- Provides empathetic, encouraging guidance
- Recommends specific, actionable steps
- Includes pro tips based on best practices
- Flags warnings if relevant

Fallback: Returns None if Gemini unavailable (graceful degradation)


Usage Example - In FastAPI Endpoint:
────────────────────────────────────

from app.services.ai_service import get_tara_guidance

# Get TARA guidance for NGO admin
guidance = get_tara_guidance(
    user_role="NGO",
    current_page="at-risk",
    context={
        "total_students": 250,
        "at_risk_students": 12,
        "pending_mentor_reviews": 5
    }
)

if guidance:
    print(f"Title: {guidance.guidance_title}")
    print(f"Guidance: {guidance.guidance_text}")
    print(f"Actions: {guidance.key_actions}")
    if guidance.warning:
        print(f"⚠️ Warning: {guidance.warning}")


═══════════════════════════════════════════════════════════════════════════════
3. ROUTER INTEGRATION
═══════════════════════════════════════════════════════════════════════════════

Endpoints Using AI Service:
───────────────────────────

Student Portal:
- POST /student/career-logic
  → Calls: get_career_recommendations()
  → Returns: Stream recommendations with confidence scores

- GET /student/guidance?page={page}
  → Calls: get_tara_guidance(role="Student", page=page)
  → Returns: Page-specific TARA guidance


Mentor Portal:
- GET /mentor/guidance?page={page}
  → Calls: get_tara_guidance(role="Mentor", page=page)
  → Returns: Mentor-specific guidance for their current page


NGO Portal:
- GET /ngo/guidance?page={page}
  → Calls: get_tara_guidance(role="NGO", page=page)
  → Returns: NGO admin-specific guidance


═══════════════════════════════════════════════════════════════════════════════
4. CONFIGURATION & SETUP
═══════════════════════════════════════════════════════════════════════════════

Environment Variables (.env):
──────────────────────────────
GEMINI_API_KEY=your-gemini-api-key-here

If not set:
- Career recommendations: Uses fallback heuristic algorithm
- TARA guidance: Returns None (gracefully skipped)
- No errors or crashes—system works without AI


Model Selection:
────────────────
Currently uses: Gemini 3.1 Pro (gemini-1.5-pro)
- Fast, consistent responses
- Good cost-effectiveness
- Excellent JSON parsing capabilities


Logging:
─────────
All AI service errors are logged:
- Logger: app.services.ai_service
- Level: WARNING/ERROR for failures
- Logged events: API errors, JSON parsing failures, timeouts


Caching (Future):
──────────────────
For frequently accessed recommendations (same DNA profile):
- Could implement Redis caching
- Cache key: hash(learning_dna + standard)
- TTL: 7 days (reasonable for stable DNA)


═══════════════════════════════════════════════════════════════════════════════
5. ERROR HANDLING & FALLBACKS
═══════════════════════════════════════════════════════════════════════════════

Career Recommendations:
────────────────────
Gemini Available + Success:
  → Returns: Full CareerRecommendationResponse

Gemini Available + Fails:
  → Falls back to: get_fallback_career_recommendation()
  → Disabled logging and returns heuristic result
  → User sees good recommendations without knowing API failed

Gemini Unavailable:
  → Detects GEMINI_API_KEY not set
  → Returns: get_fallback_career_recommendation()
  → Zero user impact


TARA Guidance:
──────────────
Gemini Available + Success:
  → Returns: Full TARGuidance with personalized messages

Gemini Available + Fails:
  → Returns: None
  → Frontend shows default guidance or skips section

Gemini Unavailable:
  → Detects GEMINI_API_KEY not set
  → Returns: None
  → Frontend shows default guidance or skips section


═══════════════════════════════════════════════════════════════════════════════
6. UTILITY FUNCTIONS
═══════════════════════════════════════════════════════════════════════════════

is_gemini_available() -> bool
─────────────────────────────
Returns: True if GEMINI_API_KEY is configured, False otherwise
Usage: Check before making optional calls to AI service

Example:
if is_gemini_available():
    recommendation = get_career_recommendations(dna, standard)
else:
    recommendation = get_fallback_career_recommendation(dna, standard)


get_fallback_career_recommendation(dna, standard) -> CareerRecommendationResponse
──────────────────────────────────────────────────────────────────────────────────
Returns: Heuristic-based recommendation when Gemini unavailable
Uses: Weighted scoring algorithm based on DNA dimensions
Quality: Good recommendations suitable for MVP/fallback


═══════════════════════════════════════════════════════════════════════════════
7. BEST PRACTICES
═══════════════════════════════════════════════════════════════════════════════

For Career Recommender:
───────────────────────
✓ Always pass student_name for personalization
✓ Validate DNA scores are 0-100 before calling (done by Pydantic)
✓ Only call for students grade 8 or above (router validates this)
✓ Cache results if user calls multiple times (future improvement)


For TARA Guidance:
──────────────────
✓ Always include relevant context for better guidance
✓ Use exact page names from the list above
✓ Call TARA whenever user navigates to a new page
✓ Display guidance prominently (sidebar, modal, tooltip)
✓ Update context when metrics change (streak, student count, etc.)


Performance:
─────────────
- Career recommender: ~3-5 seconds (Gemini API call)
- TARA guidance: ~2-4 seconds (Gemini API call)
- Fallback algorithms: <100ms (instant)
- Recommended: Show loading spinner during API calls
- Timeout: 30 seconds (relies on Gemini SDK defaults)


═══════════════════════════════════════════════════════════════════════════════
8. FUTURE ENHANCEMENTS
═══════════════════════════════════════════════════════════════════════════════

✓ Caching layer with Redis for frequent queries
✓ Stream recommendation based on exam scores and previous performance
✓ TARA guidance with user interaction history (what sections they visit)
✓ Mentor-specific guidance: "Students matching student X's profile"
✓ Batch recommendation engine: "Which students should be in same batch?"
✓ Career trajectory: "Recommended streams for next standard/grade"
✓ Feedback loop: "How accurate were recommendations?" tracking


═══════════════════════════════════════════════════════════════════════════════

For questions or integration help, refer to the endpoint documentation in
API_ENDPOINTS.md or the inline docstrings in app/services/ai_service.py.
"""

# This file is documentation only; not executable Python code.
