import type { Channel } from './Channel';

export type Profile = {
  channels: Channel[];
  traceSeparation: number | null;
  deviceModel: string;
};
