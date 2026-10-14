import re
import time

import pytest

PW = "original-password"
NEW = "attacker-chosen-password"


def register(client, email, password=PW):
    client.post("/register", data={"email": email, "password": password})


def can_login(client, email, password):
    resp = client.post("/login", data={"email": email, "password": password})
    return resp.headers.get("Location", "").endswith("/save")


def request_reset(client, email, capsys):
    capsys.readouterr()
    client.post("/lostpw", data={"email": email})
    out = capsys.readouterr().out
    link = re.search(r"/pwreset\?u=\S+", out).group(0)
    return re.search(r"[?&]d=([^&\s]+)", link).group(1)


def test_reset_without_token_does_not_change_password(client):
    register(client, "a@example.test")
    client.post("/pwreset", data={"email": "a@example.test", "password": NEW})
    assert not can_login(client, "a@example.test", NEW)
    assert can_login(client, "a@example.test", PW)


def test_reset_with_wrong_or_empty_token_does_not_change_password(client, capsys):
    register(client, "a@example.test")
    request_reset(client, "a@example.test", capsys)
    for bad in ["", "bogus", "A" * 43]:
        client.post("/pwreset", data={"email": "a@example.test", "password": NEW, "token": bad})
    assert not can_login(client, "a@example.test", NEW)
    assert can_login(client, "a@example.test", PW)


def test_valid_token_resets_password(client, capsys):
    register(client, "a@example.test")
    token = request_reset(client, "a@example.test", capsys)
    page = client.get(f"/pwreset?u=a@example.test&d={token}")
    assert page.status_code == 200
    resp = client.post("/pwreset", data={"email": "a@example.test", "password": NEW, "token": token})
    assert resp.status_code == 200
    assert can_login(client, "a@example.test", NEW)
    assert not can_login(client, "a@example.test", PW)


def test_token_is_single_use(client, capsys):
    register(client, "a@example.test")
    token = request_reset(client, "a@example.test", capsys)
    client.post("/pwreset", data={"email": "a@example.test", "password": NEW, "token": token})
    client.post("/pwreset", data={"email": "a@example.test", "password": "third-password", "token": token})
    assert can_login(client, "a@example.test", NEW)
    assert not can_login(client, "a@example.test", "third-password")


def test_expired_token_is_rejected(client, capsys, monkeypatch):
    register(client, "a@example.test")
    token = request_reset(client, "a@example.test", capsys)
    real = time.time
    monkeypatch.setattr(time, "time", lambda: real() + 2 * 60 * 60)
    resp = client.post("/pwreset", data={"email": "a@example.test", "password": NEW, "token": token})
    assert resp.status_code != 200
    monkeypatch.undo()
    assert not can_login(client, "a@example.test", NEW)
    assert can_login(client, "a@example.test", PW)


def test_token_is_tied_to_the_user_it_was_issued_to(client, capsys):
    register(client, "alice@example.test")
    register(client, "bob@example.test")
    alice_token = request_reset(client, "alice@example.test", capsys)
    request_reset(client, "bob@example.test", capsys)
    client.post("/pwreset", data={"email": "bob@example.test", "password": NEW, "token": alice_token})
    assert not can_login(client, "bob@example.test", NEW)
    assert can_login(client, "bob@example.test", PW)


def test_unknown_user_cannot_be_reset(client):
    resp = client.post("/pwreset", data={"email": "nobody@example.test", "password": NEW, "token": "x"})
    assert resp.status_code != 200


def test_reset_page_rejects_invalid_token(client, capsys):
    register(client, "a@example.test")
    request_reset(client, "a@example.test", capsys)
    page = client.get("/pwreset?u=a@example.test&d=bogus")
    assert b'name="password"' not in page.data
