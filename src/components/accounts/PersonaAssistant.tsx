import { useState, useEffect, useRef } from 'react';
import { usePersonaAssistant, type PersonaProposal } from '@/hooks/usePersonaAssistant';
import PersonaProposalDisplay from './PersonaProposalDisplay';

interface PersonaAssistantProps {
  onClose: () => void;
  onApprovePersonas: (personas: PersonaProposal[]) => Promise<void>;
}

export default function PersonaAssistant({ onClose, onApprovePersonas }: PersonaAssistantProps) {
  const {
    messages,
    loading,
    readyForProposals,
    proposals,
    error,
    sendMessage,
    generateProposals,
    reset,
    startConversation,
  } = usePersonaAssistant();

  const [userInput, setUserInput] = useState('');
  const [selectedProposals, setSelectedProposals] = useState<Set<number>>(new Set());
  const [showProposals, setShowProposals] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!userInput.trim() || loading) return;

    const input = userInput;
    setUserInput('');
    await sendMessage(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGenerateProposals = async () => {
    const result = await generateProposals();
    if (result.success) {
      setShowProposals(true);
    }
  };

  const handleToggleProposal = (index: number) => {
    const newSelected = new Set(selectedProposals);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProposals(newSelected);
  };

  const handleApprove = async () => {
    const selectedPersonas = proposals.filter((_, index) => selectedProposals.has(index));
    if (selectedPersonas.length === 0) {
      alert('少なくとも1つのペルソナを選択してください');
      return;
    }

    await onApprovePersonas(selectedPersonas);
  };

  const handleRestart = () => {
    reset();
    setShowProposals(false);
    setSelectedProposals(new Set());
    startConversation();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            ペルソナ作成アシスタント
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {!showProposals ? (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t">
              {readyForProposals ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 text-center">
                    十分な情報が集まりました！ペルソナの提案を生成できます。
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleRestart}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      会話を続ける
                    </button>
                    <button
                      onClick={handleGenerateProposals}
                      disabled={loading}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '生成中...' : 'ペルソナを提案'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="メッセージを入力..."
                    disabled={loading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !userInput.trim()}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    送信
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Proposals Display */
          <PersonaProposalDisplay
            proposals={proposals}
            selectedProposals={selectedProposals}
            onToggleProposal={handleToggleProposal}
            onApprove={handleApprove}
            onBack={handleRestart}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
