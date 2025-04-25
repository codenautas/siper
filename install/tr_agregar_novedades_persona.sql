-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

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

CREATE OR REPLACE FUNCTION siper.agregar_novedades_persona()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO siper.per_nov_cant (annio, cod_nov, idper, origen, cantidad, comienzo, vencimiento)
      (SELECT 2025 as annio, cc.cod_nov, NEW.idper, 2025 origen, cc.cantidad, null, null FROM siper.cod_novedades cc
        where cc.inicializar = true and NEW.activo)
	ON CONFLICT (annio, cod_nov, idper, origen) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_agregar_novedades_persona
AFTER INSERT ON siper.personas
FOR EACH ROW
EXECUTE FUNCTION siper.agregar_novedades_persona();
