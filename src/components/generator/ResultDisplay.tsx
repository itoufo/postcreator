import { useState } from 'react';
import type { GeneratedPostResults, QualityChecks } from '@/types';

interface ResultDisplayProps {
  result: GeneratedPostResults;
  checks: QualityChecks | null;
  onClear: () => void;
}

export default function ResultDisplay({ result, checks, onClear }: ResultDisplayProps) {
  const [activeTab, setActiveTab] = useState<'main' | 'alt1' | 'alt2' | 'short'>('main');
  const [copied, setCopied] = useState(false);

  const tabs = [
    { key: 'main' as const, label: '本命案', content: result.main },
    { key: 'alt1' as const, label: '代替案1', content: result.alt1 },
    { key: 'alt2' as const, label: '代替案2', content: result.alt2 },
    { key: 'short' as const, label: '短縮版', content: result.short_main },
  ];

  const activeContent = tabs.find((tab) => tab.key === activeTab)?.content || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">生成結果</h3>
        <button
          onClick={onClear}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          クリア
        </button>
      </div>

      {/* タブ */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 品質チェック */}
      {checks && (
        <div className="bg-gray-50 rounded-md p-4 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">文字数:</span>
            <span className={`font-medium ${checks.char_count > (checks.warnings.length > 0 ? 999999 : 0) ? 'text-red-600' : 'text-green-600'}`}>
              {checks.char_count}文字
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">SNS適合:</span>
            <span className={`font-medium ${checks.sns_compliant ? 'text-green-600' : 'text-red-600'}`}>
              {checks.sns_compliant ? '✓ 適合' : '✗ 不適合'}
            </span>
          </div>
          {checks.banned_terms_found.length > 0 && (
            <div className="text-red-600">
              <span className="font-medium">禁止語検出:</span> {checks.banned_terms_found.join(', ')}
            </div>
          )}
          {checks.warnings.length > 0 && (
            <div className="text-yellow-600">
              <span className="font-medium">警告:</span>
              <ul className="list-disc list-inside mt-1">
                {checks.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 投稿文 */}
      <div className="relative">
        <div className="bg-gray-50 rounded-md p-4 min-h-[150px] whitespace-pre-wrap text-gray-900">
          {activeContent}
        </div>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
        >
          {copied ? 'コピー済み ✓' : 'コピー'}
        </button>
      </div>

      {/* ハッシュタグ */}
      {result.hashtags && result.hashtags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">ハッシュタグ</h4>
          <div className="flex flex-wrap gap-2">
            {result.hashtags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* アクション */}
      <div className="flex space-x-3 pt-4 border-t">
        <button
          onClick={handleCopy}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          投稿文をコピー
        </button>
        <button
          onClick={() => {
            const textWithHashtags = `${activeContent}\n\n${result.hashtags?.join(' ') || ''}`;
            navigator.clipboard.writeText(textWithHashtags);
          }}
          className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50"
        >
          ハッシュタグ込みでコピー
        </button>
      </div>
    </div>
  );
}
