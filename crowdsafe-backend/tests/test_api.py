import os
import pytest


def test_env_present_or_skip():
    if not os.getenv('FIREBASE_CREDENTIALS'):
        pytest.skip('No Firebase credentials provided; skipping integration tests')


def test_alerts_active_endpoint():
    # Only run when credentials exist
    if not os.getenv('FIREBASE_CREDENTIALS'):
        pytest.skip('No Firebase credentials provided; skipping integration tests')

    from app import app

    client = app.test_client()
    res = client.get('/api/alerts/active')
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, dict)
    assert 'success' in data
