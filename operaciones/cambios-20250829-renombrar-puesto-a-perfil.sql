set search_path=siper;
--SET ROLE siper_muleto_owner;
SET ROLE siper_owner;

-- borrro la constraint en personas:
ALTER TABLE personas DROP CONSTRAINT "personas puestos REL";

-- renombro la tabla:
ALTER TABLE puestos RENAME TO perfiles;

-- renombro la pk:
ALTER TABLE perfiles RENAME COLUMN puesto TO perfil;

-- renombro el campo en persona:
ALTER TABLE personas RENAME COLUMN puesto TO perfil;

-- agrego la nueva foreing key
ALTER TABLE personas ADD CONSTRAINT "personas perfiles REL" 
FOREIGN KEY (perfil) REFERENCES perfiles (perfil) ON UPDATE CASCADE;
