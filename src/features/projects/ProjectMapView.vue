<template>
  <div class="h-full w-full relative">
    <div
      ref="mapContainer"
      class="h-full w-full"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import { useProjectContext } from './useProjectContext';

  const { project } = useProjectContext();

  const mapContainer = ref<HTMLDivElement | null>(null);
  let map: L.Map | null = null;

  const DEFAULT_CENTER: L.LatLngExpression = [0, 0];
  const DEFAULT_ZOOM = 2;

  onMounted(() =>
  {
    if (!mapContainer.value) return;

    map = L.map(mapContainer.value,
    {
      attributionControl: false,
    }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
    }).addTo(map);
  });

  onUnmounted(() =>
  {
    if (map)
    {
      map.remove();
      map = null;
    }
  });
</script>

<style>
  @reference "tailwindcss";
</style>
