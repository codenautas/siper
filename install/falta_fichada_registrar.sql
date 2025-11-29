-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET ROLE siper_owner;

CREATE OR REPLACE PROCEDURE falta_fichada_registrar()
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lock_id BIGINT := hashtext('falta_fichada_registrar_running');
  v_today date := current_date;
BEGIN
  -- fijar search_path seguro para SECURITY DEFINER
  PERFORM set_config('search_path','siper, pg_temp', true);

  -- evitar superposición de corridas
  IF NOT pg_try_advisory_lock(lock_id) THEN
    RAISE NOTICE 'falta_fichada_registrar ya en ejecución. Saliendo.';
    RETURN;
  END IF;

  WITH base AS (
    -- Personas activas con novedad que requiere fichada y con horario hoy
    SELECT
      p.idper,
      p.banda_horaria,
      hd.hora_desde   AS hora_ent,
      hd.hora_hasta   AS hora_sal,
      bh.umbral_aviso_falta_entrada  AS umbral_ent_min,
      bh.umbral_aviso_falta_salida   AS umbral_sal_min
    FROM personas p
    JOIN novedades_vigentes nv
         ON nv.idper = p.idper AND nv.fecha = v_today
    JOIN cod_novedades cn
         ON cn.cod_nov = nv.cod_nov AND coalesce(cn.requiere_fichadas, true) = true
    JOIN horarios_per hp
         ON hp.idper = p.idper
        AND v_today BETWEEN hp.desde AND coalesce(hp.hasta, v_today)
    JOIN horarios_dds hd
         ON hd.horario = hp.horario
        AND hd.dds = extract(dow from v_today)
        AND coalesce(hd.trabaja, true) = true
    JOIN bandas_horarias bh
         ON bh.banda_horaria = p.banda_horaria
    WHERE p.activo = true
  ),
  expand AS (
    -- Genero una fila por tipo de fichada esperada (E y S) con su hora y umbral
    SELECT
      b.idper,
      v_today::date AS fecha,
      x.tipo_fichada,
      CASE x.tipo_fichada WHEN 'E' THEN b.hora_ent ELSE b.hora_sal END AS hora_base,
      (CASE x.tipo_fichada WHEN 'E' THEN b.umbral_ent_min ELSE b.umbral_sal_min END)::int AS umbral_min
    FROM base b
    CROSS JOIN (VALUES ('E'), ('S')) AS x(tipo_fichada)
  ),
  vencidas AS (
    -- Solo las cuyo umbral ya venció y aún no hay fichada registrada del tipo correspondiente
    SELECT e.*
    FROM expand e
    WHERE
      (current_time > (e.hora_base + make_interval(mins => e.umbral_min)))
      AND NOT EXISTS (
        SELECT 1
        FROM fichadas f
        WHERE f.idper = e.idper
          AND f.fecha = e.fecha
          AND f.tipo_fichada = e.tipo_fichada
      )
  )
  INSERT INTO avisos_falta_fichada (idper, fecha, tipo_fichada)
  SELECT v.idper, v.fecha, v.tipo_fichada
  FROM vencidas v
  -- evitar duplicados si otra corrida alcanzó a insertar
  ON CONFLICT (idper, fecha, tipo_fichada) DO NOTHING;

  PERFORM pg_advisory_unlock(lock_id);
  RAISE NOTICE 'falta_fichada_registrar completado.';
EXCEPTION
  WHEN OTHERS THEN
    PERFORM pg_advisory_unlock(lock_id);
    RAISE;
END;
$$;
