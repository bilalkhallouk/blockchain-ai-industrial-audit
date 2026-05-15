import unittest

from agent import build_event


class AgentEventTests(unittest.TestCase):
    def test_builds_suspicious_login_event(self):
        event = build_event("suspicious-login")

        self.assertEqual(event["action"], "LOGIN")
        self.assertEqual(event["severity"], "critical")
        self.assertEqual(event["timestamp"], "2026-05-15T03:00:00Z")
        self.assertEqual(event["metadata"]["demoScenario"], "Suspicious login at 03:00 from unknown IP")

    def test_builds_config_change_event(self):
        event = build_event("config-change")

        self.assertEqual(event["assetType"], "PLC")
        self.assertEqual(event["action"], "PLC_CONFIG_CHANGE")
        self.assertEqual(event["metadata"]["parameter"], "temperature_limit")

    def test_rejects_unknown_scenario(self):
        with self.assertRaises(ValueError):
            build_event("unknown")


if __name__ == "__main__":
    unittest.main()
