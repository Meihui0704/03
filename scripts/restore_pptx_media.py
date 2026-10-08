#!/usr/bin/env python3
"""Restore corrupt media binaries in the EN deck from the original Chinese PPTX.
Does not change slide XML, text, or layout — media bytes only.
"""
from __future__ import annotations

import shutil
import zipfile
from collections import defaultdict
from pathlib import Path

USER = Path("/Users/meihui/Downloads/202603_EN_clean_v2.pptx")
ORIG = Path("/Users/meihui/Downloads/202603昭昭.pptx")
OUT = Path("/Users/meihui/Downloads/202603_EN_fixed_images.pptx")
TMP = Path("/Users/meihui/Downloads/202603_EN_fixed_images.pptx.tmp")

# Same-size collision on slide 38: map by relationship order (pos 5 / pos 8).
MANUAL = {
    "ppt/media/image178.png": "ppt/media/image183.png",
    "ppt/media/image203.png": "ppt/media/image208.png",
}


def kind(data: bytes) -> str:
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "PNG"
    if data[:2] == b"\xff\xd8":
        return "JPEG"
    if b"<svg" in data[:120]:
        return "SVG"
    return "BAD"


def copy_info(info: zipfile.ZipInfo) -> zipfile.ZipInfo:
    out = zipfile.ZipInfo(filename=info.filename, date_time=info.date_time)
    out.compress_type = info.compress_type
    out.external_attr = info.external_attr
    return out


def main() -> None:
    orig_data: dict[str, bytes] = {}
    orig_by_size: dict[int, list[str]] = defaultdict(list)
    with zipfile.ZipFile(ORIG) as orig:
        for name in orig.namelist():
            if name.startswith("ppt/media/"):
                blob = orig.read(name)
                orig_data[name] = blob
                orig_by_size[len(blob)].append(name)

    replaced = 0
    unresolved: list[tuple[str, int]] = []
    still_bad = 0

    with zipfile.ZipFile(USER, "r") as zin, zipfile.ZipFile(TMP, "w") as zout:
        for info in zin.infolist():
            data = zin.read(info.filename)
            name = info.filename
            if name.startswith("ppt/media/image") and kind(data) == "BAD":
                replacement = None
                if name in MANUAL:
                    replacement = orig_data[MANUAL[name]]
                else:
                    cands = [
                        x
                        for x in orig_by_size.get(len(data), [])
                        if kind(orig_data[x]) != "BAD"
                    ]
                    if len(cands) == 1:
                        replacement = orig_data[cands[0]]
                if replacement is not None:
                    data = replacement
                    replaced += 1
                else:
                    unresolved.append((name, len(data)))
            if name.startswith("ppt/media/") and kind(data) == "BAD":
                still_bad += 1
            zout.writestr(copy_info(info), data)

    TMP.replace(OUT)
    print("replaced corrupt images:", replaced)
    print("unresolved:", unresolved)
    print("remaining BAD media entries:", still_bad)
    print("output:", OUT, "size_mb:", round(OUT.stat().st_size / 1048576, 1))


if __name__ == "__main__":
    main()
