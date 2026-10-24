'use client';

import React, { useState, use } from 'react';
import { useBarPilotStore, StaffMember } from '@/lib/store';
import { UserRole } from '@/types/database';
import {
  Users2,
  UserPlus,
  ShieldCheck,
  Check,
  X,
  Lock,
  Mail,
  CheckCircle2,
  MoreVertical,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function StaffPage({ params }: PageProps) {
  const { locale } = use(params);
  const isIt = locale === 'it';

  const { staff } = useBarPilotStore();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('server');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const roleConfigs: Record<UserRole, { label_it: string; label_fr: string; badgeClass: string }> = {
    owner: {
      label_it: 'Proprietario',
      label_fr: 'Propriétaire',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    manager: {
      label_it: 'Manager',
      label_fr: 'Manager',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200'
    },
    server: {
      label_it: 'Cameriere / Sala',
      label_fr: 'Serveur / Salle',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    bartender: {
      label_it: 'Barman / KDS',
      label_fr: 'Barman / KDS',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
  };

  const activeCount = staff.filter(s => s.status === 'active').length;
  const inactiveCount = staff.filter(s => s.status !== 'active').length;

  const filteredStaff = staff.filter(s => {
    if (activeTab === 'active') return s.status === 'active';
    if (activeTab === 'inactive') return s.status !== 'active';
    return true;
  });

  const permissionsMatrix = [
    { name_it: 'Tableau de bord & KPI', name_fr: 'Tableau de bord & KPI', owner: 'Complet', manager: 'Complet', server: 'Limité', bartender: 'Non' },
    { name_it: 'Presa comande mobile', name_fr: 'Prise de commande mobile', owner: 'Oui', manager: 'Oui', server: 'Oui', bartender: 'Non' },
    { name_it: 'Schermo KDS preparazione', name_fr: 'Écran KDS préparation', owner: 'Oui', manager: 'Oui', server: 'Selon rôle', bartender: 'Oui' },
    { name_it: 'Modifica listino e ricette', name_fr: 'Modification prix & fiches', owner: 'Oui', manager: 'Autorisé', server: 'Non', bartender: 'Non' },
    { name_it: 'Giacenza e rettifiche magazzino', name_fr: 'Stocks & inventaires', owner: 'Oui', manager: 'Oui', server: 'Non', bartender: 'Consultation' },
    { name_it: 'Ordini d\'acquisto fornitori', name_fr: 'Bons de commande fournisseurs', owner: 'Oui', manager: 'Oui', server: 'Non', bartender: 'Non' },
    { name_it: 'Gestione e inviti dipendenti', name_fr: 'Gestion des employés', owner: 'Oui', manager: 'Limitée', server: 'Non', bartender: 'Non' },
    { name_it: 'Rapporti finanziari & Margini', name_fr: 'Rapports financiers & Marges', owner: 'Oui', manager: 'Autorisé', server: 'Non', bartender: 'Non' },
    { name_it: 'Parametri fiscali e abbonamento', name_fr: 'Paramètres & abonnement', owner: 'Oui', manager: 'Non', server: 'Non', bartender: 'Non' },
  ];

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setToastMsg(
      isIt
        ? `Invito con credenziali d'accesso inviato a ${inviteEmail}!`
        : `Invitation envoyée avec succès à ${inviteEmail} !`
    );
    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
    setTimeout(() => setToastMsg(null), 4000);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-400 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-xs">{toastMsg}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">
              {isIt ? 'Personale' : 'Personnel'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {staff.length} {isIt ? 'membri del team' : 'membres d\'équipe'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isIt 
              ? 'Controllo accessi RBAC, ruoli per sala e bancone KDS, tracciabilità delle comande' 
              : 'Gestion des rôles RBAC, affectation salle/bar KDS et journal d\'activité'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPermissionsModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
          >
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>{isIt ? 'Matrice permessi' : 'Matrice des droits'}</span>
          </button>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-sm hover:shadow transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isIt ? '+ Invita dipendente' : '+ Inviter un employé'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar (matching mockup: Tutti, Attivi, Inattivi) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isIt ? 'Tutti' : 'Tous'} ({staff.length})
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isIt ? 'Attivi' : 'Actifs'} ({activeCount})
          </button>

          <button
            onClick={() => setActiveTab('inactive')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'inactive'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isIt ? 'Inattivi' : 'Inactifs'} ({inactiveCount})
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          {isIt ? 'PIN rapido a 4 cifre per sblocco tablet' : 'Code PIN à 4 chiffres'}
        </div>
      </div>

      {/* Staff Cards Grid (matching mockup cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map(member => {
          const cfg = roleConfigs[member.role] || roleConfigs.server;
          const isActive = member.status === 'active';

          return (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition group"
            >
              <div>
                {/* Header: Avatar with initials, Name, Role Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs">
                        {getInitials(member.name)}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-orange-600 transition">
                        {member.name}
                      </h3>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cfg.badgeClass}`}>
                        {isIt ? cfg.label_it : cfg.label_fr}
                      </span>
                    </div>
                  </div>

                  {/* Active / Inactive Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span>{isActive ? (isIt ? 'Attivo' : 'Actif') : (isIt ? 'Inattivo' : 'Inactif')}</span>
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Email:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[170px]">{member.email}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">{isIt ? 'Ultimo accesso:' : 'Dernière activité :'}</span>
                    <span className="text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {member.last_active}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">{isIt ? 'PIN rapido POS:' : 'Code PIN POS :'}</span>
                    <span className="font-mono text-slate-800 font-bold tracking-widest">••••</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 mt-3 flex items-center justify-between">
                <button
                  onClick={() => alert(isIt ? `Modifica profilo di ${member.name}` : `Modifier le profil de ${member.name}`)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                >
                  {isIt ? 'Modifica permessi' : 'Modifier les droits'}
                </button>

                <button
                  onClick={() => alert(isIt ? `Rigenera PIN per ${member.name}` : `Régénérer le PIN pour ${member.name}`)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                >
                  {isIt ? 'Reimposta PIN' : 'Reset PIN'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 text-slate-900 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                <span>{isIt ? 'Matrice dei Permessi di Accesso (RBAC)' : 'Matrice des Droits d\'Accès (RBAC)'}</span>
              </h3>
              <button onClick={() => setShowPermissionsModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">{isIt ? 'Modulo / Funzionalità' : 'Module / Fonctionnalité'}</th>
                    <th className="py-2.5 px-3 text-amber-700">{isIt ? 'Proprietario' : 'Propriétaire'}</th>
                    <th className="py-2.5 px-3 text-purple-700">Manager</th>
                    <th className="py-2.5 px-3 text-blue-700">{isIt ? 'Cameriere' : 'Serveur'}</th>
                    <th className="py-2.5 px-3 text-emerald-700">{isIt ? 'Barman KDS' : 'Barman KDS'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permissionsMatrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {isIt ? row.name_it : row.name_fr}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-emerald-600">{row.owner}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-slate-700">{row.manager}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={row.server === 'Non' ? 'text-slate-400' : 'text-blue-600 font-semibold'}>
                          {row.server}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={row.bartender === 'Non' ? 'text-slate-400' : 'text-emerald-600 font-semibold'}>
                          {row.bartender}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-600" />
                <span>{isIt ? 'Invita Membro del Personale' : 'Inviter un Collaborateur'}</span>
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {isIt ? 'Nome e Cognome:' : 'Nom et Prénom :'}
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="Es. Matteo Corsi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {isIt ? 'Indirizzo Email:' : 'Adresse Email :'}
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="dipendente@barcentrale.it"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {isIt ? 'Ruolo operativo:' : 'Rôle opérationnel :'}
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  <option value="server">{isIt ? 'Cameriere (Sala / Ordini)' : 'Serveur (Salle / Commandes)'}</option>
                  <option value="bartender">{isIt ? 'Barman (Bancone KDS / Bar)' : 'Barman (Bar KDS)'}</option>
                  <option value="manager">{isIt ? 'Manager (Gestione sala & scorte)' : 'Manager (Gestion)'}</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
                <Lock className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span>
                  {isIt
                    ? 'Verrà generato un PIN rapido temporaneo a 4 cifre inviato via email per l\'accesso immediato ai tablet del bar.'
                    : 'Un code PIN provisoire à 4 chiffres sera envoyé par email pour la connexion rapide sur tablette.'}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  {isIt ? 'Annulla' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-sm"
                >
                  {isIt ? 'Invia Invito' : 'Envoyer l\'Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
