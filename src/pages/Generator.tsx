import Layout from '@/components/common/Layout';
import GeneratorForm from '@/components/generator/GeneratorForm';
import ResultDisplay from '@/components/generator/ResultDisplay';
import { useAccounts } from '@/hooks/useAccounts';
import { useGenerator } from '@/hooks/useGenerator';
import type { Account, GenerationInputs } from '@/types';

export default function Generator() {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { loading, error, result, checks, resultId, currentInputs, generatePost, clearResult } = useGenerator();

  const handleGenerate = async (account: Account, inputs: GenerationInputs) => {
    await generatePost(account, inputs);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">投稿生成</h2>
          <p className="mt-1 text-sm text-gray-600">
            Claude AIを使ってSNS投稿文を自動生成します
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {accountsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex">
              <svg
                className="h-6 w-6 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  アカウントが登録されていません
                </h3>
                <p className="mt-2 text-sm text-yellow-700">
                  投稿を生成するには、まずアカウント管理でブランド/ペルソナを登録してください。
                </p>
                <div className="mt-4">
                  <a
                    href="/accounts"
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
                  >
                    アカウント管理へ →
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <GeneratorForm
                accounts={accounts}
                onGenerate={handleGenerate}
                loading={loading}
              />
            </div>
            <div>
              {result ? (
                <ResultDisplay
                  result={result}
                  checks={checks}
                  resultId={resultId || undefined}
                  snsType={currentInputs?.sns}
                  onClear={clearResult}
                />
              ) : (
                <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    投稿文はまだ生成されていません
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    左のフォームから投稿を生成してください
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
