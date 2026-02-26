import React, { useState } from 'react';
import { useAssignUserRole, useGetAllAdminPrincipals, useGetVisitCount } from '../hooks/useQueries';
import { UserRole } from '../backend';
import { Principal } from '@dfinity/principal';
import { Settings, Plus, X, Users, Shield, Trash2, Eye, Copy, Server, Check } from 'lucide-react';

export default function AdminManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [newAdminPrincipal, setNewAdminPrincipal] = useState('');
  const [error, setError] = useState('');
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  
  const assignUserRole = useAssignUserRole();
  const { data: adminPrincipals = [], isLoading: loadingAdmins } = useGetAllAdminPrincipals();
  const { data: visitCount = 0n, isLoading: loadingVisitCount } = useGetVisitCount();

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newAdminPrincipal.trim()) {
      setError('Please enter a principal ID');
      return;
    }

    try {
      const principal = Principal.fromText(newAdminPrincipal.trim());
      await assignUserRole.mutateAsync({
        user: principal,
        role: UserRole.admin
      });
      setNewAdminPrincipal('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Invalid principal ID or assignment failed');
    }
  };

  const handleRemoveAdmin = async (principal: Principal) => {
    if (window.confirm('Are you sure you want to remove this admin?')) {
      try {
        await assignUserRole.mutateAsync({
          user: principal,
          role: UserRole.user
        });
      } catch (err: any) {
        setError(err.message || 'Failed to remove admin');
      }
    }
  };

  const formatPrincipal = (principal: string) => {
    if (principal.length <= 8) return principal;
    return `${principal.slice(0, 4)}...${principal.slice(-4)}`;
  };

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set(prev).add(itemId));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const defaultAdminPrincipal = 'tyf5f-xp4vd-acgcy-3az6q-poccg-u2yfq-7phil-jgidl-kmwm6-477a6-mae';
  
  // All canister IDs used by the app
  const canisterIds = [
    { id: 'tks3f-kaaaa-aaaas-qbq5q-cai', label: 'Backend Canister' },
    { id: 'tkq3f-kaaaa-aaaas-qbq5q-cai', label: 'Frontend Canister' }
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg transition-colors"
        title="Manage Admins"
      >
        <Settings className="w-4 h-4" />
        Manage
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-4xl border border-slate-700 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold text-slate-100">Admin Management</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Site Statistics Section - Now First */}
            <div className="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-medium text-slate-100">Site Statistics</h3>
              </div>
              <div className="text-slate-300">
                <span className="font-medium">Visited:</span>{' '}
                {loadingVisitCount ? (
                  <span className="text-slate-400">Loading...</span>
                ) : (
                  <span className="text-green-400 font-mono">{visitCount.toString()}</span>
                )}
              </div>
            </div>

            {/* Canister Information Section */}
            <div className="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                <Server className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-medium text-slate-100">Canister Information</h3>
              </div>
              <div className="space-y-3">
                {canisterIds.map((canister) => {
                  const itemId = `canister-${canister.id}`;
                  const isCopied = copiedItems.has(itemId);
                  
                  return (
                    <div key={canister.id} className="flex items-center justify-between bg-slate-600 rounded p-3">
                      <div className="flex-1">
                        <div className="text-slate-300 text-sm mb-1">{canister.label}:</div>
                        <div className="text-slate-100 font-mono text-sm">
                          {formatPrincipal(canister.id)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <div className="relative">
                          <button
                            onClick={() => copyToClipboard(canister.id, itemId)}
                            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                            title={`Copy full ${canister.label.toLowerCase()} ID`}
                          >
                            {isCopied ? (
                              <Check className="w-4 h-4 text-slate-300" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          {isCopied && (
                            <div className="absolute -top-8 right-0 bg-slate-600 text-slate-200 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                              Copied!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Admin List */}
            <div className="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
              <h3 className="text-lg font-medium text-slate-100 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Current Admins
              </h3>
              {loadingAdmins ? (
                <div className="text-slate-400">Loading admin list...</div>
              ) : adminPrincipals.length === 0 ? (
                <div className="text-slate-400">No admins found</div>
              ) : (
                <div className="space-y-2">
                  {adminPrincipals.map((principal) => {
                    const principalStr = principal.toString();
                    const isDefaultAdmin = principalStr === defaultAdminPrincipal;
                    const itemId = `admin-${principalStr}`;
                    const isCopied = copiedItems.has(itemId);
                    
                    return (
                      <div key={principalStr} className="flex items-center justify-between bg-slate-600 rounded p-3">
                        <div className="flex-1">
                          <div className="text-slate-100 font-mono text-sm">
                            {formatPrincipal(principalStr)}
                          </div>
                          {isDefaultAdmin && (
                            <div className="text-xs text-green-400 mt-1">Default Admin (Protected)</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <button
                              onClick={() => copyToClipboard(principalStr, itemId)}
                              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                              title="Copy full principal ID"
                            >
                              {isCopied ? (
                                <Check className="w-4 h-4 text-slate-300" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            {isCopied && (
                              <div className="absolute -top-8 right-0 bg-slate-600 text-slate-200 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                Copied!
                              </div>
                            )}
                          </div>
                          {!isDefaultAdmin && (
                            <button
                              onClick={() => handleRemoveAdmin(principal)}
                              disabled={assignUserRole.isPending}
                              className="text-red-400 hover:text-red-300 transition-colors p-1"
                              title="Remove admin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add New Admin Form */}
            <form onSubmit={handleAddAdmin} className="p-4 bg-slate-700 rounded-lg border border-slate-600">
              <h3 className="text-lg font-medium text-slate-100 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Add New Admin Principal
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newAdminPrincipal}
                  onChange={(e) => setNewAdminPrincipal(e.target.value)}
                  placeholder="Enter principal ID (e.g., rdmx6-jaaaa-aaaah-qcaiq-cai)"
                  className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <button
                  type="submit"
                  disabled={assignUserRole.isPending}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {assignUserRole.isPending ? 'Adding...' : 'Add'}
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
