import { useState, useEffect } from 'react';
import type { Account, SNSType } from '@/types';
import { PERSONA_SAMPLES } from '@/lib/constants';

interface AccountFormProps {
  account?: Account | null;
  onSave: (account: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
}

export default function AccountForm({ account, onSave, onCancel }: AccountFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [defaultSns, setDefaultSns] = useState<SNSType>('X');
  const [theme, setTheme] = useState('');
  const [targetAge, setTargetAge] = useState('');
  const [interests, setInterests] = useState('');
  const [painPoints, setPainPoints] = useState('');
  const [benefits, setBenefits] = useState('');
  const [formality, setFormality] = useState<'formal' | 'semi-formal' | 'casual'>('semi-formal');
  const [emojiUsage, setEmojiUsage] = useState<'none' | 'light' | 'moderate' | 'heavy'>('moderate');
  const [sentenceStyle, setSentenceStyle] = useState<'desu-masu' | 'da' | 'mixed'>('mixed');
  const [brandVoice, setBrandVoice] = useState('');
  const [mustInclude, setMustInclude] = useState('');
  const [bannedTerms, setBannedTerms] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [hardship, setHardship] = useState('');
  const [solution, setSolution] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (account) {
      setName(account.name);
      setDefaultSns(account.default_sns || 'X');
      setTheme(account.theme || '');
      setTargetAge(account.persona.target_age || '');
      setInterests(Array.isArray(account.persona.interests) ? account.persona.interests.join(', ') : '');
      setPainPoints(Array.isArray(account.persona.pain_points) ? account.persona.pain_points.join(', ') : '');
      setBenefits(Array.isArray(account.persona.benefits) ? account.persona.benefits.join(', ') : '');
      setFormality(account.tone_guidelines.formality || 'semi-formal');
      setEmojiUsage(account.tone_guidelines.emoji_usage || 'moderate');
      setSentenceStyle(account.tone_guidelines.sentence_style || 'mixed');
      setBrandVoice(Array.isArray(account.tone_guidelines.brand_voice) ? account.tone_guidelines.brand_voice.join(', ') : '');
      setMustInclude(account.must_include.join(', '));
      setBannedTerms(account.banned_terms.join(', '));
      setKnowledgeBase(account.knowledge_base || '');
      setHardship(account.account_design?.story?.hardship || '');
      setSolution(account.account_design?.story?.solution || '');
      setSuccess(account.account_design?.story?.success || '');
    }
  }, [account]);

  const applySample = (sampleKey: string) => {
    if (sampleKey === 'friendly') {
      setFormality('semi-formal');
      setEmojiUsage('moderate');
      setSentenceStyle('mixed');
      setBrandVoice('親しみやすい, 前向き, 実用的');
    } else if (sampleKey === 'professional') {
      setFormality('formal');
      setEmojiUsage('light');
      setSentenceStyle('desu-masu');
      setBrandVoice('誠実, 信頼, 専門的');
    } else if (sampleKey === 'casual') {
      setFormality('casual');
      setEmojiUsage('heavy');
      setSentenceStyle('da');
      setBrandVoice('フレンドリー, 楽しい, リラックス');
    }
  };

  const applyPersonaSample = (sampleKey: string) => {
    const sample = PERSONA_SAMPLES[sampleKey as keyof typeof PERSONA_SAMPLES];
    if (sample) {
      setTargetAge(sample.target_age);
      setInterests(sample.interests.join(', '));
      setPainPoints(sample.pain_points.join(', '));
      setBenefits(sample.benefits.join(', '));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        name,
        default_sns: defaultSns,
        theme,
        persona: {
          target_age: targetAge,
          interests: interests.split(',').map((s) => s.trim()).filter(Boolean),
          pain_points: painPoints.split(',').map((s) => s.trim()).filter(Boolean),
          benefits: benefits.split(',').map((s) => s.trim()).filter(Boolean),
        },
        tone_guidelines: {
          formality,
          emoji_usage: emojiUsage,
          sentence_style: sentenceStyle,
          brand_voice: brandVoice.split(',').map((s) => s.trim()).filter(Boolean),
        },
        must_include: mustInclude.split(',').map((s) => s.trim()).filter(Boolean),
        banned_terms: bannedTerms.split(',').map((s) => s.trim()).filter(Boolean),
        knowledge_base: knowledgeBase,
        account_design: {
          story: {
            hardship,
            solution,
            success,
          },
        },
        link_policy: {},
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {account ? 'アカウント編集' : 'アカウント作成'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">基本情報</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                アカウント名 *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: AI活用ブログ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                対象SNS *
              </label>
              <select
                value={defaultSns}
                onChange={(e) => setDefaultSns(e.target.value as SNSType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="X">X (Twitter)</option>
                <option value="Instagram">Instagram</option>
                <option value="Threads">Threads</option>
                <option value="note">note</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                このアカウントで投稿を生成する対象のSNSを選択してください
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                テーマ
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 自己成長×AI"
              />
            </div>
          </div>
        </div>

        {/* ペルソナ情報 */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-700">ペルソナ情報（ターゲット層の特徴）</h4>
            <select
              onChange={(e) => applyPersonaSample(e.target.value)}
              className="text-xs px-2 py-1 border border-gray-300 rounded"
            >
              <option value="">サンプル適用...</option>
              <option value="young-professional">若手プロフェッショナル</option>
              <option value="tech-enthusiast">テック愛好家</option>
              <option value="lifestyle-seeker">ライフスタイル志向</option>
            </select>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">ターゲット年齢層</label>
              <input
                type="text"
                value={targetAge}
                onChange={(e) => setTargetAge(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 25-34"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">興味・関心（カンマ区切り）</label>
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: AI, スキルアップ, 副業"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">課題・悩み（カンマ区切り）</label>
              <input
                type="text"
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 時間がない, 何から始めるか分からない"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">提供価値（カンマ区切り）</label>
              <input
                type="text"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 短時間で成果, 実践的な知識"
              />
            </div>
          </div>
        </div>

        {/* トーンガイドライン */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-700">トーンガイドライン</h4>
            <select
              onChange={(e) => applySample(e.target.value)}
              className="text-xs px-2 py-1 border border-gray-300 rounded"
            >
              <option value="">サンプル適用...</option>
              <option value="friendly">フレンドリー</option>
              <option value="professional">プロフェッショナル</option>
              <option value="casual">カジュアル</option>
            </select>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">フォーマル度</label>
              <select
                value={formality}
                onChange={(e) => setFormality(e.target.value as typeof formality)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="formal">フォーマル</option>
                <option value="semi-formal">セミフォーマル</option>
                <option value="casual">カジュアル</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">絵文字使用</label>
              <select
                value={emojiUsage}
                onChange={(e) => setEmojiUsage(e.target.value as typeof emojiUsage)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="none">なし</option>
                <option value="light">控えめ</option>
                <option value="moderate">通常</option>
                <option value="heavy">多め</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">文体</label>
              <select
                value={sentenceStyle}
                onChange={(e) => setSentenceStyle(e.target.value as typeof sentenceStyle)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="desu-masu">です・ます調</option>
                <option value="da">だ・である調</option>
                <option value="mixed">混在</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">ブランドボイス（カンマ区切り）</label>
              <input
                type="text"
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 親しみやすい, 前向き, 実用的"
              />
            </div>
          </div>
        </div>

        {/* 必須・禁止語 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">必須・禁止語</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">必須語（カンマ区切り）</label>
              <input
                type="text"
                value={mustInclude}
                onChange={(e) => setMustInclude(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: #AIフレンズ, プロフィールのリンクから"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">禁止語（カンマ区切り）</label>
              <input
                type="text"
                value={bannedTerms}
                onChange={(e) => setBannedTerms(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 絶対, 確実, 100%"
              />
            </div>
          </div>
        </div>

        {/* アカウント設計 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">アカウント設計（ペルソナにヒットさせる戦略）</h4>
          <p className="text-xs text-gray-500 mb-3">
            ペルソナに響かせるためのストーリー、ポジショニング、メッセージング戦略を設定します
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1 font-medium">
                ストーリー: 難関・課題
              </label>
              <textarea
                rows={3}
                value={hardship}
                onChange={(e) => setHardship(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ペルソナが抱える難関や課題を具体的に記述&#10;例: 毎日忙しくてスキルアップの時間が取れない、何から始めたらいいかわからない"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1 font-medium">
                ストーリー: 救い・商品（ソリューション）
              </label>
              <textarea
                rows={3}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="あなたの商品・サービスがどう解決するか&#10;例: 1日10分から始められるAI学習アプリ「LearnAI」で、初心者でも無理なく学習できる"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1 font-medium">
                ストーリー: 成功・結果
              </label>
              <textarea
                rows={3}
                value={success}
                onChange={(e) => setSuccess(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="利用後にペルソナが得られる成功・結果&#10;例: 3ヶ月後には実務でAIを活用できるようになり、業務効率が2倍に向上"
              />
            </div>
            <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-2">
              💡 このストーリー（難関→救い→成功）は投稿生成時に活用され、ペルソナの共感を生み出します
            </p>
          </div>
        </div>

        {/* 知識ベース */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">知識ベース</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                ブランド・商品情報、トーン例、参考投稿など
              </label>
              <textarea
                rows={6}
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例:&#10;・商品名: AI学習アプリ「LearnAI」&#10;・特徴: 1日10分で成果が出る、初心者向け&#10;・トーン: 前向きで実用的、「〜しましょう」を多用&#10;・過去の投稿例: 「AIって難しそう？実は1日10分から始められます」"
              />
              <p className="mt-1 text-xs text-gray-500">
                ここに記載した情報は投稿生成時にClaudeに渡され、より的確な投稿文生成に活用されます
              </p>
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
