import type { EmlTrace, ObjectType, ProjectObject } from './ProjectObject.type';

export const createEmlTrace = (name: string): EmlTrace =>
{
  return {
    id: crypto.randomUUID(),
    name,
    type: 'emlTrace',
    visible: true,
    points: []
  };
};

export const getNextObjectName = (objects: ProjectObject[], type: ObjectType): string =>
{
  const typeLabels: Record<ObjectType, string> =
  {
    emlTrace: 'Layer'
  };

  const label = typeLabels[type];
  const existingOfType = objects.filter(obj => obj.type === type);
  const nextNumber = existingOfType.length + 1;

  return `${label} ${nextNumber}`;
};
