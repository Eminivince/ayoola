---
year: Aug 2024
title: State Machines as Contracts
desc: Why deterministic state management and legal drafting are the same intellectual problem.
italic: false
also_in: engineering
---

A well-drafted contract is a state machine in prose. It enumerates the parties,
the events that move them between states, and the obligations that fire on each
transition. The work of drafting is the work of finding the edges nobody asked
about — the cases where the machine could deadlock, double-spend, or accept a
malformed input.

## The shared discipline

What lawyers call _force majeure_, engineers call exception handling. What
lawyers call _conditions precedent_, engineers call guards. The vocabularies
differ; the underlying problem is the same: define every reachable state and
specify the transition function exhaustively.

> "The exhaustive enumeration of cases is the most laborious part of legal
> drafting, and the most laborious part of distributed-systems design." — me,
> probably

A few patterns translate cleanly between the two:

- **Idempotency clauses** map to retry-safe handlers.
- **Severability** is graceful degradation.
- **Choice-of-forum** is the dispatcher routing rule.

## Where the analogy breaks

Contracts are interpreted by humans with discretion. State machines are
interpreted by compilers without it. The lawyer's craft is partly knowing how
much ambiguity to leave on the page; the engineer's craft is partly knowing
how to remove it entirely.

Both disciplines reward the same temperament: a tolerance for tedious
case-analysis and a refusal to let edge cases be someone else's problem.

---

_Draft. Replace this body with the full piece._
