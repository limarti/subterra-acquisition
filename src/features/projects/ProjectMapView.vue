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
  import { useGpsService } from '@/services/gps/useGpsService';
  import { GpsFixQuality } from '@/services/gps/types/GpsFixQuality.enum';

  const { project } = useProjectContext();
  const { subscribeToLocationData } = useGpsService();

  const mapContainer = ref<HTMLDivElement | null>(null);
  let map: L.Map | null = null;
  let unsubscribeGps: (() => void) | null = null;
  let hasCenteredOnGps = false;

  const DEFAULT_CENTER: L.LatLngExpression = [0, 0];
  const DEFAULT_ZOOM = 18;

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

    unsubscribeGps = subscribeToLocationData((data) =>
    {
      if (hasCenteredOnGps) return;

      const isValidFix = data.isValid &&
                         data.fixQuality > GpsFixQuality.INVALID &&
                         data.latitude !== null &&
                         data.longitude !== null;

      if (isValidFix && map)
      {
        map.setView([data.latitude!, data.longitude!], DEFAULT_ZOOM);
        hasCenteredOnGps = true;
      }
    });
  });

  onUnmounted(() =>
  {
    if (unsubscribeGps)
    {
      unsubscribeGps();
      unsubscribeGps = null;
    }

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
