<template>
  <div ref="containerRef" class="masonry-container">
    <!-- Measurement container: renders all items to measure heights -->
    <div v-if="!measured" ref="measureRef" class="flex flex-col" :style="{ gap: gapStyle }">
      <div v-for="(vnode, index) in slotChildren" :key="index" ref="itemRefs">
        <component :is="vnode" />
      </div>
    </div>

    <!-- Display container: renders items distributed into columns -->
    <div v-else class="flex" :style="{ gap: gapStyle }">
      <div v-for="(column, colIndex) in columns"
           :key="colIndex"
           class="flex-1 flex flex-col"
           :style="{ gap: gapStyle }">
        <component :is="slotChildren[itemIndex]" v-for="itemIndex in column" :key="itemIndex" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, useSlots, onMounted, onUnmounted, watch, nextTick } from 'vue';
  import type { VNode } from 'vue';
  import './MasonryGrid.css';

  const slots = useSlots();
  const containerRef = ref<HTMLElement | null>(null);
  const measureRef = ref<HTMLElement | null>(null);

  const measured = ref(false);
  const itemHeights = ref<number[]>([]);
  const columnCount = ref(1);

  // Extract VNodes from default slot
  const slotChildren = computed<VNode[]>(() =>
  {
    const defaultSlot = slots.default?.();
    if (!defaultSlot) return [];

    // Flatten fragments and filter out text/comment nodes
    const flatten = (nodes: VNode[]): VNode[] =>
    {
      return nodes.flatMap(node =>
      {
        if (node.type === Symbol.for('v-fgt'))
        {
          return flatten(node.children as VNode[]);
        }
        return node;
      });
    };

    return flatten(defaultSlot).filter(
      node => typeof node.type !== 'symbol' && node.type !== Comment
    );
  });

  // Read gap from CSS variable or use default
  const gapStyle = computed(() =>
  {
    if (!containerRef.value) return '1.5rem';
    const gap = getComputedStyle(containerRef.value).getPropertyValue('--masonry-gap').trim();
    return gap || '1.5rem';
  });

  // Distribute items to columns using shortest-column algorithm
  const columns = computed<number[][]>(() =>
  {
    const numCols = columnCount.value;
    if (numCols <= 1 || itemHeights.value.length === 0)
    {
      // Single column: all items in order
      return [slotChildren.value.map((_, i) => i)];
    }

    // Initialize columns and their heights
    const cols: number[][] = Array.from({ length: numCols }, () => []);
    const colHeights: number[] = Array(numCols).fill(0);

    // Distribute each item to the shortest column
    itemHeights.value.forEach((height, index) =>
    {
      const shortestCol = colHeights.indexOf(Math.min(...colHeights));
      cols[shortestCol]?.push(index);
      colHeights[shortestCol] = (colHeights[shortestCol] ?? 0) + height;
    });

    return cols;
  });

  // Read column count from CSS variable
  const updateColumnCount = () =>
  {
    if (!containerRef.value) return;
    const cssValue = getComputedStyle(containerRef.value).getPropertyValue('--masonry-columns').trim();
    columnCount.value = parseInt(cssValue, 10) || 1;
  };

  // Measure all items and store their heights
  const measureItems = async () =>
  {
    await nextTick();

    if (!measureRef.value) return;

    const items = measureRef.value.children;
    const heights: number[] = [];

    for (let i = 0; i < items.length; i++)
    {
      heights.push((items[i] as HTMLElement).offsetHeight);
    }

    itemHeights.value = heights;
    measured.value = true;
  };

  // Handle resize: re-read column count and potentially re-measure
  let resizeObserver: ResizeObserver | null = null;

  const setupResizeObserver = () =>
  {
    if (!containerRef.value) return;

    resizeObserver = new ResizeObserver(() =>
    {
      updateColumnCount();
    });

    resizeObserver.observe(containerRef.value);
  };

  onMounted(async () =>
  {
    updateColumnCount();
    await measureItems();
    setupResizeObserver();
  });

  onUnmounted(() =>
  {
    resizeObserver?.disconnect();
  });

  // Re-measure when slot content changes
  watch(slotChildren, async () =>
  {
    measured.value = false;
    await nextTick();
    await measureItems();
  }, { deep: true });
</script>

