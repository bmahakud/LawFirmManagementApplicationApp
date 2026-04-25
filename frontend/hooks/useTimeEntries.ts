import { useState, useEffect, useCallback } from 'react';
import { customFetch } from '@/lib/fetch';
import { API } from '@/lib/api';

export interface TimeEntry {
  id: string;
  firm: string;
  case: string | null;
  case_title: string;
  user: string;
  user_name: string;
  date: string;
  activity_type: string;
  description: string;
  hours: string;
  hourly_rate: string;
  amount: string;
  billable: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'invoiced';
  invoice: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function useTimeEntries(viewType: 'all' | 'my_entries' | 'unbilled' = 'all') {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = API.BILLING.TIME_ENTRIES.LIST;
      
      if (viewType === 'unbilled') {
        url = API.BILLING.TIME_ENTRIES.UNBILLED;
      } else if (viewType === 'my_entries') {
        const today = new Date();
        // Default to current month for my_entries
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
        url = API.BILLING.TIME_ENTRIES.MY_ENTRIES(startDate, endDate);
      }

      const response = await customFetch(url);
      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : (data.results || []);
        setEntries(results);
      } else {
        throw new Error('Failed to fetch time entries');
      }
    } catch (err: any) {
      console.error('Time Entries Fetch Error:', err);
      setError('Connection to billing service failed.');
    } finally {
      setLoading(false);
    }
  }, [viewType]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    loading,
    error,
    refresh: fetchEntries
  };
}
