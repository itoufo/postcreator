import type { Account } from '@/types';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export default function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {account.default_sns}
            </span>
          </div>
          {account.theme && (
            <p className="text-sm text-gray-600 mt-1">{account.theme}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(account)}
            className="text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              if (window.confirm('このアカウントを削除してもよろしいですか？')) {
                onDelete(account.id);
              }
            }}
            className="text-red-600 hover:text-red-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {account.tone_guidelines.formality && (
          <div className="flex items-center">
            <span className="text-gray-500 w-24">口調:</span>
            <span className="text-gray-900">{account.tone_guidelines.formality}</span>
          </div>
        )}
        {account.tone_guidelines.emoji_usage && (
          <div className="flex items-center">
            <span className="text-gray-500 w-24">絵文字:</span>
            <span className="text-gray-900">{account.tone_guidelines.emoji_usage}</span>
          </div>
        )}
        {account.persona.target_age && (
          <div className="flex items-center">
            <span className="text-gray-500 w-24">ターゲット:</span>
            <span className="text-gray-900">{account.persona.target_age}</span>
          </div>
        )}
        {account.must_include.length > 0 && (
          <div className="flex items-start">
            <span className="text-gray-500 w-24">必須語:</span>
            <div className="flex flex-wrap gap-1">
              {account.must_include.map((term, idx) => (
                <span
                  key={idx}
                  className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                >
                  {term}
                </span>
              ))}
            </div>
          </div>
        )}
        {account.banned_terms.length > 0 && (
          <div className="flex items-start">
            <span className="text-gray-500 w-24">禁止語:</span>
            <div className="flex flex-wrap gap-1">
              {account.banned_terms.map((term, idx) => (
                <span
                  key={idx}
                  className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded"
                >
                  {term}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
