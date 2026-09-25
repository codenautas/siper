set role to siper_muleto_owner;
set search_path = siper;



-- renombrar sede como cod_sede
--ALTER TABLE IF EXISTS siper.sedes
--    ADD COLUMN cod_sede text COLLATE pg_catalog."default";
--
--ALTER TABLE IF EXISTS siper.sedes DROP COLUMN IF EXISTS sede;
-- Uso RENAME para preservar los datos (el schema Diff no tiene forma de saber que es un rename)
ALTER TABLE siper.sedes 
    RENAME COLUMN sede TO cod_sede;
-- como no es pk le saco el NOT NULL que hereda de sede
-- mas adelante preciso que sean NULL para el filtro de la softFK
ALTER TABLE IF EXISTS siper.sedes DROP CONSTRAINT IF EXISTS sedes_pkey;

ALTER TABLE siper.sedes
    ALTER COLUMN cod_sede DROP NOT NULL;
---------------

-- agregar id_punto
--ALTER TABLE IF EXISTS siper.sedes
--    ADD COLUMN id_punto text COLLATE pg_catalog."default" NOT NULL;
--
--ALTER TABLE IF EXISTS siper.sedes
--    ADD CONSTRAINT sedes_pkey PRIMARY KEY (id_punto);
---------------
-- 1) Agregar la columna como NULLABLE (sin NOT NULL todavía)
ALTER TABLE siper.sedes
    ADD COLUMN id_punto text COLLATE pg_catalog."default";

-- 2) Poblar los datos existentes con valores únicos
-- .... como sede era PK, cod_sede ahora es unique.
-- .... puedo poblar con algo com P+<cod_sede> ?
UPDATE siper.sedes SET id_punto = 'P' || cod_sede;

-- 3) Recién ahora aplicar NOT NULL (los datos ya están completos y únicos)
ALTER TABLE siper.sedes
    ALTER COLUMN id_punto SET NOT NULL;

-- 4) Crear la PK
-- 4).0 Borrar la PK
--ALTER TABLE siper.sedes
--    DROP CONSTRAINT sedes_pkey;
-- 4).1
ALTER TABLE siper.sedes
    ADD CONSTRAINT sedes_pkey PRIMARY KEY (id_punto);
---------------

-- crear y poblar punto_alternativo
ALTER TABLE IF EXISTS siper.sedes
    ADD COLUMN punto_alternativo boolean;

UPDATE siper.sedes SET punto_alternativo = TRUE
WHERE cod_sede LIKE 'SIA%';

-- para el filtro de la softFk
UPDATE siper.sedes SET cod_sede = NULL
WHERE cod_sede LIKE 'SIA%';
---------------

ALTER TABLE IF EXISTS siper.sedes
    ADD CONSTRAINT sedes_cod_sede_key UNIQUE (cod_sede);

ALTER TABLE IF EXISTS siper.sedes
    ADD CONSTRAINT "id_punto<>''" CHECK (id_punto <> ''::text);

ALTER TABLE IF EXISTS siper.sedes
    ADD CONSTRAINT "cod_sede<>''" CHECK (cod_sede <> ''::text);

-- esta ya existe
ALTER TABLE IF EXISTS siper.sedes
    ADD CONSTRAINT "descripcion<>''" CHECK (descripcion <> ''::text);

ALTER TABLE IF EXISTS siper.sedes
    ADD CONSTRAINT "palabra corta y solo mayusculas en id_punto" CHECK (id_punto ~ similar_to_escape('[A-Z][A-Z0-9]{0,9}|[1-9]\d{0,10}'::text));

-- ¿ borrarlo y crearlo de nuevo ?
--DROP TRIGGER IF EXISTS changes_trg ON siper.sedes;
-- Dejo el que existe.

-- En personas, como es una softfk, alcanza con crear el campo.
ALTER TABLE IF EXISTS siper.personas
    ADD COLUMN cod_sede text COLLATE pg_catalog."default";

ALTER TABLE IF EXISTS siper.personas
    ADD CONSTRAINT "cod_sede<>''" CHECK (cod_sede <> ''::text);