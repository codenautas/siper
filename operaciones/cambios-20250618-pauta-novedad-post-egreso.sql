SET search_path = siper; 
SET ROLE siper_owner;

-- Agregar la entrada "cuil invalido"
INSERT INTO pautas (pauta, descripcion)
VALUES 
    ('NOVPOSTEGR', 'Existencia de novedades después de la fecha de egreso');
    ('NOVPREVING', 'Existencia de novedades previas a la fecha de ingreso');