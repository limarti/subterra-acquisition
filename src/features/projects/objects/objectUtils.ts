import type { Layer, EmlReading } from './ProjectObject.type';

export const createLayer = (name: string): Layer =>
{
  return {
    id: crypto.randomUUID(),
    name,
    visible: true,
    objects: []
  };
};

export const createEmlReading = (eml: string, gps: string): EmlReading =>
{
  return {
    id: crypto.randomUUID(),
    type: 'emlReading',
    epoch: Date.now(),
    eml,
    gps
  };
};

export const getNextLayerName = (layers: Layer[]): string =>
{
  const nextNumber = layers.length + 1;
  return `Layer ${nextNumber}`;
};
