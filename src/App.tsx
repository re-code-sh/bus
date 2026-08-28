import React, { useState } from 'react';
import { I18nProvider } from '@/contexts/i18n-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { CityProvider } from '@/contexts/city-context';
import { BasemapProvider } from '@/contexts/basemap-context';
import { MapLayersProvider } from '@/contexts/map-layers-context';
import { StationsProvider } from '@/contexts/stations-context';
import { AppHeader } from '@/components/layout/app-header';
import { MapCanvas } from '@/components/map/map-canvas';
import { BottomSheet } from '@/components/panel/bottom-sheet';
import { SettingsModal } from '@/components/settings/settings-modal';

function MainApp() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0e1014] select-none touch-manipulation">
      <AppHeader onOpenSettings={() => setIsSettingsOpen(true)} />
      <main className="w-full h-full">
        <MapCanvas />
      </main>
      <BottomSheet />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <CityProvider>
          <BasemapProvider>
            <MapLayersProvider>
              <StationsProvider>
                <MainApp />
              </StationsProvider>
            </MapLayersProvider>
          </BasemapProvider>
        </CityProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
