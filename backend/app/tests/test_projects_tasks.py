import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestProjects:
    async def test_create_project(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/projects",
            headers=auth_headers,
            json={"name": "Test Project", "description": "A test project", "color": "#ef4444"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Project"
        assert data["color"] == "#ef4444"
        assert data["task_count"] == 0

    async def test_list_projects(self, client: AsyncClient, auth_headers):
        await client.post("/api/projects", headers=auth_headers, json={"name": "Project 1"})
        await client.post("/api/projects", headers=auth_headers, json={"name": "Project 2"})
        response = await client.get("/api/projects", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["total"] >= 2

    async def test_update_project(self, client: AsyncClient, auth_headers):
        create_resp = await client.post(
            "/api/projects", headers=auth_headers, json={"name": "Old Name"}
        )
        pid = create_resp.json()["id"]
        response = await client.patch(
            f"/api/projects/{pid}", headers=auth_headers, json={"name": "New Name"}
        )
        assert response.status_code == 200
        assert response.json()["name"] == "New Name"

    async def test_delete_project(self, client: AsyncClient, auth_headers):
        create_resp = await client.post(
            "/api/projects", headers=auth_headers, json={"name": "To Delete"}
        )
        pid = create_resp.json()["id"]
        assert (await client.delete(f"/api/projects/{pid}", headers=auth_headers)).status_code == 204
        assert (await client.get(f"/api/projects/{pid}", headers=auth_headers)).status_code == 404


@pytest.mark.asyncio
class TestTasks:
    async def _create_project(self, client, auth_headers) -> str:
        resp = await client.post("/api/projects", headers=auth_headers, json={"name": "Task Project"})
        return resp.json()["id"]

    async def test_create_task(self, client: AsyncClient, auth_headers):
        pid = await self._create_project(client, auth_headers)
        response = await client.post(
            "/api/tasks", headers=auth_headers,
            json={"title": "My Task", "project_id": pid, "priority": "high"},
        )
        assert response.status_code == 201
        assert response.json()["priority"] == "high"

    async def test_update_task_status(self, client: AsyncClient, auth_headers):
        pid = await self._create_project(client, auth_headers)
        task = (await client.post(
            "/api/tasks", headers=auth_headers, json={"title": "To Update", "project_id": pid}
        )).json()
        response = await client.patch(
            f"/api/tasks/{task['id']}", headers=auth_headers, json={"status": "in_progress"}
        )
        assert response.json()["status"] == "in_progress"

    async def test_delete_task(self, client: AsyncClient, auth_headers):
        pid = await self._create_project(client, auth_headers)
        task = (await client.post(
            "/api/tasks", headers=auth_headers, json={"title": "To Delete", "project_id": pid}
        )).json()
        assert (await client.delete(f"/api/tasks/{task['id']}", headers=auth_headers)).status_code == 204
