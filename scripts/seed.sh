#!/usr/bin/env bash
# Seed the blog database with sample data.
# Passwords are bcrypt-hashed via the backend's bcrypt dependency.
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
BACKEND_DIR="$SCRIPT_DIR/../apps/backend"

echo "→ Generating bcrypt hashes (salt rounds: 10)…"

hash_password() {
  (
    cd "$BACKEND_DIR"
    node -e "require('bcrypt').hash('$1', 10).then(h => process.stdout.write(h))"
  )
}

ADMIN_HASH=$(hash_password 'Admin1234!')
WRITER_HASH=$(hash_password 'Writer1234!')

echo "→ Connecting to $PGUSER@$PGHOST:$PGPORT/$PGDATABASE"

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" <<SQL

-- ─────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────
INSERT INTO profiles (first_name, last_name, avatar_url)
VALUES
  ('Admin',  'User',   NULL),
  ('Maria',  'García', NULL)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- USERS  (profile_id comes from the rows above)
-- ─────────────────────────────────────────────
-- role enum values: 'user' | 'admin'
INSERT INTO users (email, password, role, profile_id)
SELECT
  'admin@blog.com',
  '$ADMIN_HASH',
  'admin'::user_role_enum,
  id
FROM profiles WHERE first_name = 'Admin' AND last_name = 'User'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, role, profile_id)
SELECT
  'writer@blog.com',
  '$WRITER_HASH',
  'user'::user_role_enum,
  id
FROM profiles WHERE first_name = 'Maria' AND last_name = 'García'
ON CONFLICT (email) DO NOTHING;

-- ─────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────
INSERT INTO categories (name, description, cover_image)
VALUES
  ('Technology',  'General technology topics',              NULL),
  ('JavaScript',  'JS ecosystem — runtimes, frameworks',    NULL),
  ('TypeScript',  'Type-safe JS development',               NULL),
  ('NestJS',      'Building APIs with NestJS',              NULL),
  ('React',       'Component-driven UIs with React',        NULL)
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────
-- POSTS  (author = admin user)
-- ─────────────────────────────────────────────
INSERT INTO posts (title, content, summary, is_draft, author_id)
SELECT
  'Getting Started with NestJS',
  '<p>NestJS is a progressive Node.js framework built with TypeScript. It leverages decorators, modules, and dependency injection to produce well-structured, testable server-side applications.</p><p>In this article we will scaffold a new project, build a simple REST endpoint, and wire up TypeORM to a PostgreSQL database.</p>',
  'A hands-on introduction to NestJS — modules, controllers, services, and TypeORM.',
  false,
  u.id
FROM users u WHERE u.email = 'admin@blog.com'
ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, is_draft, author_id)
SELECT
  'TypeScript Generics in Practice',
  '<p>Generics are one of TypeScript''s most powerful features, yet many developers avoid them out of fear of complexity. This article breaks down generics with real-world examples: typed API clients, reusable collection utilities, and conditional types.</p>',
  'Demystifying TypeScript generics with practical, real-world examples.',
  false,
  u.id
FROM users u WHERE u.email = 'admin@blog.com'
ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, is_draft, author_id)
SELECT
  'Why I Switched from Express to NestJS',
  '<p>After three years of Express applications I made the switch to NestJS. This is the story of why: opinionated structure, first-class TypeScript support, and a thriving ecosystem of official modules.</p>',
  'A migration story: from bare Express to structured NestJS.',
  false,
  u.id
FROM users u WHERE u.email = 'admin@blog.com'
ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, is_draft, author_id)
SELECT
  'Building Reusable React Components',
  '<p>The key to a maintainable React codebase is component composability. We will cover the compound component pattern, render props, and how to expose a clean API surface from a complex UI widget.</p>',
  'Patterns for building composable, reusable React components.',
  false,
  u.id
FROM users u WHERE u.email = 'writer@blog.com'
ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, is_draft, author_id)
SELECT
  'JavaScript Event Loop Demystified',
  '<p>The event loop is the heart of Node.js and the browser runtime. Understanding call stack, microtask queue, and macrotask queue will make you a better async programmer and help you avoid subtle bugs.</p>',
  'A visual walkthrough of the JavaScript event loop.',
  false,
  u.id
FROM users u WHERE u.email = 'writer@blog.com'
ON CONFLICT DO NOTHING;

INSERT INTO posts (title, content, summary, is_draft, author_id)
SELECT
  'Draft: Advanced TypeORM Relations',
  '<p>Work in progress — covering OneToMany, ManyToMany with custom join tables, and eager vs lazy loading strategies.</p>',
  NULL,
  true,
  u.id
FROM users u WHERE u.email = 'admin@blog.com'
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- POSTS ↔ CATEGORIES  (join table)
-- ─────────────────────────────────────────────
INSERT INTO posts_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p, categories c
WHERE p.title = 'Getting Started with NestJS'
  AND c.name IN ('NestJS', 'TypeScript', 'Technology')
ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p, categories c
WHERE p.title = 'TypeScript Generics in Practice'
  AND c.name IN ('TypeScript', 'JavaScript')
ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p, categories c
WHERE p.title = 'Why I Switched from Express to NestJS'
  AND c.name IN ('NestJS', 'Technology')
ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p, categories c
WHERE p.title = 'Building Reusable React Components'
  AND c.name IN ('React', 'JavaScript', 'TypeScript')
ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p, categories c
WHERE p.title = 'JavaScript Event Loop Demystified'
  AND c.name IN ('JavaScript', 'Technology')
ON CONFLICT DO NOTHING;

INSERT INTO posts_categories (post_id, category_id)
SELECT p.id, c.id
FROM posts p, categories c
WHERE p.title = 'Draft: Advanced TypeORM Relations'
  AND c.name IN ('NestJS', 'TypeScript')
ON CONFLICT DO NOTHING;

SQL

echo ""
echo "✓ Seed complete."
echo ""
echo "  Credentials:"
echo "    admin@blog.com   / Admin1234!"
echo "    writer@blog.com  / Writer1234!"
