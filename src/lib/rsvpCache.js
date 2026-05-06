import { registerCacheBuster } from './cacheBuster';

export const responseCache = new Map();
export const cacheKey = (eventId, playerId) => `${eventId}:${playerId}`;
registerCacheBuster(() => responseCache.clear());
