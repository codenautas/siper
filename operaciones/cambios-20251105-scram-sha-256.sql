set search_path=siper;
SET ROLE siper_owner;

alter table usuarios add column ultima_actualizacion_password timestamp;
alter table usuarios add column algoritmo_pass text;

alter table "usuarios" add constraint "algoritmo_pass<>''" check ("algoritmo_pass"<>'');

update usuarios set algoritmo_pass = 'M-SHA256' where hashpass like 'SCRAM-SHA-256$%';

update usuarios set algoritmo_pass = 'MD5' where hashpass not like 'SCRAM-SHA-256$%';
