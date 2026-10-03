"""Recency-weighted, unsupervised recommendation ranking.

Input is a feature payload built from the authenticated user's stored submission
history. Every number in the output is derived from those features; nothing is
invented when the payload carries no data.
"""

from __future__ import annotations

import math
import random
from typing import Any, Dict, Iterable, List, Optional

DEFAULT_CONFIG: Dict[str, Any] = {
    "minAttemptsPerTopic": 3,
    "minTotalAttempts": 5,
    "bayesPrior": 0.5,
    "bayesStrength": 4.0,
    "recencyWeight": 0.4,
    "weakBelow": 0.55,
    "strongAbove": 0.75,
    "clusters": 4,
    "maxRecommendations": 8,
}

DOMAIN_PRESENTATION: Dict[str, Dict[str, str]] = {
    "DSA": {
        "title": "Practice {topic}",
        "action": "Work through {topic} DSA problems, starting at the difficulty you already clear.",
        "path": "/practice/dsa",
    },
    "SQL": {
        "title": "Revise {topic} in SQL",
        "action": "Practise {topic} SQL queries until the pattern is automatic.",
        "path": "/practice/sql",
    },
    "Aptitude": {
        "title": "Improve {topic} aptitude",
        "action": "Attempt a timed {topic} aptitude set, then a full mock test.",
        "path": "/practice/aptitude",
    },
    "Interview": {
        "title": "Revise {topic} interview fundamentals",
        "action": "Answer two {topic} interview questions out loud, then run a mock interview.",
        "path": "/mock-interview",
    },
}

FALLBACK_PRESENTATION = {
    "title": "Practise {topic}",
    "action": "Work through {topic} problems to build coverage.",
    "path": "/practice/dsa",
}


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _number(value: Any, default: float = 0.0) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return default
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return default
    return float(value)


def parse_features(payload: Any) -> List[Dict[str, Any]]:
    """Normalise the Node payload. Malformed rows are dropped, not fatal."""
    if not isinstance(payload, dict):
        return []
    raw = payload.get("features")
    if not isinstance(raw, list):
        return []

    parsed: List[Dict[str, Any]] = []
    for row in raw:
        if not isinstance(row, dict):
            continue
        domain = row.get("domain")
        topic = row.get("topic")
        if not isinstance(domain, str) or not isinstance(topic, str) or not topic.strip():
            continue
        parsed.append({
            "domain": domain,
            "topic": topic.strip(),
            "attempts": max(0, int(_number(row.get("attempts")))),
            "solved": max(0, int(_number(row.get("solved")))),
            "recentAttempts": max(0, int(_number(row.get("recentAttempts")))),
            "recentAccuracy": _number(row.get("recentAccuracy")),
            "trend": _number(row.get("trend")),
            "avgDifficulty": _number(row.get("avgDifficulty")),
        })
    return parsed


def smoothed_accuracy(successes: float, attempts: float, cfg: Dict[str, Any]) -> float:
    """Beta-shrink an observed rate toward the prior so one miss is not 0% skill."""
    if attempts <= 0:
        return 0.0
    return (successes + cfg["bayesPrior"] * cfg["bayesStrength"]) / (attempts + cfg["bayesStrength"])


def _vector(feature: Dict[str, Any], cfg: Dict[str, Any]) -> List[float]:
    return [
        _clamp(smoothed_accuracy(feature["solved"], feature["attempts"], cfg)),
        _clamp(feature["attempts"] / 20.0),
        _clamp(feature["recentAccuracy"] / 100.0),
        _clamp((feature["trend"] + 100.0) / 200.0),
    ]


def _squared_distance(a: Iterable[float], b: Iterable[float]) -> float:
    return sum((x - y) ** 2 for x, y in zip(a, b))


def kmeans(points: List[List[float]], k: int, seed: int = 42) -> List[int]:
    """Deterministic k-means with k-means++ seeding, so repeated calls on the
    same features always produce the same ordering."""
    n = len(points)
    if n == 0:
        return []
    if n <= k:
        return [0] * n

    rng = random.Random(seed)
    centroids = [list(points[rng.randrange(n)])]
    while len(centroids) < k:
        distances = [min(_squared_distance(p, c) for c in centroids) for p in points]
        total = sum(distances)
        if total <= 0:
            centroids.append(list(points[rng.randrange(n)]))
            continue
        threshold = rng.random() * total
        cumulative = 0.0
        chosen = n - 1
        for index, distance in enumerate(distances):
            cumulative += distance
            if cumulative >= threshold:
                chosen = index
                break
        centroids.append(list(points[chosen]))

    labels = [0] * n
    for _ in range(50):
        moved = False
        for index, point in enumerate(points):
            nearest = min(range(len(centroids)), key=lambda c: _squared_distance(point, centroids[c]))
            if labels[index] != nearest:
                labels[index] = nearest
                moved = True
        sums = [[0.0] * len(points[0]) for _ in centroids]
        counts = [0] * len(centroids)
        for index, point in enumerate(points):
            counts[labels[index]] += 1
            for d, value in enumerate(point):
                sums[labels[index]][d] += value
        for c in range(len(centroids)):
            if counts[c]:
                centroids[c] = [s / counts[c] for s in sums[c]]
        if not moved:
            break
    return labels


def _cluster_proficiency(labels: List[int], points: List[List[float]]) -> Dict[int, float]:
    totals: Dict[int, float] = {}
    counts: Dict[int, int] = {}
    for label, point in zip(labels, points):
        totals[label] = totals.get(label, 0.0) + point[0]
        counts[label] = counts.get(label, 0) + 1
    return {label: totals[label] / counts[label] for label in counts}


def _deficit(feature: Dict[str, Any], cfg: Dict[str, Any]) -> float:
    """Blend lifetime deficit with recent deficit. Recent results only count
    once there are at least two of them, otherwise a single stale session would
    swing the score."""
    history = smoothed_accuracy(feature["solved"], feature["attempts"], cfg)
    if feature["recentAttempts"] >= 2:
        weight = cfg["recencyWeight"]
        recent = _clamp(feature["recentAccuracy"] / 100.0)
        return _clamp((1.0 - history) * (1.0 - weight) + (1.0 - recent) * weight)
    return 1.0 - history


def _priority(feature: Dict[str, Any], cluster_deficit: float, cfg: Dict[str, Any]) -> float:
    evidence = _clamp(feature["attempts"] / cfg["minAttemptsPerTopic"])
    blend = 0.75 * _deficit(feature, cfg) + 0.25 * cluster_deficit
    return round(_clamp(blend * (0.5 + 0.5 * evidence)), 4)


def _priority_label(score: float) -> str:
    if score >= 0.55:
        return "HIGH"
    return "MEDIUM" if score >= 0.3 else "LOW"


def _reason(feature: Dict[str, Any], accuracy_pct: int) -> str:
    attempts = feature["attempts"]
    parts = [f"{accuracy_pct}% accuracy across {attempts} attempt{'' if attempts == 1 else 's'}"]
    if feature["recentAttempts"] >= 2:
        parts.append(f"recent accuracy is {round(feature['recentAccuracy'])}%")
    if feature["avgDifficulty"] >= 2:
        parts.append(f"average difficulty attempted {feature['avgDifficulty']:.1f}/3")
    return f"Your {feature['topic']} performance is {', '.join(parts)}."


def build_recommendations(payload: Any, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    cfg = dict(DEFAULT_CONFIG)
    if isinstance(config, dict):
        cfg.update({k: v for k, v in config.items() if k in DEFAULT_CONFIG})

    features = parse_features(payload)
    total_attempts = sum(f["attempts"] for f in features)
    model = {
        "name": "recency-weighted-kmeans-weakness-ranker",
        "version": 1,
        "supervised": False,
        "training": "none - unsupervised clustering over one learner's feature vectors",
        "weights": {
            "historyDeficit": round(1 - cfg["recencyWeight"], 4),
            "recentDeficit": cfg["recencyWeight"],
            "clusterBlend": 0.25,
        },
        "smoothing": f"Beta(prior={cfg['bayesPrior']}, k={cfg['bayesStrength']})",
        "thresholds": {
            "minAttemptsPerTopic": cfg["minAttemptsPerTopic"],
            "minTotalAttempts": cfg["minTotalAttempts"],
            "weakBelow": cfg["weakBelow"],
            "strongAbove": cfg["strongAbove"],
        },
    }

    if not features or total_attempts < cfg["minTotalAttempts"]:
        return {
            "hasEnoughData": False,
            "message": (
                "No performance data yet. Complete a few practice questions or a "
                "mock interview to receive personalized recommendations."
            ),
            "recommendations": [],
            "strongTopics": [],
            "model": model,
            "features": {"topics": len(features), "totalAttempts": total_attempts},
        }

    points = [_vector(f, cfg) for f in features]
    labels = kmeans(points, cfg["clusters"])
    proficiency = _cluster_proficiency(labels, points)
    mean_proficiency = sum(proficiency.values()) / len(proficiency)

    ranked = []
    for feature, label in zip(features, labels):
        if feature["attempts"] < cfg["minAttemptsPerTopic"]:
            continue
        cluster_deficit = _clamp(mean_proficiency - proficiency.get(label, mean_proficiency))
        score = _priority(feature, cluster_deficit, cfg)
        if score > 0:
            ranked.append((score, feature))
    ranked.sort(key=lambda item: (-item[0], -item[1]["attempts"], item[1]["topic"]))

    recommendations = []
    for score, feature in ranked[: cfg["maxRecommendations"]]:
        presentation = DOMAIN_PRESENTATION.get(feature["domain"], FALLBACK_PRESENTATION)
        accuracy_pct = round(smoothed_accuracy(feature["solved"], feature["attempts"], cfg) * 100)
        recommendations.append({
            "title": presentation["title"].format(topic=feature["topic"]),
            "domain": feature["domain"],
            "category": feature["domain"],
            "topic": feature["topic"],
            "reason": _reason(feature, accuracy_pct),
            "priority": _priority_label(score),
            "priorityScore": score,
            "action": presentation["action"].format(topic=feature["topic"]),
            "path": presentation["path"],
            "evidence": {
                "attempts": feature["attempts"],
                "solved": feature["solved"],
                "smoothedAccuracy": accuracy_pct,
                "recentAccuracy": round(feature["recentAccuracy"]),
                "recentAttempts": feature["recentAttempts"],
                "trend": round(feature["trend"]),
            },
        })

    strong = []
    for feature in features:
        accuracy = smoothed_accuracy(feature["solved"], feature["attempts"], cfg)
        if accuracy >= cfg["strongAbove"] and feature["attempts"] >= cfg["minAttemptsPerTopic"]:
            strong.append({
                "topic": feature["topic"],
                "domain": feature["domain"],
                "accuracy": round(accuracy * 100),
                "attempts": feature["attempts"],
            })
    strong.sort(key=lambda item: -item["accuracy"])

    return {
        "hasEnoughData": True,
        "message": None,
        "recommendations": recommendations,
        "strongTopics": strong,
        "model": model,
        "features": {
            "topics": len(features),
            "totalAttempts": total_attempts,
            "domains": sorted({f["domain"] for f in features}),
        },
    }