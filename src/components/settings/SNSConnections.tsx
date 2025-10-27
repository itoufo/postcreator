import { useState } from 'react';
import { useSNSConnections } from '@/hooks/useSNSConnections';
import type { SNSType } from '@/types';

export default function SNSConnections() {
  const { connections, loading, deleteConnection } = useSNSConnections();
  const [showAddModal, setShowAddModal] = useState(false);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除してもよろしいですか？`)) return;

    const result = await deleteConnection(id);
    if (result.error) {
      alert(`削除に失敗しました: ${result.error}`);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">読み込み中...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">SNS接続管理</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          接続を追加
        </button>
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">SNS接続がまだありません</p>
          <p className="text-sm">「接続を追加」ボタンから、XやThreadsのアカウントを連携してください</p>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {conn.sns_type}
                    </span>
                    <h3 className="text-lg font-medium text-gray-900">
                      {conn.connection_name}
                    </h3>
                    {conn.is_active ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        有効
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        無効
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    作成日: {new Date(conn.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(conn.id, conn.connection_name)}
                  className="ml-4 px-3 py-1 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 接続追加モーダル */}
      {showAddModal && (
        <AddConnectionModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

function AddConnectionModal({ onClose }: { onClose: () => void }) {
  const [snsType, setSnsType] = useState<SNSType>('X');
  const [connectionName, setConnectionName] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [tokenSecret, setTokenSecret] = useState('');
  const [saving, setSaving] = useState(false);

  const { createConnection } = useSNSConnections();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const credentials: any = {
        access_token: accessToken,
      };

      // Xの場合はtoken_secretも必要
      if (snsType === 'X' && tokenSecret) {
        credentials.token_secret = tokenSecret;
      }

      const result = await createConnection(
        snsType,
        connectionName,
        credentials
      );

      if (result.error) {
        alert(`接続の作成に失敗しました: ${result.error}`);
      } else {
        alert('接続を作成しました！');
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          SNS接続を追加
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SNS種別 *
            </label>
            <select
              value={snsType}
              onChange={(e) => setSnsType(e.target.value as SNSType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="X">X (Twitter)</option>
              <option value="Threads">Threads</option>
              <option value="Instagram">Instagram</option>
              <option value="note">note</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              接続名 *
            </label>
            <input
              type="text"
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: メインアカウント"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              アクセストークン *
            </label>
            <textarea
              rows={4}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="アクセストークンを入力"
              required
            />
          </div>

          {snsType === 'X' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                アクセストークンシークレット *
              </label>
              <textarea
                rows={4}
                value={tokenSecret}
                onChange={(e) => setTokenSecret(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="アクセストークンシークレットを入力"
                required
              />
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-gray-700">
            <p className="font-medium mb-2">ℹ️ トークンの取得方法</p>
            {snsType === 'X' && (
              <p>
                Twitter Developer Portal で App を作成し、OAuth 1.0a User Context の
                Access Token と Access Token Secret を取得してください。
              </p>
            )}
            {snsType === 'Threads' && (
              <p>
                Meta for Developers で App を作成し、threads_basic と
                threads_content_publish 権限を持つアクセストークンを取得してください。
              </p>
            )}
            {(snsType === 'Instagram' || snsType === 'note') && (
              <p>各プラットフォームの開発者向けドキュメントを参照してください。</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
