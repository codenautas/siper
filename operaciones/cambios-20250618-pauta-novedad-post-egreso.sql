SET search_path = siper; 
SET ROLE siper_owner;

INSERT INTO pautas (pauta, gravedad, descripcion)
VALUES 
    ('NOVPOSTEGR', 'MEDIO', 'Existencia de novedades después de la fecha de egreso');
    ('NOVPREVING', 'MEDIO', 'Existencia de novedades previas a la fecha de ingreso');
