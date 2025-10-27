import { useState } from 'react';
import Layout from '@/components/common/Layout';
import HistoryItem from '@/components/history/HistoryItem';
import { useHistory } from '@/hooks/useHistory';
import type { SNSType } from '@/types';

export default function History() {
  const { history, loading, error, deleteHistoryItem } = useHistory();
  const [filterSNS, setFilterSNS] = useState<SNSType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredHistory = history.filter((item) => {
    const inputs = item.request.inputs as { sns: SNSType };
    const snsMatch = filterSNS === 'all' || inputs.sns === filterSNS;
    const statusMatch = filterStatus === 'all' || item.request.status === filterStatus;
    return snsMatch && statusMatch;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">生成履歴</h2>
            <p className="mt-1 text-sm text-gray-600">
              過去に生成した投稿文を確認・再利用できます
            </p>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SNSで絞り込み
              </label>
              <select
                value={filterSNS}
                onChange={(e) => setFilterSNS(e.target.value as typeof filterSNS)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">すべて</option>
                <option value="X">X（旧Twitter）</option>
                <option value="Instagram">Instagram</option>
                <option value="Threads">Threads</option>
                <option value="note">note</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータスで絞り込み
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">すべて</option>
                <option value="completed">完了</option>
                <option value="processing">処理中</option>
                <option value="failed">失敗</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredHistory.length === 0 ? (
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">履歴がありません</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterSNS !== 'all' || filterStatus !== 'all'
                ? 'フィルターを変更して再度お試しください'
                : '投稿生成ページで投稿文を生成してください'}
            </p>
            {(filterSNS !== 'all' || filterStatus !== 'all') && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setFilterSNS('all');
                    setFilterStatus('all');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  フィルターをクリア
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {filteredHistory.length}件の履歴
            </div>
            {filteredHistory.map((item) => (
              <HistoryItem
                key={item.request.id}
                request={item.request}
                results={item.results}
                onDelete={deleteHistoryItem}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
