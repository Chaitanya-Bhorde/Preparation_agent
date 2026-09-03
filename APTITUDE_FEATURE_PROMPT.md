# PrepAgent — Aptitude Section Full Spec + Implementation Prompt (Hinglish)

> **User requirement (original):** Har aptitude section (Quantitative / Logical / Verbal) ke har topic mein
> Easy–Medium–Hard sections 50-50-50 questions. Questions pehle solved/corrected NA dikho. Sirf tab feedback dikho
> jab user koi option click kare — correct ho to GREEN, galat ho to RED. "Check Solution" option ho. Easy/Medium/Hard
> practice solve karte waqt koi counting/result calculation NA ho. Result sirf Mock Test solve karne par ho.
> Mock Test ke baad "Reset Paper" option ho jisse bilkul nayi test naye (shuffled) options ke saath aaye.

---

## Important Note (pehle 2 min padho)

Ye feature is repo mein **pehle se implement ho chuka hai** — commits `b64cab3`, `72855d2`, `c06f4a2` ke through.
Is prompt ko 2 tarah use kar sakte ho:

1. **Gap-check / verification mode:** Har section ke requirement ko current code ke against verify karo aur jo missing ya
   beesura dikhe use fix karo. Har phase ke end par proof dena (console logs / curl / UI screenshot).
2. **Fresh implementation mode:** Agar kisi doosre repo / fresh machine par lagana ho to is prompt ko as-is follow karo,
   phase-by-phase implement karo.

MATLAB: Agar code pehle se sahi hai to mat toodo — sirf verify + minor fixes. Change sirf wahi karo jo requirement se
bhatkta hai.

---

## DOs & DON'Ts (har step mein yahi rule apply hoga)

| Rule | Allowed | NOT allowed |
|---|---|---|
| Practice mode (Easy/Med/Hard) | Instant green/red feedback + View Solution + retry | Score, accuracy, "X correct", result page, DB scoring write |
| Mock test | Timer, options select, submit → score, per-question review | Koi instant feedback test ke andar nahi |
| Questions list API | `questionText`, `options`, `difficulty` | `correctAnswer`, `explanation`, `solutionSteps` (solutions hidden) |
| Mock generate | Har baar fresh random 30 Qs + shuffled/relabeled options | Same paper dobara dena, solutions leak karna |

**3 golden rules:**
1. Practice = feedback-only, kabhi score/count/result NAHI.
2. Result/settlement SIRF `/api/aptitude/submit-mock` par hota hai.
3. "Reset Paper" par naya paper + naye shuffled options + timer reset.

---

## Phase 0 — Codebase Map (mat toodo, isi pe kaam karo)

**Server (Express + MongoDB, Mongoose):**
- `server/models/AptitudeTopic.js` — topic schema (category, priority, subtopics)
- `server/models/AptitudeQuestion.js` — question schema (options[] label/text/isCorrect, correctAnswer, explanation, solutionSteps, difficulty, category, topicId)
- `server/models/AptitudeMockTest.js` — mock paper schema (questionIds + shuffled question snapshot `questions[]`, duration, difficultyMix)
- `server/models/AptitudeSubmission.js`, `server/models/AptitudeResult.js` — result storage
- `server/routes/aptitude.js` — SAB API endpoints yahan
- `server/scripts/_aptSub.js` — 43 topics ka metadata
- `server/scripts/_aptGen_*.js` — question generators
- `server/scripts/seedAptitudeQuestions.js` — 50-50-50 seeder

**Topics (43):**
- quantitative (15): Percentages, Profit, Loss & Discount, Ratio & Proportion, Averages, Time, Speed & Distance, Time & Work, Simple & Compound Interest, Number System, LCM & HCF, Probability, Permutation & Combination, Algebra, Data Interpretation, Simplification, Mensuration
- logical (15): Number Series, Coding-Decoding, Blood Relations, Direction Sense, Syllogism, Seating Arrangement, Puzzles, Statement & Conclusions, Statement & Assumptions, Data Sufficiency, Analogy, Odd One Out, Venn Diagrams, Clocks & Calendars, Ranking & Order
- verbal (13): Reading Comprehension, Sentence Correction, Error Detection, Fill in the Blanks, Para Jumbles, Synonyms & Antonyms, Vocabulary, Sentence Completion, Grammar, Active & Passive Voice, Direct & Indirect Speech, One Word Substitution, Idioms & Phrases

**Client (React + Vite + Tailwind + lucide-react):**
- `client/src/api.js` (lines ~135-144) — aptitude API wrappers
- `client/src/pages/AptitudePractice.jsx` — section cards + topic grid + MockTestGrid
- `client/src/pages/AptitudeTopicPractice.jsx` — Easy/Medium/Hard tabs + practice flow
- `client/src/pages/AptitudeMockTest.jsx` — mock runner + timer + submit
- `client/src/components/aptitude/QuestionCard.jsx` — green/red feedback card + View Solution
- `client/src/components/aptitude/MockTestGrid.jsx` — mock test entry grid
- `client/src/components/aptitude/MockResultView.jsx` — result page + Reset Paper button

---

## Phase 1 — Database & Seeding (50-50-50)

**Requirement:** Har topic ke paas EXACTLY 50 easy + 50 medium + 50 hard = 150 questions.
43 topics × 150 = **6450 questions** total. Counts UI par tab labels mein dikhna chahiye: `Easy · 50 / Medium · 50 / Hard · 50`.

**Already hai:** `seedAptitudeQuestions.js` for-loop `['easy','medium','hard']` × 50. Verify karo, re-seed karo:

```bash
cd server
node scripts/seedAptitudeQuestions.js
```

Mongo verification (per topic × difficulty count exactly 50):
```js
db.aptitudequestions.aggregate([
  { $group: { _id: { topic: "$topic", difficulty: "$difficulty" }, n: { $sum: 1 } } },
  { $match: { "n": { $ne: 50 } } }
])
// -> koi row aaye to galat hai; empty = sab 50-50-50
```

**Phase 1 acceptance proof (terminal mein dikhana):**
- [ ] Seeder output: 43 lines `quantitative/Percentages: 150 questions` jaise
- [ ] Count query empty result (ya `n:50` confirm)
- [ ] Total = 6450

---

## Phase 2 — Backend APIs (`server/routes/aptitude.js`)

### 2.1 GET `/api/aptitude/topics?category=quantitative|logical|verbal`
Topics list. Public ho (auth ke bina bhi page load ho).

### 2.2 GET `/api/aptitude/questions/:topicId?difficulty=easy|medium|hard`
- Query ke bas us difficulty ke 50 questions return karo.
- **Solutions hidden** — `.select('-explanation -solutionSteps -correctAnswer -options.isCorrect')`.
- Response mein `counts: { easy, medium, hard }` bhi do (tab counts ke liye).
- 404 agar koi question na mile.

### 2.3 POST `/api/aptitude/submit-answer` (PRACTICE — scoring NAHI)
Body: `{ questionId, selectedAnswer }`
- Question dhoondo, `isCorrect = question.correctAnswer === selectedAnswer` compare karo.
- Return: `{ isCorrect, correctAnswer, explanation, solutionSteps }`.
- **KUUCH BHI SAVE/COUNT/SCORE MAT KARO. DB WRITE NAHI.**
  - Ye requirement ka CORE hai: practice karte waqt counting zero honi chahiye.
  - Sirf instant feedback — green/red + solution.
  - (Optional: timeTaken log allowed, par scoring nahi.)

### 2.4 POST `/api/aptitude/mock/generate` (auth required)
Body: `{ category: 'full' | 'quantitative-only' | 'logical-only' | 'verbal-only' }`
- Pool se random 30: **10 easy + 12 medium + 8 hard**.
- Har question ke **options HAR BAR SHUFFLE** karo, labels relabel `A/B/C/D`, `correctAnswer` bhi naye label ke against.
- **Snapshot paper** (`AptitudeMockTest` doc with `questions[]` snapshot) DB mein save karo → reload par SAME paper dikhe.
- Response: `{ success, mock: { _id, name, duration, totalQuestions, passingScore }, questions: [{ _id, questionText, difficulty, options }] }`
- `correctAnswer`/`explanation` response mein kabhi mat bhejo.

### 2.5 GET `/api/aptitude/mock-tests` — list saved papers / pre-seeded tests.

### 2.6 GET `/api/aptitude/mock/:mockTestId/questions` — paper meta + questions (solutions hidden). Snapshot se options exact parent label ke saath.

### 2.7 POST `/api/aptitude/submit-mock` (auth required) — **SIRF YAHAN SCORING**
Body: `{ mockTestId, answers: [{ questionId, selectedAnswer }] }`
- **Shuffled snapshot ke correctAnswer ke against check karo** (galat label compare se bug aata hai).
- Result: `{ score, correctCount, totalCount, verdict, passed }` + per-question detail (user answer, correct answer, options, explanation).
- Result save karo (`AptitudeSubmission`/`AptitudeResult`) + leaderboard + achievements update (agar pehle se wired hai).

### 2.8 GET `/api/aptitude/results/:submissionId` — saved result ka full detail.

### 2.9 GET `/api/aptitude/progress` — user stats (mock submissions se calculate).

**Phase 2 acceptance proof:**
- [ ] curl `GET questions?difficulty=easy` → JSON mein `"explanation"`, `"correctAnswer"`, `"solutionSteps"` **kahin nahi** aa sakte.
- [ ] curl `POST submit-answer` (correct & wrong dono) → correct `isCorrect` + `correctAnswer` + `explanation`; MongoDB mein koi naya submission doc nahi bana.
- [ ] curl `POST mock/generate` 2 baar → dono papers ke options order **alag-alag**; response mein `correctAnswer` absent.
- [ ] curl `POST submit-mock` with shuffled labels → sahi score compute (e.g. 18/30 → 60%).

---

## Phase 3 — Frontend: Topic Practice (Easy/Medium/Hard + green/red + Check Solution)

Files: `client/src/pages/AptitudeTopicPractice.jsx`, `client/src/components/aptitude/QuestionCard.jsx`

**Flow:**
1. Topic page ke upar **3 tabs**: `Easy · 50` / `Medium · 50` / `Hard · 50` (colors: green/yellow/red).
2. Tab switch → `getAptitudeQuestions(topicId, difficulty)` se 50 questions + counts load. Index 0 se shuru.
3. Question card (**pehle neutral**):
   - Saare options gray — koi correct answer pehle nahi dikhta.
   - User ne option click kiya:
     - ✅ Correct → wo option **GREEN** + `CheckCircle2` + "Correct!"
     - ❌ Galat → chosen option **RED** + `XCircle` + "Wrong — correct answer is (X)", aur saath hi correct option **GREEN** highlight.
     - Baaki options dim (opacity-60).
   - Answer ke BAAD hi **"View solution"** button (Eye icon) → toggle se:
     - Correct answer chip (Target icon)
     - Explanation (Lightbulb icon, yellow)
     - Step-by-step solution (numbered, colored circles)
   - ~18s ke baad feedback **auto-clear** (retry ke liye) — text bhi dikhe "(feedback resets in ~18s so you can retry)".
4. **Practice mode = NO SCORING:**
   - Koi score bar, koi "3/50 correct", koi accuracy, koi counting → **ZERO**.
   - "Finish set" par sirf neutral message: *"Practice set done! You've gone through this set. Jump to Mock Tests when you're ready to track a score."* + "Practice again" + "More topics".
   - Solutions cache client-side tabhi hoti hai jab user ne wo question answer kiya ho.

**Phase 3 acceptance proof:**
- [ ] Ek question page load karo → html inspect: koi green/red class, koi solution text nahi.
- [ ] Galat click → red + correct green ek saath dikhe.
- [ ] "View solution" toggle → explanation + steps.
- [ ] 18s wait → feedback gayab, options wapas clickable.
- [ ] 20 questions solve karke bhi page par KAHIN "correct: x/y" nahi.

---

## Phase 4 — Frontend: Mock Test + Reset Paper

Files: `client/src/pages/AptitudeMockTest.jsx`, `client/src/components/aptitude/MockResultView.jsx`

**Flow:**
1. Mock paper = 30 random Qs (10E/12M/8H) + **30:00 countdown timer** (chip, hide/show toggle, amber ≤5min, red ≤1min).
2. Test ke ANDAR **koi instant green/red feedback nahi** — options bas `border-blue-500/70 bg-blue-900/20` selection highlight hota hai.
3. "Submit test (answered/30)" → `submitAptitudeMock({ mockTestId, answers })` → result phase.
4. **Result page** (`MockResultView`):
   - Logo, `{mockName} — Result`, `{score}% · {verdict} · PASSED/NOT PASSED`
   - Progress bar (green ≥70 / yellow ≥40 / red)
   - `You got {correctCount} out of {totalCount} correct.`
   - Per-question review: `Q1 · Your answer: C · Correct: B` + question text + all options (correct highlighted green) + "Why:" explanation.
5. **DO buttons result page par:**
   - `Back to aptitude` (primary)
   - **`Reset Paper — new test with new options`** (secondary, `RotateCcw` icon) → `onResetPaper` prop se **fresh paper**:
     - `POST /api/aptitude/mock/generate` dobara
     - Bilkul NAYE random questions + NAYE shuffled options
     - timer wapas 30:00, answeredCount 0, result null, phase 'running'
6. Test ke beech mein bhi sticky bottom: `New paper` (secondary) + `Submit test` (primary).

**Phase 4 acceptance proof:**
- [ ] Mock solve → Result page pe %. (practice solve karne se YE page kabhi nahi)
- [ ] "Reset Paper" click → naya paper dikhe, countdown 30:00, question text DIFFERENT ho.
- [ ] Reset karke option orders compare karo — **options bhi shuffled** (A/B/C/D positions alag).
- [ ] Test 31+ min koi issue nahi (timer guard, auto-submit allowed).

---

## Phase 5 — Routes & Navigation

- `/practice/aptitude` → `AptitudePractice` (3 section cards + topic grid + MockTestGrid)
- `/practice/aptitude/topic/:topicId` → `AptitudeTopicPractice`
- `/practice/aptitude/mock/:mockTestId` → `AptitudeMockTest` (pre-seeded paper)
- `/practice/aptitude/mock/generate?category=full` → `AptitudeMockTest` generate mode (fresh paper)
- Navbar Aptitude → `/practice/aptitude` (already wired)
- MockTestGrid ke cards/buttons sahi routes par point karein.

---

## Phase 6 — Final Verification Checklist (HAR ITEM PASS)

**UI manual test:**
1. [ ] Easy tab → neutral options, koi solution pre-revealed nahi
2. [ ] Galat click → RED + XCircle; correct option GREEN highlight
3. [ ] "View solution" → correct answer + explanation + steps
4. [ ] 18s → feedback clear, retry possible
5. [ ] Practice poori category (50 Qs) solve karke bhi koi score/counter/result nahi
6. [ ] Mock test andar koi green/red nahi, sirf blue selection
7. [ ] Submit → score%, verdict, PASS/FAIL + review listing
8. [ ] "Reset Paper" → naye questions + naye shuffled options + timer 30:00
9. [ ] 2 reset papers cross-compare → questions alag AUR options order alag

**Code review:**
10. [ ] `GET /questions/:topicId` response mein `explanation | solutionSteps | correctAnswer` field NA ho
11. [ ] `POST /submit-answer` koi scoring/submission DB write na kare
12. [ ] `POST /mock/generate` mein har bar shuffle + relabel; snapshot saved
13. [ ] `POST /submit-mock` correctAnswer compare snapshot label se ho (relabeled)
14. [ ] Client `api.js`, `AptitudeTopicPractice.jsx`, `AptitudeMockTest.jsx`, `MockResultView.jsx` upar ke flow se match

**Build/Run:**
15. [ ] `cd client && npm run build` → 0 errors
16. [ ] `cd server && node scripts/seedAptitudeQuestions.js` → 6450 Qs (150/topic)
17. [ ] All aptitude REST endpoints → HTTP 200, response shape per spec

---

## Delivery Format

Har phase ke end par **proof dena** (Phase 1 se 6 tak):
- Backend: terminal mein curl + JSON outputs
- Frontend: `npm run build` + browser rendered output / screenshot excerpt
- Data: Mongo counts (50-50-50)
Aage koi phase tabhi badhana jab tak us phase ka acceptance criteria pass na ho.