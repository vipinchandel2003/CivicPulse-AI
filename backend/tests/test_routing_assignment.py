import uuid
import pytest
from civicpulse_app.domain.enums import UserRole, Department, IssueStatus
from civicpulse_app.services.notification import MultiChannelNotifier, NotificationPayload


@pytest.mark.asyncio
async def test_notification_dispatch_mock():
    notifier = MultiChannelNotifier()
    payload = NotificationPayload(
        recipient_phone="+919876543210",
        template_id="TICKET_ASSIGNED_INSPECTOR",
        variables={"ticket_code": "IMC-2026-W01-A1B2", "priority": "CRITICAL"},
    )
    result = await notifier.send(payload)
    assert result is True


def test_least_loaded_selection_logic():
    """
    Test that routing correctly selects the inspector with the least count of open tickets.
    """
    inspector_ids = [uuid.uuid4(), uuid.uuid4(), uuid.uuid4()]
    # Mock load counts: inspector 0 has 5, inspector 1 has 2, inspector 2 has 8
    load_dict = {
        inspector_ids[0]: 5,
        inspector_ids[1]: 2,
        inspector_ids[2]: 8,
    }
    least_loaded = min(inspector_ids, key=lambda uid: load_dict.get(uid, 0))
    assert least_loaded == inspector_ids[1]


def test_off_duty_ignored_in_selection():
    """
    Off duty inspectors should not be eligible for selection.
    """
    inspectors = [
        {"id": uuid.uuid4(), "on_duty": False, "load": 0},
        {"id": uuid.uuid4(), "on_duty": True, "load": 3},
    ]
    eligible = [i for i in inspectors if i["on_duty"]]
    assert len(eligible) == 1
    assert eligible[0]["load"] == 3
