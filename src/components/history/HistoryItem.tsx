import { useState } from 'react';
import type { GenerationRequest, GenerationResult } from '@/types';

interface HistoryItemProps {
  request: GenerationRequest;
  results: GenerationResult[];
  onDelete: (requestId: string) => void;
}

export default function HistoryItem({ request, results, onDelete }: HistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const mainResult = results.find((r) => r.draft);
  const inputs = request.inputs as { prompt: string; sns: string; post_type: string };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      queued: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800',
    };
    const labels = {
      completed: '完了',
      processing: '処理中',
      queued: '待機中',
      failed: '失敗',
    };
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${styles[status as keyof typeof styles] || styles.queued}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                {inputs.sns}
              </span>
              <span className="text-xs text-gray-500">{inputs.post_type}</span>
              {getStatusBadge(request.status)}
            </div>
            <p className="text-sm text-gray-900 font-medium line-clamp-2">
              {inputs.prompt}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(request.created_at)}
            </p>
          </div>
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-800"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => {
                if (window.confirm('この履歴を削除してもよろしいですか？')) {
                  onDelete(request.id);
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

        {isExpanded && mainResult && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="bg-gray-50 rounded-md p-3">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-medium text-gray-700">生成結果</h4>
                <button
                  onClick={() => handleCopy(mainResult.draft)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {copied ? 'コピー済み ✓' : 'コピー'}
                </button>
              </div>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {mainResult.draft}
              </p>
            </div>

            {mainResult.hashtags && mainResult.hashtags.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">ハッシュタグ</h4>
                <div className="flex flex-wrap gap-1">
                  {mainResult.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {mainResult.checks && (
              <div className="text-xs text-gray-600">
                文字数: {(mainResult.checks as { char_count?: number }).char_count || 0}文字
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
