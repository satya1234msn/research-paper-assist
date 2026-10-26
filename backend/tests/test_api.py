import pytest
import httpx

BASE_URL = "http://127.0.0.1:8000"

def test_health_check():
    res = httpx.get(f"{BASE_URL}/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_demo_login():
    res = httpx.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "demo@researchassist.ai",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "demo@researchassist.ai"

def test_papers_listing_authenticated():
    # Login first
    login_res = httpx.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "demo@researchassist.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch papers
    papers_res = httpx.get(f"{BASE_URL}/api/v1/papers", headers=headers)
    assert papers_res.status_code == 200
    papers = papers_res.json()
    assert len(papers) > 0

def test_chat_grounded_rag():
    login_res = httpx.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "demo@researchassist.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Ask grounded question
    chat_res = httpx.post(f"{BASE_URL}/api/v1/chat/message", json={
        "message": "Summarize the core methodology and findings."
    }, headers=headers)
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "assistant_message" in chat_data
    assert len(chat_data["assistant_message"]["content"]) > 0

def test_academic_search():
    login_res = httpx.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "demo@researchassist.ai",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    search_res = httpx.get(f"{BASE_URL}/api/v1/search?q=machine+learning", headers=headers, timeout=15.0)
    assert search_res.status_code == 200
    results = search_res.json()
    assert len(results) > 0

if __name__ == "__main__":
    print("Running API tests...")
    test_health_check()
    print("PASS: test_health_check")
    test_demo_login()
    print("PASS: test_demo_login")
    test_papers_listing_authenticated()
    print("PASS: test_papers_listing_authenticated")
    test_chat_grounded_rag()
    print("PASS: test_chat_grounded_rag")
    test_academic_search()
    print("PASS: test_academic_search")
    print("ALL API TESTS PASSED SUCCESSFULLY!")
