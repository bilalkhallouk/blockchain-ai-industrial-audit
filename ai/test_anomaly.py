import unittest

from ai.anomaly import score_event, score_entries


class AnomalyScoringTests(unittest.TestCase):
    def test_flags_suspicious_login(self):
        alert = score_event(
            {
                "timestamp": "2026-05-15T03:00:00Z",
                "userId": "maintenance_ext_01",
                "userRole": "contractor",
                "action": "LOGIN",
                "assetId": "scada-main-01",
                "assetType": "SCADA",
                "sourceIp": "203.0.113.77",
                "severity": "critical",
                "metadata": {},
            }
        )

        self.assertTrue(alert["anomalous"])
        self.assertEqual(alert["level"], "critical")
        self.assertGreaterEqual(alert["score"], 75)
        self.assertTrue(any("outside normal working hours" in reason for reason in alert["reasons"]))

    def test_accepts_normal_login(self):
        alert = score_event(
            {
                "timestamp": "2026-05-15T10:00:00Z",
                "userId": "bilal.khallouk",
                "userRole": "engineer",
                "action": "LOGIN",
                "assetId": "scada-main-01",
                "assetType": "SCADA",
                "sourceIp": "10.10.10.15",
                "severity": "low",
                "metadata": {},
            }
        )

        self.assertFalse(alert["anomalous"])
        self.assertEqual(alert["score"], 0)

    def test_scores_blockchain_entries(self):
        result = score_entries(
            [
                {
                    "event": {
                        "eventId": "evt-001",
                        "timestamp": "2026-05-15T03:00:00Z",
                        "userId": "maintenance_ext_01",
                        "userRole": "contractor",
                        "action": "LOGIN",
                        "assetId": "scada-main-01",
                        "assetType": "SCADA",
                        "sourceIp": "203.0.113.77",
                        "severity": "critical",
                        "metadata": {},
                    }
                }
            ]
        )

        self.assertEqual(result["count"], 1)
        self.assertEqual(len(result["anomalies"]), 1)


if __name__ == "__main__":
    unittest.main()
