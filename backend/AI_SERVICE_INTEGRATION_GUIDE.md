"""
AI_SERVICE_INTEGRATION_GUIDE.md

Quick integration examples for using ai_service.py in your routers and endpoints.

═══════════════════════════════════════════════════════════════════════════════
QUICK START
═══════════════════════════════════════════════════════════════════════════════

1. Import the service functions:

from app.services.ai_service import (
    get_career_recommendations,
    get_fallback_career_recommendation,
    get_tara_guidance,
    is_gemini_available,
    CareerRecommendationResponse,
    TARGuidance,
)


2. Use in your endpoints:

@router.post("/some-endpoint")
def my_endpoint(...) -> CareerRecommendationResponse:
    # Get student's learning DNA
    dna = # ... fetch from database
    
    # Call AI service
    recommendation = get_career_recommendations(dna, standard=10)
    return recommendation


═══════════════════════════════════════════════════════════════════════════════
EXAMPLE 1: Student Career Logic Endpoint (Already Implemented)
═══════════════════════════════════════════════════════════════════════════════

# In app/routers/student.py

from app.services.ai_service import (
    get_career_recommendations,
    get_fallback_career_recommendation,
    is_gemini_available,
    CareerRecommendationResponse,
)

@router.post("/career-logic", response_model=CareerRecommendationResponse)
def get_career_recommendations_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CareerRecommendationResponse:
    \"\"\"Get AI-powered career stream recommendations.\"\"\"
    
    # Validate student
    if current_user.role != "Student":
        raise HTTPException(status_code=403, detail="Students only")
    
    # Get student profile
    student_profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == current_user.id
    ).first()
    
    if not student_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Grade 8+ only
    if student_profile.standard < 8:
        raise HTTPException(status_code=400, detail="Grade 8 onwards only")
    
    # Extract DNA
    dna = LearningDNA(**student_profile.learning_dna)
    
    # Try Gemini API first
    if is_gemini_available():
        recommendation = get_career_recommendations(
            learning_dna=dna,
            standard=student_profile.standard,
            student_name=current_user.full_name,
        )
        if recommendation:
            return recommendation
    
    # Fallback to heuristic
    return get_fallback_career_recommendation(dna, student_profile.standard)


═══════════════════════════════════════════════════════════════════════════════
EXAMPLE 2: TARA Guidance for Students (Already Implemented)
═══════════════════════════════════════════════════════════════════════════════

# In app/routers/student.py

from app.services.ai_service import get_tara_guidance, TARGuidance

@router.get("/guidance", response_model=Optional[TARGuidance])
def get_student_guidance(
    current_user: User = Depends(get_current_user),
    page: str = "dashboard",
    db: Session = Depends(get_db),
) -> Optional[TARGuidance]:
    \"\"\"Get contextual TARA guidance.\"\"\"
    
    if current_user.role != "Student":
        raise HTTPException(status_code=403)
    
    valid_pages = ["dashboard", "learning-dna", "career-logic", "daily-missions"]
    if page not in valid_pages:
        raise HTTPException(status_code=400, detail=f"Invalid page")
    
    # Get student context
    student_profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == current_user.id
    ).first()
    
    context = {
        "student_standard": student_profile.standard,
        "streak": student_profile.current_streak,
        "xp": student_profile.total_xp,
    }
    
    # Get TARA guidance
    guidance = get_tara_guidance(
        user_role="Student",
        current_page=page,
        context=context,
    )
    
    return guidance


═══════════════════════════════════════════════════════════════════════════════
EXAMPLE 3: TARA Guidance for Mentors (Already Implemented)
═══════════════════════════════════════════════════════════════════════════════

# In app/routers/mentor.py

from app.services.ai_service import get_tara_guidance, TARGuidance

@router.get("/guidance", response_model=Optional[TARGuidance])
def get_mentor_guidance(
    current_user: User = Depends(get_current_user),
    page: str = "profile",
    db: Session = Depends(get_db),
) -> Optional[TARGuidance]:
    \"\"\"Get contextual guidance for mentor portal.\"\"\"
    
    if current_user.role != "Mentor":
        raise HTTPException(status_code=403)
    
    valid_pages = ["profile", "batches", "update-progress", "impact-score"]
    if page not in valid_pages:
        raise HTTPException(status_code=400)
    
    mentor_profile = db.query(MentorProfile).filter(
        MentorProfile.user_id == current_user.id
    ).first()
    
    context = {
        "mentor_status": mentor_profile.status,
        "total_students": mentor_profile.total_students,
        "total_batches": mentor_profile.total_batches,
        "exam_score": mentor_profile.exam_score,
    }
    
    return get_tara_guidance(
        user_role="Mentor",
        current_page=page,
        context=context,
    )


═══════════════════════════════════════════════════════════════════════════════
EXAMPLE 4: TARA Guidance for NGO (Already Implemented)
═══════════════════════════════════════════════════════════════════════════════

# In app/routers/ngo.py

from app.services.ai_service import get_tara_guidance, TARGuidance

@router.get("/guidance", response_model=Optional[TARGuidance])
def get_ngo_guidance(
    current_user: User = Depends(require_role("NGO")),
    page: str = "dashboard",
    db: Session = Depends(get_db),
) -> Optional[TARGuidance]:
    \"\"\"Get contextual guidance for NGO admin portal.\"\"\"
    
    valid_pages = ["dashboard", "at-risk", "pending-mentors", "verify-mentor"]
    if page not in valid_pages:
        raise HTTPException(status_code=400)
    
    # Aggregate metrics
    total_students = db.query(StudentProfile).count()
    total_mentors = db.query(MentorProfile).count()
    pending = db.query(MentorProfile).filter(
        MentorProfile.status == "PENDING"
    ).count()
    at_risk = db.query(StudentProfile).filter(
        StudentProfile.current_streak == 0
    ).count()
    
    context = {
        "total_students": total_students,
        "total_mentors": total_mentors,
        "pending_mentor_reviews": pending,
        "at_risk_students": at_risk,
    }
    
    return get_tara_guidance(
        user_role="NGO",
        current_page=page,
        context=context,
    )


═══════════════════════════════════════════════════════════════════════════════
EXAMPLE 5: Using Career Recommendations Elsewhere
═══════════════════════════════════════════════════════════════════════════════

# Example: Generate recommendations for a specific student manually

from app.services.ai_service import get_career_recommendations
from app.schemas.user import LearningDNA

# Somewhere in your code
def generate_career_report_for_student(user_id: uuid.UUID, db: Session):
    \"\"\"Generate a career report for a student.\"\"\"
    
    user = db.query(User).filter(User.id == user_id).first()
    student = db.query(StudentProfile).filter(
        StudentProfile.user_id == user_id
    ).first()
    
    if not student or user.role != "Student":
        return None
    
    dna = LearningDNA(**student.learning_dna)
    
    recommendation = get_career_recommendations(
        learning_dna=dna,
        standard=student.standard,
        student_name=user.full_name,
    )
    
    if recommendation:
        return {
            "user_id": user_id,
            "name": user.full_name,
            "email": user.email,
            "recommendation": recommendation,
            "generated_at": datetime.utcnow(),
        }
    
    return None


═══════════════════════════════════════════════════════════════════════════════
EXAMPLE 6: Custom Context Usage
═══════════════════════════════════════════════════════════════════════════════

# You can extend context with your own fields for more specific guidance

context = {
    "mentor_status": "APPROVED",
    "total_students": 42,
    "total_batches": 3,
    "recent_activity": "2 students marked mastered in last 24 hours",
    "impact_score": 8.7,
    "approval_date": "2026-03-20",
}

guidance = get_tara_guidance(
    user_role="Mentor",
    current_page="impact-score",
    context=context,
)

# TARA will incorporate this context into its guidance message


═══════════════════════════════════════════════════════════════════════════════
FRONTEND INTEGRATION
═══════════════════════════════════════════════════════════════════════════════

API Calls:

// Career recommendations
fetch('/student/career-logic', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
})
.then(r => r.json())
.then(recommendation => {
    console.log('Primary:', recommendation.primary_recommendation);
    console.log('Confidence:', recommendation.primary_recommendation.confidence);
});

// TARA guidance
fetch('/student/guidance?page=career-logic', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + token }
})
.then(r => r.json())
.then(guidance => {
    if (guidance) {
        console.log('Guidance:', guidance.guidance_text);
        console.log('Actions:', guidance.key_actions);
    }
});


Display Patterns:

1. Career Recommendations:
   - Show primary stream prominently
   - Display confidence percentage
   - List secondary options in dropdown or tabs
   - Show "Why" section with reasoning
   - Link to subject-specific resources

2. TARA Guidance:
   - Sidebar info box or tooltip
   - Show guidance_title as heading
   - Display guidance_text in plain language
   - List key_actions as numbered steps
   - Add tips in a "Pro Tips" section
   - Show warning in a callout if present


═══════════════════════════════════════════════════════════════════════════════
ERROR HANDLING PATTERNS
═══════════════════════════════════════════════════════════════════════════════

Pattern 1: Graceful Degradation

try:
    recommendation = get_career_recommendations(dna, standard)
except Exception as e:
    logger.error(f"Career recommendation failed: {e}")
    recommendation = get_fallback_career_recommendation(dna, standard)
finally:
    return recommendation


Pattern 2: Optional Service

if is_gemini_available():
    guidance = get_tara_guidance(role, page, context)
    if guidance:
        return guidance

# No error, just return None if TARA unavailable
return None


Pattern 3: Async Wrapper (future)

import asyncio

async def get_recommendations_async(dna, standard):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        get_career_recommendations,
        dna,
        standard
    )

# Prevents blocking during API calls


═══════════════════════════════════════════════════════════════════════════════
TESTING THE AI SERVICE
═══════════════════════════════════════════════════════════════════════════════

Unit Test Example:

import pytest
from app.services.ai_service import get_fallback_career_recommendation
from app.schemas.user import LearningDNA

def test_career_recommendation_fallback():
    dna = LearningDNA(
        logical=75, verbal=65, creative=55,
        visual_spatial=80, memory=70, pattern=72
    )
    
    recommendation = get_fallback_career_recommendation(dna, standard=10)
    
    assert recommendation is not None
    assert recommendation.student_standard == 10
    assert recommendation.primary_recommendation.stream in ["MPC", "BiPC", "CEC"]
    assert recommendation.primary_recommendation.confidence > 0
    assert len(recommendation.secondary_recommendations) == 2
    assert len(recommendation.next_steps) >= 3


Integration Test:

@pytest.mark.asyncio
async def test_career_endpoint_with_mock_gemini(client):
    # Login and get token
    token = await login_as_student()
    
    # Call career endpoint
    response = client.post(
        "/student/career-logic",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "primary_recommendation" in data
    assert "secondary_recommendations" in data


═══════════════════════════════════════════════════════════════════════════════

Need more specific examples? Refer to:
- app/routers/student.py for career + guidance implementation
- app/routers/mentor.py for mentor guidance
- app/routers/ngo.py for NGO guidance
- app/services/ai_service.py for all service functions
- AI_SERVICE_DOCUMENTATION.md for comprehensive reference
"""

# This file is documentation only.
