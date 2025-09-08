set search_path=siper;
--SET ROLE siper_muleto_owner;
SET ROLE siper_owner;

-- eliminar la FK
ALTER TABLE trayectoria_laboral 
DROP CONSTRAINT "trayectoria_laboral puestos REL";

-- renombrar la tabla
ALTER TABLE puestos RENAME TO perfiles;

-- renombrar la PK de puesto a perfil
ALTER TABLE perfiles RENAME COLUMN puesto TO perfil;

--actualizar la columna puesto en trayectoria_laboral
ALTER TABLE trayectoria_laboral RENAME COLUMN puesto TO perfil;

-- crear la nueva FK
ALTER TABLE trayectoria_laboral 
ADD CONSTRAINT "trayectoria_laboral perfiles REL" 
FOREIGN KEY (perfil) REFERENCES perfiles(perfil) 
ON UPDATE CASCADE;

