SET search_path = siper; 
SET ROLE siper_owner;

-- Agregar la entrada "cuil invalido"
INSERT INTO pautas (pauta, descripcion)
VALUES ('CUILINV', 'CUIL inválido o inexistente');