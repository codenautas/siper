UPDATE personas p 
  SET ficha                = pi.ficha,
      idmeta4              = pi.id_meta_4,
      sector               = pi.sector,
      categoria            = pi.categoria,
      documento            = pi.documento,
      nacionalidad         = pi.nacionalidad,
      jerarquia            = pi.jerarquia,
      "cargo_/atgc"        = pi."cargo_/atgc",
      agrupamiento         = pi.agrupamiento,
      tramo                = pi.tramo,
      grado                = pi.grado,
      situacion_de_revista = pi.situacion_de_revista,
      domicilio            = pi.domicilio,
      fecha_nacimiento     = pi.fecha_nacimiento,
      comu_descripcion     = pi.comu_descripcion
FROM (SELECT i.cuil, i.ficha, i.id_meta_4, s.sector, i.categoria, i.documento, i.nacionalidad, i.jerarquia, i."cargo_/atgc", i.agrupamiento, i.tramo, i.grado,
       i.situacion_de_revista, i.domicilio, i.fecha_nacimiento, string_agg (comu_descripcion,' ') comu_descripcion
       FROM personas_importadas i 
         LEFT JOIN sectores s on i.oficina = s.nombre_sector
       GROUP BY i.cuil, i.ficha, i.id_meta_4, s.sector, i.categoria, i.documento, i.nacionalidad, i.jerarquia, i."cargo_/atgc", i.agrupamiento, i.tramo, i.grado,
       i.situacion_de_revista, i.domicilio, i.fecha_nacimiento
     ) pi
WHERE p.cuil = pi.cuil;
