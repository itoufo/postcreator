import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Account, GenerationInputs, GeneratePostResponse, QualityChecks } from '@/types';

export function useGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratePostResponse | null>(null);
  const [checks, setChecks] = useState<QualityChecks | null>(null);

  const generatePost = async (account: Account, inputs: GenerationInputs) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setChecks(null);

      // 1. リクエストレコードを作成
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');

      const { data: requestData, error: requestError } = await supabase
        .from('snsgen_requests')
        .insert({
          user_id: user.id,
          account_id: account.id,
          inputs,
          status: 'processing',
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // 2. Edge Function を呼び出し
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-post`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestData.id,
          account,
          inputs,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Edge Functionの呼び出しに失敗しました');
      }

      const data = await response.json();
      setResult(data.results);
      setChecks(data.checks);

      // 3. リクエストステータスを更新
      await supabase
        .from('snsgen_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', requestData.id);

      // 4. 結果を保存
      await supabase.from('snsgen_results').insert({
        request_id: requestData.id,
        sns: inputs.sns,
        post_type: inputs.post_type,
        draft: data.results.main,
        alt_versions: {
          alt1: data.results.alt1,
          alt2: data.results.alt2,
          short_main: data.results.short_main,
        },
        hashtags: data.results.hashtags || [],
        checks: data.checks || {},
      });

      return { data: data.results, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '投稿文の生成に失敗しました';
      setError(message);
      return { data: null, error: message };
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setChecks(null);
    setError(null);
  };

  return {
    loading,
    error,
    result,
    checks,
    generatePost,
    clearResult,
  };
}
