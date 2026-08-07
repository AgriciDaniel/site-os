# Contributing to Site OS

Thanks for improving Site OS. Small, focused pull requests are easiest to
review and safest to merge.

## Before opening a pull request

1. Create a branch from `main`.
2. Keep the change scoped to one problem or feature.
3. Run `npm ci`, `npm run typecheck`, and `npm run build`.
4. If your work changes the shell or interaction behavior, also run
   `python3 verify.py` with the app running on port 3100.
5. Update documentation when behavior, setup, or public-facing copy changes.

## Design principles

- The locked one-window presentation is the default; free windows are an
  optional desktop enhancement.
- Keep every route readable without the shell.
- Use semantic color tokens instead of ad hoc component colors.
- Prefer accessible native semantics and visible keyboard focus.
- Do not add another company's source, trademark, or assets.

## Reporting bugs and proposing features

Use the repository issue forms. Include a minimal reproduction, expected
behavior, and screenshots when the issue is visual.

## Security

Do not report vulnerabilities in public issues. See [SECURITY.md](SECURITY.md).
