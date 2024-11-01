export const staticConfigYaml=`
server:
  port: 3021
  session-store: memory-saved
db:
  motor: postgresql
  x-min-version: 17.0
  host: localhost
  database: siper_db
  schema: siper
  user: siper_admin
login:
  table: usuarios
  userFieldName: usuario
  passFieldName: md5clave
  rolFieldName: rol
  infoFieldList: [usuario, rol]
  activeClausule: activo
  unloggedLandPage: false
  plus:
    allowHttpLogin: true
    fileStore: true
    loginForm:
      formTitle: entrada
      formImg: unlogged/tables-lock.png
client-setup:
  menu: true
  lang: es
  user-scalable: no
install:
  dump:
    db:
      owner: siper_owner
      extensions: 
      - gist
    scripts:
      prepare:
      - ../node_modules/type-store/postgres/time_range.sql
      pre-adapt:
      - ../node_modules/pg-triggers/lib/table-changes.sql
      - ../install/validad_codigo.sql
      - ../install/sector_pertenece.sql
      - ../install/personas_id_trg.sql
      - ../install/validar_digito.sql
      post-adapt:
      - ../node_modules/pg-triggers/lib/function-changes-trg.sql
      - ../node_modules/pg-triggers/lib/enance.sql    
      - ../install/novedades_calculadas.sql
      - ../install/actualizar_novedades_vigentes.sql
      - ../install/novedades_registradas_trg.sql
      - ../install/novedades_horarias_trg.sql
      - ../install/personas_horarios_trg.sql
      - ../install/fechas_nov_trg.sql
      - ../install/sectores_circulares_trg.sql
      - ../install/novedades_registradas_detalles_trg.sql
      - ../install/novedades_horarias_parcial_trg.sql
      - ../install/novedades_registradas_total_trg.sql
      - ../install/horarios_con_horario_trg.sql
logo: 
  path: client/img
`;