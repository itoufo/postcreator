import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { GenerationRequest, GenerationResult } from '@/types';

interface HistoryItem {
  request: GenerationRequest;
  results: GenerationResult[];
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // リクエストを取得
      const { data: requests, error: requestsError } = await supabase
        .from('snsgen_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (requestsError) throw requestsError;

      if (!requests || requests.length === 0) {
        setHistory([]);
        return;
      }

      // 各リクエストの結果を取得
      const historyItems: HistoryItem[] = [];
      for (const request of requests) {
        const { data: results, error: resultsError } = await supabase
          .from('snsgen_results')
          .select('*')
          .eq('request_id', request.id);

        if (resultsError) {
          console.error('結果取得エラー:', resultsError);
          continue;
        }

        historyItems.push({
          request: request as GenerationRequest,
          results: (results as GenerationResult[]) || [],
        });
      }

      setHistory(historyItems);
    } catch (err) {
      console.error('履歴取得エラー:', err);
      setError(err instanceof Error ? err.message : '履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const deleteHistoryItem = async (requestId: string) => {
    try {
      setError(null);

      // リクエストを削除（CASCADE で結果も削除される）
      const { error: deleteError } = await supabase
        .from('snsgen_requests')
        .delete()
        .eq('id', requestId);

      if (deleteError) throw deleteError;

      setHistory((prev) => prev.filter((item) => item.request.id !== requestId));
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '履歴の削除に失敗しました';
      setError(message);
      return { error: message };
    }
  };

  return {
    history,
    loading,
    error,
    fetchHistory,
    deleteHistoryItem,
  };
}
