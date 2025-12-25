# TypeScript Guidelines

## 🚀 AI Quick Reference

| Problem | Solution | Section |
|---------|----------|---------|
| Type vs interface choice | Interface for objects, type for unions | [Type Definitions](#type-definitions) |
| Vue component typing | Props/Emits interfaces | [Vue Component Types](#vue-component-types) |
| API response typing | Generic ApiResponse<T> pattern | [Generic Types and Constraints](#generic-types-and-constraints) |
| Avoiding `any` type | Use unknown + type guards | [Type Guards](#-type-guards) |
| Complex generic constraints | Extend base types with constraints | [Missing Generic Constraints](#missing-generic-constraints) |
| Error type handling | Custom error classes + unions | [Error Type Patterns](#-error-type-patterns) |
| Type organization | One domain per file | [Type Organization](#type-organization) |
| New vs existing code | TypeScript for new, keep JS for existing | [Migration Strategy](#-migration-strategy---read-this-first) |

This guide establishes TypeScript usage patterns for the Vue.js application, ensuring type safety, maintainability, and developer productivity.

## 🔄 Migration Strategy - READ THIS FIRST

**Current Application State**: The application is primarily JavaScript-based with progressive TypeScript adoption.

### When TypeScript is REQUIRED ✅
- **All new files** - Components, composables, services, utilities
- **New features** - Complete features should use TypeScript throughout
- **New stores** - Pinia stores for new functionality

### When JavaScript is ACCEPTABLE 🔄
- **Modifying existing `.js` files** - No need to convert to TypeScript
- **Bug fixes** - Fix the bug without changing the language
- **Small updates** - Minor changes to existing JavaScript logic

### Gradual Adoption Benefits
- **No breaking changes** - Existing code continues to work
- **Immediate benefits** - New code gets TypeScript advantages
- **Natural migration** - TypeScript adoption through development, not forced conversion
- **Team flexibility** - Developers can focus on features, not migration

### File Extension Guidelines
```
✅ NEW CODE:
- NewComponent.vue (with <script setup lang="ts">)
- useNewFeature.ts
- NewService.ts
- newUtility.ts

🔄 EXISTING CODE MODIFICATIONS:
- ExistingComponent.vue (keep <script> if already JavaScript)
- existingUtility.js (keep .js extension)
- existingService.js (keep .js extension)
```

## 🎯 Core Principles (For New TypeScript Code)

1. **Embrace Type Safety** - Use TypeScript's type system to catch errors at compile time
2. **Make Types Discoverable** - Types should be self-documenting and help with IDE autocompletion
3. **Prefer Explicit Over Implicit** - Be explicit about types when it improves clarity
4. **Compose Types Effectively** - Build complex types from simpler, reusable building blocks
5. **Don't Force Migration** - Focus on new code quality, not converting existing JavaScript

## ✅ Best Practices

### Type Definitions

```typescript
// ✅ GOOD: Clear interface definitions
export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

// Discriminated unions for states
export type ConnectionState = 
  | { status: 'connected'; connectedAt: Date }
  | { status: 'disconnected' }
  | { status: 'error'; error: string };

// Generic types
export interface ApiResponse<TData> {
  success: boolean;
  data: TData;
}
```

### Generic Types and Constraints

```typescript
// ✅ GOOD: Effective use of generics with constraints
export interface Repository<TEntity extends BaseEntity> {
  findById(id: string): Promise<TEntity | null>;
  findAll(filters?: Partial<TEntity>): Promise<TEntity[]>;
  create(data: Omit<TEntity, keyof BaseEntity>): Promise<TEntity>;
  delete(id: string): Promise<void>;
}

// Generic async state management
export interface AsyncState<TData, TError = AppError> {
  data: TData | null;
  isLoading: boolean;
  error: TError | null;
}
```

### Vue Component Types

```typescript
// ✅ GOOD: Vue component typing
<script setup lang="ts">
interface Props
{
  user: User;
  readonly?: boolean;
}

interface Emits
{
  update: [user: User];
  delete: [id: string];
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
});

const emit = defineEmits<Emits>();

const isEditing = ref<boolean>(false);
const handleDelete = () => emit('delete', props.user.id);
</script>
```

## 🚨 Error Type Patterns

```typescript
// ✅ GOOD: Typed error handling
export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error unions for specific contexts
export type ApiError = ValidationError | NetworkError | AuthError;

// Typed error state in composables
const error = ref<ApiError | null>(null);
```

## 🛡️ Type Guards

```typescript
// ✅ GOOD: Simple type guards for runtime validation
export function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && 
         obj !== null &&
         'id' in obj && 
         'name' in obj && 
         'email' in obj;
}

// Usage with API responses
const processUserData = (data: unknown) => {
  if (isUser(data)) {
    // TypeScript knows data is User here
    return data.name.toUpperCase();
  }
  throw new ValidationError('data', 'Invalid user structure');
};
```

## ❌ Anti-Patterns

### Using `any` Type
```typescript
// ❌ BAD: Using any loses type safety
const processData = (data: any) => {
  return data.someProperty.nested.value; // No type checking
};

// ✅ GOOD: Proper typing with unknowns and type guards
const processData = (data: unknown): string => {
  if (isValidDataStructure(data)) {
    return data.someProperty.nested.value; // Type-safe access
  }
  throw new Error('Invalid data structure');
};
```

### Overly Complex Types
```typescript
// ❌ BAD: Complex nested conditionals
type ComplexType<T, U, V> = T extends string ? U extends number ? V extends boolean ? { a: T; b: U; c: V } : never : never : never;

// ✅ GOOD: Simple, composable types
interface UserData {
  name: string;
  age: number;
  isActive: boolean;
}

type UserWithStatus = UserData & {
  status: 'active' | 'inactive' | 'pending';
};
```

### Missing Generic Constraints
```typescript
// ❌ BAD: Generic without constraints
function updateEntity<T>(entity: T, updates: any): T {
  return { ...entity, ...updates };
}

// ✅ GOOD: Generic with proper constraints
function updateEntity<T extends BaseEntity>(
  entity: T, 
  updates: Partial<Omit<T, keyof BaseEntity>>
): T {
  return { ...entity, ...updates };
}
```

## 🏗️ Architecture Patterns

### Type Organization

**One Domain Per File**: Each type file should focus on a single domain or concern.

```typescript
// ✅ GOOD: Single domain focus
// user.types.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

export type CreateUserDTO = Omit<User, 'id'>;
export type UpdateUserDTO = Partial<CreateUserDTO>;

// ❌ BAD: Multiple unrelated domains in one file
// mixed.types.ts
export interface User { /* */ }
export interface ChartData { /* */ }  // Different domain
export interface SocketMessage { /* */ }  // Different domain
```


## 📝 Testing TypeScript

For comprehensive TypeScript testing patterns, see **[Testing Guidelines](../patterns/testing.md)** which covers:
- Type-safe testing with Vitest and expectTypeOf
- Service method return type validation
- Type compatibility testing
- Error type testing

## 🎯 Advanced Patterns

### Branded Types
Create distinct types from primitives to prevent mixing related but different string/number types.

```typescript
declare const __brand: unique symbol;
type Brand<T, TBrand> = T & { [__brand]: TBrand };

export type IdUser = Brand<string, 'IdUser'>;
export type Email = Brand<string, 'Email'>;
```

### Template Literal Types
Build type-safe string patterns using TypeScript's template literal syntax.

```typescript
type ApiVersion = 'v1' | 'v2';
type ResourceType = 'users' | 'products';

type ApiEndpoint<V extends ApiVersion, R extends ResourceType> = `/api/${V}/${R}`;
// Results in: '/api/v1/users' | '/api/v1/products' | '/api/v2/users' | '/api/v2/products'
```

## 📚 Related Guidelines

- **[Vue Conventions](./vue-conventions.md)** - Vue-specific TypeScript patterns
- **[Component Design](../architecture/component-design.md)** - Component prop and event typing
- **[Composables](../architecture/composables.md)** - Composable type patterns
- **[Error Handling](../patterns/error-handling.md)** - Error type definitions
- **[Testing Guidelines](../patterns/testing.md)** - Type-safe testing patterns

Remember: TypeScript prevents bugs and improves developer experience. Use its type system to make your code more reliable, self-documenting, and maintainable.