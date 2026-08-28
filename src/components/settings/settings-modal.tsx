import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from '@/components/common/dialog';
import { useI18n } from '@/contexts/i18n-context';
import { useBasemap } from '@/contexts/basemap-context';
import { useCity } from '@/contexts/city-context';
import { useTheme } from '@/contexts/theme-context';
import { CITIES, CITY_IDS, type CityId } from '@/lib/cities';
import { AboutModal } from './about-modal';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import SatelliteAltRoundedIcon from '@mui/icons-material/SatelliteAltRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { cn } from '@/lib/utils';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t, lang, setLang } = useI18n();
  const { basemap, setBasemap } = useBasemap();
  const { cityId, setCity } = useCity();
  const { theme, setTheme } = useTheme();

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Close city dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    };
    if (isCityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCityDropdownOpen]);

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose} title={t.settings}>
        <div className="space-y-4 text-xs sm:text-sm">
          {/* Basemap Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 block">{t.mapStyle}</label>
            <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setBasemap('street')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none',
                  basemap === 'street'
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                )}>
                <MapRoundedIcon sx={{ fontSize: 18 }} />
                <span>{t.basemapStreet}</span>
              </button>
              <button
                type="button"
                onClick={() => setBasemap('satellite')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none',
                  basemap === 'satellite'
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                )}>
                <SatelliteAltRoundedIcon sx={{ fontSize: 18 }} />
                <span>{t.basemapSatellite}</span>
              </button>
            </div>
            {basemap === 'satellite' && (
              <p className="text-[10px] text-amber-400/80 leading-relaxed px-1">
                {t.satelliteVpnNote}
              </p>
            )}
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Language Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-300">
              <LanguageRoundedIcon sx={{ fontSize: 18 }} className="text-neutral-400" />
              <span>{t.language}</span>
            </div>
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setLang('fa')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  lang === 'fa' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
                )}>
                فارسی
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  lang === 'en' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
                )}>
                English
              </button>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-300">
              <PaletteRoundedIcon sx={{ fontSize: 18 }} className="text-neutral-400" />
              <span>{t.theme}</span>
            </div>
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  theme === 'light' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
                )}>
                <LightModeRoundedIcon sx={{ fontSize: 16 }} />
                <span>{t.themeLight}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  theme === 'dark' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
                )}>
                <DarkModeRoundedIcon sx={{ fontSize: 16 }} />
                <span>{t.themeDark}</span>
              </button>
            </div>
          </div>

          {/* Minimal & Proportional Default City Selector (Matching Width) */}
          <div className="flex items-center justify-between relative" ref={cityDropdownRef}>
            <div className="flex items-center gap-2 text-neutral-300">
              <PlaceRoundedIcon sx={{ fontSize: 18 }} className="text-neutral-400" />
              <span>{t.defaultCity}</span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCityDropdownOpen((prev) => !prev)}
                className="flex items-center justify-between gap-1.5 min-w-[96px] bg-black/40 hover:bg-black/60 active:scale-98 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white font-medium transition-all cursor-pointer">
                <span>{CITIES[cityId].name[lang]}</span>
                <KeyboardArrowDownRoundedIcon
                  sx={{ fontSize: 16 }}
                  className={cn(
                    'text-neutral-400 transition-transform duration-200',
                    isCityDropdownOpen && 'rotate-180 text-white'
                  )}
                />
              </button>

              {/* Minimal Popover Matching the Width of the City Button */}
              {isCityDropdownOpen && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1 z-50 w-full min-w-[96px] rounded-xl bg-[#1e2229] border border-white/15 shadow-2xl p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                  {CITY_IDS.map((id) => {
                    const isSelected = id === cityId;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setCity(id as CityId);
                          setIsCityDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                          isSelected
                            ? 'bg-[#5e4b8b] text-white font-bold shadow-xs'
                            : 'text-neutral-300 hover:text-white hover:bg-white/10 active:bg-white/15'
                        )}>
                        <span className="truncate">{CITIES[id].name[lang]}</span>
                        {isSelected && <CheckRoundedIcon sx={{ fontSize: 14 }} className="text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Footer Actions */}
          <div className="space-y-1 pt-1">
            <button
              type="button"
              onClick={() => setIsAboutOpen(true)}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-start">
              <InfoRoundedIcon sx={{ fontSize: 18 }} className="text-neutral-400" />
              <span>{t.about}</span>
            </button>

            <a
              href="https://github.com/MohsenDastaran/istgah-rn/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/5 transition-colors text-start">
              <div className="flex items-center gap-2.5">
                <BugReportRoundedIcon sx={{ fontSize: 18 }} className="text-neutral-400" />
                <span>{t.reportIssue}</span>
              </div>
              <LaunchRoundedIcon sx={{ fontSize: 16 }} className="text-neutral-400" />
            </a>
          </div>
        </div>
      </Dialog>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
}
