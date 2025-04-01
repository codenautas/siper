-- ticket137

set search_path = "siper"

INSERT INTO siper.motivos_egreso(motivo_egreso, descripcion, cod_2024)
	VALUES 
	('EXO','EXONERACION', 2),
    ('ASC', 'ASCENSO', 7),
    ('COM', 'PASE EN COMISION', 10),
    ('RAD', 'TRASLADO RAD', 11),
    ('DES', 'DESPIDO', 13),
    ('NPR', 'NO SE PRESENTO', 14),
    ('AFJ', 'TRASPASO AFJP', 16),
    ('DEC', 'CESE DEC. 584/05', 17),
    ('COE', 'CESE COLEGIO DE ESCRIBANO', 18),
    ('CMJ', 'CARGO DE MAYOR JERARQUIA', 19),
    ('INA', 'INASISTENCIAS', 21);
