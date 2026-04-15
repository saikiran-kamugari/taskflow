import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestAuth:
    async def test_register_success(self, client: AsyncClient):
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "new@example.com",
                "username": "newuser",
                "password": "securepass123",
                "full_name": "New User",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_register_duplicate_email(self, client: AsyncClient, test_user):
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "different",
                "password": "securepass123",
                "full_name": "Dup User",
            },
        )
        assert response.status_code == 409

    async def test_register_weak_password(self, client: AsyncClient):
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "weak@example.com",
                "username": "weakuser",
                "password": "short",
                "full_name": "Weak User",
            },
        )
        assert response.status_code == 422

    async def test_login_success(self, client: AsyncClient, test_user):
        response = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "testpass123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    async def test_login_wrong_password(self, client: AsyncClient, test_user):
        response = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "wrongpass"},
        )
        assert response.status_code == 401

    async def test_get_me(self, client: AsyncClient, auth_headers):
        response = await client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["username"] == "testuser"

    async def test_get_me_unauthorized(self, client: AsyncClient):
        response = await client.get("/api/auth/me")
        assert response.status_code == 403

    async def test_update_me(self, client: AsyncClient, auth_headers):
        response = await client.patch(
            "/api/auth/me",
            headers=auth_headers,
            json={"full_name": "Updated Name"},
        )
        assert response.status_code == 200
        assert response.json()["full_name"] == "Updated Name"

    async def test_refresh_token(self, client: AsyncClient, test_user):
        login_resp = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "testpass123"},
        )
        refresh = login_resp.json()["refresh_token"]

        response = await client.post(
            "/api/auth/refresh", json={"refresh_token": refresh}
        )
        assert response.status_code == 200
        assert "access_token" in response.json()
