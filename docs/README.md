# Developer documentation

This handbook describes the implementation, not a verified production infrastructure inventory. Source reviewed against baseline `a7fc45d`; changes to code must update these pages in the same PR. No live SharePoint access or deployment is implied by a diagram.

## Suggested reading order

1. [Repository README](../README.md): purpose and quick start.
2. [Development](development.md): install, local servers and verification.
3. [Architecture](architecture.md): source ownership, routes and three editable Mermaid diagrams; [offline visual overview](diagrams/architecture.html).
4. [Configuration](configuration.md): environment variables, identity and list schemas.
5. [API](api.md): request/response contracts and authorization.
6. [Operations](operations.md): content publishing, troubleshooting and known limitations.
7. [Deployment](../DEPLOYMENT_README.md): build safety, hosting and release checks.
8. [Contributing](../CONTRIBUTING.md) and [agent guidance](../AGENTS.md): review and documentation maintenance.

## Document status

The handbook above is the current-state reference. The documents below are **historical proposals**, retained for design context, not runnable specifications:

- [Multi-list source plan](member-calendar-multi-list-sources.md): a generic source registry is still proposed; current code explicitly handles two sources.
- [Event deletion plan](member-calendar-event-deletion.md): current implementation supports admin club-event deletion and reservation state changes, not the proposed generic deletion API.
- `.roo/` contains older optimization/configuration notes; verify them against current source before reuse.
- `AGENTS.md` also contains legacy statements (MSAL login, generic response wrappers, Router dispatch, full-stack Compose and `isMember()`). Use the source-backed handbook for current architecture/API/setup facts; retain its general coding discipline. Updating that protected agent-instruction file requires a separately approved edit.

## Choosing the page to update

| Change | Required review of documentation |
| --- | --- |
| Routes, UI features, local content | README, architecture route map, operations |
| Endpoint/action/response/capability | API, architecture flows, configuration and operations |
| Env variables, SharePoint fields, identity | Configuration, development/deployment examples, API |
| Build, hosting, tool versions | README commands, development and deployment |
| Component or trust-boundary changes | Architecture Mermaid diagrams and offline overview |

Documentation is part of the change, not a later follow-up. Link relevant source paths, distinguish implemented behavior from proposals and label verification gaps. Keep screenshots/data examples synthetic and never publish secrets.
