import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface SubscriptionData {
  plan_type: string;
  status: string;
  current_period_end: string | null;
  cancel_at: string | null;
}

interface UsageQuota {
  requests_count: number;
  requests_limit: number;
  accounts_count: number;
  accounts_limit: number;
  period_end: string;
}

const PLANS = {
  free: {
    name: 'フリープラン',
    price: '¥0',
    features: ['月10回まで生成', '1アカウントまで', '基本機能'],
  },
  basic: {
    name: 'ベーシックプラン',
    price: '¥980',
    priceId: import.meta.env.VITE_STRIPE_BASIC_PRICE_ID,
    features: ['月100回まで生成', '3アカウントまで', '全機能利用可能', 'メールサポート'],
  },
  pro: {
    name: 'プロプラン',
    price: '¥2,980',
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
    features: ['月500回まで生成', '10アカウントまで', '全機能利用可能', '優先サポート'],
  },
  enterprise: {
    name: 'エンタープライズプラン',
    price: 'お問い合わせ',
    features: ['無制限生成', '無制限アカウント', 'カスタマイズ対応', '専属サポート'],
  },
};

export default function Subscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      // サブスクリプション情報を取得
      const { data: subData, error: subError } = await supabase
        .from('snsgen_subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (subError) throw subError;
      setSubscription(subData);

      // 使用量を取得
      const { data: usageData, error: usageError } = await supabase
        .from('snsgen_usage_quotas')
        .select('*')
        .eq('user_id', user!.id)
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

      if (usageError && usageError.code !== 'PGRST116') throw usageError;
      setUsage(usageData);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    setUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('snsgen_create-checkout-session', {
        body: {
          priceId,
          successUrl: `${window.location.origin}/subscription?success=true`,
          cancelUrl: `${window.location.origin}/subscription`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('アップグレード処理中にエラーが発生しました');
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('snsgen_create-portal-session', {
        body: {
          returnUrl: `${window.location.origin}/subscription`,
        },
      });

      if (error) throw error;
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert('サブスクリプション管理画面を開けませんでした');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  const currentPlan = subscription?.plan_type || 'free';
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900">サブスクリプション管理</h1>
          <p className="mt-4 text-lg text-gray-600">プランの確認とアップグレード</p>
        </div>

        {/* 現在のプランと使用状況 */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">現在のプラン</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">プラン</p>
              <p className="text-2xl font-bold text-gray-900">{PLANS[currentPlan as keyof typeof PLANS].name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {subscription?.current_period_end &&
                  `次回更新日: ${new Date(subscription.current_period_end).toLocaleDateString('ja-JP')}`
                }
              </p>
              {currentPlan !== 'free' && isActive && (
                <button
                  onClick={handleManageSubscription}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-500"
                >
                  サブスクリプションを管理
                </button>
              )}
            </div>
            {usage && (
              <div>
                <p className="text-sm text-gray-600 mb-2">今月の利用状況</p>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>生成回数</span>
                      <span>{usage.requests_count} / {usage.requests_limit === -1 ? '無制限' : usage.requests_limit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${usage.requests_limit === -1 ? 0 : Math.min((usage.requests_count / usage.requests_limit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>アカウント数</span>
                      <span>{usage.accounts_count} / {usage.accounts_limit === -1 ? '無制限' : usage.accounts_limit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${usage.accounts_limit === -1 ? 0 : Math.min((usage.accounts_count / usage.accounts_limit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  期間終了日: {new Date(usage.period_end).toLocaleDateString('ja-JP')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* プラン一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => {
            const isCurrent = key === currentPlan;
            const canUpgrade = key !== 'free' && key !== currentPlan && key !== 'enterprise';

            return (
              <div
                key={key}
                className={`bg-white rounded-lg shadow-sm p-6 ${
                  isCurrent ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {isCurrent && (
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2">
                    現在のプラン
                  </span>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold mb-4">
                  {plan.price}
                  {key !== 'free' && key !== 'enterprise' && <span className="text-sm font-normal text-gray-600">/月</span>}
                </p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                {canUpgrade && (
                  <button
                    onClick={() => handleUpgrade((plan as any).priceId)}
                    disabled={upgrading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgrading ? '処理中...' : 'アップグレード'}
                  </button>
                )}
                {key === 'enterprise' && (
                  <button
                    disabled
                    className="w-full bg-gray-200 text-gray-600 py-2 px-4 rounded-md cursor-not-allowed"
                  >
                    お問い合わせ
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 注意事項 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">ご注意</h3>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li>プランのアップグレードは即時反映されます</li>
            <li>ダウングレードは次回更新日から適用されます</li>
            <li>一度お支払いいただいた料金の返金は原則承っておりません</li>
            <li>サブスクリプションはいつでも解約可能です</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
