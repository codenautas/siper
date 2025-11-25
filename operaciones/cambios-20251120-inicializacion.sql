set search_path=siper;
SET ROLE siper_owner; -- el que corresponda

ALTER TABLE siper.cod_novedades
ADD COLUMN inicializacion TEXT NULL;

ALTER TABLE siper.cod_novedades
ADD COLUMN inicializacion_limite NUMERIC NULL;

alter table siper.cod_novedades 
add constraint "inicializacion lista de metodos" 
check (inicializacion in ('LICORD', 'LICMAT', 'PLANTA'));

update siper.cod_novedades set inicializacion = 'LICORD' where cod_nov = '1';
update siper.cod_novedades set inicializacion_limite = 2 where cod_nov = '11';
update siper.cod_novedades set inicializacion = 'PLANTA' where cod_nov = '11';
update siper.cod_novedades set inicializacion = 'LICMAT' where cod_nov = '19';
update siper.cod_novedades set inicializacion_limite = 28 where cod_nov = '21';
update siper.cod_novedades set inicializacion = 'PLANTA' where cod_nov = '21';
update siper.cod_novedades set inicializacion_limite = 10 where cod_nov = '23';
update siper.cod_novedades set inicializacion = 'PLANTA' where cod_nov = '23';
update siper.cod_novedades set inicializacion_limite = 4 where cod_nov = '121';
update siper.cod_novedades set inicializacion = 'PLANTA' where cod_nov = '121';
update siper.cod_novedades set inicializacion_limite = 1 where cod_nov = '124';
update siper.cod_novedades set inicializacion = 'PLANTA' where cod_nov = '124';
update siper.cod_novedades set inicializacion_limite = 1 where cod_nov = '126';
update siper.cod_novedades set inicializacion = 'PLANTA' where cod_nov = '126';
update siper.cod_novedades set inicializacion_limite = 10 where cod_nov = '155';
update siper.cod_novedades set inicializacion = 'PLANTA' where cod_nov = '155';
update siper.cod_novedades set inicializacion_limite = 5 where cod_nov = '156';
update siper.cod_novedades set inicializacion = 'PLANTA' where cod_nov = '156';
update siper.cod_novedades set inicializacion_limite = 1 where cod_nov = '157';
update siper.cod_novedades set inicializacion = 'PLANTA' where cod_nov = '157';