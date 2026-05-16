#!/usr/bin/env bash
# Seed the Pino Blog database with sample data.
# Passwords are bcrypt-hashed at runtime via the backend's bcrypt dependency.
#
# Usage:
#   ./scripts/seed.sh
#
# Override any connection variable via env:
#   PGHOST=myhost PGDATABASE=mydb PGUSER=me PGPASSWORD=secret ./scripts/seed.sh

set -euo pipefail

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGDATABASE="${PGDATABASE:-my_blog_db}"
PGUSER="${PGUSER:-blog_user}"
export PGPASSWORD="${PGPASSWORD:-blog_password}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/apps/backend"

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

run_psql <<SQL

-- ─────────────────────────────────────────────
-- PROFILES  (5 users — real face placeholders)
-- i.pravatar.cc/256?img=N  →  N ∈ [1..70]
-- ─────────────────────────────────────────────
INSERT INTO profiles (first_name, last_name, avatar_url) VALUES
  ('Admin',   'Pino',     'https://i.pravatar.cc/256?img=8'),
  ('Carlos',  'Ramírez',  'https://i.pravatar.cc/256?img=12'),
  ('María',   'González', 'https://i.pravatar.cc/256?img=45'),
  ('Sofía',   'Herrera',  'https://i.pravatar.cc/256?img=44'),
  ('Andrés',  'Torres',   'https://i.pravatar.cc/256?img=67')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
INSERT INTO users (email, password, role, profile_id)
SELECT 'admin@pinoblog.com', '$ADMIN_HASH', 'admin'::user_role_enum, id
FROM profiles WHERE first_name = 'Admin' AND last_name = 'Pino'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, role, profile_id)
SELECT 'carlos@pinoblog.com', '$WRITER_HASH', 'user'::user_role_enum, id
FROM profiles WHERE first_name = 'Carlos' AND last_name = 'Ramírez'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, role, profile_id)
SELECT 'maria@pinoblog.com', '$WRITER_HASH', 'user'::user_role_enum, id
FROM profiles WHERE first_name = 'María' AND last_name = 'González'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, role, profile_id)
SELECT 'sofia@pinoblog.com', '$WRITER_HASH', 'user'::user_role_enum, id
FROM profiles WHERE first_name = 'Sofía' AND last_name = 'Herrera'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, role, profile_id)
SELECT 'andres@pinoblog.com', '$WRITER_HASH', 'user'::user_role_enum, id
FROM profiles WHERE first_name = 'Andrés' AND last_name = 'Torres'
ON CONFLICT (email) DO NOTHING;

-- ─────────────────────────────────────────────
-- CATEGORIES  (10 — 640×360 covers)
-- picsum.photos/seed/{seed}/640/360  →  deterministic image per seed
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
-- POSTS  (30 — 1200×630 covers)
-- 27 published, 3 drafts
-- ─────────────────────────────────────────────

-- ── admin@pinoblog.com  (7 posts) ───────────

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Getting Started with NestJS',
  '<p>NestJS is a progressive Node.js framework built with TypeScript. It brings Angular-style architecture—modules, decorators, dependency injection—to the server side.</p><p>In this guide we will scaffold a new project, build a simple REST endpoint, and wire up TypeORM to PostgreSQL.</p>',
  'A hands-on introduction to NestJS modules, controllers, services, and TypeORM.',
  'https://picsum.photos/seed/nestjs-start/1200/630',
  false, id FROM users WHERE email = 'admin@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'TypeScript Generics in Practice',
  '<p>Generics are one of TypeScript''s most powerful features, yet many developers avoid them out of fear of complexity. This article breaks them down with real-world examples: typed API clients, reusable collection utilities, and conditional types.</p>',
  'Demystifying TypeScript generics with practical, real-world examples.',
  'https://picsum.photos/seed/ts-generics/1200/630',
  false, id FROM users WHERE email = 'admin@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Why I Switched from Express to NestJS',
  '<p>After three years of Express applications I made the switch to NestJS. The reasons: opinionated structure, first-class TypeScript support, and a thriving ecosystem of official modules.</p>',
  'A migration story: from bare Express to a structured NestJS monolith.',
  'https://picsum.photos/seed/express-nest/1200/630',
  false, id FROM users WHERE email = 'admin@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Designing Scalable REST APIs',
  '<p>Good API design is invisible—clients never notice it. Bad API design is painful forever. This post covers versioning strategies, resource naming, error envelopes, and pagination patterns that survive the test of time.</p>',
  'Practical patterns for building REST APIs that scale with your product.',
  'https://picsum.photos/seed/rest-api-design/1200/630',
  false, id FROM users WHERE email = 'admin@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'PostgreSQL Full-Text Search with TypeORM',
  '<p>Full-text search in PostgreSQL is powerful, underused, and free. We will add a <code>tsvector</code> column, build a GIN index, and expose a search endpoint from NestJS without any external search engine.</p>',
  'Add production-ready full-text search to NestJS using native PostgreSQL tsvector.',
  'https://picsum.photos/seed/postgres-fts/1200/630',
  false, id FROM users WHERE email = 'admin@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Implementing Role-Based Access Control in NestJS',
  '<p>Most applications need more than "logged in or not". We will implement a roles system with a custom <code>@Roles()</code> decorator, a <code>RolesGuard</code>, and JWT claims—all without third-party libraries.</p>',
  'Build a clean RBAC system in NestJS using custom decorators and guards.',
  'https://picsum.photos/seed/rbac-nestjs/1200/630',
  false, id FROM users WHERE email = 'admin@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Draft: Advanced TypeORM Patterns',
  '<p>Work in progress — covering listeners, subscribers, soft deletes, and tree entities.</p>',
  NULL,
  'https://picsum.photos/seed/typeorm-adv/1200/630',
  true, id FROM users WHERE email = 'admin@pinoblog.com' ON CONFLICT DO NOTHING;

-- ── carlos@pinoblog.com  (6 posts) ──────────

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'JavaScript Event Loop Demystified',
  '<p>The event loop is the heart of every JavaScript runtime. Understanding the call stack, microtask queue, and macrotask queue will make you a better async programmer and help you avoid subtle concurrency bugs.</p>',
  'A visual walkthrough of the JavaScript event loop, microtasks, and macrotasks.',
  'https://picsum.photos/seed/event-loop/1200/630',
  false, id FROM users WHERE email = 'carlos@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Async/Await Under the Hood',
  '<p>Async/await is syntactic sugar over Promises, which are themselves built on top of the event loop. Understanding the de-sugared code helps you reason about execution order and avoid common pitfalls.</p>',
  'What actually happens when you write async/await—the generator-based mental model explained.',
  'https://picsum.photos/seed/async-await/1200/630',
  false, id FROM users WHERE email = 'carlos@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Tree-Shaking and Bundle Optimization',
  '<p>Modern JavaScript bundlers can eliminate dead code, but only if you write your modules correctly. This post covers ES module semantics, side-effect annotations, and how to audit your bundle with source-map-explorer.</p>',
  'Write bundle-friendly JavaScript and cut your production payload in half.',
  'https://picsum.photos/seed/tree-shaking/1200/630',
  false, id FROM users WHERE email = 'carlos@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Writing Clean Code in JavaScript',
  '<p>Clean code is not about style guides—it is about empathy for the next developer (usually yourself, six months later). We cover naming, function size, pure functions, and when to abstract.</p>',
  'Practical principles for writing JavaScript that is a joy to read and maintain.',
  'https://picsum.photos/seed/clean-code-js/1200/630',
  false, id FROM users WHERE email = 'carlos@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Monorepos with pnpm Workspaces',
  '<p>Managing multiple packages in one repository used to require complex tooling. With pnpm workspaces, shared types, and Turborepo, you get fast installs, incremental builds, and clear dependency boundaries.</p>',
  'Set up a production-grade monorepo with pnpm workspaces and Turborepo.',
  'https://picsum.photos/seed/monorepo-pnpm/1200/630',
  false, id FROM users WHERE email = 'carlos@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Understanding the V8 Garbage Collector',
  '<p>Memory leaks in Node.js are sneaky. Understanding how V8''s generational GC works—young generation, old generation, and incremental marking—helps you write long-running services that stay healthy.</p>',
  'How V8 manages memory and what you can do to avoid leaks in Node.js applications.',
  'https://picsum.photos/seed/v8-gc-node/1200/630',
  false, id FROM users WHERE email = 'carlos@pinoblog.com' ON CONFLICT DO NOTHING;

-- ── maria@pinoblog.com  (6 posts) ───────────

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Building Reusable React Components',
  '<p>The key to a maintainable React codebase is component composability. We cover the compound component pattern, render props, and how to expose a clean API surface from a complex UI widget.</p>',
  'Patterns for building composable, reusable React components.',
  'https://picsum.photos/seed/react-components/1200/630',
  false, id FROM users WHERE email = 'maria@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'React Server Components Explained',
  '<p>React Server Components run on the server and stream HTML to the client—no client-side JavaScript, no hydration. They change how we think about data fetching, code splitting, and the boundary between server and client.</p>',
  'What React Server Components are, why they matter, and when to use them.',
  'https://picsum.photos/seed/rsc-explained/1200/630',
  false, id FROM users WHERE email = 'maria@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'State Management in 2025: Zustand vs Signals',
  '<p>Redux changed how we think about state. Zustand simplified it. Now Angular Signals and React''s upcoming compiler are changing the conversation again. This post compares the paradigms and helps you choose.</p>',
  'A practical comparison of modern React state management: Zustand, Jotai, and Signals.',
  'https://picsum.photos/seed/zustand-signals/1200/630',
  false, id FROM users WHERE email = 'maria@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Next.js App Router: Everything You Need to Know',
  '<p>The Next.js App Router introduced Server Components, Layouts, Loading UI, and the new file-system routing convention. This guide covers the mental model shift and common migration pitfalls.</p>',
  'The complete guide to Next.js 14+ App Router: routing, layouts, data fetching, and caching.',
  'https://picsum.photos/seed/nextjs-approuter/1200/630',
  false, id FROM users WHERE email = 'maria@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Styling React Apps with Tailwind v4',
  '<p>Tailwind v4 drops the config file in favor of CSS-native @theme tokens. PostCSS is out, Lightning CSS is in. This post covers the migration and shows how the new cascade layer approach simplifies theming.</p>',
  'What changed in Tailwind CSS v4 and how to migrate your existing project.',
  'https://picsum.photos/seed/tailwind-v4-react/1200/630',
  false, id FROM users WHERE email = 'maria@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Draft: Micro Frontends with Module Federation',
  '<p>Work in progress — covering Webpack Module Federation v2 and the new Rspack implementation.</p>',
  NULL,
  'https://picsum.photos/seed/micro-frontends/1200/630',
  true, id FROM users WHERE email = 'maria@pinoblog.com' ON CONFLICT DO NOTHING;

-- ── sofia@pinoblog.com  (6 posts) ───────────

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Docker for Node.js Developers',
  '<p>Containers solve the "works on my machine" problem once and for all. We build a production-ready Dockerfile for a NestJS app with multi-stage builds, non-root users, and health checks.</p>',
  'A practical Docker guide for Node.js and NestJS applications.',
  'https://picsum.photos/seed/docker-nodejs/1200/630',
  false, id FROM users WHERE email = 'sofia@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'CI/CD with GitHub Actions',
  '<p>GitHub Actions makes it easy to build, test, and deploy your application on every push. We set up a full pipeline: lint, test, build Docker image, and deploy to a cloud provider.</p>',
  'Set up a complete CI/CD pipeline for your Node.js app using GitHub Actions.',
  'https://picsum.photos/seed/cicd-github/1200/630',
  false, id FROM users WHERE email = 'sofia@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Kubernetes for the Skeptic',
  '<p>Kubernetes has a steep learning curve, but the core concepts are fewer than you think: Pods, Deployments, Services, and Ingress. We walk through deploying a real API without the marketing fluff.</p>',
  'The honest guide to deploying your first application on Kubernetes.',
  'https://picsum.photos/seed/kubernetes-skeptic/1200/630',
  false, id FROM users WHERE email = 'sofia@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Observability: Logs, Metrics, and Traces',
  '<p>Shipping code without observability is flying blind. We implement structured logging with Pino, expose Prometheus metrics, and add distributed tracing with OpenTelemetry—all inside NestJS.</p>',
  'Add production-grade observability to your NestJS API with Pino, Prometheus, and OpenTelemetry.',
  'https://picsum.photos/seed/observability-otel/1200/630',
  false, id FROM users WHERE email = 'sofia@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Zero-Downtime Deployments',
  '<p>Rolling updates, blue-green, and canary releases each solve a different flavor of the "ship without breaking users" problem. We compare strategies and implement rolling updates with Kubernetes.</p>',
  'Compare rolling, blue-green, and canary deployment strategies with real examples.',
  'https://picsum.photos/seed/zero-downtime/1200/630',
  false, id FROM users WHERE email = 'sofia@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Infrastructure as Code with Terraform',
  '<p>ClickOps does not scale. Terraform lets you describe infrastructure in HCL, plan changes before applying, and keep your cloud environment in version control alongside your application code.</p>',
  'Get started with Terraform to manage cloud infrastructure as code.',
  'https://picsum.photos/seed/terraform-iac/1200/630',
  false, id FROM users WHERE email = 'sofia@pinoblog.com' ON CONFLICT DO NOTHING;

-- ── andres@pinoblog.com  (5 posts) ──────────

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Clean Architecture in Node.js',
  '<p>Uncle Bob''s Clean Architecture proposes separating business logic from frameworks, databases, and delivery mechanisms. We apply it to a NestJS service with use cases, ports, and adapters—without over-engineering.</p>',
  'Apply Clean Architecture to a real NestJS project without over-engineering it.',
  'https://picsum.photos/seed/clean-arch-node/1200/630',
  false, id FROM users WHERE email = 'andres@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Domain-Driven Design: A Pragmatic Introduction',
  '<p>DDD is not about folder structures—it is about a shared language between developers and domain experts. We cover bounded contexts, aggregates, and value objects with a concrete example.</p>',
  'A pragmatic introduction to DDD concepts: bounded contexts, aggregates, and ubiquitous language.',
  'https://picsum.photos/seed/ddd-pragmatic/1200/630',
  false, id FROM users WHERE email = 'andres@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'From Side Project to Open Source',
  '<p>Opening your code to the world means thinking about documentation, contribution guidelines, semantic versioning, and community management. This is the story of my first OSS package and what I learned.</p>',
  'What I learned turning a side project into a maintained open-source package.',
  'https://picsum.photos/seed/side-project-oss/1200/630',
  false, id FROM users WHERE email = 'andres@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'The Senior Engineer Mindset',
  '<p>Seniority is not about knowing every API—it is about judgment: when to build vs buy, how to communicate uncertainty, and how to unblock the team. This post explores the invisible skills that matter most.</p>',
  'The technical and human skills that separate senior engineers from the rest.',
  'https://picsum.photos/seed/senior-engineer/1200/630',
  false, id FROM users WHERE email = 'andres@pinoblog.com' ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, cover_image, is_draft, author_id) SELECT
  'Draft: Event-Driven Architecture with NATS',
  '<p>Work in progress — exploring NATS JetStream for reliable event streaming between NestJS microservices.</p>',
  NULL,
  'https://picsum.photos/seed/event-driven-nats/1200/630',
  true, id FROM users WHERE email = 'andres@pinoblog.com' ON CONFLICT DO NOTHING;

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
