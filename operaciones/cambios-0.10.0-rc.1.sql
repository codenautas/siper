-- Cambios para la versión 0.10.0-rc.1: 

set search_path = siper;
set role to siper_muleto_owner;

alter table reglas add column incidencias_por_hora text not null default '60,77';
