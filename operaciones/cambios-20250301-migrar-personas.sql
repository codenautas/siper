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

INSERT INTO situacion_revista (situacion_revista) SELECT DISTINCT situacion_revista FROM temp_personas_a_migrar;

INSERT INTO sectores (nombre_sector, sector) 
  SELECT DISTINCT oficina, ultimo_numero + row_number() over ()
    FROM temp_personas_a_migrar x left join sectores s on x.oficina = s.nombre_sector, 
        (SELECT COALESCE(max(sector::bigint), 0) as ultimo_numero FROM sectores WHERE sector ~ '^\d+$') un
    WHERE nombre_sector is null;

/* controles
select t.apellido, t.nombre, p.apellido, p.nombres, * 
from temp_personas_a_migrar t 
left join personas p on t.cuil = p.cuil
order by t.apellido, t.nombre;

select p.apellido, p.nombres, t.apellido, t.nombre, * 
from personas p 
left join temp_personas_a_migrar t on p.cuil = t.cuil
order by p.apellido, p.nombres;
*/

MERGE INTO personas p
  USING temp_personas_a_migrar q
    ON p.nombres = q.nombre AND p.apellido = q.apellido and p.cuil = q.cuil and renglon = 1
  WHEN MATCHED AND 
      (--or p.activo                   IS DISTINCT FROM  
       --or 
       p.agrupamiento                  IS DISTINCT FROM  q.agrupamiento
       --                              IS DISTINCT FROM  q.antiguedad
       --or p.apellido                 IS DISTINCT FROM  q.apellido
       or p.cargo_atgc                 IS DISTINCT FROM  q."cargo_/atgc"
       or p.categoria                  IS DISTINCT FROM  q.categoria
       --                              IS DISTINCT FROM  q.codigo_funcion
       --                              IS DISTINCT FROM  q.comu_descripcion
       -- p.cuil                       IS DISTINCT FROM  q.cuil
       --                              IS DISTINCT FROM  q.descripcion
       or p.documento                  IS DISTINCT FROM  q.documento
       or p.domicilio                  IS DISTINCT FROM  q.domicilio
       --                              IS DISTINCT FROM  q.edad
       --                              IS DISTINCT FROM  q.estudio
       or p.fecha_egreso               IS DISTINCT FROM  nullif(q.fecha_egreso, '2100-01-01')
       --                              IS DISTINCT FROM  q.fecha_fin_cargo
       or p.fecha_ingreso              IS DISTINCT FROM  q.fecha_ingreso
       --                              IS DISTINCT FROM  q.fecha_inicio_cargo
       or p.fecha_nacimiento           IS DISTINCT FROM  q.fecha_nacimiento
       or p.ficha                      IS DISTINCT FROM  q.ficha
       --                              IS DISTINCT FROM  q.funcion
       or p.grado                      IS DISTINCT FROM  q.grado
       --                              IS DISTINCT FROM  q.horario
       --                              IS DISTINCT FROM  q.id_importacion
       or p.idmeta4                    IS DISTINCT FROM  q.id_meta_4
       --p.idper                       IS DISTINCT FROM  
       or p.jerarquia                  IS DISTINCT FROM  q.jerarquia
       --                              IS DISTINCT FROM  q.login
       --                              IS DISTINCT FROM  q.motivo_de_egreso
       or p.nacionalidad               IS DISTINCT FROM  q.nacionalidad
       --                              IS DISTINCT FROM  q.nivelestudio
       --or p.nombres                  IS DISTINCT FROM  q.nombre
       --                              IS DISTINCT FROM  q.oficina
       --                              IS DISTINCT FROM  q.reparticion
       --                              IS DISTINCT FROM  q.sexo
       or p.situacion_revista          IS DISTINCT FROM  q.situacion_revista
       --                              IS DISTINCT FROM  q.tarjeta
       or p.tramo                      IS DISTINCT FROM  q.tramo
       --or p.para_antiguedad_relativa IS DISTINCT FROM  
       --or p.registra_novedades_desde IS DISTINCT FROM  
       --or p.sector                   IS DISTINCT FROM  
) THEN
    UPDATE SET agrupamiento = q.agrupamiento, ficha = q.ficha, idmeta4 = q.id_meta_4, categoria = q.categoria, documento = q.documento, tramo = q.tramo, 
    domicilio = q.domicilio, fecha_ingreso = q.fecha_ingreso, fecha_nacimiento = q.fecha_nacimiento, grado = q.grado, fecha_egreso = nullif(q.fecha_egreso, '2100-01-01'),
    nacionalidad = q.nacionalidad, jerarquia = q.jerarquia, cargo_atgc = q."cargo_/atgc", situacion_revista = q.situacion_revista
  WHEN NOT MATCHED THEN  
    INSERT (agrupamiento, cuil, ficha, idmeta4, apellido, nombres, categoria, documento, fecha_ingreso, fecha_egreso, 
    nacionalidad, jerarquia, cargo_atgc, situacion_revista, domicilio, fecha_nacimiento, grado, tramo)
    VALUES (q.agrupamiento, q.cuil, q.ficha, q.id_meta_4, q.apellido, q.nombre, q.categoria, q.documento, q.fecha_ingreso, nullif(q.fecha_egreso, '2100-01-01'),
    q.nacionalidad, q.jerarquia, q."cargo_/atgc", q.situacion_revista, q.domicilio, q.fecha_nacimiento, q.grado, q.tramo);

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
