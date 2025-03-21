--role dependiendo de la BD
--set role to siper_owner;
--set role to siper_muleto_owner;

set search_path = "siper", public;

create table "grupos_parte_diario" (
  "grupo_parte_diario" text, 
  "descripcion" text, 
  "grupo_padre" text, 
  "orden" integer, 
  "nivel" integer, 
  "es_cod_nov" boolean
, primary key ("grupo_parte_diario")
);
grant select, insert, update, delete on "grupos_parte_diario" to siper_admin;
grant all on "grupos_parte_diario" to siper_owner;

-- table data: install\grupos_parte_diario.tab
insert into "grupos_parte_diario" ("grupo_parte_diario", "descripcion", "grupo_padre", "es_cod_nov", "orden", "nivel") values
('PADI', 'Parte diario', null, 'false', null, null),
('TOTL', 'Total agentes', 'PADI', 'false', '900', null),
('PRES', 'Presentes', 'TOTL', 'false', '100', null),
('TTPR', 'Total de presentes', 'PRES', 'false', '140', null),
('STPR', 'Sub Total Presentes', 'TTPR', 'false', '130', null),
('140', 'Autoridades superiores', 'STPR', 'true', '110', null),
('999', 'Presente (Horario flexible)', 'STPR', 'true', '120', null),
('AUJU', 'Ausentes justificados', 'TOTL', 'false', '200', null),
('TOAJ', 'Total ausentes justificados', 'AUJU', 'false', '260', null),
('STAJ', 'Subtotal ausentes justificados', 'TOAJ', 'false', '250', null),
('SULI', 'Subtotal Licencias', 'STAJ', 'false', '220', null),
('1', 'Art. 18 Descanso anual remunerado', 'SULI', 'true', '210', null),
('SOAJ', 'Subtotal Otros Ausentes Justificados', 'STAJ', 'false', '240', null),
('101', 'Teletrabajo Diagramado', 'SOAJ', 'true', '230', null);

alter table "grupos_parte_diario" add constraint "grupo_parte_diario<>''" check ("grupo_parte_diario"<>'');
alter table "grupos_parte_diario" add constraint "descripcion<>''" check ("descripcion"<>'');
alter table "grupos_parte_diario" add constraint "grupo_padre<>''" check ("grupo_padre"<>'');
alter table "grupos_parte_diario" add unique ("descripcion");
alter table "grupos_parte_diario" add constraint "palabra corta y solo mayusculas en grupo_parte_diario" check (grupo_parte_diario similar to '[A-Z][A-Z0-9]{0,9}|[1-9]\d{0,10}');

do $SQL_ENANCE$
 begin
PERFORM enance_table('grupos_parte_diario','grupo_parte_diario');
end
$SQL_ENANCE$;