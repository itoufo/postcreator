import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { SNSType } from '@/types';

interface PublishOptions {
  resultId: string;
  connectionId: string;
  content: string;
  snsType: SNSType;
  hashtags?: string[];
}

export function useSocialPublish() {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publishToSNS = async (options: PublishOptions) => {
    try {
      setPublishing(true);
      setError(null);

      const { resultId, connectionId, content, snsType, hashtags } = options;

      // Edge Functionを呼び出し
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const functionName = snsType === 'X' ? 'publish-to-x' :
                          snsType === 'Threads' ? 'publish-to-threads' :
                          snsType === 'Instagram' ? 'publish-to-instagram' :
                          'publish-to-note';

      const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection_id: connectionId,
          content,
          hashtags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '投稿に失敗しました');
      }

      const data = await response.json();

      // 結果を更新
      await (supabase.from('snsgen_results') as any)
        .update({
          is_published: true,
          connection_id: connectionId,
          published_at: new Date().toISOString(),
          publish_error: null,
        })
        .eq('id', resultId);

      return { data, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : '投稿に失敗しました';
      setError(message);

      // エラーを記録
      if (options.resultId) {
        await (supabase.from('snsgen_results') as any)
          .update({
            publish_error: message,
          })
          .eq('id', options.resultId);
      }

      return { data: null, error: message };
    } finally {
      setPublishing(false);
    }
  };

  return {
    publishing,
    error,
    publishToSNS,
  };
}
