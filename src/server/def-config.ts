export const staticConfigYaml=`
server:
  port: 3021
  session-store: memory-saved
db:
  motor: postgresql
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
    scripts:
      pre-adapt:
      - ../node_modules/pg-triggers/lib/table-changes.sql
      - ../install/validad_codigo.sql
      post-adapt:
      - ../node_modules/pg-triggers/lib/function-changes-trg.sql
      - ../node_modules/pg-triggers/lib/enance.sql    
      - ../install/novedades_calculadas.sql
      - ../install/actualizar_novedades_vigentes.sql
      - ../install/novedades_registradas_trg.sql
logo: 
  path: client/img
`;