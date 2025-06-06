-- ticket 167
set search_path=siper;
SET ROLE siper_owner;

-- ver cuantos tienen mail con espacios o saltos de linea
/*
select mail, mail_alternativo,* from siper.usuarios where REGEXP_COUNT(mail, '[[:space:]]') > 0
or REGEXP_COUNT(mail_alternativo, '[[:space:]]') > 0;
--*/

-- sacar espacios de los mail
update siper.usuarios set mail = REGEXP_REPLACE(mail, '[[:space:]]', '', 'g'),
 	mail_alternativo = REGEXP_REPLACE(mail_alternativo, '[[:space:]]', '', 'g');

-- agregar las constraint
alter table "usuarios" add constraint "Sin espacios ni saltos en mail" check (mail similar to '[^[:space:]]+@[^[:space:]]+');
alter table "usuarios" add constraint "Sin espacios ni saltos en mail_alternativo" check (mail_alternativo similar to '[^[:space:]]+@[^[:space:]]+');
