import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="fixed bottom-6 left-6 z-[100]">
      <DropdownMenu onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="h-12 px-4 rounded-full bg-black/60 backdrop-blur-xl border-zinc-800 hover:border-red-600/50 hover:bg-zinc-900/80 transition-all shadow-2xl group flex items-center gap-3 overflow-hidden text-white"
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Globe className="w-5 h-5 text-red-600" />
            </motion.div>
            <span className="font-bold text-sm tracking-wide uppercase">{currentLang.code}</span>
            <span className="text-lg opacity-80">{currentLang.flag}</span>
            
            {/* Glow effect */}
            <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          side="top" 
          sideOffset={12}
          className="w-48 bg-black/90 backdrop-blur-2xl border-zinc-800 p-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <AnimatePresence>
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code as any)}
                className={`
                  flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-1 last:mb-0
                  ${language === lang.code ? 'bg-red-600/20 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{lang.flag}</span>
                  <span className="font-bold text-sm uppercase tracking-tight">{lang.label}</span>
                </div>
                {language === lang.code && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="w-4 h-4 text-red-600" />
                  </motion.div>
                )}
              </DropdownMenuItem>
            ))}
          </AnimatePresence>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
