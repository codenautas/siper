set search_path=siper;
SET ROLE siper_owner; -- el que corresponda

ALTER TABLE siper.cod_novedades
ADD COLUMN inicializacion TEXT NULL;

alter table siper.cod_novedades 
add constraint "inicializacion numero o algoritmo" 
check (inicializacion in ('LICORD', 'LICMAT') or inicializacion ~ '^\d+$');

update siper.cod_novedades set inicializacion = 'LICORD' where cod_nov = '1';
update siper.cod_novedades set inicializacion = '2' where cod_nov = '11';
update siper.cod_novedades set inicializacion = 'LICMAT' where cod_nov = '19';
update siper.cod_novedades set inicializacion = '28' where cod_nov = '21';
update siper.cod_novedades set inicializacion = '10' where cod_nov = '23';
update siper.cod_novedades set inicializacion = '4' where cod_nov = '121';
update siper.cod_novedades set inicializacion = '1' where cod_nov = '124';
update siper.cod_novedades set inicializacion = '1' where cod_nov = '126';
update siper.cod_novedades set inicializacion = '10' where cod_nov = '155';
update siper.cod_novedades set inicializacion = '5' where cod_nov = '156';
update siper.cod_novedades set inicializacion = '1' where cod_nov = '157';