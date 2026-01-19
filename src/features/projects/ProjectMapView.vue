<template>
  <div class="h-full w-full relative">
    <div ref="mapContainer"
         class="h-full w-full" />
    <div class="absolute inset-0 z-[1000] pointer-events-none">
      <LayerIndicator
        :layers="layers"
        :activeLayerId="activeLayerId"
        @select-layer="handleSelectLayer"
        @delete-layer="handleDeleteLayer"
        @toggle-visibility="handleToggleVisibility"
        @add-layer="handleAddLayer"
        @view-elements="handleViewElements"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import { openDialog } from 'vue3-promise-dialog';
  import { useProjectContext } from './useProjectContext';
  import { useGpsService } from '@/services/gps/useGpsService';
  import { useActiveLayerStore } from './stores/useActiveLayerStore';
  import { GpsFixQuality } from '@/services/gps/types/GpsFixQuality.enum';
  import { parseNmeaGga } from '@/services/gps/utils/nmeaParser';
  import LayerIndicator from './layers/LayerIndicator.vue';
  import LayerElementsDialog from './layers/LayerElementsDialog.vue';
  import AddLayerDialog from './layers/AddLayerDialog.vue';
  import GeoConfirmationDialog from '@/generic/components/GeoConfirmationDialog.vue';
  import type { Layer, EmlReading } from './objects/ProjectObject.type';
  import { createLayer, getNextLayerName } from './objects/objectUtils';

  const { project, saveProject } = useProjectContext();
  const { subscribeToLocationData } = useGpsService();
  const activeLayerStore = useActiveLayerStore();

  const mapContainer = ref<HTMLDivElement | null>(null);
  let map: L.Map | null = null;
  let unsubscribeGps: (() => void) | null = null;
  let hasCenteredOnGps = false;
  let layerGroups: Map<string, L.LayerGroup> = new Map();
  let locationMarker: L.CircleMarker | null = null;

  const DEFAULT_CENTER: L.LatLngExpression = [0, 0];
  const DEFAULT_ZOOM = 18;

  const layers = computed(() => project.value?.layers ?? []);
  const activeLayerId = computed(() => activeLayerStore.activeLayerId);

  // Validate active layer when layers change
  watch(layers, () =>
  {
    activeLayerStore.validateActiveLayer(project.value);
  }, { immediate: true });

  const handleAddLayer = async (): Promise<void> =>
  {
    const existingLayers = project.value?.layers ?? [];
    const defaultName = getNextLayerName(existingLayers);
    const layerName = await openDialog<string | null>(AddLayerDialog, { defaultName });

    if (layerName && project.value)
    {
      const newLayer = createLayer(layerName);
      const updatedLayers = [...existingLayers, newLayer];
      await saveProject({
        ...project.value,
        layers: updatedLayers
      });
      activeLayerStore.setActiveLayer(newLayer.id);
    }
  };

  const handleSelectLayer = (layerId: string): void =>
  {
    activeLayerStore.setActiveLayer(layerId);
  };

  const handleDeleteLayer = async (layerId: string): Promise<void> =>
  {
    if (!project.value) return;

    const layerToDelete = project.value.layers.find(layer => layer.id === layerId);
    if (!layerToDelete) return;

    const confirmed = await openDialog<boolean>(GeoConfirmationDialog, {
      title: 'Delete Layer',
      message: `Are you sure you want to delete "${layerToDelete.name}"? All elements in this layer will be permanently deleted.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    const updatedLayers = project.value.layers.filter(layer => layer.id !== layerId);
    await saveProject({
      ...project.value,
      layers: updatedLayers
    });
  };

  const handleToggleVisibility = async (layerId: string): Promise<void> =>
  {
    if (!project.value) return;

    const updatedLayers = project.value.layers.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    );

    await saveProject({
      ...project.value,
      layers: updatedLayers
    });
  };

  const handleViewElements = async (layer: Layer): Promise<void> =>
  {
    const result = await openDialog<{ type: 'delete'; elementId: string } | null>(
      LayerElementsDialog,
      { layer }
    );

    if (result?.type === 'delete' && project.value)
    {
      const updatedLayers = project.value.layers.map(l =>
      {
        if (l.id === layer.id)
        {
          return {
            ...l,
            objects: l.objects.filter(obj => obj.id !== result.elementId)
          };
        }
        return l;
      });

      await saveProject({
        ...project.value,
        layers: updatedLayers
      });

      const updatedLayer = updatedLayers.find(l => l.id === layer.id);
      if (updatedLayer && updatedLayer.objects.length > 0)
      {
        await handleViewElements(updatedLayer);
      }
    }
  };

  /**
   * Extract lat/lng from EML reading's GPS NMEA sentence
   */
  const getCoordinatesFromReading = (reading: EmlReading): { lat: number; lng: number } | null =>
  {
    if (!reading.gps)
    {
      return null;
    }

    try
    {
      const parsed = parseNmeaGga(reading.gps);
      if (parsed.isValid && parsed.latitude !== null && parsed.longitude !== null)
      {
        return { lat: parsed.latitude, lng: parsed.longitude };
      }
    }
    catch
    {
      // Invalid NMEA sentence
    }

    return null;
  };

  const renderLayersOnMap = (): void =>
  {
    if (!map) return;

    layerGroups.forEach(group => group.remove());
    layerGroups.clear();

    const projectLayers = project.value?.layers ?? [];

    projectLayers.forEach(layer =>
    {
      if (!layer.visible) return;

      const layerGroup = L.layerGroup();
      const points: L.LatLngExpression[] = [];

      let pointNumber = 0;
      layer.objects.forEach(obj =>
      {
        if (obj.type === 'emlReading')
        {
          const coords = getCoordinatesFromReading(obj);
          if (coords)
          {
            pointNumber++;
            points.push([coords.lat, coords.lng]);

            L.circleMarker([coords.lat, coords.lng], {
              radius: 4,
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 1
            }).addTo(layerGroup);

            // Add point number label
            L.marker([coords.lat, coords.lng], {
              icon: L.divIcon({
                className: 'point-number-label',
                html: `<span>${pointNumber}</span>`,
                iconSize: [20, 14],
                iconAnchor: [-6, 7]
              })
            }).addTo(layerGroup);
          }
        }
      });

      // Draw polyline connecting points
      if (points.length > 1)
      {
        L.polyline(points, { color: '#3b82f6', weight: 3 }).addTo(layerGroup);
      }

      layerGroup.addTo(map!);
      layerGroups.set(layer.id, layerGroup);
    });
  };

  watch(
    () => project.value?.layers,
    () => renderLayersOnMap(),
    { deep: true }
  );

  onMounted(() =>
  {
    if (!mapContainer.value) return;

    map = L.map(mapContainer.value,
                {
                  attributionControl: false,
                }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
                {
                  maxZoom: 20,
                  maxNativeZoom: 16,
                }).addTo(map);

    renderLayersOnMap();

    unsubscribeGps = subscribeToLocationData((data) =>
    {
      const isValidFix = data.isValid &&
        data.fixQuality > GpsFixQuality.INVALID &&
        data.latitude !== null &&
        data.longitude !== null;

      if (isValidFix && map)
      {
        const latLng: L.LatLngExpression = [data.latitude!, data.longitude!];

        if (!locationMarker)
        {
          locationMarker = L.circleMarker(latLng, {
            radius: 8,
            color: '#ffffff',
            fillColor: '#3b82f6',
            fillOpacity: 1,
            weight: 2
          }).addTo(map);
        }
        else
        {
          locationMarker.setLatLng(latLng);
        }

        if (!hasCenteredOnGps)
        {
          map.setView(latLng, DEFAULT_ZOOM);
          hasCenteredOnGps = true;
        }
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

    layerGroups.forEach(group => group.remove());
    layerGroups.clear();

    if (locationMarker)
    {
      locationMarker.remove();
      locationMarker = null;
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

  .point-number-label
  {
    background: transparent;
    border: none;
  }

  .point-number-label span
  {
    font-size: 11px;
    font-weight: 600;
    color: #fff;
    text-shadow: 0 0 3px #000, 0 0 3px #000;
  }
</style>
