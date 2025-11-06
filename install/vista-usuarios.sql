CREATE OR REPLACE VIEW usuarios_habilitados_fichadas
AS
SELECT
    u.usuario, 
    u.idper,
    u.nombre,
    u.apellido,
    u.hashpass,
    'ficha: ' || p.ficha AS otros_datos 
FROM 
    usuarios u join personas p using (idper) --uso join porque no me interesan los usuarios sin idper
WHERE 
    u.algoritmo_pass = 'PG-SHA256' and u.activo
ORDER BY
    u.usuario;

