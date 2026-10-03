import json
import os
import subprocess
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from recommender import (  # noqa: E402
    DEFAULT_CONFIG,
    build_recommendations,
    kmeans,
    parse_features,
    smoothed_accuracy,
)

ML_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVICE = os.path.join(ML_DIR, "service.py")


def feature(topic, attempts, solved, recent=0, recent_acc=0, trend=0, domain="DSA", difficulty=2):
    return {
        "domain": domain,
        "topic": topic,
        "attempts": attempts,
        "solved": solved,
        "accuracy": round(solved / attempts * 100, 2) if attempts else 0,
        "recentAttempts": recent,
        "recentAccuracy": recent_acc,
        "trend": trend,
        "avgDifficulty": difficulty,
    }


class ColdStart(unittest.TestCase):
    def test_empty_payload_is_an_honest_empty_state(self):
        result = build_recommendations({})
        self.assertFalse(result["hasEnoughData"])
        self.assertEqual(result["recommendations"], [])
        self.assertIn("No performance data yet", result["message"])
        self.assertEqual(result["features"]["totalAttempts"], 0)

    def test_payload_with_features_but_too_few_attempts_stays_empty(self):
        result = build_recommendations({"features": [feature("Arrays", 1, 0)]})
        self.assertFalse(result["hasEnoughData"])
        self.assertEqual(result["recommendations"], [])

    def test_null_and_wrong_typed_payloads_do_not_raise(self):
        for payload in [None, "nope", 42, [], {"features": "bad"}, {"features": [None, 3, {}]}]:
            self.assertEqual(build_recommendations(payload)["hasEnoughData"], False)


class WeakTopic(unittest.TestCase):
    def test_weak_topic_outranks_a_strong_one(self):
        payload = {"features": [
            feature("Graphs", 10, 1, recent=3, recent_acc=0, trend=-10),
            feature("Arrays", 10, 9, recent=3, recent_acc=95, trend=5),
        ]}
        result = build_recommendations(payload)
        self.assertTrue(result["hasEnoughData"])
        self.assertEqual(result["recommendations"][0]["topic"], "Graphs")
        self.assertEqual(result["recommendations"][0]["priority"], "HIGH")

    def test_reason_and_evidence_quote_real_numbers(self):
        payload = {"features": [feature("Graphs", 10, 1, recent=3, recent_acc=0, trend=-10)]}
        top = build_recommendations(payload)["recommendations"][0]
        self.assertIn("10 attempts", top["reason"])
        self.assertIn("0%", top["reason"])
        self.assertEqual(top["evidence"]["attempts"], 10)
        self.assertEqual(top["evidence"]["solved"], 1)

    def test_a_domain_maps_to_a_real_practice_route(self):
        payload = {"features": [feature("Quantitative", 8, 2, recent=2, recent_acc=10, domain="Aptitude")]}
        top = build_recommendations(payload)["recommendations"][0]
        self.assertEqual(top["path"], "/practice/aptitude")
        self.assertIn("Quantitative", top["title"])

    def test_low_sample_topics_are_ignored(self):
        payload = {"features": [
            feature("Graphs", 1, 0),
            feature("Arrays", 12, 8, recent=4, recent_acc=60),
        ]}
        topics = [r["topic"] for r in build_recommendations(payload)["recommendations"]]
        self.assertNotIn("Graphs", topics)


class Recency(unittest.TestCase):
    def test_declining_recent_performance_raises_priority(self):
        base = {"attempts": 12, "solved": 3}
        declining = build_recommendations({"features": [
            feature("Graphs", recent=3, recent_acc=0, trend=-30, **base),
        ]})["recommendations"][0]["priorityScore"]
        improving = build_recommendations({"features": [
            feature("Graphs", recent=3, recent_acc=95, trend=30, **base),
        ]})["recommendations"][0]["priorityScore"]
        self.assertGreater(declining, improving)

    def test_recent_data_is_ignored_until_there_is_enough_of_it(self):
        single = build_recommendations({"features": [
            feature("Graphs", 12, 3, recent=1, recent_acc=0, trend=-30),
        ]})["recommendations"][0]["priorityScore"]
        historical = build_recommendations({"features": [
            feature("Graphs", 12, 3, recent=0, recent_acc=0, trend=0),
        ]})["recommendations"][0]["priorityScore"]
        self.assertEqual(single, historical)


class MultipleDomains(unittest.TestCase):
    def test_features_from_every_domain_are_ranked_together(self):
        payload = {"features": [
            feature("Graphs", 10, 1, recent=3, recent_acc=0, domain="DSA"),
            feature("Joins", 9, 2, recent=3, recent_acc=0, domain="SQL"),
            feature("Logical", 8, 1, recent=2, recent_acc=0, domain="Aptitude"),
            feature("Arrays", 20, 19, recent=5, recent_acc=95, domain="Interview"),
        ]}
        result = build_recommendations(payload)
        self.assertEqual(result["features"]["domains"], ["Aptitude", "DSA", "Interview", "SQL"])
        self.assertEqual([s["topic"] for s in result["strongTopics"]], ["Arrays"])
        self.assertEqual(len(result["recommendations"]), 4)

    def test_a_near_perfect_but_small_sample_is_not_called_strong(self):
        # 19/20 smooths to 0.875 (strong); 6/7 smooths to 0.727, which the
        # threshold correctly refuses to call strong on seven attempts.
        strong = build_recommendations({"features": [feature("Arrays", 20, 19, recent=5, recent_acc=95)]})
        thin = build_recommendations({"features": [feature("Arrays", 7, 6, recent=3, recent_acc=90)]})
        self.assertEqual([s["topic"] for s in strong["strongTopics"]], ["Arrays"])
        self.assertEqual(thin["strongTopics"], [])


class Model(unittest.TestCase):
    def test_output_declares_itself_unsupervised(self):
        model = build_recommendations({"features": [feature("Arrays", 9, 8, recent=3, recent_acc=90)]})["model"]
        self.assertFalse(model["supervised"])
        self.assertIn("unsupervised", model["training"])
        self.assertNotIn("accuracy", model)

    def test_no_fabricated_metric_fields(self):
        result = build_recommendations({"features": [feature("Arrays", 9, 8, recent=3, recent_acc=90)]})
        for rec in result["recommendations"]:
            for banned in ("confidence", "modelAccuracy", "prediction"):
                self.assertNotIn(banned, rec)

    def test_kmeans_is_deterministic_and_covers_every_point(self):
        points = [[0.1, 0.2, 0.3, 0.5], [0.15, 0.25, 0.35, 0.55], [0.9, 0.8, 0.7, 0.2], [0.85, 0.75, 0.65, 0.25]]
        first = kmeans(points, 2)
        self.assertEqual(first, kmeans(points, 2))
        self.assertEqual(len(first), len(points))
        self.assertEqual(len(set(first)), 2)

    def test_bayesian_smoothing_shrinks_toward_the_prior(self):
        self.assertAlmostEqual(smoothed_accuracy(0, 1, DEFAULT_CONFIG), 0.4, places=3)
        self.assertLess(smoothed_accuracy(0, 100, DEFAULT_CONFIG), 0.1)
        self.assertGreater(smoothed_accuracy(90, 100, DEFAULT_CONFIG), 0.8)

    def test_parse_features_drops_bad_rows(self):
        parsed = parse_features({"features": [
            {"domain": "DSA", "topic": "Graphs", "attempts": "five"},
            {"domain": "DSA"},
            "garbage",
            {"domain": "DSA", "topic": "   "},
        ]})
        self.assertEqual(len(parsed), 1)
        self.assertEqual(parsed[0]["attempts"], 0)


class ServiceProcess(unittest.TestCase):
    def _run(self, raw):
        proc = subprocess.run([sys.executable, SERVICE], input=raw, capture_output=True, text=True, timeout=30)
        return proc.returncode, proc.stdout, proc.stderr

    def test_valid_payload_round_trips(self):
        payload = json.dumps({"features": [feature("Graphs", 10, 1, recent=3, recent_acc=0)]})
        code, out, _ = self._run(payload)
        self.assertEqual(code, 0)
        self.assertTrue(json.loads(out)["hasEnoughData"])

    def test_empty_stdin_is_handled(self):
        code, out, _ = self._run("")
        self.assertEqual(code, 0)
        self.assertFalse(json.loads(out)["hasEnoughData"])

    def test_invalid_json_exits_non_zero(self):
        code, _, err = self._run("{not json")
        self.assertEqual(code, 2)
        self.assertIn("invalid JSON", err)


if __name__ == "__main__":
    unittest.main(verbosity=2)