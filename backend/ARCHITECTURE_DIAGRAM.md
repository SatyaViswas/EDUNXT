"""
ARCHITECTURE_DIAGRAM.md
════════════════════════════════════════════════════════════════════════════════

3-PART PORTAL SYSTEM - AI SERVICE ARCHITECTURE
════════════════════════════════════════════════════════════════════════════════


LAYER ARCHITECTURE
═════════════════════════════════════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────────────┐
    │  FRONTEND LAYER (React/TypeScript - src/)                              │
    │  ┌──────────────┬──────────────┬──────────────┐                        │
    │  │   Student    │    Mentor    │     NGO      │                        │
    │  │   Portal     │    Portal    │    Portal    │                        │
    │  └──────────────┴──────────────┴──────────────┘                        │
    └─────────────────────────────────────────────────────────────────────────┘
                                  ↓ HTTP/REST
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  FASTAPI LAYER (backend/app/)                                           │
    │  ┌────────────────────────────────────────────────────────────────────┐ │
    │  │ main.py - FastAPI app with CORS, error handlers, table creation  │ │
    │  └────────────────────────────────────────────────────────────────────┘ │
    │                                                                         │
    │  ROUTERS:                                                               │
    │  ┌──────────────────┬──────────────────┬──────────────────┐            │
    │  │  student.py      │   mentor.py      │    ngo.py        │            │
    │  │                  │                  │                  │            │
    │  │ • /dna           │ • /profile       │ • /dashboard-    │            │
    │  │ • /career-logic  │ • /batches       │   stats          │            │
    │  │ • /guidance      │ • /update-prog   │ • /at-risk       │            │
    │  │                  │ • /guidance      │ • /pending-      │            │
    │  │                  │                  │   mentors        │            │
    │  │                  │                  │ • /verify-mentor │            │
    │  │                  │                  │ • /guidance      │            │
    │  └──────────────────┴──────────────────┴──────────────────┘            │
    │         ↓                   ↓                   ↓                      │
    │  ┌────────────────────────────────────────────────────────────────────┐ │
    │  │ dependencies.py - Authentication & RBAC                           │ │
    │  │ • get_current_user() - JWT validation                             │ │
    │  │ • require_role(role) - Single role enforcement                    │ │
    │  │ • require_any_role(roles) - Multi-role enforcement                │ │
    │  └────────────────────────────────────────────────────────────────────┘ │
    └─────────────────────────────────────────────────────────────────────────┘
                                  ↓
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  AI SERVICE LAYER (backend/app/services/)                              │
    │  ┌────────────────────────────────────────────────────────────────────┐ │
    │  │ ai_service.py                                                      │ │
    │  │                                                                    │ │
    │  │  ┌────────────────────────────────────────────────────────────┐   │ │
    │  │  │ 1. CAREER RECOMMENDER                                     │   │ │
    │  │  │                                                            │   │ │
    │  │  │  get_career_recommendations(dna, standard, name)         │   │ │
    │  │  │    ↓                                                       │   │ │
    │  │  │  CHECK: Grade >= 8?                                      │   │ │
    │  │  │    ↓ YES                                                  │   │ │
    │  │  │  [Gemini 3.1 Pro API] or [Fallback Heuristic]           │   │ │
    │  │  │    ↓                                                       │   │ │
    │  │  │  Analyze DNA profile:                                     │   │ │
    │  │  │    • MPC: (logical + pattern + memory) / 3               │   │ │
    │  │  │    • BiPC: (visual_spatial + memory + logical) / 3       │   │ │
    │  │  │    • CEC: (verbal + logical + creative) / 3              │   │ │
    │  │  │    ↓                                                       │   │ │
    │  │  │  CareerRecommendationResponse {                           │   │ │
    │  │  │    primary: StreamRecommendation (confidence: 80-90%)    │   │ │
    │  │  │    secondary: [StreamRecommendation, ...]                │   │ │
    │  │  │    next_steps: [...]                                     │   │ │
    │  │  │  }                                                        │   │ │
    │  │  └────────────────────────────────────────────────────────────┘   │ │
    │  │                                                                    │ │
    │  │  ┌────────────────────────────────────────────────────────────┐   │ │
    │  │  │ 2. TARA (CONTEXTUAL ASSISTANT)                             │   │ │
    │  │  │                                                            │   │ │
    │  │  │  get_tara_guidance(role, page, context)                  │   │ │
    │  │  │    ↓                                                       │   │ │
    │  │  │  VALIDATE: Role in [Student, Mentor, NGO]?              │   │ │
    │  │  │           Page valid for role?                           │   │ │
    │  │  │    ↓ YES                                                  │   │ │
    │  │  │  [Gemini 3.1 Pro API]                                    │   │ │
    │  │  │    ↓                                                       │   │ │
    │  │  │  Generate role + page specific guidance:                 │   │ │
    │  │  │    • Student: guidance for dashboard, learning-dna, etc  │   │ │
    │  │  │    • Mentor: guidance for batches, update-progress, etc  │   │ │
    │  │  │    • NGO: guidance for at-risk, pending-mentors, etc      │   │ │
    │  │  │    ↓                                                       │   │ │
    │  │  │  TARGuidance {                                            │   │ │
    │  │  │    guidance_title: str                                   │   │ │
    │  │  │    guidance_text: str (2-3 sentences)                    │   │ │
    │  │  │    key_actions: [str, str, ...]                         │   │ │
    │  │  │    tips: [str, str]                                     │   │ │
    │  │  │    warning: Optional[str]                               │   │ │
    │  │  │  }                                                        │   │ │
    │  │  └────────────────────────────────────────────────────────────┘   │ │
    │  │                                                                    │ │
    │  │  ┌────────────────────────────────────────────────────────────┐   │ │
    │  │  │ UTILITY FUNCTIONS                                          │   │ │
    │  │  │ • is_gemini_available() → bool                            │   │ │
    │  │  │ • get_fallback_career_recommendation() → Response         │   │ │
    │  │  └────────────────────────────────────────────────────────────┘   │ │
    │  │                                                                    │ │
    │  │  ERROR HANDLING:                                                   │ │
    │  │  • Career recommender: Always returns response (never fails)      │ │
    │  │  • TARA guidance: Returns Optional[TARGuidance] (graceful)        │ │
    │  │  • Fallback algorithms for when Gemini unavailable                │ │
    │  │  • Comprehensive logging for debugging                            │ │
    │  └────────────────────────────────────────────────────────────────────┘ │
    └─────────────────────────────────────────────────────────────────────────┘
                    ↓ (if Gemini API available)      ↓ (data layer)
    ┌─────────────────────────────────┐    ┌──────────────────────────────┐
    │  EXTERNAL: Google Gemini API    │    │  DATA LAYER (SQLAlchemy ORM) │
    │  (Gemini 3.1 Pro)               │    │                              │
    │  • Uses: google-generativeai    │    │  models/user.py:             │
    │  • Model: gemini-1.5-pro        │    │  • User (core identity)      │
    │  • Input: DNA + context         │    │  • StudentProfile (DNA JSONB)│
    │  • Output: Structured JSON      │    │  • MentorProfile (approval)  │
    │  • Fallback: Heuristic if fail  │    │                              │
    │  └─────────────────────────────┘    │  db/session.py:              │
    │                                      │  • Engine (PostgreSQL/Neon)  │
    │                                      │  • SessionLocal factory       │
    │                                      └──────────────────────────────┘


DATA FLOW: STUDENT CAREER LOGIC
═════════════════════════════════════════════════════════════════════════════════

    Frontend                Router              AI Service           Database
    
    POST /career-logic
         ↓                  ↓
    Fetch token      get_current_user()
         ↓                  ↓
         │            Validate JWT
         │                  ↓
    Loaded           Fetch student
    User Profile         ↓
    (mounted)        db.query(StudentProfile)
         ↓                  ↓
    Call endpoint    Extract learning_dna
         ↓                  ↓
    Show loading     is_gemini_available()?
    spinner              ↓
         ↓           [Gemini 3.1 Pro API]
    Wait...              ↓
         ↓           Analyze DNA, rank streams
    Display              ↓
    results         Return CareerRecommendationResponse
         ↓                  ↓
    Show:            {primary, secondary,
    • Stream           next_steps}
    • Confidence         ↓
    • Why               Return JSON
    • Subjects           ↓
    • Tips          Render in frontend


DATA FLOW: TARA GUIDANCE
═════════════════════════════════════════════════════════════════════════════════

    Frontend           Router           AI Service         Database
    
    page_changed
         ↓
    GET /guidance?page=X
         ↓
    Fetch auth         ↓
    token          VALIDATE:
         ↓          • Role = page owner?  → DB queries
    Send             • Page in whitelist?    for context
         ↓                ↓
         │          get_tara_guidance()
         │                ↓
         │          [Gemini 3.1 Pro API]
         │                ↓
    Show             Generate personalized
    loading          guidance text
    spinner              ↓
         ↓           Return TARGuidance
    Wait...              ↓
         ↓           {title, text,
    Display          key_actions, tips}
    in:                  ↓
    • Modal          Render in frontend
    • Sidebar        • Title (heading)
    • Tooltip        • Text (main message)
                     • Actions (numbered)
                     • Tips (pro tips)


AUTHENTICATION FLOW
═════════════════════════════════════════════════════════════════════════════════

    Client                 dependencies.py           core/security.py

    GET /protected
    + Authorization: Bearer <token>
         ↓                  ↓
         │            verify_credentials()
         │                  ↓
         │            decode_access_token()
         │                  ↓
         │            jwt.decode()
         │                  ↓
         │            Extract user_id, role
         │                  ↓
         │            db.query(User)
         │                  ↓
    Return 401 ← NO ─ Valid token?
    (Unauthorized)      ↓ YES
                   get_current_user()
                        ↓
                   Return User object
                        ↓
                   Route handler access


ROLES & PERMISSIONS
═════════════════════════════════════════════════════════════════════════════════

    ┌──────────┬────────────────────────┬─────────────────────────────┐
    │  Role    │  Can Access            │  Restrictions               │
    ├──────────┼────────────────────────┼─────────────────────────────┤
    │ Student  │ • /student/dna         │ • Grade 8+ for recommendations│
    │          │ • /student/career-logic│ • Own profile only          │
    │          │ • /student/guidance    │                             │
    ├──────────┼────────────────────────┼─────────────────────────────┤
    │ Mentor   │ • /mentor/profile      │ • Must be APPROVED status   │
    │          │ • /mentor/batches      │ • Cannot access before      │
    │          │ • /mentor/update-prog  │   NGO approval              │
    │          │ • /mentor/guidance     │                             │
    ├──────────┼────────────────────────┼─────────────────────────────┤
    │ NGO      │ • /ngo/dashboard-stats │ • Platform administration   │
    │          │ • /ngo/at-risk         │ • No student/mentor access  │
    │          │ • /ngo/pending-mentors │                             │
    │          │ • /ngo/verify-mentor   │ • Edit mentor status only   │
    │          │ • /ngo/guidance        │                             │
    └──────────┴────────────────────────┴─────────────────────────────┘


MENTOR APPROVAL WORKFLOW
═════════════════════════════════════════════════════════════════════════════════

    1. REGISTER
       ┌──────────────────────────┐
       │ POST /auth/register      │
       │ (role="Mentor")          │
       └──────────────────────────┘
              ↓
       MentorProfile created
       Status = "PENDING"
              ↓
       ⚠️  Cannot access /mentor/batches


    2. NGO REVIEW
       ┌──────────────────────────┐
       │ GET /ngo/pending-mentors │
       │ (NGO views applications) │
       └──────────────────────────┘
              ↓
       Display list of PENDING mentors


    3. APPROVAL/REJECTION
       ┌──────────────────────────────────────┐
       │ POST /ngo/verify-mentor/{mentor_id}  │
       │ {status: "APPROVED"|"REJECTED"}      │
       └──────────────────────────────────────┘
              ↓
       Update MentorProfile.status
              ↓
       ✅ If APPROVED:
          • approved_at = datetime
          • Mentor can now access /mentor/batches
          • Can update student progress
       
       ❌ If REJECTED:
          • rejection_reason = "..."
          • Cannot access mentor portal


ERROR RECOVERY STRATEGY
═════════════════════════════════════════════════════════════════════════════════

    Scenario                    Solution
    ───────────────────────────────────────────────────────────────
    Gemini API key missing      → Heuristic fallback (instant)
    Gemini API timeout (30s)    → Heuristic fallback
    Gemini API error            → Log + Heuristic fallback
    Invalid JWT token           → 401 Unauthorized
    Insufficient permissions    → 403 Forbidden
    Student not found           → 404 Not Found
    Approval status PENDING     → 403 Forbidden
    Grade < 8 for career logic  → 400 Bad Request


════════════════════════════════════════════════════════════════════════════════
"""

# This file is documentation only.
