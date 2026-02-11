-- Diagnóstico de columnas de la tabla 'citas'
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'citas';
