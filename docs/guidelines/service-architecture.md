# Service Architecture Guidelines

This guide establishes patterns for designing the service layer that handles external integrations, business logic, and cross-cutting concerns. Services provide abstraction between components and external systems.

## 🎯 Design Patterns & Principles

### Service Interface Design

```typescript
// ✅ GOOD: Clear, focused service interface
export interface ISocketService {
  readonly isConnected: Ref<boolean>;
  
  connect(url: string): Promise<void>;
  disconnect(): Promise<void>;
  send(message: string): Promise<void>;
  subscribe<T>(messageType: string, handler: (data: T) => void): () => void;
}

export interface IFileService {
  readonly isAvailable: Ref<boolean>;
  
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
}
```

**Key Principles:**
- **Interface Segregation**: Expose focused interfaces that clients actually need
- **Dependency Injection**: Services injected as dependencies, not imported directly
- **Platform Abstraction**: Abstract platform-specific implementations (Debug vs Capacitor)
- **Dependency Direction**: Services consumed by features, never the reverse. Service A using Service B means Service B knows nothing about Service A

### Service Implementation Pattern

```typescript
// ✅ GOOD: Service implementation with proper abstraction
export class DebugSocketService implements ISocketService {
  private websocket: WebSocket | null = null;
  readonly isConnected = ref(false);
  
  async connect(url: string): Promise<void> {
    this.websocket = new WebSocket(url);
    this.websocket.onopen = () => { this.isConnected.value = true; };
    this.websocket.onmessage = (event) => this.handleMessage(event.data);
  }
  
  async send(message: string): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new ConnectionError('WebSocket is not connected');
    }
    this.websocket.send(message);
  }
}
```

### Factory & Registration Pattern

```typescript
// ✅ GOOD: Factory for platform-specific service creation
export const createSocketService = (): ISocketService => {
  return isCapacitorEnvironment() 
    ? new CapacitorSocketService() 
    : new DebugSocketService();
};

// Service registration
export const servicesPlugin = {
  install(app: App) {
    app.provide('socketService', createSocketService());
    app.provide('fileService', createFileService());
  }
};
```

### Service Composable Pattern

```typescript
// ✅ GOOD: Composable for service consumption
export const useSocketService = (): ISocketService => {
  const socketService = inject<ISocketService>('socketService');
  
  if (!socketService) {
    throw new Error('Socket service not provided');
  }
  
  return socketService;
};
```

## ❌ Anti-Patterns

### Direct Implementation Dependencies

```typescript
// ❌ BAD: Components depending on specific implementations
import { DebugSocketService } from '@/services/socket/DebugSocketService';
const socketService = new DebugSocketService(); // ❌ BAD

// ✅ GOOD: Use service abstraction
const socketService = useSocketService(); // ✅ GOOD
```

### Mixed Service Responsibilities

```typescript
// ❌ BAD: Service handling too many concerns
export class AppService {
  async connectSocket(url: string) { /* ... */ }
  async saveFile(path: string, content: string) { /* ... */ }
  async loginUser(credentials: Credentials) { /* ... */ }
  toggleSidebar() { /* ... */ } // Too many responsibilities
}

// ✅ GOOD: Focused, single-responsibility services
export class SocketService implements ISocketService { /* socket only */ }
export class FileService implements IFileService { /* files only */ }
```

### Wrong Dependency Direction

```typescript
// ❌ BAD: Service knowing about features that consume it
export class SocketService {
  private profileFeature: ProfileFeature; // ❌ BAD - service knows about feature
  
  async connect() {
    // ...
    this.profileFeature.onConnectionEstablished(); // ❌ BAD - tight coupling
  }
}

// ❌ BAD: Service B knowing about Service A that uses it
export class FileService {
  private socketService: SocketService; // ❌ BAD - reverse dependency
  
  async saveFile() {
    this.socketService.notifyFileSaved(); // ❌ BAD - wrong direction
  }
}

// ✅ GOOD: Services are consumed, never know their consumers
export class SocketService {
  // Clean interface, no knowledge of consumers
  async connect() { /* ... */ }
  subscribe(handler: (event) => void) { /* ... */ } // ✅ GOOD - callback pattern
}
```

## 🏗️ Architecture Organization

### Service Layer Structure

```
src/services/
├── socket/
│   ├── interfaces/ISocketService.ts
│   ├── implementations/
│   │   ├── DebugSocketService.ts
│   │   └── CapacitorSocketService.ts
│   └── composables/useSocketService.ts
├── files/
│   ├── interfaces/IFileService.ts
│   └── implementations/
└── radar/
    ├── RadarService.ts
    └── useRadarService.ts
```

**Key Patterns:**
- **Interface-first design**: Define contracts before implementations
- **Platform implementations**: Separate Debug vs Capacitor versions
- **Composable access**: Provide clean injection patterns

## 📚 Related Guidelines

- **[Error Handling](../patterns/error-handling.md)** - Service-level error management and typed errors
- **[Testing Guidelines](../patterns/testing.md#service-testing)** - Service testing with mocking patterns
- **[TypeScript Guidelines](../style/typescript.md#service-interfaces)** - Service interface design patterns
- **[Composables](./composables.md)** - Using services within composables

Remember: Great services provide clean abstractions, handle errors gracefully, and make testing easier. They should encapsulate external complexity while providing simple, predictable interfaces to their consumers.