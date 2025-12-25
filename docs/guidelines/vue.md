# Vue.js Complete Guidelines

## 🚀 AI Quick Reference

| Need | Solution | Section |
|------|----------|---------|
| Component architecture | Smart/Dumb patterns | [Component Patterns](#component-patterns) |
| State management | Composables + Pinia | [Composables](#composables) |
| Props/events typing | TypeScript interfaces | [Component Patterns](#component-patterns) |
| Error handling | Try/catch + reactive state | [Error Handling](#error-handling) |
| Testing components | Vue Test Utils + Vitest | [Testing](#testing) |
| Reactive state ownership | Readonly exposure pattern | [Composables](#composables) |
| z-index issues | DOM order + positioning | [Anti-Patterns](#anti-patterns) |
| Boolean naming | is/has/can prefixes | [Conventions](#conventions) |
| ID properties | idEntity format | [Conventions](#conventions) |
| Over-extraction | Rule of Three | [Extraction Principles](#extraction-principles) |
| Data patching vs transformation | Fix at source, transform for UI | [Computed Performance](#computed-performance-patterns) |
| Magic values | Extract to constants | [Computed Performance](#computed-performance-patterns) |

## 📖 Table of Contents

1. [Component Patterns](#component-patterns)
2. [Composables](#composables)
3. [State Management](#state-management-pinia)
4. [Testing](#testing)
5. [Conventions & Style](#conventions--style)
6. [Extraction Principles](#extraction-principles)
7. [Anti-Patterns Reference](#anti-patterns-reference)
8. [Decision Matrix](#decision-matrix)
9. [Code Examples Bank](#code-examples-bank)

## 1. Component Patterns

### 1.1 Single Responsibility
Components should own their presentation logic and delegate business logic to composables.

```vue
<!-- ✅ GOOD: Component focuses on UI, composable handles logic -->
<!-- NEW COMPONENT (TypeScript) -->
<template>
  <div class="search-component">
    <input v-model="searchQuery" placeholder="Search..." />
    <SearchResults :results="searchResults" @select="handleSelect" />
  </div>
</template>

<script setup lang="ts">
  const { searchQuery, searchResults } = useSearch('/api/users');
  const handleSelect = (result) => emit('select', result);
</script>
```

```vue
<!-- ✅ GOOD: Existing component modification (JavaScript) -->
<!-- EXISTING COMPONENT (JavaScript) -->
<template>
  <div class="search-component">
    <input v-model="searchQuery" placeholder="Search..." />
    <SearchResults :results="searchResults" @select="handleSelect" />
  </div>
</template>

<script setup>
  const { searchQuery, searchResults } = useSearch('/api/users');
  const handleSelect = (result) => emit('select', result);
</script>
```

### 1.2 Props Down, Events Up
Data flows down through props, events communicate changes upward.

**When to Use Props vs. Composables/Stores:**
- **Use props**: For parent-controlled configuration, presentation variants, or data the child cannot derive itself
- **Avoid props**: If the child can already access the data via composables, stores, or inject
- **Rule of thumb**: Don't pass what the child can already figure out

```vue
<!-- ❌ BAD: Passing data the child can access directly -->
<template>
  <UserProfile :current-user="currentUser" :is-connected="isConnected" />
</template>

<script setup lang="ts">
  const { currentUser } = useAuth();        // Child can call useAuth() itself
  const { isConnected } = useSocketService(); // Child can call useSocketService() itself
</script>
```

```vue
<!-- ✅ GOOD: Child accesses shared state directly -->
<template>
  <UserProfile :display-mode="displayMode" />
</template>

<script setup lang="ts">
  // Only pass parent-specific configuration
  const displayMode = ref<'compact' | 'full'>('compact');
</script>
```

```vue
<!-- UserProfile.vue - Child component -->
<script setup lang="ts">
  interface Props {
    displayMode: 'compact' | 'full'; // Parent controls presentation
  }

  defineProps<Props>();

  // Access shared state directly via composables
  const { currentUser } = useAuth();
  const { isConnected } = useSocketService();
</script>
```

```vue
<!-- ✅ GOOD: Clear data flow (New TypeScript Component) -->
<script setup lang="ts">
  interface Props {
    user: User;
    readonly?: boolean;
  }

  interface Emits {
    updateUser: [updates: Partial<User>];
  }

  const emit = defineEmits<Emits>();
  const updateUser = () => emit('updateUser', { name: 'New Name' });
</script>
```

```vue
<!-- ✅ GOOD: Clear data flow (Existing JavaScript Component) -->
<script setup>
  const props = defineProps({
    user: { type: Object, required: true },
    readonly: { type: Boolean, default: false }
  });

  const emit = defineEmits(['updateUser']);
  const updateUser = () => emit('updateUser', { name: 'New Name' });
</script>
```

### 1.3 Smart vs Dumb Components
Separate data management from presentation for better testability and reusability.

```vue
<!-- ✅ GOOD: Smart component handles data -->
<template>
  <UserList 
    :users="users"
    :loading="isLoading"
    @edit="handleEdit"
    @delete="handleDelete" />
</template>

<script setup lang="ts">
const { users, isLoading, editUser, deleteUser } = useUsers();
const handleEdit = (user: User) => editUser(user);
const handleDelete = (id: string) => deleteUser(id);
</script>
```

```vue
<!-- ✅ GOOD: Dumb component focuses on presentation -->
<template>
  <div v-if="loading">Loading...</div>
  <div v-else class="user-grid">
    <UserCard
      v-for="user in users"
      :key="user.id"
      :user="user"
      @edit="$emit('edit', user)"
      @delete="$emit('delete', user.id)" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ users: User[]; loading?: boolean }>();
defineEmits<{ edit: [User]; delete: [string] }>();
</script>
```

### 1.4 Slot Usage
Use slots for flexible content composition with sensible fallbacks.

```vue
<!-- ✅ GOOD: Named slots with scoped data -->
<template>
  <div class="modal">
    <slot name="header" :title="title">
      <h2>{{ title }}</h2>
    </slot>
    
    <slot :data="modalData">
      <p>No content provided</p>
    </slot>
    
    <slot name="actions" :close="handleClose">
      <button @click="handleClose">Close</button>
    </slot>
  </div>
</template>
```

### 1.5 Loading States
Handle loading, error, and empty states clearly for better UX.

```vue
<!-- ✅ GOOD: Clear state handling -->
<template>
  <div v-if="isLoading" class="loading-skeleton">
    <div class="skeleton-item" v-for="i in 3" :key="i"></div>
  </div>
  
  <div v-else-if="error" class="error-state">
    <p>{{ error }}</p>
    <button @click="retry">Try Again</button>
  </div>
  
  <div v-else-if="data.length === 0" class="empty-state">
    <p>No data available</p>
  </div>
  
  <div v-else>
    <DataItem v-for="item in data" :key="item.id" :item="item" />
  </div>
</template>
```

## 2. Composables

### 2.1 State Ownership
Composables should own their reactive state internally and expose it through controlled interfaces with readonly access.

```typescript
// ✅ GOOD: Internal state ownership with readonly exposure
export const useDataCollection = () => {
  const isCollecting = ref(false);
  const items = ref<Item[]>([]);
  
  return {
    isCollecting: readonly(isCollecting),
    items: readonly(items),
    startCollection: () => { isCollecting.value = true; }
  };
};

// ❌ BAD: External dependencies and mutable state exposure
export const useDataCollection = (options: { isCollecting: Ref<boolean> }) => {
  const items = ref<Item[]>([]);
  return { items, isCollecting: options.isCollecting }; // Breaks encapsulation
};
```

### 2.2 Single Responsibility
Each composable should have a focused, clearly defined purpose. Compose multiple focused composables rather than creating monolithic ones.

```typescript
// ✅ GOOD: Focused composables composed together
export const useDataFeature = () => {
  const collection = useDataCollection();
  const storage = useDataStorage();
  
  return {
    isCollecting: collection.isCollecting,
    items: storage.items,
    startCollection: collection.startCollection
  };
};

// ❌ BAD: Mixed concerns in single composable
export const useDataManager = () => {
  const items = ref<Item[]>([]);
  const isModalOpen = ref(false);  // UI concern
  const isCollecting = ref(false); // Business logic concern
  return { items, isModalOpen, isCollecting };
};
```

### 2.3 Lifecycle Management
Handle setup and cleanup properly to prevent memory leaks.

```typescript
// ✅ GOOD: Proper cleanup with onUnmounted
export const useWebSocket = () => {
  const socket = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  
  const disconnect = () => {
    socket.value?.close();
    isConnected.value = false;
  };
  
  onUnmounted(disconnect);
  return { isConnected: readonly(isConnected), disconnect };
};

// ❌ BAD: No cleanup - creates memory leaks
export const useTimer = () => {
  const count = ref(0);
  setInterval(() => count.value++, 1000); // Never cleared!
  return { count };
};
```

### 2.4 Configuration Patterns

```typescript
// ✅ GOOD: Use options for configuration, not state
export const useApi = (options: { baseUrl?: string; timeout?: number } = {}) => {
  const { baseUrl = '/api', timeout = 5000 } = options;
  const isLoading = ref(false);
  
  const request = async <T>(endpoint: string): Promise<T> => {
    // Implementation using configuration
  };
  
  return { isLoading: readonly(isLoading), request };
};
```

## 3. State Management (Pinia)

### 3.1 Store Structure
Each piece of state should have one authoritative source in the store.

```typescript
// ✅ GOOD: Well-structured Pinia store
export const useUsersStore = defineStore('users', () => {
  // State
  const users = ref<User[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  // Getters
  const activeUsers = computed(() => 
    users.value.filter(user => user.isActive)
  );
  
  // Actions
  const fetchUsers = async () => {
    isLoading.value = true;
    try {
      const response = await userApi.getUsers();
      users.value = response.data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch';
    } finally {
      isLoading.value = false;
    }
  };
  
  const addUser = (user: User) => {
    users.value.push(user);
  };
  
  return {
    users: readonly(users),
    isLoading: readonly(isLoading),
    error: readonly(error),
    activeUsers,
    fetchUsers,
    addUser
  };
});
```

### 3.2 Store Composition
Compose multiple stores for complex operations:

```typescript
// ✅ GOOD: Composing multiple stores
export const useUserWorkflow = () => {
  const usersStore = useUsersStore();
  const notificationStore = useNotificationStore();
  
  const saveUserWithNotification = async (user: User) => {
    try {
      await usersStore.saveUser(user);
      notificationStore.success('User saved successfully');
    } catch (error) {
      notificationStore.error('Failed to save user');
      throw error;
    }
  };
  
  return { saveUserWithNotification };
};
```

### 3.3 Store Organization
Organize stores by business domain:

```
src/stores/
├── auth/useAuthStore.ts
├── users/useUsersStore.ts
├── ui/useUIStore.ts
└── settings/useUserSettingsStore.ts
```

## 4. Testing

### 4.1 Component Testing

```typescript
// ✅ GOOD: Component testing focused on user interactions
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import UserCard from './UserCard.vue';

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    isActive: true
  };
  
  const createWrapper = (props = {}) => {
    return mount(UserCard, {
      props: { user: mockUser, ...props },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] }
    });
  };
  
  it('should display user information', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('john@example.com');
  });
  
  it('should emit edit event when edit button is clicked', async () => {
    const wrapper = createWrapper();
    const editButton = wrapper.find('[data-testid="edit-button"]');
    await editButton.trigger('click');
    
    expect(wrapper.emitted('edit')).toHaveLength(1);
    expect(wrapper.emitted('edit')[0]).toEqual([mockUser]);
  });
});
```

### 4.2 Composable Testing

```typescript
// ✅ GOOD: Composable testing with proper setup
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserData } from './useUserData';
import { createTestingPinia } from '@pinia/testing';

vi.mock('@/services/user/UserService', () => ({
  UserService: { getUser: vi.fn() }
}));

describe('useUserData', () => {
  let mockUserService: any;
  
  beforeEach(() => {
    mockUserService = (await import('@/services/user/UserService')).UserService;
    vi.clearAllMocks();
    createTestingPinia({ createSpy: vi.fn });
  });
  
  it('should fetch user successfully', async () => {
    const mockUser = { id: '1', name: 'John Doe' };
    mockUserService.getUser.mockResolvedValue(mockUser);
    
    const { user, isLoading, fetchUser } = useUserData();
    
    await fetchUser('1');
    
    expect(mockUserService.getUser).toHaveBeenCalledWith('1');
    expect(user.value).toEqual(mockUser);
    expect(isLoading.value).toBe(false);
  });
});
```

### 4.3 Store Testing

```typescript
// ✅ GOOD: Pinia store testing
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUsersStore } from './useUsersStore';

describe('useUsersStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  
  it('should initialize with empty state', () => {
    const store = useUsersStore();
    expect(store.users).toEqual([]);
    expect(store.isLoading).toBe(false);
  });
  
  it('should add user', () => {
    const store = useUsersStore();
    const user = { id: '1', name: 'John Doe' };
    
    store.addUser(user);
    
    expect(store.users).toHaveLength(1);
    expect(store.users[0]).toEqual(user);
  });
});
```

### 4.4 When to Test Implementation
Test implementation when it involves integration boundaries or critical side effects:

```typescript
// ✅ ACCEPTABLE: Testing integration boundaries
it('should call user service with correct parameters', async () => {
  const { fetchUser } = useUserData();
  
  await fetchUser('user-123');
  
  // Testing service integration - this is an important contract
  expect(mockUserService.getUser).toHaveBeenCalledWith('user-123');
});

// ✅ ACCEPTABLE: Testing critical side effects
it('should track analytics when user signs up', async () => {
  const { signUp } = useAuth();
  
  await signUp(userData);
  
  // Analytics tracking is a critical business requirement 
  expect(mockAnalytics.track).toHaveBeenCalledWith('user_signup', userData);
});
```

## 5. Conventions & Style

### 5.1 Computed Performance Patterns

#### Fix Data at Source, Transform for Presentation
Computed properties should transform data for legitimate UI needs, not patch broken data structures. Fix data problems where they originate.

```typescript
// ❌ BAD: Patching broken data instead of fixing the source
const fixedItems = computed(() =>
  items.value.map(item => ({
    ...item,
    // Fixing missing/broken data instead of ensuring proper data structure
    metadata: item.metadata || { status: 'unknown', priority: 0 },
    traces: item.traces.length === 0 ? [{ values: new Float32Array(0) }] : item.traces
  }))
);

// ✅ GOOD: Transform for legitimate UI presentation needs
const displayItems = computed(() =>
  items.value.map(item => ({
    ...item,
    displayName: `${item.firstName} ${item.lastName}`,
    formattedDate: formatDate(item.createdAt),
    statusColor: getStatusColor(item.status)
  }))
);

// ✅ BETTER: Fix data structure at the source (store/API/composable)
const initializeItem = (rawItem) => ({
  ...rawItem,
  metadata: rawItem.metadata || DEFAULT_METADATA,
  traces: rawItem.traces?.length > 0 ? rawItem.traces : [DEFAULT_TRACE]
});
```

#### Single Responsibility in Computed
Each computed should have one clear purpose - either filtering, sorting, or deriving simple values.

```typescript
// ❌ BAD: Multiple operations in one computed
const processedData = computed(() => {
  const filtered = data.value.filter(item => item.isValid);
  return filtered.map(item => ({
    ...item,
    enhanced: someTransformation(item)
  }));
});

// ✅ GOOD: Separate filtering and transformation into focused computeds
const validData = computed(() => 
  data.value.filter(item => item.isValid)
);

const enhancedData = computed(() =>
  validData.value.map(item => ({
    ...item,
    enhanced: someTransformation(item)
  }))
);
```

```typescript
// ✅ ALTERNATIVE: For very large lists, use shallowRef for better performance
const enhancedData = shallowRef([]);

watchEffect(() => {
  enhancedData.value = validData.value.map(item => ({
    ...item,
    enhanced: someTransformation(item)
  }));
});
```

### 5.2 Script Setup Organization

#### New Components (TypeScript)
```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserData } from '@/composables/useUserData';

// 2. Props with TypeScript interfaces
interface Props {
  users: User[];
  pageSize?: number;
}

const props = withDefaults(defineProps<Props>(), { pageSize: 10 });
const emit = defineEmits<{ select: [user: User] }>();

// 3. Composables
const router = useRouter();
const { searchUsers } = useUserData();

// 4. Reactive state
const currentPage = ref(1);

// 5. Computed properties
const totalPages = computed(() => 
  Math.ceil(props.users.length / props.pageSize)
);

// 6. Watchers and lifecycle
watch(currentPage, (page) => { /* Handle page change */ });
onMounted(() => searchUsers());

// 7. Methods
const handleSelect = (user) => {
  emit('select', user);
  router.push(`/users/${user.id}`);
};
</script>
```

#### Existing Components (JavaScript)
```vue
<script setup>
// 1. Imports
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserData } from '@/composables/useUserData';

// 2. Props with JavaScript (no interface needed)
const props = defineProps({
  users: { type: Array, required: true },
  pageSize: { type: Number, default: 10 }
});
const emit = defineEmits(['select']);

// 3. Composables
const router = useRouter();
const { searchUsers } = useUserData();

// 4. Reactive state
const currentPage = ref(1);

// 5. Computed properties
const totalPages = computed(() => 
  Math.ceil(props.users.length / props.pageSize)
);

// 6. Watchers and lifecycle
watch(currentPage, (page) => { /* Handle page change */ });
onMounted(() => searchUsers());

// 7. Methods
const handleSelect = (user) => {
  emit('select', user);
  router.push(`/users/${user.id}`);
};
</script>
```

### 5.2 Naming Conventions

#### Variables and Functions
```typescript
// ✅ GOOD: Descriptive names
const users = ref<User[]>([]);
const isLoadingUsers = ref(false);
const canEdit = computed(() => !isReadonly.value);

const fetchUsers = async () => { /* ... */ };
const handleUserSelect = (user: User) => { /* ... */ };

// ✅ GOOD: Boolean prefixes
const isLoading = ref(false);        // State
const hasError = ref(false);         // Possession
const canEdit = ref(true);           // Ability

// ❌ BAD: Wrong ID naming patterns
const userId = ref('');                    // Should be idUser
const datasetId = ref('');                 // Should be idDataset
const selectedUsers = ref<string[]>([]);   // Should be idUsersSelected
const tagIds = ref<string[]>([]);          // Should be idTagsSelected

// ✅ GOOD: ID patterns
const idUsersSelected = ref<string[]>([]);          // Multiple user IDs
const idTagsAvailable = computed(() => [...]);      // Multiple tag IDs
const processUserData = (idUser: string) => {};     // Single user ID when ambiguous
```

#### Props and Events
```vue
<script setup lang="ts">
// ❌ BAD: Wrong ID patterns in props
interface Props {
  userId: string;                     // Should be idUser
  selectedTags: string[];             // Should be idTagsSelected
  datasetId?: string;                 // Should be idDataset
}

// ✅ GOOD: Descriptive props and events
interface Props {
  user: User;
  isReadonly?: boolean;
  maxItemCount?: number;
  idTagsSelected?: string[];          // ID array following pattern
}

interface Emits {
  userUpdated: [user: User];              // Past tense - completed action
  editRequested: [id: string];            // Past tense - completed action
  editUser: [user: User];                 // Present tense - action command
  deleteItem: [id: string];               // Present tense - action command
}
</script>
```

### 5.3 Error Handling

```vue
<!-- ✅ GOOD: Proper error handling -->
<script setup lang="ts">
  const data = ref(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  const fetchData = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      data.value = await apiCall();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      isLoading.value = false;
    }
  };
</script>
```

## 6. Extraction Principles

### 6.1 Rule of Three
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

### 6.2 Decision Framework
Use this checklist before extracting:

- [ ] **Reuse**: Is this used in 3+ places?
- [ ] **Complexity**: Is this complex enough to benefit from isolation?
- [ ] **Testing**: Does this need to be tested in isolation?
- [ ] **Readability**: Is the extracted version actually clearer?
- [ ] **Responsibility**: Does this separate genuine concerns?

If you can't check at least 2 of these boxes, keep it inline.

### 6.3 Avoid Premature Extraction

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

## ❌ Anti-Patterns Reference

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| **z-index usage** | Creates maintenance nightmares | Use proper DOM order + CSS positioning |
| **Direct state mutation** | Breaks reactivity patterns | Use actions in stores |
| **Mixed concerns in components** | Poor separation of responsibilities | Split into smart/dumb components |
| **Overusing watchers** | Using watchers for derived state | Use computed for derived state |
| **Missing error handling** | Poor user experience | Implement try/catch with reactive state |
| **Premature extraction** | Over-abstraction | Follow Rule of Three |
| **Generic naming** | Poor code readability | Use descriptive, purpose-driven names |
| **Mutating props** | Breaks Vue data flow | Emit events for changes |
| **Unnecessary reactive flags** | Creates complexity | Use direct function calls |
| **Implementation testing** | Brittle tests | Focus on behavior, test boundaries only |
| **Patching data in computed** | Fixes symptoms, not root cause | Fix data structure at source |
| **Multiple operations in computed** | Mixed concerns, poor maintainability | One responsibility per computed |
| **Magic fallback objects** | Hard to maintain, unclear intent | Extract to named constants |

## ✅ Decision Matrix

| Scenario | Pattern to Use | Key Considerations |
|----------|----------------|-------------------|
| **New component** | TypeScript + Composition API | Use interfaces for props/emits |
| **Existing component** | Keep JavaScript + Composition API | Don't force TypeScript migration |
| **Data management** | Smart component + composable | Separate concerns cleanly |
| **Reusable logic** | Composable with readonly exports | Own state internally |
| **Complex state** | Pinia store | Domain-based organization |
| **Testing** | Behavior-focused | Test integration boundaries |
| **Naming IDs** | idEntity format | Clear when context ambiguous |
| **Error handling** | Try/catch + reactive state | Always handle loading/error states |
| **Extraction decision** | Rule of Three | Need 3+ uses or clear complexity |

## 💡 Code Examples Bank

### Common Scenarios with Solutions

**Loading State with Error Handling**
```vue
<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
  <div v-else>{{ data }}</div>
</template>

<script setup lang="ts">
const { data, isLoading, error, execute } = useAsyncOperation();
onMounted(() => execute(fetchData));
</script>
```

**Form with Validation**
```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.email" :class="{ error: errors.email }" />
    <span v-if="errors.email">{{ errors.email }}</span>
    <button :disabled="isSubmitting">Submit</button>
  </form>
</template>

<script setup lang="ts">
const { form, errors, isSubmitting, handleSubmit } = useForm(validationRules);
</script>
```

**Data Fetching with Parameters**
```vue
<script setup lang="ts">
const route = useRoute();
const { data: user, isLoading } = useAsyncData(
  () => userApi.getUser(route.params.id as string)
);
</script>
```

**Modal Component**
```vue
<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="close">
      <div class="modal-content" @click.stop>
        <slot :close="close" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean;
}

interface Emits {
  close: [];
}

const emit = defineEmits<Emits>();
const close = () => emit('close');

// Close on Escape key
useEventListener('keydown', (e) => {
  if (e.key === 'Escape' && props.isOpen) close();
});
</script>
```

Remember: Great Vue components are focused, predictable, and easy to test. They should feel like natural building blocks that compose well together while maintaining clear boundaries and responsibilities.