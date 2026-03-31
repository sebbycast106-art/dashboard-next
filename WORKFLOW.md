## Git Workflow

### Commit message format
type: short summary of WHAT

WHY it was needed (the diff shows the what — you need to explain the why)

Good: `fix: bootstrap SQLite tables inline — prisma db push not available in standalone`
Bad: `update files`

### Pre-commit hook
Runs automatically before every commit. Catches TypeScript errors locally in ~5s.
Railway builds take ~3 minutes. Catching errors locally = 35x faster feedback loop.

### Mental model: commit size
One concern per commit. If you're writing "and" in the commit message, it should be two commits.
