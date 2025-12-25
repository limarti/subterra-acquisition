# Three.js Integration Guidelines

## 🚀 AI Quick Reference

| Problem | Solution | Section |
|---------|----------|---------|
| Three.js objects too slow | Non-reactive objects pattern | [Reactivity Considerations](#1-reactivity-considerations) |
| Composable returns null objects | Getter functions | [Non-Reactive Object Management](#2-non-reactive-object-management) |
| Can't mutate scene/camera | Avoid readonly() on working objects | [readonly() and Object Mutations](#3-readonly-and-object-mutations) |
| Mixed Vue + Three.js logic | Infrastructure vs domain separation | [Architecture Recommendations](#architecture-recommendations) |
| When to create composables | Rule of Three + complexity | [When to Extract Graphics Composables](#when-to-extract-graphics-composables) |
| Memory leaks in Three.js | cleanupThreeScene utility function | [Memory Management](#-memory-management-with-cleanup-utility) |
| TypeScript + Three.js typing | Explicit types + null unions | [TypeScript Integration](#-typescript-integration-patterns) |

This guide establishes patterns for integrating Three.js and other imperative graphics libraries with Vue 3 composables, focusing on performance optimization and clean API design.

## 🎯 When to Use These Patterns

These patterns apply when working with:
- **Three.js** - 3D graphics and WebGL rendering
- **Canvas API** - 2D graphics and custom drawing
- **WebGL** - Direct graphics programming
- **Other imperative graphics libraries** - Libraries that manage their own object lifecycles

**Key Characteristic**: Libraries that create objects requiring imperative manipulation and don't benefit from Vue's reactivity system.

## 🚀 Core Three.js Patterns

### 1. Reactivity Considerations

**❌ Problem**: Making Three.js objects reactive causes unnecessary performance overhead.

```javascript
// BAD: Unnecessary Vue reactivity overhead
const scene = ref(new THREE.Scene());
const camera = ref(new THREE.Camera());
const renderer = ref(new THREE.WebGLRenderer());
```

**✅ Solution**: Use plain JavaScript objects for Three.js instances.

```javascript
// GOOD: No reactivity overhead for Three.js objects
let scene = null;
let camera = null;
let renderer = null;
```

**Performance Impact**: Non-reactive Three.js objects provide ~30% performance improvement in scene operations.

Three.js objects are imperative and don't benefit from Vue's reactivity system. Only make Vue-relevant state reactive.

### 2. Non-Reactive Object Management

**❌ Problem**: Non-reactive objects returned from composables are captured at creation time.

```javascript
// BAD: scene and camera are null when composable returns
export function useThreeScene() {
  let scene = null;
  let camera = null;
  
  function initThreeScene() {
    scene = new THREE.Scene();
    camera = new THREE.Camera();
  }
  
  return { scene, camera }; // Always null!
}
```

**✅ Solution**: Use getter functions to provide dynamic access.

```javascript
// GOOD: Getter functions provide current values
export function useThreeScene() {
  let scene = null;
  let camera = null;
  
  function initThreeScene() {
    scene = new THREE.Scene();
    camera = new THREE.Camera();
  }
  
  return {
    get scene() { return scene; },
    get camera() { return camera; },
    initThreeScene
  };
}
```

When returning non-reactive objects that are initialized asynchronously, use getters to ensure dynamic access.

### 3. readonly() and Object Mutations

**❌ Problem**: `readonly()` prevents necessary mutations to Three.js objects.

```javascript
// BAD: Blocks scene.add() and other essential operations
export function useThreeScene() {
  let scene = null;
  
  return { 
    get scene() { return readonly(scene); } // Prevents scene.add()!
  };
}
```

**✅ Solution**: Only use `readonly()` for truly immutable state.

```javascript
// GOOD: Allow mutations for working objects, protect only state
export function useThreeScene() {
  let scene = null;
  const isReady = ref(false);
  
  return {
    get scene() { return scene; },           // Allow mutations
    isReady: readonly(isReady)               // Protect state only
  };
}
```

`readonly()` should only wrap state that shouldn't be mutated, not working objects that require imperative operations.

## 🧹 Memory Management with Cleanup Utility

**Problem**: Three.js objects require proper disposal to prevent memory leaks, and manual cleanup is error-prone.

**✅ Solution**: Use a reusable cleanup utility that handles all disposal automatically.

```javascript
// Reusable cleanup utility
export function cleanupThreeScene(scene) {
  while (scene.children.length > 0) {
    cleanupThreeScene(scene.children[0]);
    scene.remove(scene.children[0]);
  }
  if (scene.dispose && !(scene instanceof THREE.Scene)) scene.dispose();
  if (scene.geoDispose) scene.geoDispose();
  if (scene.geometry) scene.geometry.dispose();
  if (scene.texture) scene.texture.dispose();
  if (scene.material) {
    if (scene.material.map) if (scene.material.map.dispose) scene.material.map.dispose();
    if (scene.material.dispose) scene.material.dispose();
  }
}

// Usage in composables
export function useThreeScene() {
  let scene = null;
  let renderer = null;
  
  const initThreeScene = () => {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer();
  };
  
  // Automatic cleanup
  onUnmounted(() => {
    cleanupThreeScene(scene);
    renderer?.dispose();
  });
  
  return {
    get scene() { return scene; },
    initThreeScene
  };
}
```

This utility recursively cleans all nested objects and handles disposal of geometries, materials, textures, and custom disposal methods.

## 🔷 TypeScript Integration Patterns

**Problem**: Three.js composables need proper typing for better IntelliSense and type safety.

**✅ Solution**: Use explicit Three.js types with null unions and type guards.

```typescript
// ✅ GOOD: Proper TypeScript typing for Three.js composables
export function useThreeScene2D(options: {
  container?: HTMLElement;
  rendererOptions?: THREE.WebGLRendererParameters;
} = {}) {
  let scene: THREE.Scene | null = null;
  let camera: THREE.OrthographicCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  
  const isReady = ref<boolean>(false);
  
  const initThreeScene = (): void => {
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    renderer = new THREE.WebGLRenderer(options.rendererOptions);
    isReady.value = true;
  };
  
  return {
    // Typed getters that can return null
    get scene(): THREE.Scene | null { return scene; },
    get camera(): THREE.OrthographicCamera | null { return camera; },
    get renderer(): THREE.WebGLRenderer | null { return renderer; },
    
    // Reactive state with proper typing
    isReady: readonly(isReady),
    
    // Typed functions
    initThreeScene
  } as const; // Make return type readonly
}

// ✅ GOOD: Proper usage with type guards
const threeScene = useThreeScene2D({ rendererOptions: { antialias: true } });

watch(threeScene.isReady, (ready) => {
  if (ready && threeScene.scene && threeScene.camera) {
    // TypeScript knows these are non-null here
    threeScene.scene.add(mesh);
  }
});
```

**Key TypeScript patterns:**
- Explicit Three.js types for better IntelliSense
- Null union types for uninitialized objects  
- Type guards in usage for safe access
- `as const` for readonly return types

## 🏗️ Composable Design Patterns

### Recommended Architecture

```javascript
export function useThreeScene2D(options = {}) {
  const { container, zoomRect, rendererOptions } = options;
  
  // Non-reactive Three.js objects
  let scene = null;
  let camera = null;
  let renderer = null;
  
  // Reactive state only for Vue-relevant data
  const isReady = ref(false);
  const isLoading = ref(false);
  
  function initThreeScene() {
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(/*...*/);
    renderer = new THREE.WebGLRenderer(rendererOptions);
    
    // Attach related objects for cleaner API
    scene.camera = camera;
    
    isReady.value = true;
  }
  
  function render() {
    if (scene && camera && renderer) {
      renderer.render(scene, camera);
    }
  }
  
  // Cleanup
  onUnmounted(() => {
    renderer?.dispose();
  });
  
  return {
    get scene() { return scene; },        // Dynamic access via getter
    isReady: readonly(isReady),           // Reactive state with readonly
    isLoading: readonly(isLoading),       // Reactive state with readonly
    render,                               // Action function
    initThreeScene                        // Initialization function
  };
}
```

### Component Usage Pattern

```javascript
// Component setup
const threeScene = useThreeScene2D({
  container: containerRef,
  zoomRect: toRef(props, 'zoomRect'),
  rendererOptions: { antialias: true, alpha: true }
});

// Access reactive state (can be destructured)
const { isReady, render } = threeScene;

// Use scene when ready
watch(isReady, (ready) => {
  if (ready) {
    threeScene.scene.add(mesh);
    render();
  }
});
```

## 🎯 Architecture Recommendations

### Infrastructure vs Domain Separation

**Infrastructure Composables** (Handle technical concerns):
```javascript
// useThreeScene2D.js - Scene setup, WebGL context, rendering
// useWebGLContext.js - Low-level WebGL management
// useCanvasRenderer.js - Canvas API abstraction
```

**Domain Composables** (Handle business logic):
```javascript
// useGeologicalRenderer.js - Geological visualization logic
// usePicksVisualization.js - Pick data rendering
// useProfileData.js - Profile calculation and management
```

**Clear Boundaries**: Don't mix infrastructure and domain concerns in the same composable.

### When to Extract Graphics Composables

Based on the extraction criteria from **[Don't Extract Prematurely](../principles/dont-extract-prematurely.md)**:

✅ **Extract when you have:**
- **Clear reuse potential**: 3+ components could benefit from the same Three.js setup
- **Substantial complexity**: 50+ lines of Three.js initialization code
- **Separation of concerns**: Infrastructure (Three.js) vs. domain logic (geological calculations)
- **Testing benefits**: Complex graphics logic needs isolation

❌ **Don't extract prematurely**: Simple, single-use Three.js setup should stay inline.

## ⚠️ Common Pitfalls to Avoid

1. **Over-reactivity**: Don't make Three.js objects reactive - performance killer
2. **Premature extraction**: Wait for clear reuse patterns before creating composables
3. **Mixed concerns**: Keep infrastructure (Three.js) and domain logic (geological) separate
4. **Destructuring getters**: Access properties directly on returned objects, not through destructuring
5. **Readonly overuse**: Only protect truly immutable state, not working objects

## 🔮 Future Applications

This pattern can be extended for:
- `useThreeScene3D` - 3D geological visualizations
- `useWebGLContext` - Custom shader workflows
- `useCanvasRenderer` - 2D canvas-based visualizations
- `useGeologicalRenderer` - Domain-specific rendering composables

## 📚 Related Guidelines

- **[Composables](./composables.md)** - General Vue 3 composable patterns
- **[Don't Extract Prematurely](../principles/dont-extract-prematurely.md)** - When to create composables vs keep logic inline
- **[Component Design](./component-design.md)** - How components should delegate to graphics composables
- **[Vue Conventions](../style/vue-conventions.md)** - Vue-specific patterns that apply to graphics composables

## 💡 Key Takeaways

1. **Performance Matters**: Non-reactive Three.js objects provide significant performance benefits
2. **Getter Functions**: Essential for asynchronously initialized non-reactive objects
3. **Selective Reactivity**: Only make Vue-relevant state reactive, not working objects
4. **Clean APIs**: Property attachment and intuitive object relationships improve usability
5. **Clear Separation**: Infrastructure and domain concerns should remain separate

Remember: The goal is to bridge the gap between Vue's reactive paradigm and Three.js's imperative paradigm while maintaining optimal performance and clean APIs.