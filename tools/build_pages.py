"""Build the Quadno Pages site when Cloudflare starts at the repository root."""
from pathlib import Path
from runpy import run_path
from shutil import copytree

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "quadno-site"

run_path(str(SITE / "tools" / "build_pages.py"), run_name="__main__")
copytree(SITE / "dist", ROOT / "dist", dirs_exist_ok=True)
