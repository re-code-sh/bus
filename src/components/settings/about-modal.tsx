import React from 'react';
import { Dialog } from '@/components/common/dialog';
import { useI18n } from '@/contexts/i18n-context';
import DirectionsTransitRoundedIcon from '@mui/icons-material/DirectionsTransitRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';

type AboutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ABOUT_FEATURE_KEYS = [
  'aboutFeatureMetroBrtBus',
  'aboutFeatureMultiCity',
  'aboutFeatureRouting',
  'aboutFeaturePlaceSearch',
  'aboutFeatureSatelliteBasemap',
  'aboutFeatureI18n',
  'aboutFeatureTheme',
] as const;

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { t } = useI18n();

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t.aboutTitle}>
      <div className="space-y-4 text-xs sm:text-sm text-neutral-300">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
          <div className="w-10 h-10 rounded-2xl bg-[#5e4b8b] border border-[#8f7bb7]/40 flex items-center justify-center shadow-lg shrink-0">
            <DirectionsTransitRoundedIcon sx={{ fontSize: 22 }} className="text-white" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm sm:text-base">{t.appName}</h4>
            <p className="text-[11px] text-neutral-400 leading-snug">{t.aboutDescription}</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-bold text-white">{t.whatIsIstgah}</p>
          <p className="text-xs text-neutral-400 leading-relaxed">{t.aboutBody}</p>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <p className="font-bold text-white flex items-center gap-1.5">
            <AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} className="text-amber-400" />
            <span>{t.aboutFeaturesTitle}</span>
          </p>
          <ul className="space-y-1 text-xs text-neutral-300">
            {ABOUT_FEATURE_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-1.5">
                <span className="text-blue-400 leading-tight">•</span>
                <span>{t[key]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-2">
          <a
            href="https://github.com/MohsenDastaran"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors">
            <PersonRoundedIcon sx={{ fontSize: 18 }} />
            <span>{t.developerGitHub}</span>
          </a>
          <a
            href="https://github.com/MohsenDastaran/istgah-rn"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors">
            <CodeRoundedIcon sx={{ fontSize: 18 }} />
            <span>{t.appSourceCode}</span>
          </a>
        </div>
      </div>
    </Dialog>
  );
}
