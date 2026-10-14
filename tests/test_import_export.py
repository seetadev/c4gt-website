import io
import os
import shutil
import subprocess

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIXTURES = os.path.expanduser("~/Desktop/c4gt-work/test-fixtures")
HAVE_PHP = bool(shutil.which("php")) and os.path.exists(os.path.join(ROOT, "excelinterop/vendor/autoload.php"))


@pytest.fixture(autouse=True)
def in_repo_root(monkeypatch):
    monkeypatch.chdir(ROOT)


@pytest.fixture
def spawned(monkeypatch):
    """Record every subprocess started while a request is handled."""
    calls = []
    real = subprocess.Popen

    class Recording(real):
        def __init__(self, args, *a, **kw):
            calls.append({"args": args, "shell": kw.get("shell", False)})
            super().__init__(args, *a, **kw)

    monkeypatch.setattr(subprocess, "Popen", Recording)
    return calls


def upload(client, filename, content=b"not really a workbook"):
    return client.post(
        "/import",
        data={"upload": (io.BytesIO(content), filename)},
        content_type="multipart/form-data",
    )


def test_metacharacter_filename_does_not_execute(client):
    marker = os.path.join(ROOT, "PWNED_MARKER")
    try:
        upload(client, "a.xlsx;touch PWNED_MARKER;#.xlsx")
        assert not os.path.exists(marker)
    finally:
        if os.path.exists(marker):
            os.remove(marker)


@pytest.mark.parametrize(
    "name",
    ["../../PWNED_TRAV.xlsx", "..\\..\\PWNED_TRAV.xlsx", "sub/../../PWNED_TRAV.xlsx", "/tmp/PWNED_TRAV.xlsx"],
)
def test_traversal_filename_cannot_write_outside_tmp(client, name):
    targets = [os.path.join(ROOT, "PWNED_TRAV.xlsx"), "/tmp/PWNED_TRAV.xlsx"]
    try:
        upload(client, name)
        assert not any(os.path.exists(t) for t in targets)
    finally:
        for t in targets:
            if os.path.exists(t):
                os.remove(t)


def test_uploaded_files_are_stored_in_tmp_only(client):
    tmp = os.path.join(ROOT, "excelinterop", "tmp")
    before = set(os.listdir(tmp))
    upload(client, "report.xlsx")
    assert set(os.listdir(tmp)) <= before  # nothing left behind, nothing elsewhere


def test_import_does_not_use_a_shell(client, spawned):
    upload(client, "report.xlsx")
    assert spawned, "expected the converter to be started"
    assert not any(c["shell"] for c in spawned)


def test_export_does_not_use_a_shell(client, spawned):
    client.post("/downloadfile", data={"type": "Excel2007", "content": "{}"})
    client.post("/downloadfile", data={"type": "PDF", "content": "<p>x</p>"})
    assert spawned
    assert not any(c["shell"] for c in spawned)


def test_html_to_pdf_does_not_use_a_shell(client, spawned):
    client.post("/htmltopdf", data={"action": "preview", "content": "<p>x</p>"})
    assert spawned
    assert not any(c["shell"] for c in spawned)


@pytest.mark.skipif(not HAVE_PHP, reason="needs php and composer dependencies in excelinterop/")
def test_normal_xlsx_import_still_works(client):
    path = os.path.join(FIXTURES, "invoice.xlsx")
    if not os.path.exists(path):
        pytest.skip("fixture not available")
    with open(path, "rb") as f:
        resp = upload(client, "invoice.xlsx", f.read())
    assert resp.status_code == 200
    assert b"cell:" in resp.data


def test_msc_import_still_works(client):
    resp = upload(client, "sheet.msc", b"version:1.5\ncell:A1:v:1\n")
    assert resp.status_code == 200
    assert b"cell:A1" in resp.data
