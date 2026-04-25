export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      arquivos_conhecimento: {
        Row: {
          categoria_id: number | null
          data_upload: string | null
          id: string
          nome_arquivo: string
          storage_path: string | null
        }
        Insert: {
          categoria_id?: number | null
          data_upload?: string | null
          id?: string
          nome_arquivo: string
          storage_path?: string | null
        }
        Update: {
          categoria_id?: number | null
          data_upload?: string | null
          id?: string
          nome_arquivo?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arquivos_conhecimento_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          ativo: boolean | null
          codigo_menu: number
          created_at: string
          descricao_ia: string | null
          id: number
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          codigo_menu: number
          created_at?: string
          descricao_ia?: string | null
          id?: number
          nome: string
        }
        Update: {
          ativo?: boolean | null
          codigo_menu?: number
          created_at?: string
          descricao_ia?: string | null
          id?: number
          nome?: string
        }
        Relationships: []
      }
      chamados: {
        Row: {
          categoria: string | null
          causa_provavel: string | null
          data_abertura: string | null
          data_fechamento: string | null
          descricao_original: string | null
          id: string
          numero_usuario: string | null
          prioridade: string | null
          protocolo: string
          responsavel_id: string | null
          resumo: string | null
          solucao_ia_tentada: string | null
          status: string | null
        }
        Insert: {
          categoria?: string | null
          causa_provavel?: string | null
          data_abertura?: string | null
          data_fechamento?: string | null
          descricao_original?: string | null
          id?: string
          numero_usuario?: string | null
          prioridade?: string | null
          protocolo: string
          responsavel_id?: string | null
          resumo?: string | null
          solucao_ia_tentada?: string | null
          status?: string | null
        }
        Update: {
          categoria?: string | null
          causa_provavel?: string | null
          data_abertura?: string | null
          data_fechamento?: string | null
          descricao_original?: string | null
          id?: string
          numero_usuario?: string | null
          prioridade?: string | null
          protocolo?: string
          responsavel_id?: string | null
          resumo?: string | null
          solucao_ia_tentada?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chamados_numero_usuario_fkey"
            columns: ["numero_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["numero"]
          },
          {
            foreignKeyName: "chamados_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "equipe_ti"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          arquivo_id: string | null
          content: string
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          arquivo_id?: string | null
          content: string
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          arquivo_id?: string | null
          content?: string
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_arquivo_id_fkey"
            columns: ["arquivo_id"]
            isOneToOne: false
            referencedRelation: "arquivos_conhecimento"
            referencedColumns: ["id"]
          },
        ]
      }
      equipe_ti: {
        Row: {
          ativo: boolean | null
          cargo: string
          criado_em: string | null
          email: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string
          criado_em?: string | null
          email: string
          id: string
          nome: string
        }
        Update: {
          ativo?: boolean | null
          cargo?: string
          criado_em?: string | null
          email?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      historico_chamados: {
        Row: {
          autor_id: string | null
          chamado_id: string | null
          conteudo: string | null
          criado_em: string | null
          id: string
          tipo_acao: string
        }
        Insert: {
          autor_id?: string | null
          chamado_id?: string | null
          conteudo?: string | null
          criado_em?: string | null
          id?: string
          tipo_acao: string
        }
        Update: {
          autor_id?: string | null
          chamado_id?: string | null
          conteudo?: string | null
          criado_em?: string | null
          id?: string
          tipo_acao?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_chamados_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "equipe_ti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_chamados_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_mensagens: {
        Row: {
          data_hora: string | null
          id: number
          mensagem: string | null
          numero: string
          processado: boolean | null
        }
        Insert: {
          data_hora?: string | null
          id?: number
          mensagem?: string | null
          numero: string
          processado?: boolean | null
        }
        Update: {
          data_hora?: string | null
          id?: number
          mensagem?: string | null
          numero?: string
          processado?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          cargo: string | null
          categoria_escolhida: number | null
          cpf: string | null
          criado_em: string | null
          data_ultima_mensagem: string | null
          email: string | null
          id: string
          nome: string | null
          numero: string | null
          status_conversa: string | null
          ultima_interacao: string | null
          ultima_resposta_ia: string | null
          ultimo_relato_usuario: string | null
          unidade: string | null
        }
        Insert: {
          cargo?: string | null
          categoria_escolhida?: number | null
          cpf?: string | null
          criado_em?: string | null
          data_ultima_mensagem?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          numero?: string | null
          status_conversa?: string | null
          ultima_interacao?: string | null
          ultima_resposta_ia?: string | null
          ultimo_relato_usuario?: string | null
          unidade?: string | null
        }
        Update: {
          cargo?: string | null
          categoria_escolhida?: number | null
          cpf?: string | null
          criado_em?: string | null
          data_ultima_mensagem?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          numero?: string | null
          status_conversa?: string | null
          ultima_interacao?: string | null
          ultima_resposta_ia?: string | null
          ultimo_relato_usuario?: string | null
          unidade?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_documents: {
        Args: {
          filter?: Json
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
