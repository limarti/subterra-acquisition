# AI Guidelines Reference

## 🤖 For AI Agents

**ALWAYS read relevant files BEFORE modifying code:**

- **Vue work** → Read `vue.md`
- **3D graphics/Three.js** → Read `threejs.md` 
- **TypeScript patterns** → Read `typescript.md`
- **Architecture decisions** → Read `architecture.md`

## 📊 Quick Decision Matrix

| Scenario | Read This File | Key Sections |
|----------|---------------|--------------|
| Creating Vue component | vue.md | Component Patterns, Conventions |
| Vue composable patterns | vue.md | Composables, State Management |
| Three.js integration | threejs.md | Vue Integration, Memory Management |
| TypeScript in Vue | typescript.md | Migration Strategy, Vue Component Types |
| Error handling patterns | architecture.md | Error Handling, Component Error Handling |
| Code extraction decisions | architecture.md | Code Extraction Principles |
| When to add comments | architecture.md | Code Style & Comments |

## 🎯 Hierarchy Rules

1. **Architecture patterns** (highest priority) - Core principles that affect all code
2. **Technology-specific patterns** (vue, threejs, typescript) - Implementation guidance
3. **Domain-specific patterns** - Applied on top of the above

## 📁 File Overview

| File | Lines | Purpose |
|------|-------|---------|
| **vue.md** | ~920 | Complete Vue.js patterns: components, composables, state management, testing, conventions |
| **threejs.md** | ~300 | Three.js + Vue integration: performance, memory management, TypeScript patterns |
| **typescript.md** | ~280 | TypeScript usage: migration strategy, type patterns, error types, type guards |
| **architecture.md** | ~350 | Architecture principles: error handling, code extraction, commenting guidelines |

## 💡 Usage Tips for AI Agents

### Before Code Modifications
1. **Identify the task type** from the decision matrix above
2. **Read the relevant file(s)** completely 
3. **Apply the patterns** shown in the guidelines
4. **Follow the AI Quick Reference** tables in each file

### Multiple File Scenarios
- **Vue component with TypeScript**: Read vue.md + typescript.md
- **Three.js with error handling**: Read threejs.md + architecture.md  
- **Complex Vue feature**: Read vue.md + architecture.md

### Pattern Priority
When patterns conflict or overlap:
1. **Architecture principles** override technology-specific patterns
2. **Explicit guidelines** override general conventions
3. **Recent examples** in guidelines represent current best practices

## 🎯 Success Criteria

After reading guidelines, you should be able to:
- Choose the right architectural pattern for the task
- Write code that follows established conventions
- Handle errors appropriately for the context
- Make informed extraction/abstraction decisions
- Apply TypeScript patterns correctly in Vue components

Remember: These guidelines optimize for maintainability, consistency, and developer productivity. When in doubt, favor simpler solutions over complex abstractions.