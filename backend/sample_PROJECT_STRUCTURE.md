# Project Structure Documentation

## Project Overview

**StudentTracker** is a NestJS-based REST API application for managing students and projects. It provides endpoints for user management and project registration with role-based access control.

## Directory Tree

```
studentTracker/
├── src/                          # Source code
│   ├── main.ts                   # Application entry point
│   ├── app.module.ts             # Root module
│   ├── app.controller.ts        # Root controller
│   ├── app.service.ts           # Root service
│   ├── app.controller.spec.ts    # Root controller tests
│   ├── common/                  # Shared code
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts
│   │   ├── guards/
│   │   │   └── roles.guard.ts
│   │   └── enums/
│   │       ├── role.enum.ts     # User roles (STUDENT, MENTOR, ADMIN)
│   │       └── projectType.enum.ts
│   ├── users/                    # Users feature module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── user.interface.ts
│   │   ├── users.controller.spec.ts
│   │   ├── users.service.spec.ts
│   │   └── DTO/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   └── projects/                  # Projects feature module
│       ├── projects.module.ts
│       ├── projects.controller.ts
│       ├── projects.service.ts
│       ├── project.repository.ts
│       ├── eligibility.service.ts
│       ├── projects.interface.ts
│       ├── projects.controller.spec.ts
│       ├── projects.service.spec.ts
│       └── DTO/
│           ├── register-project.dto.ts
│           └── add-meeting.dto.ts
├── test/                         # E2E tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── dist/                         # Compiled output (generated)
├── package.json                 # Dependencies & scripts
├── package-lock.json            # Locked dependencies
├── tsconfig.json               # TypeScript config
├── tsconfig.build.json        # TypeScript build config
├── nest-cli.json               # NestJS CLI config
├── eslint.config.mjs           # ESLint config
├── .prettierrc                # Prettier config
├── .gitignore                 # Git ignore rules
└── README.md                  # Project readme
```

## Component Explanations

### Root Level Files

| File | Purpose |
|------|---------|
| `src/main.ts` | Application bootstrap & server initialization |
| `src/app.module.ts` | Root module importing UsersModule and ProjectsModule |
| `src/app.controller.ts` | Root controller (home route) |
| `src/app.service.ts` | Root service for app-level logic |
| `package.json` | NPM package config with dependencies and scripts |
| `nest-cli.json` | NestJS CLI configuration |
| `tsconfig.json` | TypeScript compiler options |
| `eslint.config.mjs` | ESLint linting rules |
| `.prettierrc` | Code formatting rules |

### Common Module (`src/common/`)

Shared utilities used across modules:

- **decorators/roles.decorator.ts** - Custom decorator for role-based access control
- **guards/roles.guard.ts** - Route guard for role verification
- **enums/role.enum.ts** - User role definitions (`STUDENT`, `MENTOR`, `ADMIN`)
- **enums/projectType.enum.ts** - Project type definitions

### Users Module (`src/users/`)

Feature module for user management:

| File | Purpose |
|------|---------|
| `users.module.ts` | NestJS module definition |
| `users.controller.ts` | REST endpoints for user operations |
| `users.service.ts` | Business logic for users |
| `users.repository.ts` | Data access layer |
| `user.interface.ts` | TypeScript interface for User |
| `create-user.dto.ts` | Validation DTO for creating users |
| `update-user.dto.ts` | Validation DTO for updating users |

### Projects Module (`src/projects/`)

Feature module for project management:

| File | Purpose |
|------|---------|
| `projects.module.ts` | NestJS module definition |
| `projects.controller.ts` | REST endpoints for project operations |
| `projects.service.ts` | Business logic for projects |
| `project.repository.ts` | Data access layer |
| `eligibility.service.ts` | Student eligibility checking logic |
| `projects.interface.ts` | TypeScript interface for Project |
| `register-project.dto.ts` | DTO for project registration |
| `add-meeting.dto.ts` | DTO for scheduling meetings |

### Tests

| File | Purpose |
|------|---------|
| `src/*/*.spec.ts` | Unit tests (jest) |
| `test/app.e2e-spec.ts` | End-to-end tests |
| `test/jest-e2e.json` | E2E Jest configuration |

## Module Relationships

```
AppModule
├── UsersModule (via UsersModule import)
│   └── UsersService
│   ├── UsersController (HTTP endpoints)
│   └── UserRepository (data access)
└── ProjectsModule (via UsersModule import)
    ├── ProjectsService
    ├── ProjectsController (HTTP endpoints)
    ├── ProjectRepository (data access)
    ├── ElibilityService (depends on UsersModule)
    └── UsersModule (imported for user reference)
```

## Issues & Suggestions

### 1. Naming Inconsistency
- `eligibility.service.ts` is misspelled as `elibility.service.ts`
- **Fix**: Rename to `eligibility.service.ts`

### 2. Shared Code Organization
`src/common/` exists but could be relocated to a proper shared module:
- **Suggestion**: Create `src/shared/` or `src/common/` as an importable module
- OR: Move to `libs/` directory as per NestJS best practices

### 3. Missing Index Files
No barrel files (`index.ts`) for clean imports:
- **Suggestion**: Add `index.ts` exports in each module

### 4. DTO Organization
DTOs are inside feature modules:
- **Suggestion**: Consider `src/common/dto/` for shared DTOs

### 5. Root Controller Minimal
The root `AppController` only serves as a home route:
- **Suggestion**: Move to a dedicated `health` or `app` module

### 6. Test Organization
E2E tests in `/test` but unit tests inline:
- **Suggestion**: Keep current pattern (standard in NestJS)

### 7. Missing Environment Config
No environment configuration files:
- **Suggestion**: Add `@nestjs/config` and `.env.example`

### 8. No Database Setup
No database configuration visible:
- **Suggestion**: Add TypeORM/Prisma if persistence is needed

## Summary

This is a well-structured NestJS application following standard conventions. The main improvements would be:
1. Fixing the typo in `eligibility.service.ts`
2. Adding environment configuration support
3. Consider database integration for persistence