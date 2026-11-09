# North central merge checkpoint

PR49 merged as dda4eb93eee0627525d36d932f514fe3aa8f04bd after final GitHub Actions run42655160880 passed (104 Node,71 Python tests). Adds eight controlled native tiles,131072 cells; atlas509 tiles/8339456 height-specific cells. Existing provenance, exact seed and older-Xbox caveats retained. No full-world generator claim.

Live verification attempted against75 files including all57 overview pages. It did NOT pass: catalog returned prior release bytes and some new revision PNGs returned404 during the check. Do not describe deployment as verified. Next run: inspect Pages deployment status and rerun verify-live-release.py from current main; if mismatch persists diagnose publishing before acquiring more coverage. No user input currently required.
