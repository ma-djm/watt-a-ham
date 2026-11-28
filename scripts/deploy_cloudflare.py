"""Stage clean production static assets and deploy to Cloudflare Pages (`watt-a-ham`)."""
import os
import shutil
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_NAME = "watt-a-ham"

RUNTIME_FILES = [
    "index.html",
    "style.css",
    "app.js",
    "data.js",
    "manifest.json",
    "sw.js",
    "icon.svg",
    "LICENSE",
    "NOTICE",
]

HEADERS_FILE = """/sw.js
  Cache-Control: public, max-age=0, must-revalidate

/index.html
  Cache-Control: public, max-age=0, must-revalidate
"""


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="watt-a-ham-cf-") as stage_dir:
        for rel in RUNTIME_FILES:
            src = os.path.join(ROOT, rel)
            if not os.path.exists(src):
                raise FileNotFoundError(f"Missing runtime file: {src}")
            shutil.copy2(src, os.path.join(stage_dir, rel))

        photos_src = os.path.join(ROOT, "assets", "photos")
        photos_dst = os.path.join(stage_dir, "assets", "photos")
        shutil.copytree(photos_src, photos_dst)

        with open(os.path.join(stage_dir, "_headers"), "w", encoding="utf-8", newline="\n") as f:
            f.write(HEADERS_FILE)

        wrangler_bin = shutil.which("wrangler.cmd") or shutil.which("wrangler")
        if not wrangler_bin:
            raise RuntimeError("wrangler CLI not found on PATH.")

        cmd = [
            wrangler_bin,
            "pages",
            "deploy",
            stage_dir,
            "--project-name",
            PROJECT_NAME,
            "--branch",
            "main",
            "--commit-dirty=true",
        ]
        print("Deploying clean static bundle to Cloudflare Pages...")
        subprocess.run(cmd, cwd=ROOT, check=True)


if __name__ == "__main__":
    main()
