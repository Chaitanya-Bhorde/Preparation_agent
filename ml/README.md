# Recommendation service (Python)

Ranks what a learner should practise next, from their own stored submission
history. Called by the Node backend; it never touches MongoDB and never sees
database credentials — it only receives aggregate feature vectors.

## Run

```
python ml/service.py            # reads one JSON payload on stdin, writes JSON on stdout
python -m unittest discover -s ml/tests
```

Standard library only, so there is nothing to install.

## Input

```json
{"features": [
  {"domain": "DSA", "topic": "Graph", "attempts": 9, "solved": 1,
   "recentAttempts": 3, "recentAccuracy": 0, "trend": -11, "avgDifficulty": 2.4}
]}
```

`domain` is one of `DSA`, `SQL`, `Aptitude`, `Interview`. Rows missing `domain`
or `topic`, or carrying non-numeric counters, are dropped rather than fatal.

## Approach

Unsupervised, and labelled as such. A placement-prep platform has one learner's
history, not a labelled corpus, so a trained supervised model would be fiction.
Instead each topic becomes a 4-D vector (smoothed accuracy, attempts, recent
accuracy, trend), topics are clustered with deterministic k-means (k-means++
seeding, fixed seed), and each topic is scored by:

```
priority = (0.75 * deficit + 0.25 * cluster_deficit) * (0.5 + 0.5 * evidence)
deficit  = 0.6 * (1 - lifetime smoothed accuracy)
         + 0.4 * (1 - recent accuracy)          # only if >= 2 recent attempts
evidence = min(1, attempts / minAttemptsPerTopic)
```

- **Bayesian smoothing** (`Beta(prior=0.5, k=4)`) keeps 1-of-6 from reading as
  0% skill and 19-of-20 from reading as certainty.
- **Recency** is weighted but gated: a single recent session cannot move a
  topic, two or more can.
- **Evidence** damps low-sample topics so one bad session cannot outrank a real
  weakness.

Every weight and threshold lives in `DEFAULT_CONFIG` and is echoed back under
`model`, so a recommendation can always be traced to the numbers behind it.

## Output

`hasEnoughData: false` plus an empty list and a plain message when there is not
enough history. There is no fallback list of "popular problems" - an empty state
is the honest answer. Otherwise each recommendation carries `title`, `domain`,
`topic`, `reason`, `priority`, `priorityScore`, `action`, `path` and the
`evidence` it was derived from.

## Integration

`server/services/mlRankerClient.js` spawns this script with a timeout and
resolves `null` on any failure (missing interpreter, crash, timeout, bad JSON).
`server/controllers/recommendationController.js` then keeps serving the built-in
ranker's output, so `/api/recommendations` degrades rather than breaks.

| Variable | Purpose |
| --- | --- |
| `ML_PYTHON_BIN` | Comma-separated interpreter candidates (default `python3,py -3,python`) |
| `ML_TIMEOUT_MS` | Kill the child after this long (default `5000`) |