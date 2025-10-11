import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { themes, Theme, ThemeId } from '@/config/themes';
import { toast } from 'sonner';

interface ThemeContextType {
  currentTheme: Theme;
  isAutoThemeEnabled: boolean;
  setTheme: (themeId: ThemeId) => Promise<void>;
  toggleAutoTheme: (enabled: boolean) => Promise<void>;
  themeLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading: authLoading } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]); // Default theme
  const [isAutoThemeEnabled, setIsAutoThemeEnabled] = useState(false);
  const [themeLoading, setThemeLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null); // To store the ID of the theme_settings row

  const applyThemeToCss = useCallback((theme: Theme) => {
    document.documentElement.style.setProperty('--theme-primary-h', theme.primary.hue.toString());
    document.documentElement.style.setProperty('--theme-primary-s', theme.primary.saturation.toString());
    document.documentElement.style.setProperty('--theme-primary-l', theme.primary.lightness.toString());
    document.documentElement.style.setProperty('--theme-background-h', theme.background.hue.toString());
    document.documentElement.style.setProperty('--theme-background-s', theme.background.saturation.toString());
    document.documentElement.style.setProperty('--theme-background-l', theme.background.lightness.toString());
  }, []);

  const getAutomaticTheme = useCallback(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // Mês de 1 a 12
    const currentDay = today.getDate();

    // Prioriza temas com data específica (ex: Natal)
    const specificDateTheme = themes.find(t =>
      t.triggerMonth === currentMonth && t.triggerDay === currentDay
    );
    if (specificDateTheme) {
      return specificDateTheme;
    }

    // Depois, verifica temas por mês
    const monthlyTheme = themes.find(t =>
      t.triggerMonth === currentMonth && t.triggerDay === undefined
    );
    if (monthlyTheme) {
      return monthlyTheme;
    }

    return themes.find(t => t.id === 'default') || themes[0];
  }, []);

  // Load settings and apply theme on mount or auth change
  useEffect(() => {
    if (authLoading) return;

    const loadThemeSettings = async () => {
      setThemeLoading(true);
      try {
        const { data, error } = await supabase
          .from('theme_settings')
          .select('*')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
          throw error;
        }

        if (data) {
          setSettingsId(data.id);
          setIsAutoThemeEnabled(data.auto_theme_enabled);
          const savedTheme = themes.find(t => t.id === data.active_theme_id);
          if (data.auto_theme_enabled) {
            const autoTheme = getAutomaticTheme();
            setCurrentTheme(autoTheme);
            applyThemeToCss(autoTheme);
          } else if (savedTheme) {
            setCurrentTheme(savedTheme);
            applyThemeToCss(savedTheme);
          } else {
            // Fallback to default if saved theme not found
            setCurrentTheme(themes[0]);
            applyThemeToCss(themes[0]);
          }
        } else {
          // No settings found, apply default or automatic if applicable
          const autoTheme = getAutomaticTheme();
          setCurrentTheme(autoTheme);
          applyThemeToCss(autoTheme);
        }
      } catch (error: any) {
        console.error("Error loading theme settings:", error.message);
        toast.error("Erro ao carregar configurações de tema.");
        // Fallback to default theme on error
        setCurrentTheme(themes[0]);
        applyThemeToCss(themes[0]);
      } finally {
        setThemeLoading(false);
      }
    };

    loadThemeSettings();
  }, [authLoading, applyThemeToCss, getAutomaticTheme]);

  // Effect for automatic theme switching (runs monthly or on auto mode toggle)
  useEffect(() => {
    if (isAutoThemeEnabled && !themeLoading) {
      const autoTheme = getAutomaticTheme();
      setCurrentTheme(autoTheme);
      applyThemeToCss(autoTheme);
    }
  }, [isAutoThemeEnabled, themeLoading, applyThemeToCss, getAutomaticTheme]);

  const saveThemeSetting = useCallback(async (activeThemeId: ThemeId | null, autoEnabled: boolean) => {
    if (!user || profile?.role !== 'ADMIN') {
      toast.error("Você não tem permissão para alterar as configurações de tema.");
      return;
    }

    try {
      if (settingsId) {
        // Update existing settings
        const { error } = await supabase
          .from('theme_settings')
          .update({ active_theme_id: activeThemeId, auto_theme_enabled: autoEnabled, updated_at: new Date().toISOString() })
          .eq('id', settingsId);
        if (error) throw error;
      } else {
        // Insert new settings
        const { data, error } = await supabase
          .from('theme_settings')
          .insert([{ active_theme_id: activeThemeId, auto_theme_enabled: autoEnabled }])
          .select('id')
          .single();
        if (error) throw error;
        setSettingsId(data.id);
      }
      toast.success("Configurações de tema salvas com sucesso!");
    } catch (error: any) {
      console.error("Error saving theme settings:", error.message);
      toast.error("Erro ao salvar configurações de tema.");
    }
  }, [user, profile, settingsId]);

  const setTheme = useCallback(async (themeId: ThemeId) => {
    const selected = themes.find(t => t.id === themeId);
    if (selected) {
      setCurrentTheme(selected);
      applyThemeToCss(selected);
      setIsAutoThemeEnabled(false); // Desativa o modo automático ao selecionar manualmente
      await saveThemeSetting(themeId, false);
    }
  }, [applyThemeToCss, saveThemeSetting]);

  const toggleAutoTheme = useCallback(async (enabled: boolean) => {
    setIsAutoThemeEnabled(enabled);
    if (enabled) {
      const autoTheme = getAutomaticTheme();
      setCurrentTheme(autoTheme);
      applyThemeToCss(autoTheme);
      await saveThemeSetting(autoTheme.id, true);
    } else {
      // When disabling auto, revert to default or last manually selected if available
      const defaultTheme = themes.find(t => t.id === 'default') || themes[0];
      setCurrentTheme(defaultTheme);
      applyThemeToCss(defaultTheme);
      await saveThemeSetting(defaultTheme.id, false);
    }
  }, [applyThemeToCss, getAutomaticTheme, saveThemeSetting]);

  const value = {
    currentTheme,
    isAutoThemeEnabled,
    setTheme,
    toggleAutoTheme,
    themeLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};