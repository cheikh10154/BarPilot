'use client';

import React, { useState, use } from 'react';
import { useBarPilotStore, StaffMember } from '@/lib/store';
import { UserRole } from '@/types/database';
import {
  Users2,
  UserPlus,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Clock,
  X
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

  const roleConfigs: Record<UserRole, { label_it: string; label_fr: string; color: string }> = {
    owner: {
      label_it: 'Proprietario',
      label_fr: 'Propriétaire',
      color: 'text-amber-600'
    },
    manager: {
      label_it: 'Manager',
      label_fr: 'Manager',
      color: 'text-purple-600'
    },
    server: {
      label_it: 'Cameriere',
      label_fr: 'Serveur',
      color: 'text-blue-600'
    },
    bartender: {
      label_it: 'Barman',
      label_fr: 'Barman',
      color: 'text-emerald-600'
    },
    cashier: {
      label_it: 'Cassiere',
      label_fr: 'Caissier',
      color: 'text-indigo-600'
    },
  };

  const activeCount = staff.filter(s => s.status === 'active').length;
  const inactiveCount = staff.filter(s => s.status !== 'active').length;

  const filteredStaff = staff.filter(s => {
    if (activeTab === 'active') return s.status === 'active';
    if (activeTab === 'inactive') return s.status !== 'active';
    return true;
  });

  const getAvatarGradient = (name: string) => {
    if (name.includes('Marco')) return 'from-amber-400 to-orange-500 text-white';
    if (name.includes('Laura')) return 'from-purple-400 to-pink-500 text-white';
    if (name.includes('Giulia')) return 'from-blue-400 to-indigo-500 text-white';
    if (name.includes('Alessandro')) return 'from-emerald-400 to-teal-500 text-white';
    if (name.includes('Sara')) return 'from-rose-400 to-red-500 text-white';
    return 'from-slate-400 to-slate-600 text-white';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

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

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-12 bp-fade-up">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-400 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-xs">{toastMsg}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bp-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isIt ? 'Personale' : 'Personnel'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {staff.length} {isIt ? 'membri' : 'membres'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isIt 
              ? 'Controllo accessi RBAC, ruoli sala/bancone KDS e tracciabilità comande' 
              : 'Gestion des rôles RBAC, affectation salle/bar KDS'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPermissionsModal(true)}
            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>{isIt ? 'Matrice permessi' : 'Matrice droits'}</span>
          </button>

          <button
            onClick={() => setShowInviteModal(true)}
            className="h-10 px-4 bp-btn-primary text-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isIt ? 'Invita dipendente' : 'Inviter un employé'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar matching mockup: Tutti, Attivi, Inattivi */}
      <div className="bp-card p-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isIt ? 'Tutti' : 'Tous'} ({staff.length})
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'active'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isIt ? 'Attivi' : 'Actifs'} ({activeCount})
          </button>

          <button
            onClick={() => setActiveTab('inactive')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'inactive'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isIt ? 'Inattivi' : 'Inactifs'} ({inactiveCount})
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          {isIt ? 'PIN rapido a 4 cifre per tablet' : 'Code PIN à 4 chiffres'}
        </span>
      </div>

      {/* Staff Rows matching mockup */}
      <div className="bp-card overflow-hidden divide-y divide-slate-100">
        {filteredStaff.map(member => {
          const cfg = roleConfigs[member.role] || roleConfigs.server;
          const isActive = member.status === 'active';

          return (
            <div
              key={member.id}
              className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition"
            >
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-tr ${getAvatarGradient(member.name)} font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-sm`}>
                    {getInitials(member.name)}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      isActive ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {member.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isIt ? cfg.label_it : cfg.label_fr} · <span className="text-slate-400">{member.email}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span>{isActive ? (isIt ? 'Attivo' : 'Actif') : (isIt ? 'Inattivo' : 'Inactif')}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl bp-fade-up">
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
                  className="px-4 py-2 bp-btn-primary"
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
