# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm start:dev          # Watch mode
pnpm start:debug        # Debug + watch mode

# Build
pnpm build              # Compile to dist/

# Tests
pnpm test               # All unit tests
pnpm test:watch         # Watch mode
pnpm test:cov           # With coverage
pnpm test:e2e           # End-to-end tests (requires running DB)

# Single test file
pnpm test -- --testPathPattern=posts.service

# Code quality
pnpm lint               # ESLint with autofix
pnpm format             # Prettier

# Infrastructure
docker compose up -d    # Start PostgreSQL (5432) + PgAdmin (5050)
```

## Architecture

NestJS REST API for a blog, using TypeORM + PostgreSQL. Two feature modules: `users` and `posts`.

```
src/
├── app.module.ts           # Root: ConfigModule, TypeOrmModule, UsersModule, PostsModule
├── main.ts                 # Global ValidationPipe + TypeOrmExceptionFilter
├── env.model.ts            # Typed interface for process.env
├── common/filters/         # TypeormExceptionFilter — maps PG errors to HTTP responses
├── users/                  # Flat structure: controller, service, dtos/, entities/
└── posts/                  # Nested structure: controllers/, services/, dto/, entities/
```

### Entity Relationships

```
User (1) ──── (1) Profile   [OneToOne, cascade, join: profile_id]
User (1) ──── (*) Post      [OneToMany via post.author]
Post (*) ──── (1) User      [ManyToOne, join: author_id]
Category                    # Has full CRUD (/categories) but no relation to Post entity yet
```

All entities use `@PrimaryGeneratedColumn()` (UUID not used) and `timestamptz` for timestamps.

### Key Conventions

- **TypeORM sync**: `synchronize: true` in dev — no migrations, schema auto-updates on start
- **Validation**: Global `ValidationPipe` with `transform: true`, `whitelist: true`, `forbidNonWhitelisted: true`
- **DTOs**: `UpdateDto extends PartialType(CreateDto)` pattern. `users` imports `PartialType` from `@nestjs/mapped-types`; `posts` imports it from `@nestjs/swagger` — both work but are inconsistent.
- **Swagger**: `@ApiProperty()` decorators on all DTO fields
- **Formatting**: Run `pnpm run format` after any multi-file edit to avoid Prettier lint failures
- **Error handling**: `TypeOrmExceptionFilter` handles PG unique violations and other DB errors globally

### Environment Variables

Defined in `src/env.model.ts` and loaded from `.env`:

```
POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, PORT
```

Docker Compose defaults: host=localhost, port=5432, db=my_blog_db, user=blog_user, password=blog_password.

## Notes

- The `posts` module uses a nested folder structure (`controllers/`, `services/`) while `users` is flat — there's no project-wide convention yet.
- `Category` has full CRUD via `CategoriesController` + `CategoriesService` but no `ManyToMany` relation to `Post` yet.
- Test coverage is minimal (placeholder `should be defined` tests only).
