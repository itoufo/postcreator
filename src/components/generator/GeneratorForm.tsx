import { useState, useEffect } from 'react';
import type { Account, SNSType, PostType, GenerationInputs } from '@/types';
import { SNS_PROFILES, SNS_POST_TYPES, EMOJI_LEVEL_DESCRIPTIONS, CTA_LEVEL_DESCRIPTIONS } from '@/lib/constants';

interface GeneratorFormProps {
  accounts: Account[];
  onGenerate: (account: Account, inputs: GenerationInputs) => void;
  loading: boolean;
}

export default function GeneratorForm({ accounts, onGenerate, loading }: GeneratorFormProps) {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [baseText, setBaseText] = useState('');
  const [sns, setSns] = useState<SNSType>('X');
  const [postType, setPostType] = useState<PostType>('normal');
  const [maxChars, setMaxChars] = useState(280);
  const [hashtagsOn, setHashtagsOn] = useState(true);
  const [hashtagMax, setHashtagMax] = useState(5);
  const [emojiLevel, setEmojiLevel] = useState<'none' | 'light' | 'moderate' | 'heavy'>('moderate');
  const [ctaLevel, setCtaLevel] = useState<'none' | 'weak' | 'strong'>('weak');

  // SNS変更時にデフォルト値を更新
  useEffect(() => {
    const profile = SNS_PROFILES[sns];
    setMaxChars(profile.max_chars);
    setHashtagMax(profile.hashtags.recommended[1]);
    // 投稿種別をSNSに応じてリセット
    const availableTypes = SNS_POST_TYPES[sns];
    if (availableTypes && !availableTypes.includes(postType)) {
      setPostType(availableTypes[0] as PostType);
    }
  }, [sns]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);
    if (!selectedAccount) {
      alert('アカウントを選択してください');
      return;
    }

    const inputs: GenerationInputs = {
      prompt,
      base_text: baseText || undefined,
      sns,
      post_type: postType,
      options: {
        hashtags: {
          on: hashtagsOn,
          max: hashtagMax,
          position: 'end',
        },
        max_chars: maxChars,
        emoji: emojiLevel,
        cta: ctaLevel,
      },
    };

    onGenerate(selectedAccount, inputs);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">投稿生成</h3>
      </div>

      {/* アカウント選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          アカウント *
        </label>
        <select
          required
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">選択してください</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
              {account.theme && ` - ${account.theme}`}
            </option>
          ))}
        </select>
      </div>

      {/* SNS・投稿種別 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SNS *
          </label>
          <select
            required
            value={sns}
            onChange={(e) => setSns(e.target.value as SNSType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="X">X（旧Twitter）</option>
            <option value="Instagram">Instagram</option>
            <option value="Threads">Threads</option>
            <option value="note">note</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            投稿種別 *
          </label>
          <select
            required
            value={postType}
            onChange={(e) => setPostType(e.target.value as PostType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SNS_POST_TYPES[sns]?.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* プロンプト */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          プロンプト *
        </label>
        <textarea
          required
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 新商品の告知文を作成してください"
        />
      </div>

      {/* ベース文章 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ベース文章（任意）
        </label>
        <textarea
          rows={4}
          value={baseText}
          onChange={(e) => setBaseText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="長文を要約したい場合はここに貼り付けてください"
        />
      </div>

      {/* オプション */}
      <div className="border-t pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">生成オプション</h4>
        <div className="space-y-4">
          {/* 文字数上限 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              文字数上限: {maxChars}文字
            </label>
            <input
              type="range"
              min={SNS_PROFILES[sns].short_chars[0]}
              max={SNS_PROFILES[sns].max_chars}
              value={maxChars}
              onChange={(e) => setMaxChars(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>短め</span>
              <span>推奨: {SNS_PROFILES[sns].recommended_chars[0]}-{SNS_PROFILES[sns].recommended_chars[1]}</span>
              <span>最大: {SNS_PROFILES[sns].max_chars}</span>
            </div>
          </div>

          {/* ハッシュタグ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-600">ハッシュタグ生成</label>
              <input
                type="checkbox"
                checked={hashtagsOn}
                onChange={(e) => setHashtagsOn(e.target.checked)}
                className="rounded"
              />
            </div>
            {hashtagsOn && (
              <div className="ml-4">
                <label className="block text-xs text-gray-500 mb-1">
                  最大数: {hashtagMax}個
                </label>
                <input
                  type="range"
                  min={1}
                  max={SNS_PROFILES[sns].hashtags.max}
                  value={hashtagMax}
                  onChange={(e) => setHashtagMax(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>少なめ</span>
                  <span>推奨: {SNS_PROFILES[sns].hashtags.recommended[0]}-{SNS_PROFILES[sns].hashtags.recommended[1]}</span>
                  <span>最大: {SNS_PROFILES[sns].hashtags.max}</span>
                </div>
              </div>
            )}
          </div>

          {/* 絵文字 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">絵文字使用</label>
            <select
              value={emojiLevel}
              onChange={(e) => setEmojiLevel(e.target.value as typeof emojiLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              {Object.entries(EMOJI_LEVEL_DESCRIPTIONS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* CTA */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">CTA（行動喚起）</label>
            <select
              value={ctaLevel}
              onChange={(e) => setCtaLevel(e.target.value as typeof ctaLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              {Object.entries(CTA_LEVEL_DESCRIPTIONS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ボタン */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={() => {
            setPrompt('');
            setBaseText('');
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          クリア
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          <span>{loading ? '生成中...' : '生成'}</span>
        </button>
      </div>
    </form>
  );
}
