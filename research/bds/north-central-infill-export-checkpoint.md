# North central strict export checkpoint

Persisted eight dense native tiles, control and manifest from the committed complete native evidence. Strict importer accepted 131,072 new cells and 16,384 control cells with no partial rows. Added regression validation reproducing every exported byte, checking determinism, exact seed and rejection of wrong-seed settings. Canonical gzip is reproducible from committed gzip-base64 evidence; persist it during atlas integration.

No atlas registration or publication yet. Next: register manifest in build-checked-tiles.mjs, rebuild catalog and every overview page, adjust aggregate counts, add continuous loading test, run Node/Python/CI and verify deployment after merge. Current published atlas remains 501 tiles. Source 1.26.61.1 versus Xbox target 26.60 and older-chunk caveats remain. Full-world generation unresolved.
