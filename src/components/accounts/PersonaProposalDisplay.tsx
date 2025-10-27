import type { PersonaProposal } from '@/hooks/usePersonaAssistant';

interface PersonaProposalDisplayProps {
  proposals: PersonaProposal[];
  selectedProposals: Set<number>;
  onToggleProposal: (index: number) => void;
  onApprove: () => void;
  onBack: () => void;
  loading: boolean;
}

export default function PersonaProposalDisplay({
  proposals,
  selectedProposals,
  onToggleProposal,
  onApprove,
  onBack,
  loading,
}: PersonaProposalDisplayProps) {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            ペルソナの提案
          </h4>
          <p className="text-sm text-gray-600">
            以下の提案から、作成したいペルソナを選択してください（複数選択可）
          </p>
        </div>

        <div className="space-y-4">
          {proposals.map((persona, index) => (
            <div
              key={index}
              onClick={() => onToggleProposal(index)}
              className={`border rounded-lg p-4 cursor-pointer transition ${
                selectedProposals.has(index)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h5 className="text-lg font-semibold text-gray-900 mb-1">
                    {persona.name}
                  </h5>
                  <p className="text-sm text-gray-600 italic">
                    {persona.rationale}
                  </p>
                </div>
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ml-3 ${
                    selectedProposals.has(index)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedProposals.has(index) && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">年齢層:</span>
                  <span className="ml-2 text-gray-900">{persona.target_age}</span>
                </div>

                <div>
                  <span className="font-medium text-gray-700">興味・関心:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {persona.interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">課題・悩み:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {persona.pain_points.map((point, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded"
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">提供価値:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {persona.benefits.map((benefit, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border-t">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">
            {selectedProposals.size}個のペルソナを選択中
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            会話に戻る
          </button>
          <button
            onClick={onApprove}
            disabled={loading || selectedProposals.size === 0}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '作成中...' : `${selectedProposals.size}個のペルソナを作成`}
          </button>
        </div>
      </div>
    </>
  );
}
