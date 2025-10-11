import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Palette, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeContext';
import { themes, Theme } from '@/config/themes';
import { cn } from '@/lib/utils';

export function ThemeSelector() {
  const { currentTheme, isAutoThemeEnabled, setTheme, toggleAutoTheme, themeLoading } = useTheme();

  const handleThemeSelect = async (themeId: Theme['id']) => {
    await setTheme(themeId);
  };

  const handleToggleAutoTheme = async (checked: boolean) => {
    await toggleAutoTheme(checked);
  };

  if (themeLoading) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Carregando configurações de tema...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">
            <Palette className="inline-block mr-2 h-6 w-6 text-primary" />
            Temas e Datas Comemorativas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Personalize o visual do site escolhendo um tema manualmente ou ative o modo automático para que ele mude conforme o mês ou data comemorativa.
          </p>

          <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              <Label htmlFor="auto-theme-mode" className="text-base">Modo Automático por Data</Label>
            </div>
            <Switch
              id="auto-theme-mode"
              checked={isAutoThemeEnabled}
              onCheckedChange={handleToggleAutoTheme}
              disabled={themeLoading}
            />
          </div>

          <h3 className="text-xl font-semibold mt-6 mb-4">Escolha um Tema:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {themes.map((theme) => (
              <motion.div
                key={theme.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex flex-col items-center justify-center p-4 rounded-lg shadow-md cursor-pointer transition-all duration-200",
                  currentTheme.id === theme.id ? "border-2 border-primary ring-2 ring-primary" : "border border-border"
                )}
                style={{
                  backgroundColor: `hsl(${theme.background.hue} ${theme.background.saturation}% ${theme.background.lightness}%)`,
                  color: `hsl(${theme.primary.hue} ${theme.primary.saturation}% ${theme.primary.lightness}%)`,
                }}
                onClick={() => handleThemeSelect(theme.id)}
              >
                {currentTheme.id === theme.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 right-2 text-primary"
                  >
                    <CheckCircle className="h-6 w-6" />
                  </motion.div>
                )}
                <span className="text-5xl mb-2">{theme.emoji}</span>
                <h4 className="text-lg font-bold text-center">{theme.name}</h4>
                <p className="text-sm text-center text-muted-foreground">{theme.description}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}