import { useEffect } from 'react';
import { upsertReservation, type Reservation } from './data';
import { supabase } from './supabase';

// One subscription for the whole dashboard. New and changed bookings are patched into the
// cached list, so bookings appear without polling or refetching.
export function useReservationStream(enabled: boolean, onNewBooking: (booking: Reservation) => void) {
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase.channel('admin-reservations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (payload) => {
        if (payload.eventType === 'DELETE') return;
        const row = payload.new as Reservation;
        void upsertReservation(row);
        if (payload.eventType === 'INSERT') onNewBooking(row);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [enabled, onNewBooking]);
}
