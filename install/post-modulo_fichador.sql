/***
 * El módulo fichador necesita su propira estructura. 
 * Para poder probar en máquinas locales se tiene que crear el usuario (si no existiera)
 * y darle los permisos a las tablas, secuencias y lo que corresponda
 ***/

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'siper_modulo_fichador') THEN
        CREATE USER siper_modulo_fichador;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA siper TO siper_modulo_fichador;

GRANT SELECT, USAGE ON SEQUENCE siper.id_fichada TO siper_modulo_fichador;

GRANT DELETE ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(id_fichada) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(fichador),INSERT(fichador),UPDATE(fichador) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(fecha),INSERT(fecha),UPDATE(fecha) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(hora),INSERT(hora),UPDATE(hora) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(tipo),INSERT(tipo),UPDATE(tipo) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(texto),INSERT(texto),UPDATE(texto) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(dispositivo),INSERT(dispositivo),UPDATE(dispositivo) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(punto_gps),INSERT(punto_gps),UPDATE(punto_gps) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(id_origen),INSERT(id_origen),UPDATE(id_origen) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(recepcion) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE siper.fichadas_recibidas TO siper_muleto_admin;

CREATE VIEW siper.personal_con_fichada AS
 SELECT p.idper,
    p.apellido,
    p.nombres,
    p.documento,
    u.hashpass
   FROM (siper.personas p
     JOIN siper.usuarios u USING (idper))
  WHERE ((u.algoritmo_pass = 'PG-SHA256'::text) AND u.activo AND p.activo);

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE siper.personal_con_fichada TO siper_modulo_fichador;
