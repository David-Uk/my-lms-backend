# LMS Frontend Application Specification

## Overview

This is a full-featured **Learning Management System (LMS)** with four distinct user roles, each with their own views and capabilities. The backend is a REST API running at `http://localhost:3000`. All protected routes require a JWT Bearer token obtained from `POST /auth/login`.

---

## 1. Authentication & Session Management

### How auth works
- On login, the API returns a JWT token. Store it (e.g. `localStorage` or a secure cookie) and attach it to every subsequent request as:
  ```
  Authorization: Bearer <token>
  ```
- The token payload contains `userId` and `role`. Decode it client-side to drive role-based UI rendering.
- On app load, check for a stored token and validate it (or attempt a profile fetch) to restore session.

### Screens

**Login** — `POST /auth/login`
- Fields: `email`, `password`
- On success: store token, decode role, redirect to role-specific dashboard

**Learner Self-Registration** — `POST /auth/signup`
- Fields: `firstName`, `lastName`, `email`, `password`, `phoneNumber?`, `bio?`
- Role is automatically set to `learner`

**Forgot Password** — `POST /auth/forgot-password`
- Field: `email`
- Show a confirmation message regardless of whether the email exists

**Reset Password** — `POST /auth/reset-password`
- Fields: `email`, `token` (from email link), `newPassword`
- Typically reached via a deep link: `/reset-password?token=xxx&email=yyy`

**Edit Profile** — `PUT /auth/profile` (authenticated)
- Fields: `firstName`, `lastName`, `email`, `password`, `phoneNumber`, `bio`, `profilePicture`
- SuperAdmins can also change `role` and `status`; strip those fields for all other roles

---

## 2. User Roles & Access Control

| Role | Key Capabilities |
|------|-----------------|
| `superadmin` | Everything — full system access |
| `admin` | Manage users, courses, assessments; cannot create superadmins |
| `tutor` | Manage content on assigned courses, run quiz sessions |
| `learner` | View enrolled courses, take assessments, submit code |

Use the decoded `role` from the JWT to conditionally render navigation items, action buttons, and entire pages. Never rely solely on hiding UI — the API enforces permissions server-side too.

---

## 3. User Management (Admin / SuperAdmin)

### Screens

**User List** — `GET /users`
- Table with columns: name, email, role, status
- Actions: view, edit, delete
- Only visible to `admin` and `superadmin`

**Create User** — `POST /users`
- Same fields as registration plus `role` and `status`
- Admins can create `admin`, `tutor`, `learner` accounts
- SuperAdmins can also create `superadmin` accounts

**User Detail / Edit** — `GET /users/:id` + `PUT /users/:id`
- All profile fields editable
- Role/status changes restricted by the caller's own role (enforced server-side)

**Delete User** — `DELETE /users/:id`
- Soft delete (user is deactivated, not permanently removed)

### Data shape — User
```ts
{
  id: string           // UUID
  firstName: string
  lastName: string
  email: string
  role: 'superadmin' | 'admin' | 'tutor' | 'learner'
  status: 'active' | 'inactive' | 'suspended'
  phoneNumber: string | null
  profilePicture: string | null
  bio: string | null
  lastLoginAt: string | null
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}
```

---

## 4. Course Management

Courses are the top-level learning containers. They have a hierarchical content tree (sections → lessons/assessments), assigned tutors, and learner cohorts.

### Screens

**Course Catalog** — `GET /courses`
- Paginated grid/list with search and difficulty filter
- Query params: `page`, `limit`, `search`, `difficultyLevel` (`beginner` | `intermediate` | `advanced`)
- All roles can view

**Course Detail** — `GET /courses/:id`
- Shows title, description, difficulty, content tree, assigned tutors, enrolled cohorts

**Create Course** — `POST /courses` (Admin only)
- Fields: `title`, `description?`, `difficultyLevel`

**Edit Course** — `PUT /courses/:id` (Admin only)
- Same fields, all optional

**Delete Course** — `DELETE /courses/:id` (Admin only)

### Data shape — Course
```ts
{
  id: string
  creatorId: string
  title: string
  description: string | null
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  contents: CourseContent[]
  courseTutors: CourseTutor[]
  cohorts: Cohort[]
  createdAt: string
  updatedAt: string
}
```

---

## 5. Course Content Tree

Content is structured as a tree: **Sections** contain **Lessons** and **Assessments**. The `parentId` field links children to their parent section.

### Content types
| `contentType` | Description |
|---------------|-------------|
| `section` | A grouping node (folder) — has children |
| `lesson` | A leaf node for learning material |
| `assessment` | A leaf node linked to a quiz or code challenge |

### Screens

**Content Tree View** — `GET /courses/:id/contents`
- Render as a collapsible sidebar tree
- Sections are expandable; lessons and assessments are clickable leaf nodes
- Drag-and-drop reordering via `sequenceOrder` field (update via `PUT /courses/contents/:contentId`)

**Create Content Node** — `POST /courses/:id/contents`
- Fields: `topic`, `contentType`, `sequenceOrder?`, `parentId?`
- `parentId` is the UUID of the parent section (omit for root-level nodes)

**Edit Content Node** — `PUT /courses/contents/:contentId`

**Delete Content Node** — `DELETE /courses/contents/:contentId`

### Data shape — CourseContent
```ts
{
  id: string
  courseId: string
  topic: string
  contentType: 'section' | 'lesson' | 'assessment'
  sequenceOrder: number
  parentId: string | null
  children: CourseContent[]   // populated in tree response
  lesson: Lesson | null
  assessment: Assessment | null
  createdAt: string
}
```

---

## 6. Tutor Assignment

### Screens / Actions (Admin only)

**Tutor List for Course** — `GET /courses/:id/tutors`

**Assign Single Tutor** — `POST /courses/:id/tutors`
- Body: `{ tutorId: string }`

**Bulk Assign Tutors** — `POST /courses/:id/tutors/bulk`
- Body: `{ tutorIds: string[] }`
- Use a multi-select user picker filtered to `role = tutor`

**Remove Tutor** — `DELETE /courses/:id/tutors/:tutorId`

---

## 7. Learner Enrollment

Learners are enrolled into a **cohort** within a course. A cohort is a group of learners taking the course together (think "class of 2025").

### Screens / Actions (Admin only)

**Learner List for Course** — `GET /courses/:id/learners?cohortId=`
- Optional `cohortId` query param to filter by cohort
- Response is grouped by cohort

**Enroll Single Learner** — `POST /courses/:id/learners`
- Body: `{ learnerId: string, cohortId: string }`

**Bulk Enroll** — `POST /courses/:id/learners/bulk`
- Body: `{ learnerIds: string[], cohortId: string }`

**Remove Learner** — `DELETE /courses/:id/learners/:cohortId/:learnerId`

---

## 8. Assessments

Assessments are attached to a `CourseContent` node of type `assessment`. Each assessment has a `type` and then a linked **Quiz** or **Code Challenge** sub-resource.

### Assessment types
| `type` | Sub-resource | Description |
|--------|-------------|-------------|
| `quiz` | Quiz | Standard timed quiz |
| `kahoot_quiz` | Quiz (isGroup=true) | Live group quiz session (Kahoot-style) |
| `code_challenge` | CodeChallenge | Code submission with test cases |
| `assignment` | — | Manual/offline assignment |
| `group_assignment` | — | Group offline assignment |

### Creation flow (Admin / Tutor)
1. Create a `CourseContent` node with `contentType: 'assessment'`
2. `POST /assessments/content/:contentId` — create the assessment shell (type, title, instructions)
3. Depending on type:
   - For quiz/kahoot: `POST /assessments/:id/quiz` → then `POST /assessments/quiz/:quizId/questions` (repeat per question)
   - For code challenge: `POST /assessments/:id/code-challenge`

### Data shapes

**Assessment**
```ts
{
  id: string
  contentId: string
  type: 'quiz' | 'assignment' | 'group_assignment' | 'code_challenge' | 'kahoot_quiz'
  title: string
  instructions: string | null
  quiz: Quiz | null
  codeChallenge: CodeChallenge | null
}
```

**Quiz**
```ts
{
  id: string
  assessmentId: string
  timeAllocated: number      // minutes
  passMark: number           // percentage
  isGroup: boolean           // true for Kahoot-style
  groupPin: string | null    // 6-char PIN for group sessions
  questions: QuizQuestion[]
}
```

**QuizQuestion**
```ts
{
  id: string
  quizId: string
  type: 'single_option' | 'multiple_option' | 'true_false' | 'image_matching' | 'fill_in_the_blank' | 'short_answer'
  question: string
  options: any               // array for MC, object for matching, null for short answer
  correctAnswer: any         // string, array, or object depending on type
  marks: number
  timeLimit: number | null   // seconds, for Kahoot-style per-question timers
}
```

**CodeChallenge**
```ts
{
  id: string
  assessmentId: string
  language: string           // e.g. 'typescript', 'python'
  problemStatement: string
  boilerplateCode: string | null
  testCases: { input: string, expectedOutput: string, isHidden: boolean }[]
}
```

---

## 9. Quiz Taking (Learner)

**View Assessment** — `GET /assessments/:id`
- Shows assessment details, quiz questions (without correct answers), or code challenge

**Standard Quiz Flow**
- Display questions one at a time or all at once based on UX preference
- Track time remaining client-side using `timeAllocated` (minutes)
- No dedicated "submit quiz" endpoint — answers are submitted per-question during a live session (see Group Quiz below) or handled as part of the session flow

---

## 10. Group Quiz / Kahoot Sessions

This is a real-time, Kahoot-style live quiz feature. A tutor hosts a session; learners join via a PIN.

### Host flow (Tutor / Admin)
1. **Create session** — `POST /assessments/sessions`
   - Body: `{ quizId, cohortId }`
   - Response includes a `pin` (6-char code) and `sessionId`
   - Session starts in `waiting` status
2. **Display PIN** on screen for learners to join
3. **Start session** — `PATCH /assessments/sessions/:sessionId/status`
   - Body: `{ status: 'active' }`
4. **Monitor leaderboard** — `GET /assessments/sessions/:sessionId/leaderboard`
   - Poll this endpoint (e.g. every 2–3 seconds) while session is active
5. **End session** — `PATCH /assessments/sessions/:sessionId/status`
   - Body: `{ status: 'completed' }`

### Learner flow
1. Enter PIN to join (match against active sessions — implement a join-by-PIN screen)
2. Wait in lobby until host starts
3. For each question, show question + options with a countdown timer (`timeLimit` seconds)
4. **Submit answer** — `POST /assessments/sessions/:sessionId/submit`
   - Body: `{ questionId, answer, responseTimeMs }`
   - `responseTimeMs` is how long the learner took to answer (used for scoring)
5. After session ends, show final leaderboard

### Session status flow
```
waiting → active → completed
```

### Leaderboard data shape
```ts
{
  rank: number
  userId: string
  name: string
  points: number
  correctAnswers: number
}[]
```

---

## 11. Code Challenge (Learner)

**Submit code** — `POST /assessments/code-challenge/:challengeId/submit`
- Body: `{ code: string }`
- Response includes test case results (pass/fail per case) and overall score

**Test code (without saving)** — `POST /assessments/code-challenge/:challengeId/test`
- Same body, same response shape — use this for a "Run" button before final submission

### UI recommendations
- Embed a code editor (e.g. Monaco Editor or CodeMirror)
- Pre-populate with `boilerplateCode` if present
- Show language badge from `language` field
- Display test cases (non-hidden ones) in a panel below the editor
- Show pass/fail indicators per test case after running

---

## 12. AI Features

All AI endpoints require authentication. All roles can use transcription, quiz generation, and flashcards. Only `admin` and `superadmin` can access performance analysis.

### Transcription — `POST /ai/transcribe`
- `multipart/form-data` with a `file` field (audio: wav, mp3, etc.)
- Response: `{ transcription: string }`
- UI: file upload button + display transcribed text

### Quiz Generation — `POST /ai/quiz`
- Body: `{ topic: string }`
- Response: a generated Quiz object (same shape as Quiz above)
- UI: text input for topic → "Generate Quiz" button → preview generated questions → optionally save to an assessment

### Flashcard Generation — `POST /ai/flashcards`
- Body: `{ topic: string }`
- Response: `{ flashcards: { front: string, back: string }[] }`
- UI: topic input → flip-card deck display

### Performance Analysis — `POST /ai/analyze-performance` (Admin only)
- No request body
- Response:
  ```ts
  {
    summary: string
    insights: string[]
    recommendations: string[]
    rawData: object
  }
  ```
- UI: dashboard card with summary text, insight chips, recommendation list

---

## 13. Navigation & Dashboard Structure

### SuperAdmin / Admin
- Dashboard (performance overview, quick stats)
- Users (list, create, edit, delete)
- Courses (list, create, edit, content tree, tutors, learners)
- Assessments (via course content tree)
- AI → Performance Analysis
- Profile settings

### Tutor
- My Courses (courses they are assigned to)
- Course Content (create/edit sections, lessons, assessments)
- Quiz Sessions (create and host live sessions)
- AI → Quiz Generator, Flashcards, Transcription
- Profile settings

### Learner
- My Courses (enrolled courses)
- Course Content (read-only tree, navigate to lessons and assessments)
- Take Assessments (quiz, code challenge)
- Join Live Quiz (enter PIN)
- AI → Quiz Generator, Flashcards, Transcription
- Profile settings

---

## 14. API Integration Notes

### Base URL
```
http://localhost:3000
```

### Auth header (all protected routes)
```
Authorization: Bearer <jwt_token>
```

### Pagination pattern
Requests that return lists accept:
- `page` (default: 1)
- `limit` (default: 10)

### Error handling
| Status | Meaning |
|--------|---------|
| 400 | Validation error — show field-level errors |
| 401 | Token missing or expired — redirect to login |
| 403 | Insufficient role — show "Access Denied" |
| 404 | Resource not found — show empty state |
| 409 | Conflict (duplicate) — show inline warning |
| 500 | Server error — show generic error toast |

### Recommended API client setup
- Use an HTTP client (Axios, fetch wrapper, etc.) with a request interceptor that injects the `Authorization` header automatically
- Add a response interceptor that catches `401` and redirects to `/login` after clearing the stored token
- Decode the JWT on login to extract `{ userId, role, exp }` — use `exp` to proactively refresh or warn before expiry

---

## 15. Key UI Patterns to Implement

- **Role-gated routes** — redirect unauthorized users to their dashboard
- **Content tree** — recursive collapsible tree component for course structure
- **Live quiz lobby** — polling or WebSocket-ready component for session status and leaderboard
- **Code editor** — Monaco or CodeMirror with language support
- **File upload** — for AI audio transcription
- **Paginated tables** — for users and courses
- **Multi-select user picker** — for bulk tutor assignment and learner enrollment
- **Toast notifications** — for API success/error feedback
- **Confirmation dialogs** — for destructive actions (delete user, delete course, remove learner)
