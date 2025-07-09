import { useState, useEffect, useCallback } from 'react';

interface AIFeatureConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  confidence: number;
  frequency: 'low' | 'medium' | 'high';
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  defaultView: 'list' | 'board' | 'calendar';
  timezone: string;
}

interface Settings {
  aiFeatures: AIFeatureConfig[];
  preferences: UserPreferences;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      
      const data = await response.json();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAIFeature = async (featureId: string, updates: Partial<AIFeatureConfig>) => {
    if (!settings) return;
    
    try {
      setIsSaving(true);
      const response = await fetch(`/api/settings/ai-features/${featureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update AI feature');
      
      const updatedFeature = await response.json();
      
      setSettings(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          aiFeatures: prev.aiFeatures.map(feature =>
            feature.id === featureId ? { ...feature, ...updatedFeature } : feature
          )
        };
      });
      
      setError(null);
    } catch (err) {
      console.error('Error updating AI feature:', err);
      setError('Failed to update AI feature settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!settings) return;
    
    try {
      setIsSaving(true);
      const response = await fetch('/api/settings/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update preferences');
      
      const updatedPreferences = await response.json();
      
      setSettings(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          preferences: { ...prev.preferences, ...updatedPreferences }
        };
      });
      
      setError(null);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update user preferences');
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    updateAIFeature,
    updatePreferences,
    refreshSettings: fetchSettings
  };
} 