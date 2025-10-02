-- =====================================================
-- FONCTIONS RPC D'AIDE POUR LES TESTS
-- =====================================================

-- Fonction pour obtenir les colonnes d'une table
CREATE OR REPLACE FUNCTION get_table_columns(table_name TEXT)
RETURNS TABLE(column_name TEXT, data_type TEXT, is_nullable TEXT, column_default TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::TEXT,
        c.data_type::TEXT,
        c.is_nullable::TEXT,
        c.column_default::TEXT
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' 
    AND c.table_name = get_table_columns.table_name
    ORDER BY c.ordinal_position;
END;
$$;

-- Fonction pour obtenir les index d'une table
CREATE OR REPLACE FUNCTION get_table_indexes(table_name TEXT)
RETURNS TABLE(index_name TEXT, index_type TEXT, column_names TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.indexname::TEXT,
        i.indexdef::TEXT,
        array_to_string(array_agg(a.attname), ', ')::TEXT
    FROM pg_indexes i
    JOIN pg_class c ON c.relname = i.indexname
    JOIN pg_index ix ON ix.indexrelid = c.oid
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE i.tablename = get_table_indexes.table_name
    AND i.schemaname = 'public'
    GROUP BY i.indexname, i.indexdef
    ORDER BY i.indexname;
END;
$$;

-- Fonction pour obtenir les politiques RLS d'une table
CREATE OR REPLACE FUNCTION get_table_policies(table_name TEXT)
RETURNS TABLE(policy_name TEXT, policy_cmd TEXT, policy_qual TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pol.polname::TEXT,
        pol.polcmd::TEXT,
        pg_get_expr(pol.polqual, pol.polrelid)::TEXT
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = get_table_policies.table_name
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ORDER BY pol.polname;
END;
$$;

-- Commentaires pour la documentation
COMMENT ON FUNCTION get_table_columns(TEXT) IS 'Retourne les informations sur les colonnes d''une table';
COMMENT ON FUNCTION get_table_indexes(TEXT) IS 'Retourne les informations sur les index d''une table';
COMMENT ON FUNCTION get_table_policies(TEXT) IS 'Retourne les informations sur les politiques RLS d''une table';
