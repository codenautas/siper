set search_path=siper;
--SET ROLE siper_owner; -- el que corresponda

ALTER TABLE siper.cod_novedades
ADD COLUMN inicializar BOOLEAN NULL;

ALTER TABLE siper.cod_novedades
ADD COLUMN cantidad INTEGER NULL;

ALTER TABLE siper.personas
ALTER COLUMN activo DROP NOT NULL;

--select inicializar, cantidad, * from siper.cod_novedades where cod_nov in ('121', '124', '23', '157', '156', '155', '21', '11', '126')

update siper.cod_novedades set inicializar = true where cod_nov in ('121', '124', '23', '157', '156', '155', '21', '11', '126');
update siper.cod_novedades set cantidad = 4 where cod_nov = '121';
update siper.cod_novedades set cantidad = 1 where cod_nov = '124';
update siper.cod_novedades set cantidad = 10 where cod_nov = '23';
update siper.cod_novedades set cantidad = 1 where cod_nov = '157';
update siper.cod_novedades set cantidad = 5 where cod_nov = '156';
update siper.cod_novedades set cantidad = 10 where cod_nov = '155';
update siper.cod_novedades set cantidad = 28 where cod_nov = '21';
update siper.cod_novedades set cantidad = 2 where cod_nov = '11';
update siper.cod_novedades set cantidad = 1 where cod_nov = '126';
