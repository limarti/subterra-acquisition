# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**⚠️ MANDATORY**: Before starting ANY coding task, Claude Code MUST read the relevant guidelines from `Frontend/docs/guidelines/`. These docs contain essential patterns, anti-patterns, and architectural principles that must be followed.

## Project Structure

This is a fullstack application with two main components:

- **Frontend/**: Vue.js 3 + TypeScript + Capacitor mobile app
- **Backend/**: .NET 8 ASP.NET Core WebSocket-to-TCP bridge server

## Development Commands

### Frontend (Vue.js App)
```bash
cd Frontend
```

**Setup:**
- Use Node.js 22.14.0 (run `nvm use` to switch)
- Run `npm install` to install dependencies

**Development:**
- `npm run dev:web` - Start web development server
- `npm run dev:android` - Open Android Studio for mobile development
- `npm run dev:ios` - Open Xcode for iOS development

**Build & Test:**
- `npm run build` - Build for production (includes mobile sync + Android configuration)
- `npm run test:unit` - Run Vitest unit tests
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint with auto-fix

**Android Configuration:**
- `scripts/configure-android.js` - Automatically configures Android settings after sync
  - App category: Tools (PRODUCTIVITY)
  - Screen orientation: sensor (follows device)
  - Minimum SDK version: 25
- Script runs automatically after `npm run build` via `build-mobile` command

### Backend (.NET Server)
```bash
cd Backend
```

**Development:**
- `dotnet run` - Start the WebSocket-TCP bridge server
- `dotnet build` - Build the project
- `dotnet test` - Run tests (if any)

**🚨 MANDATORY COMMIT AGENT WORKFLOW:**
After ANY file modification (Edit, MultiEdit, Write):
1. IMMEDIATELY invoke geo-commit-message-agent
2. Present commit message EXACTLY as returned (no modifications). **ABSOLUTELY FORBIDDEN:**:
  - ❌ Changing or rewording the commit message itself
  - ❌ Adding "Generated with [Claude Code]" attribution 
  - ❌ Adding "Co-Authored-By: Claude" lines
  - ❌ Modifying punctuation, capitalization, or formatting of the commit message
  - ❌ Adding or removing any text from the commit message
3. Wait for user approval before proceeding
4. NEVER auto-commit - user must explicitly approve

**If you just modified files and haven't invoked commit agent = IMMEDIATE VIOLATION**

---

## Architecture Overview

### Frontend Architecture

**Service Architecture**: Plugin-based dependency injection system using Vue.js plugins
- Services are registered via `app.use()` and injected using Vue's `inject()` API
- Environment-based factories instantiate different implementations (Debug vs Capacitor)
- Socket and File services use interface-based abstraction

**Key Service Patterns:**
- **Socket Service**: WebSocket bridge (debug) vs TCP direct connection (production)
- **File Service**: localStorage (debug) vs Capacitor Filesystem (production)
- **Composables**: `useSocketConnection`, `useFileManager`, `useSocketMessageHandler`

**Key Directories:**
- `src/services/socket/` - Socket connection abstraction and implementations
- `src/services/files/` - File management with platform-specific implementations
- `src/services/radar/` - Radar-specific business logic and data types
- `src/features/` - Feature-based component organization
- `src/components/` - Global reusable components
- `src/stores/` - Pinia state management
- `src/utils/` - Shared utility functions

### Backend Architecture

**WebSocket-TCP Bridge**: .NET server that bridges WebSocket connections to TCP
- Accepts WebSocket connections at `/ws` endpoint
- Routes messages to TCP server at `192.168.56.101:5088`
- Handles bidirectional message forwarding

### Technology Stack

**Frontend:**
- Vue.js 3 with Composition API
- TypeScript with strict typing
- Capacitor for mobile deployment
- Pinia for state management
- Vite for build tooling
- Vitest for testing

**Backend:**
- .NET 8 ASP.NET Core
- WebSocket support
- TCP client connectivity

## Development Environment

- **Node.js**: 22.14.0 (specified in `.nvmrc`)
- **Package Manager**: npm (with Node.js 22.14.0)
- **Mobile Development**: Android Studio + Xcode
- **Build Tool**: Vite with Terser minification

## Code Style & Guidelines

**CRITICAL**: All detailed coding guidelines are located in `Frontend/docs/guidelines/`. Claude Code must read these docs before implementing any patterns.

**Basic Style (detailed patterns in docs):**
- **Indentation**: 2 spaces (enforced by ESLint)
- **Brace Style**: Allman style (`{` on new line)
- **Vue Components**: Template-script-style block order enforced
- **Styling**: ALWAYS use Tailwind CSS classes for styling (see Vue Conventions doc)

### 📋 Comprehensive Coding Guidelines

**⚠️ CRITICAL FOR CLAUDE CODE**: Before starting ANY work (planning, analysis, development, or implementation), you MUST read ALL guidelines from `Frontend/docs/guidelines/`. Use the Glob tool to discover all `.md` files in this directory and read EVERY SINGLE ONE completely.

**🚨 ABSOLUTE MANDATORY WORKFLOW FOR CLAUDE CODE - NO EXCEPTIONS**:
1. **DISCOVER ALL**: Use `Glob` tool to find ALL guideline files in `Frontend/docs/guidelines/**/*.md`
2. **READ EVERY SINGLE FILE**: Read EVERY discovered guideline file completely - NO EXCEPTIONS, NO SELECTIVE READING
3. **CONFIRM COMPLETION**: State "I have read all [X] guideline files" where X is the exact count
4. **APPLY ALL PATTERNS**: Use patterns from ALL guidelines, not just "relevant" ones
5. **CHECK ALL ANTI-PATTERNS**: Review anti-pattern sections from ALL guidelines
6. **VERIFY COMPLIANCE**: Confirm adherence to ALL guideline requirements before any implementation

**🚨 VIOLATION DETECTION**: If Claude Code says "relevant guidelines" or "applicable guidelines" instead of reading ALL guidelines = IMMEDIATE PROTOCOL VIOLATION


## Development Workflow

### Task Subdivision
When working on any task or feature:
- Break down tasks into the smallest possible logical subtasks
- Each subtask should be:
  - Independently testable when possible
  - Small enough to complete in one focused session
  - Logically coherent (complete a specific function/component/feature piece)
- Prioritize subtasks so that earlier ones provide foundation for later ones
- Start with small tasks with low risk when possible

### Clarification Before Implementation
- Review tasks for ambiguity or missing information
- **When working on subdivided tasks**: ONLY ask clarifying questions that are ABSOLUTELY NECESSARY for the current subtask
  - Focus ONLY on what's needed for the immediate work
  - NEVER ask about later subtasks - defer ALL questions until you reach them
  - This prevents overwhelming the user with too many questions at once
  - Example: If subtask 1 is "rename Dashboard to Welcome" and subtask 3 is "add radar status display", don't ask about radar fields until you reach subtask 3
  - **IMPORTANT**: If the current subtask can be implemented without clarification (e.g., simple renaming), proceed without asking questions
- For any unclear aspects of the current subtask that BLOCK implementation, ask specific clarifying questions:
  - Technical implementation details (e.g., "Should this use WebSocket or REST API?")
  - UI/UX specifics (e.g., "What should happen when the user clicks cancel?")
  - Data formats or structures (e.g., "What fields should the response include?")
  - Error handling (e.g., "How should we handle network timeouts?")
  - Integration points (e.g., "Which existing services should this connect to?")
- Present clarifying questions for the current subtask together to minimize back-and-forth
- Don't make assumptions about ambiguous requirements

### Pause-Driven Development - MANDATORY
- Work on ONE subtask at a time
- **MANDATORY: STOP after each subtask completion and wait for user confirmation**
- If a subtask turns out to be too large during implementation, further subdivide it

#### MANDATORY Subtask Completion Flow
**You MUST follow this exact sequence after completing each subtask:**

1. ✅ **Mark subtask as completed in todo list**
2. 📋 **Provide completion summary** ("What I implemented:")
3. 🧪 **Give testing instructions** ("Testing Instructions:")
4. **Follow commit guidelines** (see [🚨 COMMIT GUIDELINES](#-commit-guidelines---mandatory) section)
5. ⏸️ **MANDATORY STOP and ask**: "Should I continue with the next subtask?"

**Key principle: ALWAYS pause when app reaches a stable, functional state - even if it's mid-way through related subtasks.**

### Standard Development Checklist
After implementing features, always run:
1. **Testing**: `npm run test:unit` (if applicable)
2. **Type checking**: `npm run type-check`
3. **Linting**: `npm run lint`
4. **Build verification**: `npm run build`

## Git Commit Process

**NEVER create commits on behalf of the user. Always suggest commits only.**

For detailed commit guidelines, see the [🚨 COMMIT GUIDELINES - MANDATORY](#-commit-guidelines---mandatory) section at the top of this document.


## Mobile Development

- **Target Platforms**: Android and iOS via Capacitor
- **Config**: `capacitor.config.ts` (app ID: `com.gla`)
- **Build**: `npm run build` automatically syncs mobile platforms
- **TCP Plugin**: Uses `capacitor-tcp-socket` for direct TCP connections in production