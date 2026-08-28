import React, { useState, useRef, useEffect, useCallback } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import { useI18n } from '@/contexts/i18n-context';
import { useCity } from '@/contexts/city-context';
import { useMapLayers } from '@/contexts/map-layers-context';
import { useStations } from '@/contexts/stations-context';
import { useTransitSearch } from '@/hooks/use-transit-search';
import { usePlaceSearch } from '@/hooks/use-place-search';
import { SearchColumns } from './search-columns';
import { StationList } from './station-list';
import { StationDetail } from './station-detail';
import type { Station } from '@/lib/stations';
import type { BusStop } from '@/lib/bus-stops';
import type { PlaceResult } from '@/lib/geocoding';
import { withViewTransition } from '@/lib/view-transition';
import { cn } from '@/lib/utils';

export type SheetDetent = 'peek' | 'half' | 'full';

export function BottomSheet() {
  const { t, lang } = useI18n();
  const { cityId } = useCity();
  const { isSheetVisible } = useMapLayers();
  const { selected, selectItem } = useStations();

  const [isOpen, setIsOpen] = useState(false);
  const [detent, setDetent] = useState<SheetDetent>('half');
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isSearchActive = searchQuery.trim().length > 0;

  const { sections: transitSections, isSearching: isTransitSearching } = useTransitSearch(
    searchQuery,
    isSheetVisible,
    t,
    cityId,
    lang
  );
  const { places, isSearching: isPlaceSearching } = usePlaceSearch(searchQuery, cityId, lang);

  // Auto-open panel when an item is selected on the map
  useEffect(() => {
    if (selected) {
      withViewTransition(() => {
        setIsOpen(true);
        setDetent('half');
      });
    }
  }, [selected]);

  const handleSelectStation = useCallback(
    (station: Station) => {
      withViewTransition(() => {
        selectItem({ kind: 'metro', station }, { flyTo: true });
      });
    },
    [selectItem]
  );

  const handleSelectBusStop = useCallback(
    (stop: BusStop, kind: 'brt' | 'bus') => {
      withViewTransition(() => {
        selectItem({ kind, stop }, { flyTo: true });
      });
    },
    [selectItem]
  );

  const handleSelectPlace = useCallback(
    (place: PlaceResult) => {
      withViewTransition(() => {
        selectItem({ kind: 'place', place }, { flyTo: true });
      });
    },
    [selectItem]
  );

  const handleBackToList = useCallback(() => {
    withViewTransition(() => {
      selectItem(null);
      setSearchQuery('');
    });
  }, [selectItem]);

  const handleClosePanel = useCallback(() => {
    withViewTransition(() => {
      setIsOpen(false);
      selectItem(null);
      setSearchQuery('');
    });
  }, [selectItem]);

  const handleToggleDetent = useCallback(() => {
    withViewTransition(() => {
      setDetent((prev) => {
        if (prev === 'peek') return 'half';
        if (prev === 'half') return 'full';
        return 'half';
      });
    });
  }, []);

  // Native Gesture Dragging (Pure Ponytail: Zero External Heavy Libraries)
  const touchStartY = useRef(0);
  const currentDeltaY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    currentDeltaY.current = 0;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - touchStartY.current;
    currentDeltaY.current = deltaY;
    // Resistance curve when pulling past limits
    if (detent === 'full' && deltaY < 0) {
      setDragOffset(deltaY * 0.2);
    } else {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const delta = currentDeltaY.current;
    setDragOffset(0);

    withViewTransition(() => {
      if (detent === 'half') {
        if (delta < -60) setDetent('full');
        else if (delta > 120) setIsOpen(false);
        else if (delta > 40) setDetent('peek');
      } else if (detent === 'full') {
        if (delta > 60) setDetent('half');
      } else if (detent === 'peek') {
        if (delta < -40) setDetent('half');
        else if (delta > 50) setIsOpen(false);
      }
    });
  };

  const detentHeights = {
    peek: 'h-[160px] sm:h-[180px]',
    half: 'h-[50vh] sm:h-[55vh]',
    full: 'h-[88vh] sm:h-[90vh]',
  };

  return (
    <>
      {/* Floating Trigger Button (when panel is closed) */}
      {!isOpen && (
        <div className="fixed bottom-6 inset-x-0 z-30 flex justify-center pointer-events-none pb-safe">
          <button
            type="button"
            onClick={() => {
              withViewTransition(() => {
                setIsOpen(true);
                setDetent('half');
              });
            }}
            aria-label={t.search}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-full bg-white/80 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-800 text-neutral-900 dark:text-white border border-white/30 dark:border-white/15 shadow-2xl backdrop-blur-xl transition-all duration-200 cursor-pointer active:scale-95 group">
            <div className="flex items-center justify-center size-8 rounded-full bg-[#5e4b8b] border border-[#8f7bb7]/40 shadow-md">
              <FormatListBulletedRoundedIcon sx={{ fontSize: 18 }} className="text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">{t.search}</span>
            <SearchRoundedIcon sx={{ fontSize: 18 }} className="text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors mr-1 rtl:mr-0 rtl:ml-1" />
          </button>
        </div>
      )}

      {/* Glassmorphic Swipeable Bottom Sheet */}
      {isOpen && (
        <aside
          style={{
            transform: isDragging ? `translateY(${dragOffset}px)` : 'translateY(0px)',
            transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), height 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className={cn(
            'fixed bottom-0 inset-x-0 z-30 pb-safe md:inset-x-auto md:top-16 md:bottom-6 md:w-96 md:h-auto md:max-h-[calc(100vh-5.5rem)]',
            'md:right-4 rtl:md:right-auto rtl:md:left-4',
            'flex flex-col overscroll-contain touch-pan-y',
            'bg-white/80 dark:bg-[#181b20]/80 backdrop-blur-2xl border-t md:border border-white/30 dark:border-white/15 shadow-2xl rounded-t-3xl md:rounded-3xl',
            'animate-in slide-in-from-bottom duration-300'
          )}>
          {/* Mobile Drag Handle Bar */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleToggleDetent}
            className="w-full flex items-center justify-center pt-3 pb-1.5 cursor-grab active:cursor-grabbing md:hidden select-none">
            <div className="w-12 h-1.5 rounded-full bg-neutral-400/50 dark:bg-white/30 transition-all hover:bg-neutral-500 dark:hover:bg-white/50" />
          </div>

          {/* Sheet Header: Search Input or Station Banner */}
          <div className="px-3.5 sm:px-4 py-2 border-b border-black/5 dark:border-white/10 shrink-0">
            {!selected ? (
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <SearchRoundedIcon
                    sx={{ fontSize: 20 }}
                    className="absolute right-3 rtl:right-3 rtl:left-auto left-auto rtl:left-auto top-2.5 text-neutral-500 dark:text-neutral-400 pointer-events-none"
                  />
                  <input
                    type="search"
                    autoFocus={!selected && detent !== 'peek'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.search}
                    className="w-full h-10 pr-9 pl-8 rtl:pr-9 rtl:pl-8 rounded-full bg-neutral-100 dark:bg-black/40 border border-black/10 dark:border-white/10 text-sm text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label={t.clearSearch}
                      className="absolute left-3 rtl:left-3 rtl:right-auto top-2.5 p-0.5 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">
                      <CloseRoundedIcon sx={{ fontSize: 18 }} />
                    </button>
                  )}
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleClosePanel}
                  aria-label={t.close}
                  className="flex items-center justify-center size-9 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer shrink-0">
                  <CloseRoundedIcon sx={{ fontSize: 20 }} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[80%]">
                  {selected.kind === 'metro'
                    ? selected.station.name[lang]
                    : selected.kind === 'place'
                      ? selected.place.name
                      : lang === 'fa' || !selected.stop.latinName
                        ? selected.stop.name
                        : selected.stop.latinName}
                </span>
                <button
                  type="button"
                  onClick={handleClosePanel}
                  aria-label={t.closeSheet}
                  className="p-1 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer">
                  <CloseRoundedIcon sx={{ fontSize: 20 }} />
                </button>
              </div>
            )}
          </div>

          {/* Desktop Detent Toggle */}
          <div className="hidden md:flex items-center justify-end px-3 py-1 text-[11px] text-neutral-500 dark:text-neutral-400 border-b border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={handleToggleDetent}
              className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">
              <span>{detent === 'full' ? t.collapse : t.expand}</span>
              {detent === 'full' ? (
                <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />
              ) : (
                <KeyboardArrowUpRoundedIcon sx={{ fontSize: 16 }} />
              )}
            </button>
          </div>

          {/* Body Content Container */}
          <div
            className={cn(
              'flex-1 min-h-0 px-3.5 sm:px-4 pt-2 pb-2 overflow-hidden flex flex-col',
              'md:h-[520px]',
              detentHeights[detent]
            )}>
            {selected ? (
              <div className="overflow-y-auto h-full pr-1 rtl:pr-0 rtl:pl-1">
                <StationDetail selected={selected} onBackToList={handleBackToList} />
              </div>
            ) : isSearchActive ? (
              <SearchColumns
                sections={transitSections}
                isTransitSearching={isTransitSearching}
                places={places}
                isPlaceSearching={isPlaceSearching}
                query={searchQuery}
                onSelectStation={handleSelectStation}
                onSelectBusStop={handleSelectBusStop}
                onSelectPlace={handleSelectPlace}
              />
            ) : (
              <StationList
                sections={transitSections}
                onSelectStation={handleSelectStation}
                onSelectBusStop={handleSelectBusStop}
              />
            )}
          </div>
        </aside>
      )}
    </>
  );
}
