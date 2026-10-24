'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

interface Props {
  locale: 'it' | 'fr';
}

export function NetworkStatus({ locale }: Props) {
  const isIt = locale === 'it';
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div className="bg-emerald-600 text-white text-xs py-1.5 px-4 text-center font-bold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-300">
        <Wifi className="w-3.5 h-3.5" />
        <span>
          {isIt
            ? 'Connessione Internet ripristinata. Sincronizzazione dati in corso...'
            : 'Connexion Internet rétablie. Synchronisation en cours...'}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-amber-600 text-slate-950 text-xs py-2 px-4 text-center font-extrabold flex items-center justify-center gap-2 shadow-lg animate-pulse">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        {isIt
          ? 'MODALITÀ OFFLINE: Connessione di rete assente. Le comande e i dati sono salvati in sicurezza nella memoria locale.'
          : 'MODE HORS LIGNE : Réseau indisponible. Les commandes restent sauvegardées en toute sécurité sur l\'appareil.'}
      </span>
    </div>
  );
}
