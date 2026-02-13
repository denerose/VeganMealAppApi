<!--
SYNC IMPACT REPORT
==================
Version Change: 1.0.0 → 1.1.0
Change Type: MINOR (new principles added)
Rationale: Added Domain Driven Design principle and Vegan-First Testing principle to expand governance framework

Modified Principles: None
Added Sections:
  - VI. Domain Driven Design (new core principle)
  - VII. Vegan-First Testing & Examples (new core principle)

Templates Requiring Updates:
  ✅ plan-template.md - verified alignment with constitution checks
  ✅ spec-template.md - verified alignment with testability and domain requirements
  ✅ tasks-template.md - verified alignment with test-first and modular task structure
  ⚠️  All example code and tests - MUST use vegan diet examples going forward

Follow-up TODOs:
  - Review existing examples/tests to align with vegan-first principle (if any exist)
-->

# VeganMealAppApi Constitution

## Core Principles

### I. Code Quality Standards

Code MUST be clean, readable, and maintainable. Every code artifact MUST meet these non-negotiable standards:

- **Clarity Over Cleverness**: Code MUST be self-documenting with meaningful names; comments explain WHY, not WHAT
- **Single Responsibility**: Each class, function, or module MUST do one thing well; violations require architectural review
- **DRY Principle**: No logic duplication; extract shared code into reusable components
- **SOLID Principles**: All code MUST adhere to SOLID principles (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion)
- **Consistent Style**: Code formatting and conventions MUST be enforced via automated linters (no manual enforcement)
- **Code Reviews Required**: All changes MUST pass peer review verifying adherence to quality standards

**Rationale**: High code quality reduces bugs, accelerates feature development, and minimizes technical debt. Clean code is easier to test, refactor, and extend.

### II. Clean Architecture

System architecture MUST enforce separation of concerns and independence of business logic from infrastructure:

- **Layer Separation**: Business logic MUST NOT depend on frameworks, databases, or external services; dependencies point inward
- **Domain-First Design**: Core domain models MUST be framework-agnostic; they define the business rules
- **Interface Boundaries**: External dependencies (databases, APIs, file systems) MUST be accessed via interfaces/abstractions
- **Testability by Design**: Business logic MUST be testable in isolation without requiring infrastructure (no database, no network)
- **Minimal Cross-Layer Coupling**: Controllers/UI → Use Cases → Domain; violations require justification

**Rationale**: Clean architecture enables independent testing, technology flexibility, and long-term maintainability. Business logic remains stable while infrastructure can evolve.

### III. Simple Regression Testing (NON-NEGOTIABLE)

Testing MUST be simple, fast, and focused on preventing regressions:

- **Test-First Development**: Tests MUST be written BEFORE implementation; tests fail first, then code makes them pass
- **Unit Test Coverage**: All business logic MUST have unit tests; minimum 80% coverage enforced
- **Fast Feedback**: Unit test suite MUST run in under 30 seconds; slow tests are refactored or moved to integration
- **Readable Tests**: Tests MUST follow Given-When-Then or Arrange-Act-Assert; test names describe the scenario
- **No Flaky Tests**: Tests MUST be deterministic; flaky tests are treated as broken and fixed immediately
- **Regression Safety**: All bug fixes MUST include a test that reproduces the bug before fixing it

**Rationale**: Simple, fast tests encourage frequent execution, catch bugs early, and serve as living documentation. Test-first development ensures code is designed for testability.

### IV. Modular Code & Dependency Injection

Code MUST be modular with explicit, manageable dependencies:

- **Constructor Injection**: Dependencies MUST be injected via constructors (no service locators, no global state)
- **Interface-Based Dependencies**: Classes MUST depend on interfaces/abstractions, not concrete implementations
- **Explicit Dependencies**: All dependencies MUST be visible in constructor signatures; hidden dependencies are violations
- **Composition Over Inheritance**: Favor composition and interfaces over class inheritance hierarchies
- **IoC Container Usage**: Dependency wiring MUST be centralized in composition root; business logic MUST NOT reference DI framework
- **Module Boundaries**: Each module MUST have clear public interfaces; internal implementation details MUST be encapsulated

**Rationale**: Dependency injection enables isolated testing, flexible composition, and clear dependency graphs. Modular design reduces coupling and enables parallel development.

### V. Performance Requirements

System MUST meet measurable performance standards:
### V. Performance Requirements

System MUST meet measurable performance standards:

- **API Response Time**: P95 latency MUST be under 200ms for all endpoints under normal load
- **Database Queries**: N+1 queries are violations; use eager loading or batching; queries MUST be indexed appropriately
- **Resource Efficiency**: Memory usage MUST NOT grow unbounded; implement pagination for large datasets
- **Async Operations**: Long-running operations (>1s) MUST be asynchronous with status tracking
- **Caching Strategy**: Frequently accessed, slowly changing data MUST be cached; cache invalidation MUST be explicit
- **Performance Testing**: Performance benchmarks MUST exist for critical paths; regressions MUST be caught in CI

**Rationale**: Performance impacts user experience directly. Proactive performance standards prevent degradation and ensure scalability.

### VI. Domain Driven Design

System design MUST follow Domain Driven Design principles to align software with business domain:

- **Ubiquitous Language**: Code MUST use the same terminology as domain experts; class/method names reflect business concepts (e.g., `DayPlan`, `Meal`, `Ingredient`, `MealQualities`)
- **Bounded Contexts**: Each domain area MUST have clear boundaries; contexts communicate via well-defined interfaces
- **Aggregates**: Related entities MUST be grouped into aggregates with a single root; consistency boundaries enforced at aggregate level
- **Value Objects**: Immutable domain concepts (e.g., `MealQualities`, `StorageType`) MUST be modeled as value objects, not primitives
- **Domain Events**: Significant business events MUST be modeled explicitly (e.g. `MealPlanned`, `WeekGenerated`)
- **Repository Pattern**: Domain objects MUST be persisted/retrieved via repositories that hide infrastructure concerns

**Rationale**: DDD ensures the codebase accurately reflects business logic, improves communication between technical and domain experts, and creates a maintainable model that evolves with business needs.

### VII. Vegan-First Testing & Examples

All code examples, test data, and documentation MUST assume a vegan diet:

- **Test Data**: Sample recipes, ingredients, and meals MUST be 100% plant-based (no meat, dairy, eggs, honey, or animal-derived ingredients)
- **Example Scenarios**: User stories and test scenarios MUST feature vegan meals (e.g., "tofu scramble", "lentil curry", "cashew cheese")
- **Documentation Examples**: API examples, quickstart guides, and code samples MUST use vegan meals and recipe data
- **Ingredient Validation**: Any ingredient databases or validation logic MUST flag non-vegan items appropriately

**Rationale**: This is a VeganMealApp - consistency in examples and tests ensures the application remains aligned with its core purpose and prevents confusion or inappropriate content.

## Performance Standards
- **API Endpoints**: <200ms P95 latency, <500ms P99 latency
- **Database Operations**: Queries optimized with indexes, <100ms execution time
- **Memory Usage**: Bounded growth, no memory leaks, pagination for collections >1000 items
- **Throughput**: System MUST handle 1000 concurrent requests with degradation <10%
- **Cold Start**: Application startup MUST complete in <10 seconds

Performance violations MUST be justified and documented with mitigation plans.

## Development Workflow

All development MUST follow this workflow to ensure constitution compliance:

### Quality Gates

1. **Design Review**: Architecture MUST be reviewed against Clean Architecture principles before implementation
2. **Test-First Gate**: Tests MUST be written and approved before implementation begins
3. **Code Review Gate**: All changes MUST pass peer review for code quality, modularity, and dependency injection standards
4. **Test Coverage Gate**: Unit test coverage MUST be ≥80%; uncovered code requires justification
- **Review Cadence**: Constitution MUST be reviewed quarterly for relevance and effectiveness
- **Complexity Justification**: Deviations from principles MUST be documented in implementation plans with architectural justification

1. **Spec → Plan → Tests**: Feature specification → Implementation plan → Write tests (tests fail)
2. **Implement**: Write minimum code to make tests pass (Red-Green-Refactor cycle)
3. **Review**: Peer review verifying constitution compliance
4. **Merge**: Only after all gates pass

### Tools & Automation

- **Unified Check Script**: Format, lint, and tests MUST be verified using `./scripts/check.sh` (or `bun run check`). Agents and developers MUST NOT run `format:check`, `lint`, or `test` individually when validating changes; the check script reports only errors and failures, keeping context smaller and feedback actionable.
- **Linting**: Automated code style enforcement (no manual style reviews)
- **CI Pipeline**: Automated test execution, coverage reporting, performance benchmarks
- **Static Analysis**: Dependency analysis, architecture validation, code quality metrics

## Governance

This constitution is the supreme authority for all development practices:

- **Compliance Required**: All code changes MUST comply with constitution principles; violations MUST be justified in writing and approved by technical lead
- **Amendment Process**: Constitution changes require proposal, team review, approval, and version increment (see versioning rules below)
- **Version Increment Rules**:
  - **MAJOR**: Principle removal, backward-incompatible governance changes (e.g., removing a core principle)
  - **MINOR**: New principle added, materially expanded guidance (e.g., adding a new core principle)
  - **PATCH**: Clarifications, wording improvements, non-semantic fixes (e.g., fixing typos, clarifying existing rules)
- **Review Cadence**: Constitution MUST be reviewed quarterly for relevance and effectiveness
- **Complexity Justification**: Deviations from principles MUST be documented in implementation plans with architectural justification

**Version**: 1.1.1 | **Ratified**: 2025-12-30 | **Last Amended**: 2026-02-13
