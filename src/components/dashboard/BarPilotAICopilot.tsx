'use client';

import React, { useState } from 'react';
import { useBarPilotStore } from '@/lib/store';
import { formatCents } from '@/lib/utils';
import {
  Sparkles,
  Bot,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Props {
  locale: 'it' | 'fr';
}

export function BarPilotAICopilot({ locale }: Props) {
  const isIt = locale === 'it';
  const { orders, inventory, products } = useBarPilotStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([
    {
      role: 'ai',
      text: isIt
        ? 'Ciao Gianluca! Ho analizzato l\'attività del Bar Central di oggi. Ho preparato 3 suggerimenti operativi intelligenti per ottimizzare il servizio dell\'Aperitivo e i margini.'
        : 'Bonjour Gianluca ! J\'ai analysé l\'activité du Bar Central aujourd\'hui. J\'ai 3 recommandations intelligentes pour optimiser le service de l\'Aperitivo et vos marges.',
    },
  ]);

  // Real-time AI calculated metrics from store
  const lowStock = inventory.filter(i => i.current_quantity <= i.reorder_level);
  const totalSalesCents = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_cents, 0);

  const smartInsights = [
    {
      type: 'warning',
      icon: AlertTriangle,
      title_it: 'Allerta Pre-Rush Aperitivo (18:00 - 21:00)',
      title_fr: 'Alerte Préparation Rush Aperitivo (18h - 21h)',
      desc_it: `Previsto picco di 45+ cocktail tra poco. Il Prosecco DOC è a quota ${inventory.find(i => i.id === 'inv-3')?.current_quantity || 0} ml: metti in fresca altre 4 bottiglie per non rischiare rotture di stock durante il servizio.`,
      desc_fr: `Pic de 45+ cocktails prévu. Le Prosecco DOC est à ${inventory.find(i => i.id === 'inv-3')?.current_quantity || 0} ml : mettez au frais 4 bouteilles supplémentaires.`,
      color: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    },
    {
      type: 'opportunity',
      icon: TrendingUp,
      title_it: 'Opportunità Margine: Negroni Classico',
      title_fr: 'Optimisation de Marge : Negroni Classique',
      desc_it: 'Il Negroni ha un food cost di soli 0,90 € a fronte di 8,00 € di vendita (margine 88,7%). Suggerisci ai camerieri di proporlo come cocktail speciale della serata.',
      desc_fr: 'Le Negroni présente un coût matière de seulement 0,90 € pour un prix de vente de 8,00 € (marge 88,7%). Suggérez à l\'équipe de le mettre en avant.',
      color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    },
    {
      type: 'tip',
      icon: Lightbulb,
      title_it: 'Scontrino Medio in Crescita (+18%)',
      title_fr: 'Panier Moyen en Hausse (+18%)',
      desc_it: `Le ordinazioni combinate (Cocktail + Tagliere) sui tavoli della Terrazza stanno aumentando la redditività oraria del bar a ${formatCents(totalSalesCents, isIt ? 'it-IT' : 'fr-FR')}.`,
      desc_fr: `Les commandes combinées (Cocktail + Planchette) en terrasse augmentent la rentabilité horaire à ${formatCents(totalSalesCents, isIt ? 'it-IT' : 'fr-FR')}.`,
      color: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    },
  ];

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setQuery('');

    setMessages(prev => [...prev, { role: 'user', text: userText }]);

    // Simulated contextual AI response based on real store state
    setTimeout(() => {
      let reply = '';
      const q = userText.toLowerCase();

      if (q.includes('caffè') || q.includes('cafe')) {
        const coffeeItem = inventory.find(i => i.id === 'inv-1');
        reply = isIt
          ? `Al momento disponi di ${coffeeItem?.current_quantity || 0}g di Caffè Arabica in grani. Con un consumo medio di 9g a tazzina, hai autonomia per circa ${Math.round((coffeeItem?.current_quantity || 0) / 9)} espressi. Nessun riordino urgente necessario prima di domani.`
          : `Vous disposez actuellement de ${coffeeItem?.current_quantity || 0}g de Café Arabica. Avec 9g par tasse, vous avez une autonomie d'environ ${Math.round((coffeeItem?.current_quantity || 0) / 9)} espressos.`;
      } else if (q.includes('redditizi') || q.includes('margine') || q.includes('rentable')) {
        reply = isIt
          ? 'I 3 prodotti più redditizi nel tuo bar oggi sono: 1° Negroni Classico (88% margine), 2° Espresso (81% margine), 3° Aperol Spritz (78% margine).'
          : 'Vos 3 produits les plus rentables sont : 1° Negroni Classique (88% marge), 2° Espresso (81% marge), 3° Aperol Spritz (78% marge).';
      } else {
        reply = isIt
          ? `Ho analizzato i dati operativi del turno: ${orders.length} comande totali registrate, ${lowStock.length} scorte sotto soglia minima e incasso a ${formatCents(totalSalesCents, 'it-IT')}. Tutto procede regolarmente!`
          : `J'ai analysé les données : ${orders.length} commandes enregistrées, ${lowStock.length} alertes de stock et ${formatCents(totalSalesCents, 'fr-FR')} de ventes. Tout se déroule de façon fluide !`;
      }

      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    }, 500);
  };

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 rounded-2xl border border-amber-500/30 p-5 shadow-2xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-white text-base">BarPilot AI Copilot</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-widest">
                v1.3 Smart
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isIt
                ? 'Assistente intelligente per previsione vendite, consumi e margini'
                : 'Assistant intelligent pour prévisions des ventes et rentabilité'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 pt-3 border-t border-slate-800/80">
          
          {/* Smart Insights Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {smartInsights.map((insight, idx) => {
              const Icon = insight.icon;
              return (
                <div key={idx} className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${insight.color}`}>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{isIt ? insight.title_it : insight.title_fr}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {isIt ? insight.desc_it : insight.desc_fr}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Chat Strip */}
          <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 space-y-2.5">
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1 text-xs">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 ${
                    m.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.role === 'ai' && (
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div
                    className={`p-2.5 rounded-xl max-w-md ${
                      m.role === 'user'
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'bg-slate-900 border border-slate-800 text-slate-200'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleAskAI} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={isIt ? 'Chiedi a BarPilot AI (es. "Quanto caffè ci rimane?", "Cosa consigliare stasera?")...' : 'Demandez à BarPilot AI (ex. "Combien de café reste-t-il ?")...'}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-md shadow-amber-500/20"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
