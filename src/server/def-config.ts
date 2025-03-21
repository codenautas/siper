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
    successRedirect: /menu#i=principal
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
    enances: inline
    scripts:
      prepare:
      - ../node_modules/type-store/postgres/time_range.sql
      pre-adapt:
      - ../node_modules/pg-triggers/lib/table-changes.sql
      - ../install/hora_texto.sql
      - ../install/validad_codigo.sql
      - ../install/sector_pertenece.sql
      - ../install/personas_id_trg.sql
      - ../install/validar_digito.sql
      - ../install/per_domicilios_pk_trg.sql
      post-adapt:
      - ../node_modules/pg-triggers/lib/recreate-his.sql
      - ../node_modules/pg-triggers/lib/table-changes.sql
      - ../node_modules/pg-triggers/lib/function-changes-trg.sql
      - ../node_modules/pg-triggers/lib/enance.sql    
      - ../install/novedades_calculadas.sql
      - ../install/actualizar_novedades_vigentes.sql
      - ../install/annio_abrir.sql
      - ../install/annio_preparar.sql
      - ../install/novedades_registradas_trg.sql
      - ../install/novedades_horarias_trg.sql
      - ../install/fechas_nov_trg.sql
      - ../install/sectores_circulares_trg.sql
      - ../install/novedades_registradas_detalles_trg.sql
      - ../install/novedades_horarias_parcial_trg.sql
      - ../install/novedades_registradas_total_trg.sql
      - ../install/horarios_recalcular_trg.sql
      - ../install/personas_actualizar_novedades_trg.sql
      - ../install/avance_de_dia_proc.sql
      - ../install/parametros_trg.sql
logo: 
  path: client/img
`;