import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_demo_login():
    res = client.post("/api/v1/auth/login", json={
        "email": "demo@researchassist.ai",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "demo@researchassist.ai"

def test_papers_listing_authenticated():
    # Login first
    login_res = client.post("/api/v1/auth/login", json={
        "email": "demo@researchassist.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch papers
    papers_res = client.get("/api/v1/papers", headers=headers)
    assert papers_res.status_code == 200
    papers = papers_res.json()
    assert isinstance(papers, list)

def test_chat_grounded_rag():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "demo@researchassist.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Ask grounded question
    chat_res = client.post("/api/v1/chat/message", json={
        "message": "Summarize the core methodology and findings."
    }, headers=headers)
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "assistant_message" in chat_data
    assert len(chat_data["assistant_message"]["content"]) > 0

def test_paper_analysis_retrieval():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "demo@researchassist.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/papers/paper-sample-01/analysis", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "research_problem" in data
    assert "methodology" in data
    assert "objectives" in data
    assert len(data["objectives"]) > 0

def test_academic_search():
    login_res = client.post("/api/v1/auth/login", json={
        "email": "demo@researchassist.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    search_res = client.get("/api/v1/search?q=machine+learning", headers=headers)
    assert search_res.status_code == 200
    results = search_res.json()
    assert isinstance(results, list)

if __name__ == "__main__":
    print("Running API tests...")
    test_health_check()
    print("PASS: test_health_check")
    test_demo_login()
    print("PASS: test_demo_login")
    test_papers_listing_authenticated()
    print("PASS: test_papers_listing_authenticated")
    test_paper_analysis_retrieval()
    print("PASS: test_paper_analysis_retrieval")
    test_chat_grounded_rag()
    print("PASS: test_chat_grounded_rag")
    test_academic_search()
    print("PASS: test_academic_search")
    print("ALL API TESTS PASSED SUCCESSFULLY!")
