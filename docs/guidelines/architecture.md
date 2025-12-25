# Architecture & Patterns Guidelines

## 🚀 AI Quick Reference

| Problem | Solution | Section |
|---------|----------|---------|
| When to throw vs handle errors | Data corruption = throw, empty state = handle | [Fail Loudly vs Handle Gracefully](#11-fail-loudly-vs-handle-gracefully) | 
| Should I extract this code? | Rule of Three + decision framework | [Decision Framework](#23-decision-framework) |
| Error type organization | Custom error class hierarchy | [Error Type Hierarchy](#12-error-type-hierarchy) |
| When to add comments | Only for WHY, not WHAT | [When Comments Are Valuable](#32-when-comments-are-valuable) |
| Component error handling | Loading/error/success state pattern | [Component Error Handling](#14-component-error-handling) |
| Global error management | App-level error handler + logging | [Global Error Handler](#42-global-error-handler) |
| Self-documenting code | Clear naming eliminates most comments | [Self-Documenting Code](#31-self-documenting-code) |
| Magic values in code | Extract to named constants | [Constants and Magic Values](#33-constants-and-magic-values) |
| Iteration pattern choice | Use for...of over forEach | [Prefer for...of Over forEach](#51-prefer-forof-over-foreach) |
| Need early loop termination | for...of with break/continue/return | [Control Flow Advantages](#control-flow-advantages) |
| Processing large datasets | for...of for early exit benefits | [Real-World Performance Impact](#real-world-performance-impact) |

This guide establishes architecture patterns, error handling strategies, and code extraction principles for building maintainable applications.

## 🎯 Core Principles

- **Self-Documenting Code**: Write code that explains itself through clear naming and structure
- **Fail Fast, Fail Gracefully**: Detect errors early and handle them gracefully without breaking the user experience
- **Extract Only When Needed**: Start inline and direct. Extract only when you have proven reuse or clear separation of concerns
- **Consistency**: Maintain consistent patterns throughout the codebase

## 1. Error Handling

### 1.1 Fail Loudly vs Handle Gracefully

**Critical Distinction**: Understand when to fail loudly vs handle gracefully.

#### **Fail Loudly - Data Corruption**
When data structure itself is broken or violates expected contracts:

```typescript
// ❌ FAIL LOUDLY: Expected array, got wrong type
if (!Array.isArray(response.users))
{
    throw new DataCorruptionError(`Expected array, got: ${typeof response.users}`);
}

// ❌ FAIL LOUDLY: Required field missing from API
if (!response.user?.id)
{
    throw new DataCorruptionError('User ID missing from API response');
}

// ❌ FAIL LOUDLY: Malformed data structure
if (user.categories && !Array.isArray(user.categories))
{
    throw new DataCorruptionError('User categories must be an array');
}
```

#### **Handle Gracefully - Valid Empty States**
When data structure is correct but happens to be empty or missing:

```typescript
// ✅ HANDLE GRACEFULLY: Valid empty array
if (users.length === 0)
{
    // Show empty state UI - this is normal business logic
    return <EmptyUsersState />;
}

// ✅ HANDLE GRACEFULLY: Optional field missing
if (!user.avatar)
{
    // Use default avatar - this is expected
    return DEFAULT_AVATAR_URL;
}

// ✅ HANDLE GRACEFULLY: User input errors
if (!email.includes('@'))
{
    setValidationError('Please enter a valid email address');
    return;
}
```

#### **Decision Framework**
- [ ] **Is the data structure broken?** → Fail loudly (throw error)
- [ ] **Is the data structure valid but empty?** → Handle gracefully (show UI)
- [ ] **Is this a user/network error?** → Handle gracefully (user feedback)
- [ ] **Could this hide a serious system bug?** → Fail loudly (expose the issue)

### 1.2 Error Type Hierarchy

```typescript
// ✅ GOOD: Typed error hierarchy
export abstract class AppError extends Error {
    abstract readonly code: string;
    abstract readonly userMessage: string;

    constructor(message: string, public readonly originalError?: Error) {
        super(message);
        this.name = new.target.name;
    }
}

export class ValidationError extends AppError {
    readonly code = 'VALIDATION_ERROR';
    readonly userMessage = 'Invalid input provided';
}

export class NetworkError extends AppError {
    readonly code = 'NETWORK_ERROR';
    readonly userMessage = 'Network connection failed. Please try again.';
}
```

### 1.3 Composable Error Handling

```typescript
// ✅ GOOD: Composable with proper error state management
export const useUserData = () =>
{
    const user = ref<User | null>(null);
    const isLoading = ref(false);
    const error = ref<AppError | null>(null);

    const fetchUser = async (id: string) =>
    {
        isLoading.value = true;
        error.value = null;

        try
        {
            user.value = await userService.getUser(id);
        }
        catch (err)
        {
            error.value = err instanceof AppError ? err : new NetworkError('Unexpected error');
        }
        finally
        {
            isLoading.value = false;
        }
    };

    const retry = () =>
    {
        if (user.value?.id) fetchUser(user.value.id);
    };

    return { user: readonly(user), isLoading: readonly(isLoading), error: readonly(error), fetchUser, retry };
};
```

### 1.4 Component Error Handling

```vue
<!-- ✅ GOOD: Component with comprehensive error handling -->
<template>
  <div class="user-view">
    <div v-if="isLoading">Loading user...</div>
    <div v-else-if="error" class="error-state">
      <p>{{ error.userMessage }}</p>
      <button @click="retry" :disabled="isLoading">Try Again</button>
    </div>
    <div v-else-if="user">
      <UserCard :user="user" />
    </div>
    <div v-else>No user data available</div>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps<{ id: string }>();
  const { user, isLoading, error, fetchUser, retry } = useUserData();

  onMounted(() => fetchUser(props.id));
</script>
```

## 2. Code Extraction Principles

### 2.1 The Rule of Three

**Start inline and direct. Extract only when you have proven reuse or clear separation of concerns.**

#### Common Over-Extraction Anti-Patterns

```typescript
// ❌ BAD: Over-extracted single-use methods
const validateEmail = (email: string) => checkEmailFormat(email);
const checkEmailFormat = (email: string) => email.includes('@');
const isValidUser = (user: User) => validateEmail(user.email);

// ✅ GOOD: Direct and clear
const isValidUser = (user: User) => user.email.includes('@');
```

```vue
<!-- ❌ BAD: Unnecessary method extraction -->
<template>
  <div>{{ displayUserName }}</div>
</template>

<script setup lang="ts">
const props = defineProps<{ user: User }>();

const formatName = (first: string, last: string) => `${first} ${last}`;
const getUserFullName = (user: User) => formatName(user.firstName, user.lastName);
const displayUserName = computed(() => getUserFullName(props.user));
</script>
```

```vue
<!-- ✅ GOOD: Direct and readable -->
<template>
  <div>{{ `${user.firstName} ${user.lastName}` }}</div>
</template>

<script setup lang="ts">
defineProps<{ user: User }>();
</script>
```

### 2.2 When TO Extract

Only extract when you have **3+ similar use cases**:

```typescript
// ✅ GOOD: Extract when you have multiple similar patterns
const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

// Used in 3+ places:
// - ProductPrice.vue
// - OrderSummary.vue  
// - PaymentForm.vue
```

### 2.3 Decision Framework

Use this checklist before extracting:

- [ ] **Reuse**: Is this used in 3+ places?
- [ ] **Complexity**: Is this complex enough to benefit from isolation?
- [ ] **Testing**: Does this need to be tested in isolation?
- [ ] **Readability**: Is the extracted version actually clearer?
- [ ] **Responsibility**: Does this separate genuine concerns?

If you can't check at least 2 of these boxes, keep it inline.

## 3. Code Style & Comments

### 3.1 Self-Documenting Code

**Don't Add Comments When Code Is Self-Descriptive**: Well-written code with clear variable names, function names, and structure should rarely need comments.

```typescript
// ❌ BAD: Unnecessary comments explaining obvious code
// Get the user data
const user = await getUser();

// Check if the user is active
if (user && user.isActive) {
  // Update the user's last login time
  user.lastLoginAt = new Date();
  
  // Save the updated user
  await saveUser(user);
}

// ✅ GOOD: Self-descriptive code without comments
const user = await getUser();

if (user && user.isActive) {
  user.lastLoginAt = new Date();
  await saveUser(user);
}
```

### 3.2 When Comments Are Valuable

1. **Complex Business Logic**: Explain non-obvious business rules or algorithms
2. **Workarounds**: Document why unusual approaches were necessary
3. **Context and Decisions**: Explain why a particular solution was chosen
4. **External Dependencies**: Document integration quirks or API limitations

```typescript
// ✅ GOOD: Comments explaining WHY, not WHAT
export class ChartRenderer {
  // Calculate display coordinates based on UTC time to ensure synchronized
  // rendering across all connected clients in different timezones
  calculateDisplayPosition(): number {
    const utcTime = Date.now();
    return (utcTime % ANIMATION_DURATION) / ANIMATION_DURATION * 360;
  }

  // Using custom throttle instead of lodash to avoid performance
  // issues with rapid chart updates (Issue #234)
  private throttleUpdate = this.createCustomThrottle(100);
}
```

### 3.3 Constants and Magic Values

#### Extract Magic Objects and Fallbacks
Hardcoded objects and fallback values should be extracted to named constants for clarity and maintainability.

```typescript
// ❌ BAD: Hardcoded fallback objects inline
const processedItems = computed(() =>
  items.value.map(item => ({
    ...item,
    buffer: item.buffer.length === 0 ? [{ data: new Array(256).fill(0) }] : item.buffer
  }))
);

// ✅ GOOD: Extract constants, avoid transformation in computed
const DEFAULT_BUFFER_SIZE = 256;
const createEmptyBuffer = () => [{ data: new Array(DEFAULT_BUFFER_SIZE).fill(0) }];

// Keep computed simple
const validItems = computed(() => 
  items.value.filter(item => item.isValid)
);

// Handle defaults at component level or data source
const getItemBuffer = (item) => 
  item.buffer.length === 0 ? createEmptyBuffer() : item.buffer;
```

#### Push Defaults to Data Source
The best approach is to handle default values where data originates, keeping computed properties simple.

```typescript
// ✅ BEST: Handle defaults at data source (store/composable)
const initializeItem = (rawItem) => ({
  ...rawItem,
  buffer: rawItem.buffer?.length > 0 ? rawItem.buffer : createEmptyBuffer()
});

// Computed stays clean and simple
const items = computed(() => store.items); // Already properly initialized
```

### 3.4 Template/HTML Comments

Use comments in templates only for:
- Complex layout structures that need explanation
- Conditional rendering logic
- Third-party component integration notes

```vue
<template>
  <!-- ✅ GOOD: Explaining complex conditional rendering -->
  <!-- Show loading state for initial load, skeleton for subsequent updates -->
  <div v-if="isInitialLoad" class="loading-spinner" />
  <div v-else-if="isUpdating" class="skeleton-layout" />

  <!-- ✅ GOOD: Documenting layout structure -->
  <!-- Visualization canvas: fixed positioning required for Three.js rendering -->
  <div class="visualization-container">
    <canvas ref="visualizationCanvas" />
  </div>
</template>
```

## 4. Advanced Error Patterns

### 4.1 Error Boundary Component

```vue
<!-- ✅ GOOD: Reusable error boundary -->
<template>
  <div class="error-boundary">
    <slot v-if="!hasError" />
    <div v-else class="error-fallback">
      <slot name="error" :error="error" :retry="retry">
        <div>
          <h3>Something went wrong</h3>
          <p>{{ error?.userMessage || 'An unexpected error occurred' }}</p>
          <button @click="retry">Try Again</button>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const hasError = ref(false);
const error = ref<AppError | null>(null);

const retry = () => {
  hasError.value = false;
  error.value = null;
};

onErrorCaptured((err) => {
  hasError.value = true;
  error.value = err instanceof AppError ? err : new NetworkError('Component error');
  return false;
});
</script>
```

### 4.2 Global Error Handler

```typescript
// ✅ GOOD: Global error boundary with logging
export const setupGlobalErrorHandling = (app: App) => {
  const reportError = (error: Error, context?: Record<string, unknown>) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    };
    
    if (import.meta.env.DEV) {
      console.error('Error reported:', errorReport);
    } else {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      });
    }
  };
  
  app.config.errorHandler = (err, instance, info) => {
    reportError(err as Error, { vueErrorInfo: info });
  };
  
  window.addEventListener('unhandledrejection', (event) => {
    reportError(new Error(`Unhandled rejection: ${event.reason}`));
  });
};
```

## ❌ Anti-Patterns

### Silent Failures

```typescript
// ❌ BAD: Swallowing errors without handling
export const useUserData = () => {
  const fetchUser = async (id: string) => {
    try {
      const user = await userService.getUser(id);
      return user;
    } catch (error) {
      console.log('Error occurred'); // ❌ BAD
      return null; // ❌ BAD - caller doesn't know about error
    }
  };
};

// ✅ GOOD: Use proper error state management (see composable example above)
```

### Generic Error Messages

```typescript
// ❌ BAD: Generic, unhelpful error messages
const saveUser = async (user: User) => {
    try {
        await userService.save(user);
    } catch (error) {
        throw new Error('Something went wrong'); // ❌ BAD
    }
};

// ✅ GOOD: Specific, actionable error messages
const saveUser = async (user: User) => {
    try {
        await userService.save(user);
    } catch (error) {
        if (error instanceof ValidationError) {
            throw new BusinessLogicError(`Please check the ${error.field} field and try again.`);
        }
        throw error; // Re-throw with context
    }
};
```

## 5. Loop Patterns

### 5.1 Prefer for...of Over forEach

**Key Advantage**: `for...of` supports `break`, `continue`, and early `return` - `forEach` cannot be stopped.

```javascript
// ✅ GOOD: Can break early when condition met
const findUser = (users, targetId) => {
  for (const user of users) {
    if (user.id === targetId) return user;
  }
  return null;
};

// ❌ BAD: Must process ALL elements even after finding target
let foundUser = null;
users.forEach(user => {
  if (!foundUser && user.id === targetId) {
    foundUser = user; // Still continues through remaining users!
  }
});
```

### 5.2 Decision Framework

- **Most cases**: Use `for...of` (default choice)
- **Need array index**: Use traditional `for` loop  
- **Simple operation on all elements**: `forEach` acceptable
- **Performance-critical**: Use traditional `for` (fastest)

## 📚 Related Guidelines

- **[Vue Guidelines](./vue.md)** - Vue-specific error handling and component patterns
- **[TypeScript Guidelines](./typescript.md)** - Error type definitions and type safety
- **[Testing Guidelines](../patterns/testing.md)** - Error handling testing patterns

Remember: Good architecture provides clear feedback to users while giving developers the information they need to debug issues. Start simple, extract when there's clear value, and handle errors as first-class citizens in your application's data flow.