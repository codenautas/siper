-- ticket 139

ALTER TABLE siper.personas
ADD COLUMN sexo CHAR(1) NULL;

ALTER TABLE siper.personas
    ADD CONSTRAINT "personas sexo REL" FOREIGN KEY (sexo)
        REFERENCES siper.sexos (sexo) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE NO ACTION;
