import { useState } from 'react';
import Layout from '@/components/common/Layout';
import AccountCard from '@/components/accounts/AccountCard';
import AccountForm from '@/components/accounts/AccountForm';
import PersonaAssistant from '@/components/accounts/PersonaAssistant';
import { useAccounts } from '@/hooks/useAccounts';
import type { Account } from '@/types';
import type { PersonaProposal } from '@/hooks/usePersonaAssistant';

export default function Accounts() {
  const { accounts, loading, error, createAccount, updateAccount, deleteAccount } = useAccounts();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);

  const handleSave = async (accountData: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, accountData);
    } else {
      await createAccount(accountData);
    }
    setShowForm(false);
    setEditingAccount(null);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  const handleApprovePersonas = async (personas: PersonaProposal[]) => {
    const results = [];

    for (const persona of personas) {
      const accountData: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        name: persona.name,
        default_sns: 'X', // Default to X, user can change later
        theme: `ターゲット: ${persona.target_age}`,
        persona: {
          target_age: persona.target_age,
          interests: persona.interests,
          pain_points: persona.pain_points,
          benefits: persona.benefits,
        },
        tone_guidelines: {
          formality: 'semi-formal',
          emoji_usage: 'moderate',
          sentence_style: 'mixed',
          brand_voice: [],
        },
        must_include: [],
        banned_terms: [],
        knowledge_base: `このペルソナは以下の理由で作成されました：\n${persona.rationale}`,
        link_policy: {},
      };

      const result = await createAccount(accountData);
      results.push(result);
    }

    // Check if all successful
    const allSuccess = results.every(r => !r.error);
    if (allSuccess) {
      alert(`${personas.length}個のペルソナを作成しました！`);
      setShowAssistant(false);
    } else {
      const failedCount = results.filter(r => r.error).length;
      alert(`${personas.length - failedCount}個のペルソナを作成しました。${failedCount}個の作成に失敗しました。`);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">アカウント管理</h2>
            <p className="mt-1 text-sm text-gray-600">
              ブランド/ペルソナを管理して、投稿文の生成に活用しましょう
            </p>
          </div>
          {!showForm && (
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAssistant(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span>AIでペルソナ作成</span>
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>新規作成</span>
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {showForm && (
          <AccountForm
            account={editingAccount}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">アカウントがありません</h3>
            <p className="mt-1 text-sm text-gray-500">
              新規作成ボタンからアカウントを作成してください
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={handleEdit}
                onDelete={deleteAccount}
              />
            ))}
          </div>
        )}

        {/* PersonaAssistant Modal */}
        {showAssistant && (
          <PersonaAssistant
            onClose={() => setShowAssistant(false)}
            onApprovePersonas={handleApprovePersonas}
          />
        )}
      </div>
    </Layout>
  );
}
