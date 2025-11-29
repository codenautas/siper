set search_path = siper;
set role siper_owner;

-- Modificación de tipos de datos en la tabla avisos_falta_fichada

-- CAMBIO AVISADO_WP: Convierte el valor TIME existente (si no es NULL) a TIMESTAMP,
-- usando CURRENT_DATE como fecha si hay datos de hora.
ALTER TABLE avisos_falta_fichada 
    ALTER COLUMN avisado_wp TYPE timestamp without time zone 
    USING (fecha + avisado_wp::interval);

-- CAMBIO AVISADO_MAIL: Convierte el valor TIME existente a TIMESTAMP.
ALTER TABLE avisos_falta_fichada 
    ALTER COLUMN avisado_mail TYPE timestamp without time zone
    USING (fecha + avisado_mail::interval);

-- CAMBIO LLEGADA_NOVEDAD: Convierte el valor TIME existente a TIMESTAMP.
ALTER TABLE avisos_falta_fichada 
    ALTER COLUMN llegada_novedad TYPE timestamp without time zone
    USING (fecha + llegada_novedad::interval);


grant select, insert, update, delete on avisos_falta_fichada to siper_admin;
grant all on avisos_falta_fichada to siper_owner;