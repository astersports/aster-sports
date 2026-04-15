import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useNextEventRides(event) {
  const [rideInfo, setRideInfo] = useState(null);

  useEffect(() => {
    if (!event?.id || !event.enable_rides) { setRideInfo(null); return; }
    supabase.from('event_rides').select('ride_type, seats').eq('event_id', event.id)
      .then(({ data }) => {
        if (!data) return;
        const offers = data.filter((r) => r.ride_type === 'offering').reduce((s, r) => s + (r.seats || 0), 0);
        const requests = data.filter((r) => r.ride_type === 'requesting').reduce((s, r) => s + (r.seats || 0), 0);
        setRideInfo({ offers, requests });
      });
  }, [event?.id, event?.enable_rides]);

  return rideInfo;
}
