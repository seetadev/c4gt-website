import os

import pytest

from route_handlers import safe_exec


@pytest.mark.parametrize(
    "name",
    ["", ".", "..", "../x.xlsx", "a/b.xlsx", "a\\b.xlsx", "/etc/passwd", "a..b.xlsx", "x.xlsx;touch y", "x.xlsx|id",
     "x$(id).xlsx", "x`id`.xlsx", "x&y.xlsx", "x>y.xlsx", "x\n.xlsx", "x\x00.xlsx", "x'y.xlsx", 'x"y.xlsx', " lead.xlsx", "a" * 300],
)
def test_unsafe_filenames_are_rejected(name):
    assert not safe_exec.is_safe_filename(name)


@pytest.mark.parametrize("name", ["invoice.xlsx", "10-Year plan (v2).xls", "customers.csv", "sheet.msc", "Bericht_äö.xlsx"])
def test_ordinary_filenames_are_accepted(name):
    assert safe_exec.is_safe_filename(name)


def test_server_side_name_is_inside_directory_and_ignores_original(tmp_path):
    path = safe_exec.server_side_name("evil name;rm.XLSX", directory=str(tmp_path))
    assert os.path.dirname(path) == str(tmp_path.resolve())
    assert path.endswith(".xlsx") and ";" not in path and " " not in path


def test_confined_path_rejects_escape_and_symlinks(tmp_path):
    root = tmp_path / "root"
    root.mkdir()
    (tmp_path / "outside.txt").write_text("x")
    os.symlink(tmp_path / "outside.txt", root / "link.txt")
    for bad in ["../outside.txt", "link.txt", ".", "a/../../outside.txt"]:
        with pytest.raises(ValueError):
            safe_exec.confined_path(str(root), bad)
    assert safe_exec.confined_path(str(root), "ok.txt").startswith(str(root.resolve()))


def test_run_command_does_not_interpret_shell_syntax(tmp_path):
    marker = tmp_path / "marker"
    status, out = safe_exec.run_command(["echo", f"hello; touch {marker}"])
    assert status == 0 and "hello;" in out
    assert not marker.exists()


def test_run_command_reports_missing_program_and_timeout():
    assert safe_exec.run_command(["definitely-not-installed-xyz"])[0] == 127
    assert safe_exec.run_command(["sleep", "5"], timeout=0.2)[0] == 124
