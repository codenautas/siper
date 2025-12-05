-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION siper.obtener_horarios_avisos_falta_fichada()
RETURNS TABLE (run_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO siper, pg_temp
SET TIME ZONE 'America/Argentina/Buenos_Aires'
AS $$
  WITH personas_hoy AS (
    SELECT p.idper, p.banda_horaria, hp.horario
      FROM siper.personas p
      JOIN siper.horarios_per hp
        ON hp.idper = p.idper
       AND current_date BETWEEN hp.desde AND COALESCE(hp.hasta, current_date)
     WHERE p.activo = true
  ),
  turnos_hoy AS (
    SELECT ph.idper, ph.banda_horaria, hd.hora_desde, hd.hora_hasta
      FROM personas_hoy ph
      JOIN siper.horarios_dds hd
        ON hd.horario = ph.horario
       AND hd.dds = CAST(EXTRACT(DOW FROM current_date) AS int)
       AND COALESCE(hd.trabaja, true) = true
     WHERE hd.hora_desde IS NOT NULL
       AND hd.hora_hasta IS NOT NULL
  ),
  param_banda AS (
    SELECT t.idper, t.hora_desde, t.hora_hasta,
           COALESCE(bh.umbral_aviso_falta_entrada,0) AS umbral_e,
           COALESCE(bh.umbral_aviso_falta_salida ,0) AS umbral_s
      FROM turnos_hoy t
      JOIN siper.bandas_horarias bh
        ON bh.banda_horaria = t.banda_horaria
  ),
  ejecuciones AS (
    SELECT DISTINCT
           ((current_date + hora_desde)
              + make_interval(mins => umbral_e + 5))::timestamptz AS run_at
      FROM param_banda
    UNION
    SELECT DISTINCT
           ((current_date + hora_hasta)
              + make_interval(mins => umbral_s + 5))::timestamptz AS run_at
      FROM param_banda
  )
  SELECT run_at
    FROM ejecuciones
   WHERE run_at >= now()
   ORDER BY run_at;
$$;
