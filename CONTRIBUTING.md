# Contributing

[README](README.md) · [Developer handbook](docs/README.md) · [Agent guidelines](AGENTS.md)

## Scope and safety

Start a focused branch from the current default branch (`master`). Keep unrelated refactors/dependency upgrades out of feature or documentation PRs. Preserve existing contracts unless the PR explicitly documents a breaking change. Never commit secrets, copied production member data or generated `dist/` files. Use test identities and disposable SharePoint items for integration tests.

## Documentation is part of every change

For **every repository update**, review README and the relevant handbook pages in the same PR. Do not leave inaccurate docs for a later task.

- Feature/route changes: update README, route/source map and operations guidance.
- API/auth changes: update actions, examples, response/status shapes, capabilities and security boundaries.
- Configuration/SharePoint changes: update variable names, precedence, internal field mappings and setup/deployment examples.
- Build/deployment changes: update prerequisites, commands, hosting assumptions and safety warnings.
- Architecture/flow changes: update Mermaid diagrams in `docs/architecture.md` and `docs/diagrams/architecture.html` together.
- If README or a document remains correct, state **why no edit is necessary** in the PR. Do not make cosmetic changes merely to tick a box.

Current-state docs live in the handbook. Clearly label proposals/historical notes and do not present their API/configuration sketches as implemented behavior. Use synthetic examples and source paths, not copied secrets or real member identities.

## Verification

Follow [Development](docs/development.md) and the [build-environment warning](DEPLOYMENT_README.md#build-environment-warning). Run lint and a safe isolated build for code changes; lint changed PHP when available. For integrations, record the test environment and actual behavior without exposing credentials. Never claim Graph/login/runtime verification solely from a Vite build. No application tests/CI are currently tracked; describe manual checks and gaps honestly.

For documentation changes, verify relative links/anchors, named source files, configuration/action names and diagram rendering. Review the README and deployment instructions for conflicting older guidance.

## Pull request checklist

Use the repository PR template. Summarize what changed and why, actual verification, documentation impact and risks/untested paths. Do not merge until the maintainer has reviewed; publishing a branch/PR is not approval or deployment.
