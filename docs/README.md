# docs

Shared memory for the agent team. Read only what your task needs.

| Path | What it holds | Owner |
|---|---|---|
| [PROGRESS.md](PROGRESS.md) | Current state, resume point, task status | PO only, after each batch of merges (ADR-0051) |
| [DECISIONS.md](DECISIONS.md) | ADR log, ADR-0001 to ADR-0050 | PO |
| [decisions/](decisions/) | One file per ADR, from ADR-0051 on | PO |
| [BUDGET.md](BUDGET.md) | AI credit ledger, rollups, forecast, model rates | PO only, copying each PR's row after each batch of merges (ADR-0051) |
| [LICENSES.md](LICENSES.md) | License decisions and compatibility | Fact-Checker |
| [tasks/](tasks/) | One task card per task | PO |
| `research/` | Source inventory, stack options, learning resources | Research Lead, GIS Engineer |
| `verification/` | One fact-check report per milestone | Fact-Checker |
| `design/` | Visual spec (from M3) | PO |

The plan and checkpoint status are in [../CHECKPOINTS.md](../CHECKPOINTS.md), and deferred ideas are in [../BACKLOG.md](../BACKLOG.md).
