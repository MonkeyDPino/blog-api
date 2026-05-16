#!/usr/bin/env bash
# Seed the Pino Blog database with sample data.
#
# Usage:
#   ./scripts/seed.sh           # idempotent (ON CONFLICT DO NOTHING)
#   ./scripts/seed.sh --reset   # truncate all seed tables first

set -euo pipefail

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-my_blog_db}"
PGUSER="${PGUSER:-blog_user}"
export PGPASSWORD="${PGPASSWORD:-blog_password}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/apps/backend"

RESET="${1:-}"

echo "→ Generating bcrypt hashes (salt rounds: 10)…"

hash_password() {
  (
    cd "$BACKEND_DIR"
    node -e "require('bcrypt').hash('$1', 10).then(h => process.stdout.write(h))"
  )
}

ADMIN_HASH=$(hash_password 'Admin1234!')
WRITER_HASH=$(hash_password 'Writer1234!')

# Use local psql if available, otherwise pipe through the Docker container
run_psql() {
  if command -v psql >/dev/null 2>&1; then
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE"
  else
    echo "psql not found — using docker compose exec postgres …"
    docker compose -f "$REPO_ROOT/docker-compose.yml" exec -T postgres \
      psql -U "$PGUSER" -d "$PGDATABASE"
  fi
}

echo "→ Connecting to $PGUSER@$PGHOST:$PGPORT/$PGDATABASE"

if [ "$RESET" = "--reset" ]; then
  echo "→ Resetting existing seed data…"
  run_psql <<RESET_SQL
TRUNCATE posts_categories, posts, categories, users, profiles RESTART IDENTITY CASCADE;
RESET_SQL
fi

# ── Section 1: profiles + users ──────────────────────────────────────────────
# Uses <<SQL (unquoted) so $ADMIN_HASH / $WRITER_HASH are interpolated.
run_psql <<SQL

INSERT INTO profiles (first_name, last_name, avatar_url) VALUES
  ('Admin',   'Pino',     'https://i.pravatar.cc/256?img=8'),
  ('Carlos',  'Ramírez',  'https://i.pravatar.cc/256?img=12'),
  ('María',   'González', 'https://i.pravatar.cc/256?img=45'),
  ('Sofía',   'Herrera',  'https://i.pravatar.cc/256?img=44'),
  ('Andrés',  'Torres',   'https://i.pravatar.cc/256?img=67')
ON CONFLICT DO NOTHING;

INSERT INTO users (email, password, role, profile_id)
SELECT 'admin@pinoblog.com', '$ADMIN_HASH', 'admin', id
FROM profiles WHERE first_name = 'Admin' AND last_name = 'Pino'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, role, profile_id)
SELECT 'carlos@pinoblog.com', '$WRITER_HASH', 'user', id
FROM profiles WHERE first_name = 'Carlos' AND last_name = 'Ramírez'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, role, profile_id)
SELECT 'maria@pinoblog.com', '$WRITER_HASH', 'user', id
FROM profiles WHERE first_name = 'María' AND last_name = 'González'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, role, profile_id)
SELECT 'sofia@pinoblog.com', '$WRITER_HASH', 'user', id
FROM profiles WHERE first_name = 'Sofía' AND last_name = 'Herrera'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, role, profile_id)
SELECT 'andres@pinoblog.com', '$WRITER_HASH', 'user', id
FROM profiles WHERE first_name = 'Andrés' AND last_name = 'Torres'
ON CONFLICT (email) DO NOTHING;

SQL

# ── Section 2: categories + posts + vectors + junction ───────────────────────
# Uses <<'SQL' (quoted heredoc) — no shell expansion.
# Safe to use backticks, dollar signs, and any Markdown syntax.
run_psql <<'SQL'

-- ─────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────
INSERT INTO categories (name, description, cover_image) VALUES
  ('Technology',   'General technology topics and trends',        'https://picsum.photos/seed/technology2024/640/360'),
  ('JavaScript',   'JS ecosystem — runtimes, tooling, patterns',  'https://picsum.photos/seed/javascript2024/640/360'),
  ('TypeScript',   'Type-safe JavaScript development',            'https://picsum.photos/seed/typescript2024/640/360'),
  ('NestJS',       'Building scalable APIs with NestJS',          'https://picsum.photos/seed/nestjs2024/640/360'),
  ('React',        'Component-driven UIs with React',             'https://picsum.photos/seed/reactjs2024/640/360'),
  ('Next.js',      'Full-stack React with the App Router',        'https://picsum.photos/seed/nextjs2024/640/360'),
  ('DevOps',       'CI/CD, containers, cloud infrastructure',     'https://picsum.photos/seed/devops2024/640/360'),
  ('Architecture', 'System design and software architecture',     'https://picsum.photos/seed/architecture2024/640/360'),
  ('Career',       'Growth, interviews, and developer life',      'https://picsum.photos/seed/career2024/640/360'),
  ('Open Source',  'Contributing to and building OSS projects',   'https://picsum.photos/seed/opensource2024/640/360')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────
-- POSTS  (30 total — 27 published, 3 drafts)
-- ─────────────────────────────────────────────

-- ── admin@pinoblog.com ───────────────────────

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Getting Started with NestJS',
'## What is NestJS?

NestJS is a progressive Node.js framework built on top of TypeScript. It borrows concepts from Angular — modules, decorators, dependency injection — and applies them to the server side. The result is a highly structured, testable, and scalable architecture.

## Setting Up Your First Project

Install the CLI and scaffold a new project:

    npm install -g @nestjs/cli
    nest new my-api

The CLI generates a fully configured project with a root module, a controller, and a service already wired together.

## Core Building Blocks

- **Modules** — the basic unit of organization. Every feature lives in its own module.
- **Controllers** — handle incoming HTTP requests and return responses.
- **Services** — contain business logic and are injected via the constructor.
- **Guards** — protect routes based on conditions like authentication.

## Connecting to PostgreSQL with TypeORM

Add the TypeORM integration and configure it in the root module:

    npm install @nestjs/typeorm typeorm pg

Define your entities as classes decorated with `@Entity()`, and TypeORM maps them to database tables automatically.

## What You Get Out of the Box

NestJS ships with built-in support for validation pipes, exception filters, interceptors, and Swagger documentation. Things that take hours to set up in Express are a single decorator away.

> The best framework is the one that makes the right thing easy and the wrong thing hard. NestJS makes structure unavoidable — and that is a good thing.',
'A hands-on introduction to NestJS modules, controllers, services, and TypeORM.',
'https://picsum.photos/seed/nestjs-start/1200/630',
false, id FROM users WHERE email = 'admin@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'TypeScript Generics in Practice',
'## Why Generics Exist

Without generics, you face a choice: write a function for every specific type, or use `any` and lose all type safety. Generics give you a third option — write the logic once and let the caller specify the type.

## The Basics

A generic function uses a type parameter declared with angle brackets:

    function identity<T>(value: T): T {
      return value;
    }

The caller can pass `identity<string>("hello")` or let TypeScript infer it from the argument.

## Real-World Example: A Typed API Client

    async function get<T>(url: string): Promise<T> {
      const res = await fetch(url);
      return res.json() as T;
    }

    const user = await get<User>("/api/users/1");

Now `user` is typed as `User` without any `as` assertions at the call site.

## Generic Constraints

Use `extends` to restrict what types are allowed:

    function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
      return obj[key];
    }

This ensures `key` is always a valid property name of `obj`.

## Conditional Types

    type IsArray<T> = T extends any[] ? true : false;

Conditional types let you build type-level logic — entire decision trees that run at compile time, not runtime.

> Generics are not an advanced feature. They are the feature that makes every other feature composable.',
'Demystifying TypeScript generics with practical, real-world examples.',
'https://picsum.photos/seed/ts-generics/1200/630',
false, id FROM users WHERE email = 'admin@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Why I Switched from Express to NestJS',
'## Three Years with Express

Express is minimal by design — you get routing and middleware, nothing else. For small APIs that is a feature. For large teams building complex systems, it becomes a liability.

Over three years I watched our Express codebase accumulate layers of informal conventions: a `utils/` folder nobody could agree on, request validation scattered across controllers, and middleware chains that nobody fully understood.

## The Trigger

We onboarded two new engineers who spent their first week just understanding how requests flowed through the system. That was the moment I realized the problem was not the engineers — it was the lack of structure.

## What NestJS Changed

**Module boundaries** force you to declare what each feature owns and what it exposes. There is no more reaching into another feature''s internals via a shared import.

**Dependency injection** makes testing trivial. You swap real services for mocks without touching the code under test.

**Decorators** move cross-cutting concerns — validation, authentication, caching — out of business logic and into metadata.

## What I Missed About Express

Honestly, nothing critical. NestJS runs on Express under the hood and you can drop down to raw Express APIs when you need to. You do not lose flexibility — you gain guardrails.

## The Takeaway

Frameworks are not about what they let you do. They are about what they make easy and what they make you think about. NestJS makes good architecture the path of least resistance.

> Conventions are documentation that cannot go out of date.',
'A migration story: from bare Express to a structured NestJS monolith.',
'https://picsum.photos/seed/express-nest/1200/630',
false, id FROM users WHERE email = 'admin@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Designing Scalable REST APIs',
'## The Goal of API Design

A well-designed API is one your consumers never have to think about. The names make sense, the errors are helpful, and the behavior is predictable. Bad API design follows you forever — every consumer that builds on top of it inherits every mistake.

## Resource Naming

Use nouns, not verbs. The HTTP method is the verb.

- `GET /posts` — list posts
- `POST /posts` — create a post
- `GET /posts/42` — get post 42
- `PUT /posts/42` — replace post 42
- `DELETE /posts/42` — delete post 42

Avoid `/getPosts`, `/createPost`, or any other verb in the URL.

## Consistent Error Envelopes

Every error response should have the same shape:

    {
      "statusCode": 404,
      "message": "Post with ID 42 not found",
      "error": "Not Found"
    }

Clients should never have to guess the structure of an error.

## Pagination

Always paginate list endpoints. Return metadata alongside the data:

    {
      "data": [...],
      "total": 150,
      "page": 2,
      "limit": 12,
      "totalPages": 13
    }

Clients get everything they need to build navigation without extra requests.

## Versioning

Prefix your routes with a version: `/v1/posts`. When breaking changes are necessary, add `/v2/posts` and deprecate `/v1` with a sunset header. Never break existing consumers silently.

> Good API design is not about following rules. It is about respecting the people who will build on top of your work.',
'Practical patterns for building REST APIs that scale with your product.',
'https://picsum.photos/seed/rest-api-design/1200/630',
false, id FROM users WHERE email = 'admin@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'PostgreSQL Full-Text Search with TypeORM',
'## Why Not Elasticsearch?

Elasticsearch is powerful, but it is also a separate service to deploy, monitor, and keep in sync with your database. For most applications, PostgreSQL''s built-in full-text search is more than enough — and it is already running.

## The Core Primitives

PostgreSQL uses two types for full-text search:

- `tsvector` — a normalized document: words broken into lexemes, with positions and weights.
- `tsquery` — a search query: terms combined with `&` (and), `|` (or), and `!` (not).

## Setting Up the Column

Add a `tsvector` column to your posts table and populate it on write:

    ALTER TABLE posts ADD COLUMN search_vector tsvector;

    CREATE INDEX posts_search_idx ON posts USING GIN (search_vector);

The GIN index makes full-text lookups fast even on large tables.

## Keeping It in Sync

In NestJS, update the vector every time the post is created or modified:

    await this.postRepository.query(
      `UPDATE posts
       SET search_vector = to_tsvector(''english'', coalesce($1, '''') || '' '' || coalesce($2, ''''))
       WHERE id = $3`,
      [post.title, post.content, post.id]
    );

## Querying with Relevance Ranking

Use `ts_rank` to sort results by relevance:

    .where(`post.search_vector @@ to_tsquery(''english'', :q)`, { q })
    .addSelect(`ts_rank(post.search_vector, to_tsquery(''english'', :q))`, ''rank'')
    .orderBy(''rank'', ''DESC'')

> The best search engine is the one already in your database.',
'Add production-ready full-text search to NestJS using native PostgreSQL tsvector.',
'https://picsum.photos/seed/postgres-fts/1200/630',
false, id FROM users WHERE email = 'admin@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Implementing Role-Based Access Control in NestJS',
'## Beyond Authentication

Authentication answers "who are you?" Authorization answers "what are you allowed to do?" Most tutorials stop at authentication. RBAC (Role-Based Access Control) is the missing piece.

## Defining Roles

Start with a simple enum:

    export enum UserRole {
      USER = ''user'',
      ADMIN = ''admin'',
    }

Store the role in the users table as a PostgreSQL enum column.

## The @Roles() Decorator

Create a custom metadata decorator:

    export const Roles = (...roles: UserRole[]) =>
      SetMetadata(''roles'', roles);

Apply it to any controller or handler:

    @Roles(UserRole.ADMIN)
    @Delete('':id'')
    remove(@Param(''id'') id: number) { ... }

## The RolesGuard

The guard reads the metadata and checks the authenticated user''s role:

    @Injectable()
    export class RolesGuard implements CanActivate {
      constructor(private reflector: Reflector) {}

      canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get<UserRole[]>(''roles'', context.getHandler());
        if (!roles) return true;
        const { user } = context.switchToHttp().getRequest();
        return roles.includes(user.role);
      }
    }

## Register Globally

Register the guard globally in your AppModule so it applies to every route automatically. Routes without `@Roles()` are accessible to any authenticated user.

> Authorization is not a feature. It is a requirement that belongs in the foundation.',
'Build a clean RBAC system in NestJS using custom decorators and guards.',
'https://picsum.photos/seed/rbac-nestjs/1200/630',
false, id FROM users WHERE email = 'admin@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Draft: Advanced TypeORM Patterns',
'## Work in Progress

This post is still being written. Topics to cover:

- Entity listeners and subscribers
- Soft deletes with `@DeleteDateColumn`
- Tree entities for hierarchical data
- Query result caching
- Custom repositories in TypeORM 0.3+',
NULL,
'https://picsum.photos/seed/typeorm-adv/1200/630',
true, id FROM users WHERE email = 'admin@pinoblog.com' ON CONFLICT DO NOTHING;

-- ── carlos@pinoblog.com ──────────────────────

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'JavaScript Event Loop Demystified',
'## The Single-Threaded Myth

JavaScript is single-threaded, but Node.js handles thousands of concurrent connections. How? The event loop. Understanding it is the difference between writing code that works and writing code you understand.

## The Call Stack

JavaScript executes code on a call stack. Functions are pushed when called and popped when they return. Synchronous code runs to completion before anything else can happen.

## The Heap and the Queue

Objects live in the heap. Asynchronous callbacks wait in the task queue (also called the macrotask queue). The event loop''s job is simple: if the call stack is empty, take the next task from the queue and push it.

## Microtasks vs Macrotasks

Not all async operations are equal:

- **Microtasks** (`Promise.then`, `queueMicrotask`) — run after the current task, before the next macrotask.
- **Macrotasks** (`setTimeout`, `setInterval`, I/O callbacks) — run one per event loop tick.

This is why a resolved Promise always runs before a `setTimeout(fn, 0)`.

## A Concrete Example

    console.log(''1'');
    setTimeout(() => console.log(''2''), 0);
    Promise.resolve().then(() => console.log(''3''));
    console.log(''4'');
    // Output: 1, 4, 3, 2

The `setTimeout` callback is a macrotask. The Promise callback is a microtask. Microtasks run first.

## Why This Matters

Long synchronous operations block the event loop. That `for` loop processing 10 million records? Nothing else runs until it finishes — no I/O, no timers, no user requests. Move heavy work to worker threads or break it into chunks.

> The event loop is not magic. It is a while loop that checks a queue.',
'A visual walkthrough of the JavaScript event loop, microtasks, and macrotasks.',
'https://picsum.photos/seed/event-loop/1200/630',
false, id FROM users WHERE email = 'carlos@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Async/Await Under the Hood',
'## What async/await Really Is

`async`/`await` is syntactic sugar. Under the hood it compiles to generator functions and Promises. Understanding the de-sugared form helps you reason about execution order and debug confusing behavior.

## The Generator Model

Before `async`/`await`, JavaScript had generators — functions that can pause and resume:

    function* gen() {
      const x = yield fetchSomething();
      return x + 1;
    }

An async function is essentially a generator that knows how to resume itself when a Promise resolves.

## Execution Order

    async function main() {
      console.log(''A'');
      await delay(100);
      console.log(''B'');
    }
    console.log(''C'');
    main();
    console.log(''D'');
    // A, C, D, B

`await` suspends the function but does not block the thread. Execution continues at the call site, and `B` runs only after the microtask queue is drained.

## Common Pitfall: Sequential vs Parallel

    // Sequential — takes 2 seconds
    const a = await fetchA();
    const b = await fetchB();

    // Parallel — takes 1 second
    const [a, b] = await Promise.all([fetchA(), fetchB()]);

If two operations are independent, never await them sequentially.

## Error Handling

Unhandled rejections in async functions are silent in some environments. Always use `try/catch` or chain `.catch()`:

    const result = await fetchData().catch(() => null);

> async/await did not change how JavaScript works. It changed how it reads.',
'What actually happens when you write async/await — the generator-based mental model explained.',
'https://picsum.photos/seed/async-await/1200/630',
false, id FROM users WHERE email = 'carlos@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Tree-Shaking and Bundle Optimization',
'## What Is Tree-Shaking?

Tree-shaking is dead code elimination at the module level. Bundlers like Webpack and Rollup analyze your import graph and remove exports that are never used. The name comes from "shaking the dependency tree" to make dead leaves fall.

## Why It Only Works with ES Modules

Tree-shaking requires static analysis — the bundler must know at build time which exports are used. CommonJS `require()` is dynamic, so the bundler cannot know. ES Module `import` is static, so it can.

    // CommonJS — not tree-shakeable
    const _ = require(''lodash'');

    // ES Modules — tree-shakeable
    import { debounce } from ''lodash-es'';

## Side Effects

If a module has side effects (modifying globals, running code on import), the bundler must keep it even if nothing is imported. Mark side-effect-free packages in `package.json`:

    { "sideEffects": false }

## Auditing Your Bundle

Use `source-map-explorer` to visualize what is in your production bundle:

    npx source-map-explorer dist/*.js

You will often find entire libraries included for a single utility function.

## Practical Wins

- Replace `import _ from ''lodash''` with specific imports from `lodash-es`
- Use `date-fns` instead of `moment` (tree-shakeable by design)
- Avoid barrel files (`index.ts` that re-exports everything) — they defeat tree-shaking

> Every kilobyte you ship is a kilobyte your user has to download. Respect their time.',
'Write bundle-friendly JavaScript and cut your production payload in half.',
'https://picsum.photos/seed/tree-shaking/1200/630',
false, id FROM users WHERE email = 'carlos@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Writing Clean Code in JavaScript',
'## What Clean Code Actually Means

Clean code is not about aesthetics. It is about reducing the cognitive load on the next person who reads it — and that person is usually you, six months later.

## Name Things Honestly

A function named `handleData` could do anything. A function named `validateUserEmail` does exactly one thing and announces it. Names are your first line of documentation.

    // Unclear
    function process(x) { ... }

    // Clear
    function normalizePhoneNumber(raw) { ... }

## Functions Should Do One Thing

If you need the word "and" to describe what a function does, split it:

    // Does too much
    function fetchAndSaveUser(id) { ... }

    // Single responsibility
    async function fetchUser(id) { ... }
    async function saveUser(user) { ... }

## Prefer Pure Functions

A pure function has no side effects and returns the same output for the same input. Pure functions are trivial to test, easy to reason about, and safe to reuse.

    // Impure — modifies external state
    function addToCart(item) {
      cart.push(item);
    }

    // Pure — returns new state
    function addToCart(cart, item) {
      return [...cart, item];
    }

## When to Abstract

Three times is the rule. See something once, write it inline. Twice, consider extraction. Three times, extract and name it. Abstract too early and you solve a problem that does not exist yet.

> Code is read far more than it is written. Optimize for the reader.',
'Practical principles for writing JavaScript that is a joy to read and maintain.',
'https://picsum.photos/seed/clean-code-js/1200/630',
false, id FROM users WHERE email = 'carlos@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Monorepos with pnpm Workspaces',
'## The Problem with Multi-Repo

Separate repos for each package sounds clean in theory. In practice it means: multiple CI pipelines, version mismatches between shared packages, and painful cross-package changes that require coordinated PRs.

## What a Monorepo Solves

A monorepo keeps all packages in one repository with one CI pipeline, atomic cross-package commits, and shared tooling. The dependency between packages is a local workspace reference — no publishing required during development.

## Setting Up pnpm Workspaces

Create a `pnpm-workspace.yaml` at the root:

    packages:
      - ''apps/*''
      - ''packages/*''

Each subdirectory with a `package.json` becomes a workspace package.

## Referencing Local Packages

In any `package.json`, reference another workspace package:

    {
      "dependencies": {
        "@myorg/types": "workspace:*"
      }
    }

pnpm resolves this to the local package, not npm. Changes to `@myorg/types` are immediately available in all consumers.

## Adding Turborepo

Turborepo adds intelligent caching and parallel execution:

    npx turbo run build --filter=@myorg/api

It only rebuilds packages whose source files changed since the last build — a massive time saver in CI.

## The Trade-offs

Monorepos add complexity to the repo itself: merge conflicts on `pnpm-lock.yaml`, larger `node_modules`, and a steeper learning curve for newcomers. The benefits outweigh the costs once the team is beyond two or three packages.

> A monorepo is not about keeping everything together. It is about eliminating the friction of working across boundaries.',
'Set up a production-grade monorepo with pnpm workspaces and Turborepo.',
'https://picsum.photos/seed/monorepo-pnpm/1200/630',
false, id FROM users WHERE email = 'carlos@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Understanding the V8 Garbage Collector',
'## Why Memory Leaks Are Hard to Find

Memory leaks in Node.js applications do not crash immediately. They grow slowly, increasing memory usage over days or weeks until the process runs out of memory or becomes unresponsive. By then, the cause is long gone from any recent logs.

## How V8 Organizes Memory

V8 divides the heap into generations:

- **Young generation** (New Space) — objects are allocated here first. Most objects die young and are collected quickly.
- **Old generation** (Old Space) — objects that survive multiple young generation collections are promoted here.

This is the generational hypothesis: most objects die young. Optimizing for the common case makes GC fast.

## The Scavenger (Minor GC)

The young generation uses a copy-collector called the Scavenger. It copies live objects to a new space and reclaims the old space entirely. This is fast because young objects are mostly dead — there is little to copy.

## Mark-Sweep-Compact (Major GC)

The old generation uses a mark-sweep algorithm. The GC traverses the object graph starting from roots, marks live objects, then sweeps unreachable ones. V8 does this incrementally to avoid long pauses.

## Common Leak Patterns

- **Closures capturing large objects** — the closure keeps the outer scope alive.
- **Forgotten event listeners** — `emitter.on(...)` without a matching `off` holds a reference.
- **Caches without eviction** — a `Map` used as a cache will grow forever if you never delete entries.

## Diagnosing a Leak

Use the `--inspect` flag and Chrome DevTools to take heap snapshots over time. Compare snapshots to find objects that accumulate but are never collected.

> You do not find memory leaks by reading code. You find them by measuring.',
'How V8 manages memory and what you can do to avoid leaks in Node.js applications.',
'https://picsum.photos/seed/v8-gc-node/1200/630',
false, id FROM users WHERE email = 'carlos@pinoblog.com' ON CONFLICT DO NOTHING;

-- ── maria@pinoblog.com ───────────────────────

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Building Reusable React Components',
'## The Problem with One-Off Components

Components built for a single use case accumulate fast. Six months into a project, you have a `UserCard` in the dashboard, a `ProfileCard` in the sidebar, and a `MemberCard` in the settings page — all doing the same thing differently.

## The Compound Component Pattern

Compound components let callers compose behavior without the parent knowing the details:

    <Select>
      <Select.Trigger>Choose a language</Select.Trigger>
      <Select.Options>
        <Select.Option value="ts">TypeScript</Select.Option>
        <Select.Option value="js">JavaScript</Select.Option>
      </Select.Options>
    </Select>

The parent manages shared state via context. Each sub-component reads what it needs.

## Exposing a Clean API Surface

The best component API has as few required props as possible and sensible defaults for everything else. Think about what the caller needs to know, not what the component needs to work.

    // Too much required knowledge
    <Button color="#818CF8" hoverColor="#6366F1" textColor="#fff" />

    // Clean API — the component owns the decisions
    <Button variant="primary" />

## Render Props vs Children

Render props give callers control over what is rendered:

    <DataFetcher url="/api/posts">
      {({ data, isLoading }) =>
        isLoading ? <Spinner /> : <PostList posts={data} />
      }
    </DataFetcher>

Today, custom hooks achieve the same result with less nesting. Prefer hooks for logic, children for layout.

## The Portability Test

A truly reusable component can be copied into a different project and work with zero modifications. If it imports from `../store` or `../api`, it is not reusable — it is just shared.

> Reusability is not a feature you add. It is the result of good boundaries.',
'Patterns for building composable, reusable React components.',
'https://picsum.photos/seed/react-components/1200/630',
false, id FROM users WHERE email = 'maria@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'React Server Components Explained',
'## The Problem They Solve

Every React component today runs on the client — even components that only display static data. They ship JavaScript, they hydrate, they re-render. For a component that just renders a list of posts fetched from a database, all of that is wasted.

## What Server Components Are

React Server Components run exclusively on the server. They have no client-side JavaScript, no hydration, and no re-renders. They render once and stream HTML directly to the browser.

The breakthrough: they can be async. You can `await` a database query directly in a component:

    async function PostList() {
      const posts = await db.posts.findMany();
      return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
    }

No `useEffect`, no loading state, no API route.

## The Server/Client Boundary

The boundary between server and client components is a `''use client''` directive at the top of a file. Everything above the boundary is server-only. Everything below is client-side React as you know it.

Server components can render client components. Client components cannot render server components — that boundary is one-way.

## What You Cannot Do in Server Components

- Use `useState`, `useEffect`, or any other hook
- Access browser APIs (`window`, `document`)
- Add event handlers (`onClick`, `onChange`)

If you need any of these, add `''use client''` and accept the JavaScript cost.

## The Impact on Architecture

Server Components change the default. The question is no longer "should I fetch this client-side or server-side?" — it is "does this component need to be interactive?" If no, keep it on the server.

> Server Components do not replace client React. They give you back the choice.',
'What React Server Components are, why they matter, and when to use them.',
'https://picsum.photos/seed/rsc-explained/1200/630',
false, id FROM users WHERE email = 'maria@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'State Management in 2025: Zustand vs Signals',
'## The State Management Pendulum

React state management has been through several eras. Flux, then Redux, then Context API, then Zustand and Jotai, and now Signals — each one reacting to the pain points of the last.

## What Zustand Got Right

Zustand is minimal by design. A store is just a function:

    const useStore = create((set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }));

No actions, no reducers, no boilerplate. Subscribe to only what you need, and re-render only when that slice changes.

## The Signal Model

Signals are reactive primitives — a value that notifies subscribers when it changes. Angular adopted them in v16, and Preact has had them for years:

    const count = signal(0);
    const doubled = computed(() => count.value * 2);

    count.value++; // doubled updates automatically

The key difference: with signals, updates are granular. Only the components that read a specific signal re-render — no diffing required.

## Signals in React''s Future

React''s compiler (formerly React Forget) aims to solve this automatically by memoizing components at compile time. The goal is signal-level performance without the signals API.

## Which Should You Use Today?

- **Zustand** — for most React apps that need shared state beyond Context.
- **Jotai** — when you want atom-level granularity in React.
- **Angular Signals** — mandatory for Angular 17+ reactive patterns.
- **React compiler** — watch this space; it will change the calculus.

> The best state manager is the one your team understands and can debug at 2am.',
'A practical comparison of modern React state management: Zustand, Jotai, and Signals.',
'https://picsum.photos/seed/zustand-signals/1200/630',
false, id FROM users WHERE email = 'maria@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Next.js App Router: Everything You Need to Know',
'## The Mental Model Shift

The Pages Router was file-system routing over client-side React. The App Router is file-system routing over React Server Components. The files are in different folders, but the conceptual shift is much deeper.

## The New File Conventions

Inside the `app/` directory:

- `page.tsx` — the UI for a route segment
- `layout.tsx` — shared UI that wraps child segments, persists across navigation
- `loading.tsx` — automatic Suspense boundary shown while the page loads
- `error.tsx` — automatic error boundary for the segment
- `not-found.tsx` — rendered when `notFound()` is called

## Data Fetching Is Just async/await

No `getServerSideProps`, no `getStaticProps`. Server Components are async functions:

    export default async function PostPage({ params }) {
      const post = await fetchPost(params.id);
      return <article>{post.title}</article>;
    }

Next.js handles caching, deduplication, and streaming automatically.

## Route Groups and Parallel Routes

Wrap a folder in parentheses — `(marketing)` — to group routes without affecting the URL. This lets you apply different layouts to different sections without nesting the URL path.

Parallel routes (`@modal`) let you render multiple pages simultaneously in the same layout — essential for modal routing patterns.

## Common Migration Pitfalls

- Components marked `''use client''` lose direct database access — move data fetching up to a server parent.
- `useRouter` from `next/router` does not work in the App Router — use `next/navigation`.
- `cookies()` and `headers()` are async in Next.js 15+.

> The App Router is not a replacement for the Pages Router. It is a different model entirely.',
'The complete guide to Next.js 14+ App Router: routing, layouts, data fetching, and caching.',
'https://picsum.photos/seed/nextjs-approuter/1200/630',
false, id FROM users WHERE email = 'maria@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Styling React Apps with Tailwind v4',
'## What Changed in v4

Tailwind v4 is a ground-up rewrite. The JavaScript config file is gone. PostCSS is out. Lightning CSS is the new engine. And the way you customize the design system is now pure CSS.

## The New @theme API

Instead of `tailwind.config.js`, you define design tokens in your CSS:

    @import "tailwindcss";

    @theme {
      --color-primary: #818CF8;
      --color-bg: #0F172A;
      --font-sans: ''Inter'', sans-serif;
    }

Every token you define here automatically becomes a utility class. `--color-primary` becomes `bg-primary`, `text-primary`, `border-primary`.

## Dark Mode Is Simpler

No more `darkMode: ''class''` in the config. Use CSS:

    @media (prefers-color-scheme: dark) {
      @theme {
        --color-bg: #0F172A;
      }
    }

## What Breaks on Migration

- The `content` array in `tailwind.config.js` is replaced by automatic content detection.
- Arbitrary values with `[...]` still work but some syntax changed.
- Some third-party plugins need updates to work with the new CSS-first API.

## The Performance Gain

Lightning CSS is significantly faster than PostCSS — build times drop noticeably in large projects. The reduced configuration surface also means fewer ways for the build to break.

> Tailwind v4 does not add features. It removes friction.',
'What changed in Tailwind CSS v4 and how to migrate your existing project.',
'https://picsum.photos/seed/tailwind-v4-react/1200/630',
false, id FROM users WHERE email = 'maria@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Draft: Micro Frontends with Module Federation',
'## Work in Progress

This post is still being written. Topics to cover:

- What problem micro frontends actually solve (and when they do not)
- Webpack Module Federation v2 configuration
- Rspack as a faster alternative
- Shared dependencies and version negotiation
- Runtime composition vs build-time composition',
NULL,
'https://picsum.photos/seed/micro-frontends/1200/630',
true, id FROM users WHERE email = 'maria@pinoblog.com' ON CONFLICT DO NOTHING;

-- ── sofia@pinoblog.com ───────────────────────

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Docker for Node.js Developers',
'## Why Containers?

"It works on my machine" is not a deployment strategy. Docker packages your application and its dependencies into a container — a portable, isolated unit that runs the same way everywhere.

## A Production-Ready Dockerfile

A naive Dockerfile copies everything and runs as root. A production Dockerfile uses multi-stage builds to keep the image small and runs as a non-root user:

    FROM node:20-alpine AS builder
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci
    COPY . .
    RUN npm run build

    FROM node:20-alpine AS runner
    WORKDIR /app
    RUN addgroup -S app && adduser -S app -G app
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/node_modules ./node_modules
    USER app
    EXPOSE 3000
    CMD ["node", "dist/main"]

## Health Checks

Declare a health check so orchestrators know when your container is ready:

    HEALTHCHECK --interval=30s --timeout=5s \
      CMD wget -qO- http://localhost:3000/health || exit 1

## .dockerignore

Always add a `.dockerignore` to exclude `node_modules`, `.git`, and any local build artifacts:

    node_modules
    .git
    dist
    .env

## Layer Caching

Copy `package.json` and install dependencies before copying source code. Docker caches each layer — if your source changes but `package.json` does not, the dependency install step is skipped.

> A container is not a virtual machine. It is a process with a wall around it.',
'A practical Docker guide for Node.js and NestJS applications.',
'https://picsum.photos/seed/docker-nodejs/1200/630',
false, id FROM users WHERE email = 'sofia@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'CI/CD with GitHub Actions',
'## What CI/CD Means in Practice

Continuous Integration means every push is built and tested automatically. Continuous Deployment means every passing build is deployed automatically. Together they eliminate the "works locally, breaks in production" problem.

## A Real Pipeline

A GitHub Actions workflow is a YAML file in `.github/workflows/`. Here is a complete pipeline for a Node.js API:

    name: CI/CD
    on: [push]
    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with: { node-version: 20 }
          - run: npm ci
          - run: npm test

## Secrets Management

Never put credentials in the workflow file. Store them in GitHub repository secrets and reference them as environment variables:

    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}

## Caching Dependencies

Cache `node_modules` to skip the install step on repeated runs:

    - uses: actions/cache@v4
      with:
        path: node_modules
        key: ${{ hashFiles(''package-lock.json'') }}

## Building and Pushing Docker Images

After tests pass, build and push the Docker image:

    - run: docker build -t myapp .
    - run: docker push ghcr.io/myorg/myapp:${{ github.sha }}

Tag with the commit SHA so every deployment is traceable to its source commit.

> A pipeline that does not block broken code is not a pipeline. It is theater.',
'Set up a complete CI/CD pipeline for your Node.js app using GitHub Actions.',
'https://picsum.photos/seed/cicd-github/1200/630',
false, id FROM users WHERE email = 'sofia@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Kubernetes for the Skeptic',
'## Do You Actually Need Kubernetes?

If you have one service with predictable traffic, a single server with Docker Compose is simpler, cheaper, and easier to debug. Kubernetes is for when you have multiple services that need independent scaling, automated rollouts, and self-healing — and the operational overhead is worth it.

## The Core Concepts

Stop memorizing Kubernetes objects and start thinking about what they solve:

- **Pod** — one or more containers that share a network and storage. The unit of scheduling.
- **Deployment** — declares the desired state: "run 3 replicas of this container". Kubernetes makes it so.
- **Service** — a stable DNS name and IP for a set of Pods. Pods come and go; the Service stays.
- **Ingress** — routes external HTTP traffic to Services. Your load balancer.

## Deploying an API

A minimal Deployment for a Node.js API:

    apiVersion: apps/v1
    kind: Deployment
    spec:
      replicas: 3
      template:
        spec:
          containers:
          - name: api
            image: myorg/api:v1.2.0
            ports:
            - containerPort: 3000

## Rolling Updates

Change the image tag and apply the manifest. Kubernetes replaces Pods one at a time, keeping your service available throughout.

## What Kubernetes Does Not Solve

Kubernetes handles infrastructure orchestration. It does not handle secret management (use Vault or a cloud provider''s secret manager), observability (add Prometheus and Grafana), or networking policy (add a service mesh if you need it).

> Kubernetes is a platform for building platforms. Know what layer you are on.',
'The honest guide to deploying your first application on Kubernetes.',
'https://picsum.photos/seed/kubernetes-skeptic/1200/630',
false, id FROM users WHERE email = 'sofia@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Observability: Logs, Metrics, and Traces',
'## The Three Pillars

Observability is the ability to understand what your system is doing from the outside. The three pillars give you different lenses:

- **Logs** — discrete events with context ("user 42 logged in at 14:32")
- **Metrics** — numeric measurements over time ("200 requests/second, p99 latency 120ms")
- **Traces** — the path of a single request through multiple services

## Structured Logging with Pino

Pino produces JSON logs that log aggregators can parse:

    const logger = pino({ level: ''info'' });
    logger.info({ userId: 42, action: ''login'' }, ''User logged in'');

In NestJS, inject a Pino logger via `nestjs-pino`.

## Prometheus Metrics

Expose a `/metrics` endpoint that Prometheus scrapes:

    import { PrometheusModule } from ''@willsoto/nestjs-prometheus'';

Prometheus stores time-series data. Grafana queries it and renders dashboards.

## Distributed Tracing with OpenTelemetry

A trace is a tree of spans — one per operation. OpenTelemetry is the standard SDK:

    const tracer = trace.getTracer(''my-service'');
    const span = tracer.startSpan(''fetchUser'');
    // ... do work
    span.end();

Traces are exported to Jaeger, Tempo, or a cloud provider.

## The Correlation ID

One practice that costs nothing and pays enormous dividends: generate a UUID at the edge of every request and attach it to every log, metric, and trace for that request. When something breaks, filter by correlation ID and see the complete story.

> You cannot debug what you cannot see. Instrument first, optimize second.',
'Add production-grade observability to your NestJS API with Pino, Prometheus, and OpenTelemetry.',
'https://picsum.photos/seed/observability-otel/1200/630',
false, id FROM users WHERE email = 'sofia@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Zero-Downtime Deployments',
'## Why Downtime Is Unacceptable

Five minutes of downtime during a deployment is five minutes your users cannot use your product. At scale that is thousands of interrupted sessions. The solution is not deploying at 3am — it is deploying in a way that eliminates downtime entirely.

## Rolling Updates

Replace instances one at a time. At any moment during the update, both old and new versions are running. Traffic is routed away from instances being updated.

**Requirements**: the new version must be backward compatible with the old. Database schema changes must be additive — never drop a column while the old version still reads it.

## Blue-Green Deployments

Run two identical environments: blue (current) and green (next). Deploy to green, run your full test suite, then switch the load balancer from blue to green.

**Advantage**: instant rollback — switch back to blue if anything goes wrong.
**Disadvantage**: double the infrastructure cost while both environments are running.

## Canary Releases

Route a small percentage of traffic — 1%, 5%, 10% — to the new version. Monitor error rates and latency. Gradually increase the percentage as confidence grows.

**Advantage**: real traffic validates the new version without full exposure.
**Disadvantage**: more complex routing logic and monitoring requirements.

## Database Migrations

The hardest part of zero-downtime deployments is the database. The expand-contract pattern:

1. **Expand** — add the new column (nullable, backward compatible)
2. **Migrate** — backfill data in the new column
3. **Cut over** — deploy code that reads the new column
4. **Contract** — drop the old column

Never do all four in a single deployment.

> Zero downtime is a discipline, not a feature.',
'Compare rolling, blue-green, and canary deployment strategies with real examples.',
'https://picsum.photos/seed/zero-downtime/1200/630',
false, id FROM users WHERE email = 'sofia@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Infrastructure as Code with Terraform',
'## The Problem with ClickOps

ClickOps — clicking through a cloud console to provision resources — does not scale. There is no audit trail, no review process, and no way to reproduce the same environment reliably. Infrastructure as Code (IaC) solves all three.

## What Terraform Is

Terraform is a declarative IaC tool. You describe the desired state of your infrastructure in HCL (HashiCorp Configuration Language), and Terraform figures out how to make it so.

    resource "aws_instance" "api" {
      ami           = "ami-0c55b159cbfafe1f0"
      instance_type = "t3.micro"
    }

## The Core Workflow

    terraform init    # download providers
    terraform plan    # show what will change (dry run)
    terraform apply   # make it so

The `plan` step is critical. Always review it before applying — it shows exactly what Terraform will create, update, or destroy.

## State

Terraform tracks what it has created in a state file. In a team, store state remotely (S3, Terraform Cloud) so everyone works from the same source of truth.

## Modules

Extract reusable infrastructure patterns into modules:

    module "database" {
      source = "./modules/rds"
      instance_class = "db.t3.medium"
    }

Modules let you define a "database" once and reuse it across environments.

## Environment Separation

Use workspaces or separate state files for each environment (dev, staging, production). Never share state between environments.

> Infrastructure that cannot be recreated from code is infrastructure that will eventually be lost.',
'Get started with Terraform to manage cloud infrastructure as code.',
'https://picsum.photos/seed/terraform-iac/1200/630',
false, id FROM users WHERE email = 'sofia@pinoblog.com' ON CONFLICT DO NOTHING;

-- ── andres@pinoblog.com ──────────────────────

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Clean Architecture in Node.js',
'## What Clean Architecture Actually Says

Uncle Bob''s Clean Architecture has one rule: source code dependencies must point inward. Business logic depends on nothing external. Frameworks, databases, and UIs depend on business logic — not the other way around.

The implication: you should be able to swap your database, your web framework, or your UI without touching your use cases.

## The Layers

- **Entities** — core business objects and rules. No framework dependencies.
- **Use Cases** — application-specific business rules. Orchestrate entities.
- **Interface Adapters** — convert data between use cases and external systems.
- **Frameworks and Drivers** — the outermost layer: NestJS, TypeORM, HTTP.

## Ports and Adapters

Define your dependencies as interfaces (ports), and provide implementations (adapters):

    // Port — in the use case layer
    interface PostRepository {
      findById(id: number): Promise<Post | null>;
    }

    // Adapter — in the infrastructure layer
    class TypeOrmPostRepository implements PostRepository {
      findById(id: number) { ... }
    }

The use case only knows about `PostRepository`. TypeORM is an implementation detail.

## The Trade-off

Clean Architecture adds indirection. A feature that would be three files in a flat structure becomes six. For a small team building a focused product, that overhead might not be worth it.

Use it when: the domain is complex, the team is large, or you genuinely need to swap infrastructure. Do not use it for CRUD APIs that will never change.

> Architecture is not about following patterns. It is about managing change.',
'Apply Clean Architecture to a real NestJS project without over-engineering it.',
'https://picsum.photos/seed/clean-arch-node/1200/630',
false, id FROM users WHERE email = 'andres@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Domain-Driven Design: A Pragmatic Introduction',
'## DDD Is About Language

Domain-Driven Design is not a folder structure or a set of patterns. It is a philosophy: the code should speak the language of the business. If your team says "invoice", your code should say `Invoice`, not `PaymentRecord` or `BillingDocument`.

This shared vocabulary — the ubiquitous language — eliminates the translation layer between developers and domain experts.

## Bounded Contexts

Large systems have multiple subdomains that use the same words differently. "Customer" means something different in sales, billing, and support.

A bounded context is an explicit boundary within which a model applies. Inside the `Billing` context, `Customer` has an account balance. Inside the `Support` context, `Customer` has open tickets. Different models, same word, explicit boundaries.

## Aggregates

An aggregate is a cluster of objects treated as a unit. One object is the aggregate root — the only entry point for modifications.

    class Order {
      private items: OrderItem[] = [];

      addItem(product: Product, qty: number) {
        // enforce invariants: max 50 items, product must be active
        this.items.push(new OrderItem(product.id, qty, product.price));
      }
    }

You never modify `OrderItem` directly — you always go through `Order`.

## Value Objects

A value object has no identity — it is defined entirely by its attributes. Two value objects with the same attributes are equal.

    class Money {
      constructor(readonly amount: number, readonly currency: string) {}

      equals(other: Money) {
        return this.amount === other.amount && this.currency === other.currency;
      }
    }

## When to Apply DDD

DDD pays dividends in complex domains with many business rules and domain experts who can collaborate. For simple CRUD applications, it is overkill.

> The goal of DDD is not to write better code. It is to solve the right problem.',
'A pragmatic introduction to DDD concepts: bounded contexts, aggregates, and ubiquitous language.',
'https://picsum.photos/seed/ddd-pragmatic/1200/630',
false, id FROM users WHERE email = 'andres@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'From Side Project to Open Source',
'## The Decision to Open Source

I built a small utility library for a side project — a type-safe event emitter for Node.js. After six months of using it myself and mentioning it in a blog post, three strangers emailed to ask if it was available on npm.

That is when I decided to open source it.

## What I Did Not Know

I thought open sourcing meant pushing to GitHub and publishing to npm. That took thirty minutes. What actually took weeks:

- Writing documentation that a stranger could follow
- Setting up CI so contributors could trust the test suite
- Deciding on a versioning strategy and writing a `CHANGELOG`
- Handling my first issue from someone I had never met

## The CONTRIBUTING.md Contract

A `CONTRIBUTING.md` file is a contract with potential contributors. It tells them: here is how to run the project locally, here is how to submit a change, here is what you can expect from me in return.

Without it, contributors do not know the rules. With it, good contributors self-serve.

## Semantic Versioning

Adopt semantic versioning from day one: `MAJOR.MINOR.PATCH`.

- Patch: bug fix, no API change
- Minor: new feature, backward compatible
- Major: breaking change

Your users need to trust that a minor version bump will not break their code.

## The Unexpected Part

The most valuable thing open source gave me was not the contributions. It was the issues. Real users found edge cases I never would have found myself, asked questions that revealed gaps in my mental model, and pushed the library in directions I had not considered.

> Open source is not about giving away code. It is about inviting collaboration.',
'What I learned turning a side project into a maintained open-source package.',
'https://picsum.photos/seed/side-project-oss/1200/630',
false, id FROM users WHERE email = 'andres@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'The Senior Engineer Mindset',
'## Seniority Is Not About Knowledge

Junior engineers know fewer things. Senior engineers know where to find the answer, when the answer does not matter, and when to question the question.

Every senior engineer I admire has a consistent trait: they are comfortable saying "I do not know, let me find out" — and they find out quickly.

## Build vs Buy

Junior: "Can we build this?"
Senior: "Should we build this?"

Building in-house means you own the maintenance forever. A third-party library gives you the feature and the bugs, but also the updates and the community. The decision depends on how central the problem is to your business.

If it is a core competency, build it. If it is infrastructure, buy it.

## Communicating Uncertainty

The most dangerous engineer is the one who is confident when they should not be. Communicating uncertainty is a skill:

- "I''m about 80% sure this is the right approach, but I''d like one more day to validate the assumption."
- "I don''t know how long this will take. Here is what I know, and here is what I need to find out first."

Stakeholders can plan around honest uncertainty. They cannot plan around false confidence.

## Unblocking the Team

A senior engineer''s most valuable contribution is often not the code they write — it is the code they help others write. Pair programming, thorough code reviews, and clear technical decisions multiply the output of the whole team.

## The Career Trap

Many engineers optimize for looking senior: using complex patterns, introducing new technologies, and making simple things complicated. Actually senior engineers optimize for outcomes: shipping reliable software that solves real problems, maintained by a team that understands it.

> Seniority is measured in problems solved, not technologies mastered.',
'The technical and human skills that separate senior engineers from the rest.',
'https://picsum.photos/seed/senior-engineer/1200/630',
false, id FROM users WHERE email = 'andres@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
'Draft: Event-Driven Architecture with NATS',
'## Work in Progress

This post is still being written. Topics to cover:

- Why request/response falls apart at scale
- NATS JetStream vs traditional message queues
- At-least-once vs exactly-once delivery
- Consumer groups and load balancing
- Integrating NATS with NestJS microservices',
NULL,
'https://picsum.photos/seed/event-driven-nats/1200/630',
true, id FROM users WHERE email = 'andres@pinoblog.com' ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- SEARCH VECTORS
-- ─────────────────────────────────────────────
UPDATE posts
SET search_vector = to_tsvector('english',
  coalesce(title, '') || ' ' || coalesce(content, ''))
WHERE search_vector IS NULL;

-- ─────────────────────────────────────────────
-- POSTS ↔ CATEGORIES
-- ─────────────────────────────────────────────
INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Getting Started with NestJS'
  AND c.name IN ('NestJS', 'TypeScript', 'Technology') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'TypeScript Generics in Practice'
  AND c.name IN ('TypeScript', 'JavaScript') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Why I Switched from Express to NestJS'
  AND c.name IN ('NestJS', 'Technology') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Designing Scalable REST APIs'
  AND c.name IN ('Architecture', 'NestJS', 'Technology') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'PostgreSQL Full-Text Search with TypeORM'
  AND c.name IN ('NestJS', 'TypeScript', 'Architecture') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Implementing Role-Based Access Control in NestJS'
  AND c.name IN ('NestJS', 'TypeScript', 'Architecture') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Draft: Advanced TypeORM Patterns'
  AND c.name IN ('NestJS', 'TypeScript') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'JavaScript Event Loop Demystified'
  AND c.name IN ('JavaScript', 'Technology') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Async/Await Under the Hood'
  AND c.name IN ('JavaScript', 'TypeScript') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Tree-Shaking and Bundle Optimization'
  AND c.name IN ('JavaScript', 'Technology') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Writing Clean Code in JavaScript'
  AND c.name IN ('JavaScript', 'Architecture', 'Career') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Monorepos with pnpm Workspaces'
  AND c.name IN ('JavaScript', 'DevOps', 'Technology') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Understanding the V8 Garbage Collector'
  AND c.name IN ('JavaScript', 'Technology') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Building Reusable React Components'
  AND c.name IN ('React', 'JavaScript', 'TypeScript') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'React Server Components Explained'
  AND c.name IN ('React', 'Next.js', 'JavaScript') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'State Management in 2025: Zustand vs Signals'
  AND c.name IN ('React', 'JavaScript', 'Architecture') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Next.js App Router: Everything You Need to Know'
  AND c.name IN ('Next.js', 'React', 'TypeScript') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Styling React Apps with Tailwind v4'
  AND c.name IN ('React', 'Next.js', 'Technology') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Draft: Micro Frontends with Module Federation'
  AND c.name IN ('React', 'Architecture') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Docker for Node.js Developers'
  AND c.name IN ('DevOps', 'Technology') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'CI/CD with GitHub Actions'
  AND c.name IN ('DevOps', 'Open Source') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Kubernetes for the Skeptic'
  AND c.name IN ('DevOps', 'Architecture') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Observability: Logs, Metrics, and Traces'
  AND c.name IN ('DevOps', 'NestJS', 'Architecture') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Zero-Downtime Deployments'
  AND c.name IN ('DevOps', 'Architecture') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Infrastructure as Code with Terraform'
  AND c.name IN ('DevOps', 'Technology') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Clean Architecture in Node.js'
  AND c.name IN ('Architecture', 'NestJS', 'TypeScript') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Domain-Driven Design: A Pragmatic Introduction'
  AND c.name IN ('Architecture', 'Career') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'From Side Project to Open Source'
  AND c.name IN ('Open Source', 'Career') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'The Senior Engineer Mindset'
  AND c.name IN ('Career', 'Architecture') ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id) SELECT p.id, c.id FROM posts p, categories c
WHERE p.title = 'Draft: Event-Driven Architecture with NATS'
  AND c.name IN ('Architecture', 'NestJS') ON CONFLICT DO NOTHING;

SQL

echo ""
echo "✓ Seed complete — 5 users, 10 categories, 30 posts (27 published, 3 drafts)"
echo ""
echo "  Credentials:"
echo "    admin@pinoblog.com   / Admin1234!  (admin)"
echo "    carlos@pinoblog.com  / Writer1234! (writer)"
echo "    maria@pinoblog.com   / Writer1234! (writer)"
echo "    sofia@pinoblog.com   / Writer1234! (writer)"
echo "    andres@pinoblog.com  / Writer1234! (writer)"
