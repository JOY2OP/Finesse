import { supabase } from '@/app/lib/supabase';
import { BACKEND_URL } from '@/constants/config';
import { useEffect, useState } from 'react';

export interface CustomSubcategory {
  id: string;
  label: string;
  emoji: string;
  custom: true;
}

export interface CustomCategories {
  needs: CustomSubcategory[];
  wants: CustomSubcategory[];
  investing: CustomSubcategory[];
}

const EMPTY: CustomCategories = { needs: [], wants: [], investing: [] };

export function useCustomCategories() {
  const [customCategories, setCustomCategories] = useState<CustomCategories>(EMPTY);

  useEffect(() => {
    (async () => {
      try {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const res = await fetch(`${BACKEND_URL}/preferences/${user.id}`);
        const result = await res.json() as { success: boolean; data?: { custom_categories?: CustomCategories } };

        if (result.success && result.data?.custom_categories) {
          setCustomCategories(result.data.custom_categories);
        }
      } catch (err) {
        console.error('Failed to load custom categories:', err);
      }
    })();
  }, []);

  const addCustomSubcategory = async (
    category: keyof CustomCategories,
    label: string,
    emoji: string
  ): Promise<boolean> => {
    try {
      const id = label.toLowerCase().replace(/\s+/g, '_');
      const newEntry: CustomSubcategory = { id, label, emoji, custom: true };

      const updated: CustomCategories = {
        ...customCategories,
        [category]: [...customCategories[category], newEntry],
      };

      setCustomCategories(updated);

      if (!supabase) return false;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const res = await fetch(`${BACKEND_URL}/preferences/custom-categories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, custom_categories: updated }),
      });

      const result = await res.json() as { success: boolean };
      return result.success;
    } catch (err) {
      console.error('Failed to add custom subcategory:', err);
      return false;
    }
  };

  return { customCategories, addCustomSubcategory };
}
