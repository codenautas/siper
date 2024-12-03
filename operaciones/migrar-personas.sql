SET search_path = siper; SET ROLE siper_owner;

/* -- NO ELIMINAR ESTE BLOQUE
delete from personas;
delete from situacion_revista;
-- */

DROP TABLE IF EXISTS temp_personas_a_migrar;
CREATE TEMPORARY TABLE temp_personas_a_migrar AS 
  SELECT *
    FROM (
      SELECT *, row_number() OVER (partition by apellido, nombre ORDER BY validar_cuit(cuil::text) desc, ficha,id_meta_4) renglon
        FROM siper.personas_importadas
    ) x
    WHERE renglon = 1;

ALTER TABLE temp_personas_a_migrar ADD PRIMARY KEY (cuil);

INSERT INTO situacion_revista (situacion_revista) SELECT DISTINCT situacion_de_revista FROM temp_personas_a_migrar;

INSERT INTO sectores (nombre_sector, sector) 
  SELECT DISTINCT oficina, ultimo_numero + row_number() over ()
    FROM temp_personas_a_migrar x left join sectores s on x.oficina = s.nombre_sector, 
        (SELECT COALESCE(max(sector::bigint), 0) as ultimo_numero FROM sectores WHERE sector ~ '^\d+$') un
    WHERE nombre_sector is null;

INSERT INTO personas(
	cuil, ficha, idmeta4, apellido, nombres, categoria, documento, fecha_ingreso, fecha_egreso, 
    nacionalidad, jerarquia, cargo_atgc, situacion_revista)
SELECT cuil, ficha, id_meta_4, apellido, nombre, categoria, documento, fecha_ingreso, nullif(fecha_egreso, '2100-01-01'),
    nacionalidad, jerarquia, "cargo_/atgc", situacion_de_revista
  -- , antiguedad, tarjeta, login, descripcion, sexo, edad, motivo_de_egreso, reparticion, oficina, agrupamiento, tramo, grado, categoria, fecha_inicio_cargo, fecha_fin_cargo, horario, domicilio, funcion, codigo_funcion, estudio, fecha_nacimiento, nivelestudio
  -- id_importacion, comu_descripcion 
  FROM temp_personas_a_migrar
 WHERE renglon = 1;

UPDATE personas p
  SET sector = s.sector
  FROM temp_personas_a_migrar x,
       sectores s
  WHERE x.cuil = p.cuil
    AND s.nombre_sector = x.oficina;

UPDATE personas p 
  SET activo = fecha_egreso is null,
      registra_novedades_desde = coalesce(fecha_ingreso, '31-12-1999'),
      fecha_ingreso = coalesce(fecha_ingreso, '31-12-1999');

select * from personas limit 10;
