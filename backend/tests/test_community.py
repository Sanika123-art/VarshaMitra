"""Tests for farmer community feedback endpoints."""

from pathlib import Path

from fastapi.testclient import TestClient

from app.services.dataset.storage import dataset_storage


def test_feedback_can_be_posted_and_listed(client: TestClient, monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(dataset_storage, "_db_path", tmp_path / "feedback.sqlite")

    created = client.post(
        "/api/v1/community/feedback",
        json={
            "display_name": "शेतकरी मित्र",
            "district": "सिंधुदुर्ग",
            "taluka": "मालवण",
            "rating": "slightly_high",
            "message": "पावसाचा अंदाज जवळपास होता, पण प्रमाण थोडे जास्त वाटले.",
        },
    )

    assert created.status_code == 201
    data = created.json()
    assert data["district"] == "सिंधुदुर्ग"
    assert data["rating"] == "slightly_high"
    assert "phone" not in data

    listed = client.get("/api/v1/community/feedback")
    assert listed.status_code == 200
    assert listed.json()["items"][0]["id"] == data["id"]


def test_feedback_rejects_mobile_numbers(client: TestClient, monkeypatch, tmp_path: Path) -> None:
    monkeypatch.setattr(dataset_storage, "_db_path", tmp_path / "no-phone.sqlite")

    response = client.post(
        "/api/v1/community/feedback",
        json={
            "district": "Sindhudurg",
            "rating": "helpful",
            "message": "Call me on 9876543210 for more information.",
        },
    )

    assert response.status_code == 422


def test_feedback_rejects_unexpected_contact_fields(client: TestClient) -> None:
    response = client.post(
        "/api/v1/community/feedback",
        json={
            "district": "Sindhudurg",
            "rating": "helpful",
            "message": "This was useful to me and my family.",
            "phone_number": "9876543210",
        },
    )

    assert response.status_code == 422
