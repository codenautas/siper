-- ticket136

--set search_path = siper

INSERT INTO siper.per_nov_cant (annio, cod_nov, idper, origen, cantidad)
    (select 2025 as annio, '121' as cod_nov, p.idper, 2025 as origen, 4 as cantidad
    from siper.personas p 
    LEFT JOIN (SELECT *, ROW_NUMBER() OVER (PARTITION BY idper ORDER BY desde, idt DESC) AS rn
                FROM trayectoria_laboral
               ) t ON p.idper = t.idper
    where t.rn = 1 and activo and situacion_revista in
    ('PLANTA TRANSITORIA', 'PLANTA PERMANENTE', 'AUTORIDADES SUPERIORES', 'PLANTA GABINETE'))
    ON CONFLICT (annio, cod_nov, idper, origen) DO NOTHING;

INSERT INTO siper.per_nov_cant (annio, cod_nov, idper, origen, cantidad) 
    (select 2025 as annio, '124' as cod_nov, p.idper, 2025 as origen, 1 as cantidad
    from siper.personas p
    LEFT JOIN (SELECT *, ROW_NUMBER() OVER (PARTITION BY idper ORDER BY desde, idt DESC) AS rn
                FROM trayectoria_laboral
               ) t ON p.idper = t.idper
    where t.rn = 1 and activo and situacion_revista in
    ('PLANTA TRANSITORIA', 'PLANTA PERMANENTE', 'AUTORIDADES SUPERIORES', 'PLANTA GABINETE'))
    ON CONFLICT (annio, cod_nov, idper, origen) DO NOTHING;

INSERT INTO siper.per_nov_cant (annio, cod_nov, idper, origen, cantidad) 
    (select 2025 as annio, '23' as cod_nov, p.idper, 2025 as origen, 10 as cantidad
    from siper.personas p
    LEFT JOIN (SELECT *, ROW_NUMBER() OVER (PARTITION BY idper ORDER BY desde, idt DESC) AS rn
                FROM trayectoria_laboral
               ) t ON p.idper = t.idper
    where t.rn = 1 and activo and situacion_revista in
    ('PLANTA TRANSITORIA', 'PLANTA PERMANENTE', 'AUTORIDADES SUPERIORES', 'PLANTA GABINETE'))
    ON CONFLICT (annio, cod_nov, idper, origen) DO NOTHING;

INSERT INTO siper.per_nov_cant (annio, cod_nov, idper, origen, cantidad) 
    (select 2025 as annio, '157' as cod_nov, p.idper, 2025 as origen, 1 as cantidad
    from siper.personas p
    LEFT JOIN (SELECT *, ROW_NUMBER() OVER (PARTITION BY idper ORDER BY desde, idt DESC) AS rn
                FROM trayectoria_laboral
               ) t ON p.idper = t.idper
    where t.rn = 1 and activo and situacion_revista in
    ('PLANTA TRANSITORIA', 'PLANTA PERMANENTE', 'AUTORIDADES SUPERIORES', 'PLANTA GABINETE'))
    ON CONFLICT (annio, cod_nov, idper, origen) DO NOTHING;

INSERT INTO siper.per_nov_cant (annio, cod_nov, idper, origen, cantidad) 
    (select 2025 as annio, '156' as cod_nov, p.idper, 2025 as origen, 5 as cantidad
    from siper.personas p
    LEFT JOIN (SELECT *, ROW_NUMBER() OVER (PARTITION BY idper ORDER BY desde, idt DESC) AS rn
                FROM trayectoria_laboral
               ) t ON p.idper = t.idper
    where t.rn = 1 and activo and situacion_revista in
    ('PLANTA TRANSITORIA', 'PLANTA PERMANENTE', 'AUTORIDADES SUPERIORES', 'PLANTA GABINETE'))
    ON CONFLICT (annio, cod_nov, idper, origen) DO NOTHING;

INSERT INTO siper.per_nov_cant (annio, cod_nov, idper, origen, cantidad) 
    (select 2025 as annio, '155' as cod_nov, p.idper, 2025 as origen, 10 as cantidad
    from siper.personas p
    LEFT JOIN (SELECT *, ROW_NUMBER() OVER (PARTITION BY idper ORDER BY desde, idt DESC) AS rn
                FROM trayectoria_laboral
               ) t ON p.idper = t.idper
    where t.rn = 1 and activo and situacion_revista in
    ('PLANTA TRANSITORIA', 'PLANTA PERMANENTE', 'AUTORIDADES SUPERIORES', 'PLANTA GABINETE'))
    ON CONFLICT (annio, cod_nov, idper, origen) DO NOTHING;

INSERT INTO siper.per_nov_cant (annio, cod_nov, idper, origen, cantidad) 
    (select 2025 as annio, '21' as cod_nov, p.idper, 2025 as origen, 28 as cantidad
    from siper.personas p
    LEFT JOIN (SELECT *, ROW_NUMBER() OVER (PARTITION BY idper ORDER BY desde, idt DESC) AS rn
                FROM trayectoria_laboral
               ) t ON p.idper = t.idper
    where t.rn = 1 and activo and situacion_revista in
    ('PLANTA TRANSITORIA', 'PLANTA PERMANENTE', 'AUTORIDADES SUPERIORES', 'PLANTA GABINETE'))
    ON CONFLICT (annio, cod_nov, idper, origen) DO NOTHING;

INSERT INTO siper.per_nov_cant (annio, cod_nov, idper, origen, cantidad) 
    (select 2025 as annio, '11' as cod_nov, p.idper, 2025 as origen, 2 as cantidad
    from siper.personas p
    LEFT JOIN (SELECT *, ROW_NUMBER() OVER (PARTITION BY idper ORDER BY desde, idt DESC) AS rn
                FROM trayectoria_laboral
               ) t ON p.idper = t.idper
    where t.rn = 1 and activo and situacion_revista in
    ('PLANTA TRANSITORIA', 'PLANTA PERMANENTE', 'AUTORIDADES SUPERIORES', 'PLANTA GABINETE'))
    ON CONFLICT (annio, cod_nov, idper, origen) DO NOTHING;

INSERT INTO siper.per_nov_cant(annio, cod_nov, idper, origen, cantidad)
    (select 2025 as annio, '126' as cod_nov, p.idper, 2025 as origen, 1 as cantidad
    from siper.personas p
    LEFT JOIN (SELECT *, ROW_NUMBER() OVER (PARTITION BY idper ORDER BY desde, idt DESC) AS rn
                FROM trayectoria_laboral
               ) t ON p.idper = t.idper
    where t.rn = 1 and activo and situacion_revista in
    ('PLANTA TRANSITORIA', 'PLANTA PERMANENTE', 'AUTORIDADES SUPERIORES', 'PLANTA GABINETE'))
    ON CONFLICT (annio, cod_nov, idper, origen) DO NOTHING;
