export type ObjectType = 'emlTrace';

export interface BaseProjectObject
{
  id: string;
  name: string;
  type: ObjectType;
  visible: boolean;
}

export interface EmlTrace extends BaseProjectObject
{
  type: 'emlTrace';
  points: Array<{ lat: number; lng: number; timestamp: number }>;
}

export type ProjectObject = EmlTrace;
