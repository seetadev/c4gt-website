"""Test setup: an in-memory stand-in for the S3 storage layer, so tests need no network or services."""
import json
import os
import sys
import types

import pytest

os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("APP_TITLE", "Test")
os.environ.setdefault("SQLALCHEMY_DATABASE_URI", "sqlite://")
os.environ["FLASK_DEBUG"] = "true"  # the reset link is printed instead of emailed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)


class _File:
    def __init__(self, name, data):
        self.name = name
        self.data = data


def _install_fake_storage():
    files = {}
    key = json.dumps

    fake = types.ModuleType("cloud.storage.storage")
    fake.getFile = lambda path: _File(path[-1], files[key(path)]) if key(path) in files else None
    fake.getFileRaw = lambda path: files.get(key(path))
    fake.createDir = lambda path: files.setdefault(key(path), "<dir>") and True
    fake.createFile = lambda path, data: files.__setitem__(key(path), data) or True
    fake.updateFile = lambda path, data: files.__setitem__(key(path), data) or True
    fake.deleteFile = lambda path: files.pop(key(path), None) is not None
    fake.putItem = lambda path, data, bucket_name=None: files.__setitem__(path, data) or True
    fake.getItem = lambda path, bucket_name=None: files.get(path)
    fake.existsItem = lambda path, bucket_name=None: path in files
    fake.deleteItem = lambda path, bucket_name=None: files.pop(path, None) is not None
    fake._files = files
    sys.modules["cloud.storage.storage"] = fake
    return fake


_storage = _install_fake_storage()

import main  # noqa: E402  (must come after the fake storage is installed)


@pytest.fixture
def client():
    _storage._files.clear()
    _storage._files[json.dumps(["home", "users"])] = "<dir>"
    main.app.config["TESTING"] = True
    with main.app.test_client() as c:
        yield c
