"""
Unit tests for authentication API endpoints
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.unit
@pytest.mark.auth
class TestAuthenticationAPI:
    """Test authentication endpoints."""

    def test_register_success(self, client: TestClient, sample_user_data, clean_db):
        """Test successful user registration."""
        response = client.post("/api/register", json=sample_user_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data or "data" in data
        # Handle different response formats
        if "data" in data:
            assert data["data"]["email"] == sample_user_data["email"]
            assert "password" not in data["data"]

    def test_login_success(self, client: TestClient, created_user, sample_user_data):
        """Test successful login."""
        login_data = {
            "email": sample_user_data["email"],
            "password": sample_user_data["password"]
        }
        
        response = client.post("/api/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "user" in data

    def test_health_check(self, client: TestClient):
        """Test basic health check endpoint."""
        response = client.get("/")
        assert response.status_code == 200
