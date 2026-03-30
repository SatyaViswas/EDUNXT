"""
ENDPOINTS SUMMARY & USAGE GUIDE
================================

3-PART PORTAL API ENDPOINTS

This document provides a quick reference for all endpoints across the three portals:
Student, Mentor, and NGO.

═══════════════════════════════════════════════════════════════════════════════
1. STUDENT PORTAL ENDPOINTS
═══════════════════════════════════════════════════════════════════════════════

GET /student/dna
────────────────
Description:  Returns the student's learning DNA profile (6 dimensions)
Access:       Students only
Auth:         Bearer token (JWT)

Response:
{
  "logical": 75.5,
  "verbal": 62.3,
  "creative": 58.0,
  "visual_spatial": 81.2,
  "memory": 68.4,
  "pattern": 72.1
}

Example curl:
curl -X GET "http://localhost:8000/student/dna" \
  -H "Authorization: Bearer <JWT_TOKEN>"


POST /student/career-logic
──────────────────────────
Description:  Analyzes learning DNA and provides stream recommendations
              Uses Gemini API for AI-powered analysis
Access:       Students only (Grades 8-12)
Auth:         Bearer token (JWT)

Response:
{
  "recommended_stream": "MPC",
  "reasoning": "Strong logical and pattern recognition abilities suggest aptitude for Math and Physics",
  "strengths": [
    "visual_spatial",
    "pattern",
    "logical"
  ],
  "areas_for_growth": [
    "memory",
    "creative"
  ],
  "recommended_subjects": [
    "Mathematics",
    "Physics",
    "Chemistry"
  ]
}

Example curl:
curl -X POST "http://localhost:8000/student/career-logic" \
  -H "Authorization: Bearer <JWT_TOKEN>"

Note: Requires GEMINI_API_KEY in .env


═══════════════════════════════════════════════════════════════════════════════
2. MENTOR PORTAL ENDPOINTS
═══════════════════════════════════════════════════════════════════════════════

PREREQUISITE: Mentor status must be "APPROVED" by NGO to access these endpoints

GET /mentor/profile
───────────────────
Description:  Returns the current mentor's profile with approval status
Access:       Mentors only
Auth:         Bearer token (JWT)

Response:
{
  "subject_expertise": "[\"Mathematics\", \"Physics\"]",
  "status": "APPROVED",
  "exam_score": 85,
  "total_students": 42,
  "total_batches": 3,
  "impact_score": 8.5,
  "approved_at": "2026-03-15T10:30:00",
  "rejection_reason": null
}

Example curl:
curl -X GET "http://localhost:8000/mentor/profile" \
  -H "Authorization: Bearer <JWT_TOKEN>"


GET /mentor/batches
───────────────────
Description:  Returns all batches assigned to the mentor with student details
Access:       APPROVED mentors only
Auth:         Bearer token (JWT)

Response:
[
  {
    "batch_id": "BATCH_001",
    "batch_name": "Grade 10 Math Basics",
    "subject": "Mathematics",
    "created_at": "2026-03-01T08:00:00",
    "student_count": 15,
    "students": [
      {
        "student_id": "uuid-1234",
        "name": "Raj Kumar",
        "email": "raj@student.com",
        "standard": 10,
        "current_streak": 5
      },
      ...
    ]
  }
]

Example curl:
curl -X GET "http://localhost:8000/mentor/batches" \
  -H "Authorization: Bearer <JWT_TOKEN>"

Note: Pending mentors will get 403 Forbidden


POST /mentor/update-progress
────────────────────────────
Description:  Update a student's mastery level for a specific topic
Access:       APPROVED mentors only
Auth:         Bearer token (JWT)

Request body:
{
  "student_id": "550e8400-e29b-41d4-a716-446655440000",
  "topic": "Quadratic Equations",
  "status": "mastered",
  "notes": "Excellent grasp of solving by factoring and quadratic formula"
}

Response:
{
  "student_id": "550e8400-e29b-41d4-a716-446655440000",
  "topic": "Quadratic Equations",
  "status": "mastered",
  "updated_at": "2026-03-30T14:22:00",
  "message": "Progress updated: Raj Kumar marked 'Quadratic Equations' as mastered"
}

Example curl:
curl -X POST "http://localhost:8000/mentor/update-progress" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "topic": "Quadratic Equations",
    "status": "mastered",
    "notes": "Excellent work"
  }'


═══════════════════════════════════════════════════════════════════════════════
3. NGO PORTAL ENDPOINTS
═══════════════════════════════════════════════════════════════════════════════

GET /ngo/dashboard-stats
────────────────────────
Description:  Key statistics for the NGO dashboard
Access:       NGO admins only
Auth:         Bearer token (JWT)

Response:
{
  "total_students": 250,
  "total_mentors": 45,
  "mentors_approved": 38,
  "mentors_pending": 5,
  "mentors_rejected": 2,
  "students_at_risk": 12,
  "average_streak": 4.2
}

Example curl:
curl -X GET "http://localhost:8000/ngo/dashboard-stats" \
  -H "Authorization: Bearer <JWT_TOKEN>"


GET /ngo/at-risk
────────────────
Description:  Returns students flagged as at-risk
              Criteria: streak=0 OR multiple low DNA scores
Access:       NGO admins only
Auth:         Bearer token (JWT)

Query parameters:
  - streak_threshold (default=0): Flag if streak <= this
  - dna_threshold (default=40): Flag if DNA dimension < this

Response:
{
  "total_at_risk": 8,
  "students": [
    {
      "student_id": "uuid-5678",
      "name": "Priya Sharma",
      "email": "priya@student.com",
      "standard": 9,
      "current_streak": 0,
      "reason": "No engagement: streak = 0 | Weak cognitive areas: logical=35, memory=38",
      "flagged_at": "2026-03-30T14:30:00",
      "dna_summary": {
        "top_strengths": ["verbal", "creative"],
        "areas_for_growth": ["logical", "memory"]
      }
    },
    ...
  ],
  "flags": ["low_streak", "low_dna_scores"]
}

Example curl:
curl -X GET "http://localhost:8000/ngo/at-risk?streak_threshold=0&dna_threshold=40" \
  -H "Authorization: Bearer <JWT_TOKEN>"


GET /ngo/pending-mentors
────────────────────────
Description:  List all pending mentor applications awaiting NGO review
Access:       NGO admins only
Auth:         Bearer token (JWT)

Response:
[
  {
    "mentor_id": "uuid-9012",
    "name": "Dr. Amit Patel",
    "email": "amit@mentor.com",
    "subject_expertise": "[\"Mathematics\", \"Physics\"]",
    "exam_score": 78,
    "applied_at": "2026-03-25T09:15:00"
  },
  ...
]

Example curl:
curl -X GET "http://localhost:8000/ngo/pending-mentors" \
  -H "Authorization: Bearer <JWT_TOKEN>"


POST /ngo/verify-mentor/{mentor_id}
───────────────────────────────────
Description:  Approve or reject a mentor application
              Approved mentors can immediately access the dashboard
Access:       NGO admins only
Auth:         Bearer token (JWT)

Path parameter:
  - mentor_id: UUID of the mentor

Request body:
{
  "mentor_user_id": "uuid-9012",
  "status": "APPROVED",
  "exam_score": 82,
  "rejection_reason": null
}

Response (approval):
{
  "mentor_id": "uuid-9012",
  "mentor_name": "Dr. Amit Patel",
  "email": "amit@mentor.com",
  "new_status": "APPROVED",
  "message": "Mentor Dr. Amit Patel approved and can now access the dashboard.",
  "approved_at": "2026-03-30T14:35:00",
  "rejection_reason": null
}

Response (rejection):
{
  "mentor_id": "uuid-9012",
  "mentor_name": "Dr. Amit Patel",
  "email": "amit@mentor.com",
  "new_status": "REJECTED",
  "message": "Mentor Dr. Amit Patel rejected.",
  "approved_at": null,
  "rejection_reason": "Eligibility exam score below threshold"
}

Example curl (approve):
curl -X POST "http://localhost:8000/ngo/verify-mentor/uuid-9012" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "mentor_user_id": "uuid-9012",
    "status": "APPROVED",
    "exam_score": 82
  }'

Example curl (reject):
curl -X POST "http://localhost:8000/ngo/verify-mentor/uuid-9012" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "mentor_user_id": "uuid-9012",
    "status": "REJECTED",
    "rejection_reason": "Eligibility exam score below threshold"
  }'


═══════════════════════════════════════════════════════════════════════════════
AUTHENTICATION FLOW
═══════════════════════════════════════════════════════════════════════════════

All protected endpoints require a Bearer token in the Authorization header:

Authorization: Bearer <JWT_TOKEN>

Tokens are obtained via login endpoint (not shown here, assumed to be implemented).

Token payload includes:
- sub: user_id (UUID)
- exp: expiration time
- iat: issued at time
- role: "Student" | "Mentor" | "NGO"


═══════════════════════════════════════════════════════════════════════════════
ERROR RESPONSES
═══════════════════════════════════════════════════════════════════════════════

401 Unauthorized:
{
  "detail": "Invalid or expired token",
  "status_code": 401
}

403 Forbidden:
{
  "detail": "Mentor account not approved by NGO. Access denied.",
  "status_code": 403
}

404 Not Found:
{
  "detail": "Student not found",
  "status_code": 404
}

400 Bad Request:
{
  "detail": "Career stream recommendations available from Grade 8 onwards",
  "status_code": 400
}


═══════════════════════════════════════════════════════════════════════════════
ROLE-BASED ACCESS CONTROL (RBAC)
═══════════════════════════════════════════════════════════════════════════════

Student Endpoints:
  ✓ GET /student/dna
  ✓ POST /student/career-logic

Mentor Endpoints (APPROVED status only):
  ✓ GET /mentor/profile
  ✓ GET /mentor/batches
  ✓ POST /mentor/update-progress

NGO Endpoints:
  ✓ GET /ngo/dashboard-stats
  ✓ GET /ngo/at-risk
  ✓ GET /ngo/pending-mentors
  ✓ POST /ngo/verify-mentor/{id}


═══════════════════════════════════════════════════════════════════════════════
Notes for Frontend Integration
═══════════════════════════════════════════════════════════════════════════════

1. Gemini API Integration:
   - Only enabled if GEMINI_API_KEY is set in .env
   - Returns 503 Service Unavailable if key is missing
   - Provides fallback recommendations if API fails

2. Mentor Approval Workflow:
   - Mentor registers → status = "PENDING"
   - NGO reviews via GET /ngo/pending-mentors
   - NGO approves via POST /ngo/verify-mentor/{id}
   - Mentor receives access to dashboard

3. At-Risk Student Detection:
   - Query parameters can be adjusted for different thresholds
   - Used for early intervention and resource allocation

4. Learning DNA Profile:
   - 6-dimension JSONB field in StudentProfile
   - Stored and retrieved as JSON
   - Updated via POST /ngo/verify-mentor (when teacher provides feedback)
"""

# This is documentation only; not executable Python code
