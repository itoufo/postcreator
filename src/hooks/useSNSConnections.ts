import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { SNSConnection, SNSType } from '@/types';

export function useSNSConnections() {
  const [connections, setConnections] = useState<SNSConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('snsgen_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setConnections((data as SNSConnection[]) || []);
    } catch (err) {
      console.error('SNS接続情報取得エラー:', err);
      setError(err instanceof Error ? err.message : 'SNS接続情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const createConnection = async (
    snsType: SNSType,
    connectionName: string,
    credentials: SNSConnection['credentials'],
    accountId?: string,
    metadata: Record<string, unknown> = {}
  ) => {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');

      const { data, error: createError } = await (supabase
        .from('snsgen_connections') as any)
        .insert({
          user_id: user.id,
          account_id: accountId,
          sns_type: snsType,
          connection_name: connectionName,
          credentials,
          metadata,
          is_active: true,
        })
        .select()
        .single();

      if (createError) throw createError;

      setConnections((prev) => [data as SNSConnection, ...prev]);
      return { data: data as SNSConnection, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SNS接続の作成に失敗しました';
      setError(message);
      return { data: null, error: message };
    }
  };

  const updateConnection = async (
    id: string,
    updates: Partial<Omit<SNSConnection, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      setError(null);

      const queryResult: any = await (supabase.from('snsgen_connections') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      const { data, error: updateError } = queryResult;

      if (updateError) throw updateError;

      setConnections((prev) =>
        prev.map((conn) => (conn.id === id ? (data as SNSConnection) : conn))
      );
      return { data: data as SNSConnection, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SNS接続の更新に失敗しました';
      setError(message);
      return { data: null, error: message };
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('snsgen_connections')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setConnections((prev) => prev.filter((conn) => conn.id !== id));
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SNS接続の削除に失敗しました';
      setError(message);
      return { error: message };
    }
  };

  const getConnectionsBySNS = (snsType: SNSType) => {
    return connections.filter((conn) => conn.sns_type === snsType && conn.is_active);
  };

  return {
    connections,
    loading,
    error,
    fetchConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    getConnectionsBySNS,
  };
}
