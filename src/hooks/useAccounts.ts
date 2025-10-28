import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Account } from '@/types';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('snsgen_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAccounts((data as Account[]) || []);
    } catch (err) {
      console.error('アカウント取得エラー:', err);
      setError(err instanceof Error ? err.message : 'アカウントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const createAccount = async (account: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');

      const { data, error: createError } = await supabase
        .from('snsgen_accounts')
        .insert({
          user_id: user.id,
          name: account.name,
          default_sns: account.default_sns,
          theme: account.theme,
          persona: account.persona as any,
          tone_guidelines: account.tone_guidelines as any,
          banned_terms: account.banned_terms,
          must_include: account.must_include,
          knowledge_base: account.knowledge_base,
          account_design: account.account_design as any,
          link_policy: account.link_policy as any,
        } as any)
        .select()
        .single();

      if (createError) throw createError;

      setAccounts((prev) => [data as Account, ...prev]);
      return { data: data as Account, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'アカウントの作成に失敗しました';
      setError(message);
      return { data: null, error: message };
    }
  };

  const updateAccount = async (id: string, updates: Partial<Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    try {
      setError(null);

      const queryResult: any = await (supabase.from('snsgen_accounts') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      const { data, error: updateError } = queryResult;

      if (updateError) throw updateError;

      setAccounts((prev) =>
        prev.map((acc) => (acc.id === id ? (data as Account) : acc))
      );
      return { data: data as Account, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'アカウントの更新に失敗しました';
      setError(message);
      return { data: null, error: message };
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('snsgen_accounts')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'アカウントの削除に失敗しました';
      setError(message);
      return { error: message };
    }
  };

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}
