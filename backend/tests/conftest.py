"""Pytest configuration and shared fixtures."""

import os
import sys
from typing import Generator
import pytest
from fastapi.testclient import TestClient

# Ensure both backend dir and repo root are in python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
repo_root = os.path.abspath(os.path.join(backend_dir, ".."))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

from app.main import app


@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    """Test client fixture for making requests to FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client
