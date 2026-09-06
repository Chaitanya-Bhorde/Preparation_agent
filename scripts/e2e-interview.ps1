# End-to-end verification for the AI Mock Interview feature.
# Usage: powershell -File scripts\e2e-interview.ps1 -BaseUrl http://localhost:5000
param([string]$BaseUrl = 'http://localhost:5000')

$script:pass = 0; $script:fail = 0
function Assert($cond, $name) {
  if ($cond) { $script:pass++; Write-Host "  PASS  $name" -ForegroundColor Green }
  else       { $script:fail++; Write-Host "  FAIL  $name" -ForegroundColor Red }
}
function ValidId($id) { return ($id -match '^[0-9a-f]{24}$') }
# Reliable error-body reader for PS 5.1 (ErrorDetails carries the response body).
function ReadErrorBody($err) {
  if ($err.ErrorDetails -and $err.ErrorDetails.Message) { return ($err.ErrorDetails.Message | ConvertFrom-Json) }
  if ($err.Exception.Response) {
    try { $sr = New-Object IO.StreamReader($err.Exception.Response.GetResponseStream()); return ($sr.ReadToEnd() | ConvertFrom-Json) } catch { return $null }
  }
  return $null
}
$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$email = "e2e_int_$stamp@example.com"

Write-Host "`n=== SETUP: register + login ==="
$r = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/register" -ContentType 'application/json' -Body (@{ name='E2E Tester'; email=$email; password='Secret123' } | ConvertTo-Json)
$hdr = @{ Authorization = "Bearer $($r.token)" }
Assert ($null -ne $r.token) 'register returns token'
try {
  $act = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/interview/sessions/active" -Headers $hdr
  if ($act.data.hasActiveSession) {
    Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions/$($act.data.session.id)/abandon" -Headers $hdr | Out-Null
    Write-Host '  (abandoned leftover session from a previous run)'
  }
} catch { }

# ---------- TEST A: new interview + full question ID lifecycle ----------
Write-Host "`n=== TEST A: NEW INTERVIEW (Java / text / 5 questions) ==="
$r = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions" -Headers $hdr -ContentType 'application/json' -Body (@{ topics=@('Java'); difficulty='medium'; experienceLevel='fresher'; mode='text'; totalQuestions=5 } | ConvertTo-Json)
$sid = $r.data.sessionId; $cur = $r.data.question
Assert ($r.data.status -eq 'IN_PROGRESS') 'session created IN_PROGRESS'
Assert (ValidId $sid) "sessionId valid ObjectId ($sid)"
Assert (ValidId $cur.id) "Q1 id valid ObjectId ($($cur.id))"
Write-Host "  Q1 source=$($cur.source) topic=$($cur.topic) diff=$($cur.difficulty): '$($cur.text.Substring(0,[Math]::Min(60,$cur.text.Length)))...'"

# validation checks
$rejected = $false
try { Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions/$sid/answer" -Headers $hdr -ContentType 'application/json' -Body (@{ questionId=$cur.id; answer='  ' } | ConvertTo-Json) | Out-Null } catch { $rejected = $true }
Assert $rejected 'empty answer rejected'
$rejected = $false
try { Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions/$sid/answer" -Headers $hdr -ContentType 'application/json' -Body (@{ questionId='abc123'; answer='some answer here' } | ConvertTo-Json) | Out-Null } catch { $rejected = $true }
Assert $rejected 'malformed questionId rejected (no bypass)'

# full interview loop
$answers = @(
  'Polymorphism lets objects take many forms. Overloading is compile-time with the same name but different parameters; overriding is runtime where a subclass redefines a parent method with the same signature.',
  'The JVM executes bytecode and provides abstraction over the OS. The JRE is the JVM plus core libraries needed to run programs, and the JDK is the JRE plus development tools like javac and the debugger.',
  'HashMap is not synchronized and allows one null key, while Hashtable is legacy and synchronized. ConcurrentHashMap uses bucket-level locking, giving better concurrency than Hashtable with no null keys.',
  'Garbage collection automatically reclaims memory of unreachable objects. Generational collection helps because most objects die young, so the young generation is collected frequently and cheaply.',
  'A String is immutable so its hash is cached and it is safe to share; StringBuilder is mutable and efficient for building strings inside loops without creating many temporary objects.'
)
$ids = @($cur.id); $completed = $false; $cycles = 0; $evalOk = 0
for ($i = 1; $i -le 12; $i++) {
  $cycles++
  try {
    $r = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions/$sid/answer" -Headers $hdr -ContentType 'application/json' -Body (@{ questionId=$cur.id; answer=$answers[[Math]::Min($i-1, $answers.Count-1)] } | ConvertTo-Json)
  } catch { Write-Host "  submit error: $($_.ErrorDetails.Message)"; break }
  if ($null -ne $r.data.evaluation.overall) { $evalOk++ } else { Write-Host "  WARNING: missing evaluation on cycle $i" }
  if ($r.data.completed) { $completed = $true; break }
  $nq = $r.data.nextQuestion
  if ($null -eq $nq -or -not (ValidId $nq.id)) { Write-Host "  WARNING: next question missing/invalid on cycle $i"; break }
  $ids += $nq.id
  $cur = $nq
}
Assert ($evalOk -eq $cycles) "every answer evaluated ($evalOk/$cycles)"
Assert $completed "interview completed after all main questions ($cycles cycles)"
Assert ($null -ne $r.data.report.overallScore) "final report score returned ($($r.data.report.overallScore)/100)"
Assert (($ids | Select-Object -Unique).Count -eq $ids.Count) "all question IDs unique ($($ids.Count) questions)"
Assert ($ids.Count -ge 5) 'at least 5 questions asked'
Write-Host "  question sources: $($ids.Count) asked; last q topic=$($cur.topic)"

# ---------- TEST B: active session conflict + resume ----------
Write-Host "`n=== TEST B: ACTIVE SESSION (conflict + resume) ==="
$r = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions" -Headers $hdr -ContentType 'application/json' -Body (@{ topics=@('SQL'); difficulty='easy'; experienceLevel='fresher'; mode='text'; totalQuestions=5 } | ConvertTo-Json)
$sidB = $r.data.sessionId; $qB = $r.data.question
Assert (ValidId $sidB) 'session B created'
Assert (ValidId $qB.id) 'session B Q1 valid id'
$conflict = $null
try { Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions" -Headers $hdr -ContentType 'application/json' -Body (@{ topics=@('Java'); difficulty='easy'; experienceLevel='fresher'; mode='text'; totalQuestions=5 } | ConvertTo-Json) | Out-Null } catch { $conflict = ReadErrorBody $_ }
Assert ($null -ne $conflict) 'second create blocked (409)'
Assert ($conflict.data.code -eq 'ACTIVE_SESSION_EXISTS') 'conflict code ACTIVE_SESSION_EXISTS'
Assert (ValidId $conflict.data.existingSessionId) 'conflict carries existingSessionId'
Assert (ValidId $conflict.data.nextQuestion.id) 'conflict carries resumable nextQuestion'

$r = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/interview/sessions/$sidB" -Headers $hdr
Assert ($r.data.nextQuestion.id -eq $qB.id) 'resume restores current question (same id)'
$r = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions/$sidB/answer" -Headers $hdr -ContentType 'application/json' -Body (@{ questionId=$qB.id; answer='A primary key uniquely identifies rows and cannot be null; a unique key can be null once. Foreign keys reference primary keys across tables.' } | ConvertTo-Json)
Assert ($null -ne $r.data.evaluation.overall) 'resumed session accepts answer (no Invalid question ID)'

# ---------- TEST C: abandon + new session ----------
Write-Host "`n=== TEST C: ABANDON & NEW SESSION ==="
$r = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions/$sidB/abandon" -Headers $hdr
Assert ($r.data.status -eq 'ABANDONED') 'old session ABANDONED'
$rejected = $false
try { Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions/$sidB/answer" -Headers $hdr -ContentType 'application/json' -Body (@{ questionId=$qB.id; answer='late answer should fail' } | ConvertTo-Json) | Out-Null } catch { $rejected = $true }
Assert $rejected 'abandoned session rejects new answers'
$r = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions" -Headers $hdr -ContentType 'application/json' -Body (@{ topics=@('Python'); difficulty='easy'; experienceLevel='fresher'; mode='text'; totalQuestions=5 } | ConvertTo-Json)
Assert (ValidId $r.data.sessionId) 'new session after abandon created'
Assert (ValidId $r.data.question.id) 'new session Q1 valid id'
Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions/$($r.data.sessionId)/abandon" -Headers $hdr | Out-Null

# ---------- security ----------
Write-Host "`n=== SECURITY ==="
$email2 = "e2e_other_$stamp@example.com"
$r = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/register" -ContentType 'application/json' -Body (@{ name='Other User'; email=$email2; password='Secret123' } | ConvertTo-Json)
$hdr2 = @{ Authorization = "Bearer $($r.token)" }
$forbidden = $false
try { Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/interview/sessions/$sidB" -Headers $hdr2 | Out-Null } catch { if ($_.Exception.Response.StatusCode.value__ -eq 403) { $forbidden = $true } }
Assert $forbidden 'other user cannot access session (403)'
$badq = $false
$r2 = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions" -Headers $hdr2 -ContentType 'application/json' -Body (@{ topics=@('React'); difficulty='easy'; experienceLevel='fresher'; mode='text'; totalQuestions=5 } | ConvertTo-Json)
try { Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions/$($r2.data.sessionId)/answer" -Headers $hdr2 -ContentType 'application/json' -Body (@{ questionId=$ids[0]; answer='cross-session answer attempt' } | ConvertTo-Json) | Out-Null } catch { $badq = $true }
Assert $badq 'question from another session rejected'
Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/interview/sessions/$($r2.data.sessionId)/abandon" -Headers $hdr2 | Out-Null

Write-Host "`n================================"
Write-Host "RESULT: $script:pass passed, $script:fail failed" -ForegroundColor $(if ($script:fail -eq 0) { 'Green' } else { 'Red' })
exit $(if ($script:fail -eq 0) { 0 } else { 1 })

