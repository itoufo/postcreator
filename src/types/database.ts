// Supabase Database 型定義
// 実際の運用では `supabase gen types typescript` で自動生成を推奨

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      snsgen_profiles: {
        Row: {
          id: string;
          user_id: string;
          role: 'admin' | 'user' | 'viewer';
          display_name: string | null;
          avatar_url: string | null;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: 'admin' | 'user' | 'viewer';
          display_name?: string | null;
          avatar_url?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'admin' | 'user' | 'viewer';
          display_name?: string | null;
          avatar_url?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      snsgen_accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          theme: string | null;
          persona: Json;
          tone_guidelines: Json;
          banned_terms: string[];
          must_include: string[];
          knowledge_base: string | null;
          link_policy: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          theme?: string | null;
          persona?: Json;
          tone_guidelines?: Json;
          banned_terms?: string[];
          must_include?: string[];
          knowledge_base?: string | null;
          link_policy?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          theme?: string | null;
          persona?: Json;
          tone_guidelines?: Json;
          banned_terms?: string[];
          must_include?: string[];
          knowledge_base?: string | null;
          link_policy?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      snsgen_templates: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          name: string;
          description: string | null;
          system_prompt: string;
          user_prompt_template: string;
          constraints: Json;
          sns_profiles: Json;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          name: string;
          description?: string | null;
          system_prompt: string;
          user_prompt_template: string;
          constraints?: Json;
          sns_profiles?: Json;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          name?: string;
          description?: string | null;
          system_prompt?: string;
          user_prompt_template?: string;
          constraints?: Json;
          sns_profiles?: Json;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      snsgen_requests: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          template_id: string | null;
          inputs: Json;
          status: 'queued' | 'processing' | 'completed' | 'failed';
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          template_id?: string | null;
          inputs: Json;
          status?: 'queued' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          template_id?: string | null;
          inputs?: Json;
          status?: 'queued' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      snsgen_results: {
        Row: {
          id: string;
          request_id: string;
          sns: 'X' | 'Instagram' | 'Threads' | 'note';
          post_type: string;
          draft: string;
          alt_versions: Json;
          hashtags: string[];
          checks: Json;
          score: number | null;
          note: string | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          sns: 'X' | 'Instagram' | 'Threads' | 'note';
          post_type: string;
          draft: string;
          alt_versions?: Json;
          hashtags?: string[];
          checks?: Json;
          score?: number | null;
          note?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          sns?: 'X' | 'Instagram' | 'Threads' | 'note';
          post_type?: string;
          draft?: string;
          alt_versions?: Json;
          hashtags?: string[];
          checks?: Json;
          score?: number | null;
          note?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
      };
      snsgen_dictionaries: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          type: 'hashtags' | 'cta' | 'synonyms' | 'domain_terms';
          name: string;
          entries: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          type: 'hashtags' | 'cta' | 'synonyms' | 'domain_terms';
          name: string;
          entries: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          type?: 'hashtags' | 'cta' | 'synonyms' | 'domain_terms';
          name?: string;
          entries?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
