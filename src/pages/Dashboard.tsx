import { useNavigate } from 'react-router-dom';
import Layout from '@/components/common/Layout';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            ようこそ、{profile?.display_name}さん
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            SNS投稿文自動生成ツール PostCreator
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate('/accounts')}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">アカウント管理</h3>
                <p className="mt-1 text-sm text-gray-500">
                  ブランド/ペルソナの設定
                </p>
              </div>
            </div>
          </div>

          <div
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate('/generator')}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">投稿生成</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Claude AIで投稿文を生成
                </p>
              </div>
            </div>
          </div>

          <div
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate('/history')}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-purple-600"
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
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">生成履歴</h3>
                <p className="mt-1 text-sm text-gray-500">
                  過去の生成結果を確認
                </p>
              </div>
            </div>
          </div>

          <div
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate('/settings')}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">設定</h3>
                <p className="mt-1 text-sm text-gray-500">
                  SNS連携と各種設定
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">はじめに</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>アカウント管理でブランド/ペルソナを設定</li>
            <li>設定でXやThreadsのSNSアカウントを連携（自動投稿に必要）</li>
            <li>投稿生成でプロンプトを入力してSNS投稿文を生成</li>
            <li>生成結果から直接SNSに投稿、または手動でコピー</li>
            <li>生成履歴で過去の投稿を確認・再利用</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}
