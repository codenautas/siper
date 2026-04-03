/***
 * El módulo fichador necesita su propira estructura. 
 * Para poder probar en máquinas locales se tiene que crear el usuario (si no existiera)
 * y darle los permisos a las tablas, secuencias y lo que corresponda
 ***/

CREATE USER IF NOT EXISTS siper_modulo_fichador WITH PASSWORD 'CAMBIAR ESTA CONTRASEÑA';
GRANT USAGE ON SCHEMA siper TO siper_modulo_fichador;

GRANT SELECT, USAGE ON SEQUENCE siper.id_fichada TO siper_modulo_fichador;