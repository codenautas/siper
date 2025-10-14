set search_path=siper;
SET ROLE siper_owner;
--SET ROLE siper_muleto_owner;

-- =================================================================================
-- VISTA: siper.v_usuarios_scram
-- Propósito: Retorna usuarios activos cuyo hash de contraseña utiliza el método 
-- SCRAM-SHA-256 para propósitos de administración y seguridad.
-- =================================================================================
CREATE OR REPLACE VIEW usuarios_habilitados_fichadas
AS
SELECT
    u.idper,
    u.nombre,
    u.apellido,
    u.hashpass,
    'ficha: ' || p.ficha AS otros_datos 
FROM 
    usuarios u join personas p using (idper) --uso join porque no me interesan los usuarios sin idper
WHERE 
    u.hashpass LIKE 'SCRAM-SHA-256$%' and u.activo
ORDER BY
    u.idper;

