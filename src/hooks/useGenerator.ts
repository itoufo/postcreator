import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Account, GenerationInputs, GeneratedPostResults, QualityChecks } from '@/types';

export function useGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedPostResults | null>(null);
  const [checks, setChecks] = useState<QualityChecks | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [currentInputs, setCurrentInputs] = useState<GenerationInputs | null>(null);

  const generatePost = async (account: Account, inputs: GenerationInputs) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setChecks(null);
      setResultId(null);
      setCurrentInputs(inputs);

      // 1. リクエストレコードを作成
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');

      const { data: requestData, error: requestError } = await supabase
        .from('snsgen_requests')
        .insert({
          user_id: user.id,
          account_id: account.id,
          inputs: inputs as any,
          status: 'processing' as const,
        } as any)
        .select()
        .single();

      if (requestError) throw requestError;
      if (!requestData) throw new Error('リクエストの作成に失敗しました');

      const typedRequestData = requestData as any;

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
          request_id: typedRequestData.id,
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
      await (supabase.from('snsgen_requests') as any)
        .update({
          status: 'completed' as const,
          completed_at: new Date().toISOString(),
        })
        .eq('id', typedRequestData.id);

      // 4. 結果を保存
      const { data: resultData, error: resultError } = await (supabase.from('snsgen_results') as any).insert({
        request_id: typedRequestData.id,
        sns: inputs.sns,
        post_type: inputs.post_type,
        draft: data.results.main,
        alt_versions: {
          alt1: data.results.alt1,
          alt2: data.results.alt2,
          short_main: data.results.short_main,
        } as any,
        hashtags: data.results.hashtags || [],
        checks: data.checks || {} as any,
      } as any).select().single();

      if (!resultError && resultData) {
        setResultId((resultData as any).id);
      }

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
    setResultId(null);
    setCurrentInputs(null);
  };

  return {
    loading,
    error,
    result,
    checks,
    resultId,
    currentInputs,
    generatePost,
    clearResult,
  };
}
