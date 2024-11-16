SET search_path = siper; SET ROLE siper_owner;

-- /* -- NO ELIMINAR ESTE BLOQUE
delete from personas;
-- */

DROP TABLE IF EXISTS temp_personas_a_importar;
CREATE TEMPORARY TABLE temp_personas_a_importar AS 
  SELECT *
    FROM (
      SELECT *, row_number() OVER (partition by apellido, nombre ORDER BY validar_cuit(cuil::text) desc, ficha,id_meta_4) renglon
        FROM siper.personas_importadas
    ) x
    WHERE renglon = 1;

ALTER TABLE temp_personas_a_importar ADD PRIMARY KEY (cuil);

INSERT INTO personas(
	cuil, ficha, idmeta4, apellido, nombres, categoria, documento, fecha_ingreso, fecha_egreso, nacionalidad, jerarquia, cargo_atgc)
SELECT cuil, ficha, id_meta_4, apellido, nombre, categoria, documento, fecha_ingreso, fecha_egreso, nacionalidad, jerarquia, cargo_atgc
  -- , antiguedad, tarjeta, login, descripcion, sexo, edad, motivo_de_egreso, reparticion, oficina, agrupamiento, tramo, grado, categoria, situacion_de_revista, fecha_inicio_cargo, fecha_fin_cargo, horario, domicilio, funcion, codigo_funcion, estudio, fecha_nacimiento, nivelestudio
  -- id_importacion, comu_descripcion 
  FROM temp_personas_a_importar
 WHERE renglon = 1;

UPDATE personas p
  SET sector = s.sector
  FROM temp_personas_a_importar x,
       sectores s
  WHERE x.cuil = x.cuil
    AND s.nombre_sector = x.oficina;

select * from personas limit 10;
