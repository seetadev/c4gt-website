"""Helpers for handling client-supplied filenames and running external converters safely."""
import os
import re
import subprocess
import uuid

TMP_DIR = "excelinterop/tmp"
COMMAND_TIMEOUT_SECONDS = 120

# Path separators, "..", control characters and shell metacharacters are not allowed in
# client-supplied filenames. Spaces, dots, dashes, parentheses, brackets, commas and non-ASCII
# letters are fine.
_FORBIDDEN_CHARS = re.compile(r"[\x00-\x1f\x7f/\\;&|`$<>\"'*?!{}~^#]")
_EXTENSION = re.compile(r"\.[A-Za-z0-9]{1,8}$")


def is_safe_filename(name):
    """True if name is a plain filename: no separators, no "..", no control/shell characters."""
    if not name or len(name) > 255 or name != name.strip():
        return False
    if name in (".", "..") or ".." in name:
        return False
    if _FORBIDDEN_CHARS.search(name):
        return False
    return os.path.basename(name) == name


def server_side_name(original, directory=TMP_DIR):
    """Return a path for storing an upload: a random name inside directory.

    Only a short alphanumeric extension of the original name is kept. The original name is never
    used to build a filesystem path or a command line; keep it for display only.
    """
    match = _EXTENSION.search(original)
    ext = match.group(0).lower() if match else ""
    return confined_path(directory, uuid.uuid4().hex + ext)


def confined_path(directory, name):
    """Join name to directory and make sure the real path stays inside directory."""
    root = os.path.realpath(directory)
    path = os.path.realpath(os.path.join(root, name))
    if os.path.commonpath([root, path]) != root or path == root:
        raise ValueError("path escapes the storage directory")
    return path


def run_command(args, timeout=COMMAND_TIMEOUT_SECONDS):
    """Run a program with an argument list (no shell). Returns (status, combined_output).

    Status is 127 if the program is not installed and 124 if it timed out, like the shell does.
    """
    try:
        proc = subprocess.run(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            errors="replace",
            timeout=timeout,
            check=False,
        )
    except FileNotFoundError:
        return 127, f"{args[0]}: command not found"
    except subprocess.TimeoutExpired:
        return 124, f"{args[0]}: timed out after {timeout}s"
    return proc.returncode, proc.stdout
