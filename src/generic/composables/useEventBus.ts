import { createNanoEvents } from 'nanoevents';

// Generic event bus without specific event definitions
// Components can emit and listen to any events they need
const eventBus = createNanoEvents();

export const useEventBus = () =>
{
  return {
    emit: eventBus.emit.bind(eventBus),
    on: eventBus.on.bind(eventBus)
  };
};
