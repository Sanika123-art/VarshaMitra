"""Test Suite for Saarthi AI Farming Companion & Persistent Conversation Storage."""

import pytest
from fastapi.testclient import TestClient
from app.main import create_application
from app.services.chat_service import chat_service


@pytest.fixture
def client():
    app = create_application()
    return TestClient(app)


def test_create_and_list_conversations(client):
    """Verify conversation creation, auto-titling, and listing."""
    res = client.post(
        "/api/v1/chat/conversations",
        json={
            "location_id": "baramati",
            "crop_id": "soybean",
            "stage_id": "vegetative",
            "language": "en",
        },
    )
    assert res.status_code == 201
    data = res.json()
    conv_id = data["id"]
    assert conv_id.startswith("conv_")
    assert "Soybean" in data["title"] or "Baramati" in data["title"]

    # Verify listing includes the new conversation
    list_res = client.get("/api/v1/chat/conversations")
    assert list_res.status_code == 200
    convs = list_res.json()
    assert any(c["id"] == conv_id for c in convs)


def test_send_message_and_persistence(client):
    """Verify user message processing, context-aware reply, and SQLite persistence."""
    # 1. Create session
    create_res = client.post(
        "/api/v1/chat/conversations",
        json={"location_id": "baramati", "crop_id": "soybean", "language": "en"},
    )
    conv_id = create_res.json()["id"]

    # 2. Ask rainfall question
    msg_res = client.post(
        f"/api/v1/chat/conversations/{conv_id}/messages?location_id=baramati&crop_id=soybean&language=en",
        json={"content": "Will it rain this week and should I irrigate?"},
    )
    assert msg_res.status_code == 200
    msg_data = msg_res.json()
    assert msg_data["role"] == "assistant"
    assert msg_data["conversation_id"] == conv_id
    assert len(msg_data["content"]) > 20
    assert msg_data["provider_status"] in ("nugen", "engine_fallback")

    # 3. Retrieve conversation history and verify both user and assistant messages are stored
    detail_res = client.get(f"/api/v1/chat/conversations/{conv_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["message_count"] == 2
    assert detail["messages"][0]["role"] == "user"
    assert "Will it rain" in detail["messages"][0]["content"]
    assert detail["messages"][1]["role"] == "assistant"


def test_update_and_delete_conversation(client):
    """Verify renaming and deletion of individual conversations."""
    create_res = client.post(
        "/api/v1/chat/conversations",
        json={"title": "Custom Title Test"},
    )
    conv_id = create_res.json()["id"]

    # Rename
    patch_res = client.patch(
        f"/api/v1/chat/conversations/{conv_id}",
        json={"title": "Renamed Farm Consultation"},
    )
    assert patch_res.status_code == 200

    detail = client.get(f"/api/v1/chat/conversations/{conv_id}").json()
    assert detail["title"] == "Renamed Farm Consultation"

    # Delete
    del_res = client.delete(f"/api/v1/chat/conversations/{conv_id}")
    assert del_res.status_code == 200

    get_del = client.get(f"/api/v1/chat/conversations/{conv_id}")
    assert get_del.status_code == 404

