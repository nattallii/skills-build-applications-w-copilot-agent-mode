# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route components responsible for rendering and form state; use the shared API client for relative `/api` requests and show accessible loading, empty, and error states.
- Logic tier decision: Keep HTTP validation and status-code decisions in Express routes, and put activity scoring, aggregation, and recommendation rules in the service layer.
- Data tier decision: Enforce required fields and defaults in Mongoose schemas. Seed canonical fixtures with idempotent upserts that preserve unrelated users, teams, activities, and workouts.
- Activity tracking approach: Validate ID shape and confirm the referenced user and team exist before writing. Compute points server-side at one point per minute and set `occurredAt` on the server.
- Team management approach: Require a name, retain the submitted mascot, default members to an empty array, and store member references as user IDs.
- Leaderboard approach: Sum activity points by team, sort totals highest first, and return each team name, total, and sequential 1-based rank.
- Workout suggestions approach: Look up the user by email, use their fitness goal and recent activity to prioritize matching workouts, and include a concise reason; return a 4xx when no user matches.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` - a failure means a schema requirement/default or the repeatable, additive seed contract is broken. Current baseline: fails.
- API command: `npm run test:api --prefix octofit-tracker/backend` - a failure means a route violates its response contract, including invalid references not receiving a deliberate 4xx. Current baseline: fails.
- Frontend command: `npm test --prefix octofit-tracker/frontend` - a failure means API content or an accessible loading, empty, or error state is missing. Current baseline: fails (15 tests failed).
- Backend build command: `npm run build --prefix octofit-tracker/backend` - a failure means the backend does not type-check. Current baseline: passes.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` - a failure means the frontend does not type-check or bundle. Current baseline: passes.
