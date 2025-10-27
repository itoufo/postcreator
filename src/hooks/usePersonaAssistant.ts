import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface PersonaProposal {
  name: string;
  target_age: string;
  interests: string[];
  pain_points: string[];
  benefits: string[];
  story: {
    hardship: string;
    solution: string;
    success: string;
  };
  rationale: string;
}

export function usePersonaAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [readyForProposals, setReadyForProposals] = useState(false);
  const [proposals, setProposals] = useState<PersonaProposal[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (userMessage: string) => {
    try {
      setLoading(true);
      setError(null);

      // Add user message to conversation
      const newMessages: Message[] = [
        ...messages,
        { role: 'user', content: userMessage },
      ];
      setMessages(newMessages);

      // Call Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/persona-assistant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          action: 'chat',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      // Add assistant message to conversation
      const updatedMessages: Message[] = [
        ...newMessages,
        { role: 'assistant', content: data.message },
      ];
      setMessages(updatedMessages);

      // Check if ready for proposals
      if (data.ready_for_proposals) {
        setReadyForProposals(true);
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'メッセージ送信に失敗しました';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const generateProposals = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/persona-assistant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          action: 'generate_proposals',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate proposals');
      }

      const data = await response.json();

      // Parse the JSON response
      try {
        let jsonStr = data.message;

        // Extract JSON from message if it contains extra text
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }

        const parsed = JSON.parse(jsonStr);
        if (parsed.personas && Array.isArray(parsed.personas)) {
          setProposals(parsed.personas);
          return { success: true, personas: parsed.personas };
        } else {
          throw new Error('Invalid persona format: personas array not found');
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.error('Raw message:', data.message);
        throw new Error(`ペルソナの解析に失敗しました: ${parseError instanceof Error ? parseError.message : '不明なエラー'}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ペルソナの生成に失敗しました';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setReadyForProposals(false);
    setProposals([]);
    setError(null);
  };

  const startConversation = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessages([]);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/persona-assistant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'ペルソナ作成の手伝いをお願いします。' }
          ],
          action: 'chat',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start conversation');
      }

      const data = await response.json();

      setMessages([
        { role: 'user', content: 'ペルソナ作成の手伝いをお願いします。' },
        { role: 'assistant', content: data.message },
      ]);

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : '会話の開始に失敗しました';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    readyForProposals,
    proposals,
    error,
    sendMessage,
    generateProposals,
    reset,
    startConversation,
  };
}
