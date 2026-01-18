<template>
  <div class="h-full w-full relative">
    <div
      ref="mapContainer"
      class="h-full w-full"
    />
    <MapActionBar
      @add-click="handleAddClick"
      @layers-click="handleLayersClick"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watch } from 'vue';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import { openDialog } from 'vue3-promise-dialog';
  import { useProjectContext } from './useProjectContext';
  import { useGpsService } from '@/services/gps/useGpsService';
  import { GpsFixQuality } from '@/services/gps/types/GpsFixQuality.enum';
  import MapActionBar from './map/MapActionBar.vue';
  import AddObjectDialog from './objects/AddObjectDialog.vue';
  import LayersDialog from './objects/LayersDialog.vue';
  import type { ProjectObject, EmlTrace } from './objects/ProjectObject.type';

  const { project, saveProject } = useProjectContext();
  const { subscribeToLocationData } = useGpsService();

  const mapContainer = ref<HTMLDivElement | null>(null);
  let map: L.Map | null = null;
  let unsubscribeGps: (() => void) | null = null;
  let hasCenteredOnGps = false;
  let objectLayers: Map<string, L.LayerGroup> = new Map();

  const DEFAULT_CENTER: L.LatLngExpression = [0, 0];
  const DEFAULT_ZOOM = 18;

  const handleAddClick = async (): Promise<void> =>
  {
    const existingObjects = project.value?.objects ?? [];
    const newObject = await openDialog<ProjectObject | null>(AddObjectDialog, { existingObjects });

    if (newObject && project.value)
    {
      const updatedObjects = [...(project.value.objects ?? []), newObject];
      await saveProject({
        ...project.value,
        objects: updatedObjects
      });
    }
  };

  const handleLayersClick = async (): Promise<void> =>
  {
    await openDialog(LayersDialog);
  };

  const renderObjectsOnMap = (): void =>
  {
    if (!map) return;

    objectLayers.forEach(layer => layer.remove());
    objectLayers.clear();

    const objects = project.value?.objects ?? [];

    objects.forEach(obj =>
    {
      if (!obj.visible) return;

      if (obj.type === 'emlTrace')
      {
        const trace = obj as EmlTrace;
        const layerGroup = L.layerGroup();

        if (trace.points.length > 0)
        {
          const latLngs = trace.points.map(p => [p.lat, p.lng] as L.LatLngExpression);
          L.polyline(latLngs, { color: '#3b82f6', weight: 3 }).addTo(layerGroup);

          trace.points.forEach(point =>
          {
            L.circleMarker([point.lat, point.lng], {
              radius: 4,
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 1
            }).addTo(layerGroup);
          });
        }

        layerGroup.addTo(map!);
        objectLayers.set(obj.id, layerGroup);
      }
    });
  };

  watch(
    () => project.value?.objects,
    () => renderObjectsOnMap(),
    { deep: true }
  );

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

    renderObjectsOnMap();

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

    objectLayers.forEach(layer => layer.remove());
    objectLayers.clear();

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
