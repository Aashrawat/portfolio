# HackerRank Orchestrate Agent

This is a deterministic, terminal-based Python agent for the Multi-Domain Support Triage Challenge.

## Approach

- Loads only the local Markdown support corpus from `data/`.
- Uses lightweight lexical retrieval over local documents to find relevant guidance.
- Applies explicit escalation rules for high-risk cases such as account access, billing/refunds, fraud, security vulnerabilities, hiring decisions, and broad live outages.
- Writes predictions to `support_tickets/output.csv`.

No network calls or model APIs are used.

## Run

From the repository root:

```powershell
py code\main.py
```

The script reads:

```text
support_tickets/support_tickets.csv
```

and writes:

```text
support_tickets/output.csv
```

## Files

- `main.py`: evaluator entry point.
- `agent.py`: retrieval, classification, escalation, and response generation.
