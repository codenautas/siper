set search_path=siper;
--SET ROLE siper_muleto_owner;
SET ROLE siper_owner;

--select * from siper.pautas
-- agregar gravedad
-- actualizar gravedad
-- agregar si faltan pautas

-- agregar gravedad
ALTER TABLE pautas ADD COLUMN gravedad TEXT IF NOT EXISTS;

-- actualizar gravedad
with pautasok as (
select * from (
    values
        ('CORRIDOS','GRAVE','las novedades de días corridos no pueden tener feriados o fines de semana intermedios sin novedad'),
        ('ACTULTDIA','MEDIO','activo con fecha_egreso'),
        ('ACTREGDES','MEDIO','activo sin registra_novedades_desde'),
        ('ACTSINANT','MEDIO','activo sin para_antigüedad_relativa,'),
        ('INASINULT','MEDIO','inactivo sin fecha_egreso'),
        ('ANULREGDES','MEDIO','campo activo sin dato y dato en registra_novedades_desde'),
        ('ANULCONULT','MEDIO','campo activo sin dato y dato en fecha_egreso'),
        ('ANTCOMVSRE','MEDIO','Para activos, la antiguedad computada por suma de rangos no coincide con los días transcurridos hasta la fecha de hoy contados desde para_antiguedad_relativa.'),
        ('ACTSINSEC','MEDIO','activo sin sector'),
        ('ACTSINSIT','MEDIO','activo sin situacion revista'),
        ('CUILINV','MEDIO','CUIL inválido o inexistente'),
        ('EXCEDIDO','GRAVE','la cantidad de dias tomados por novedad excede la cantidad de días disponibles')
    ) as t_pautasok (pauta, gravedad, descripcion)
)
update siper.pautas as p 
set gravedad = np.gravedad 
from pautasok as np
where p.pauta = np.pauta

-- agregar si faltan pautas
with pautasok as (
select * from (
    values
        ('CORRIDOS','GRAVE','las novedades de días corridos no pueden tener feriados o fines de semana intermedios sin novedad'),
        ('ACTULTDIA','MEDIO','activo con fecha_egreso'),
        ('ACTREGDES','MEDIO','activo sin registra_novedades_desde'),
        ('ACTSINANT','MEDIO','activo sin para_antigüedad_relativa,'),
        ('INASINULT','MEDIO','inactivo sin fecha_egreso'),
        ('ANULREGDES','MEDIO','campo activo sin dato y dato en registra_novedades_desde'),
        ('ANULCONULT','MEDIO','campo activo sin dato y dato en fecha_egreso'),
        ('ANTCOMVSRE','MEDIO','Para activos, la antiguedad computada por suma de rangos no coincide con los días transcurridos hasta la fecha de hoy contados desde para_antiguedad_relativa.'),
        ('ACTSINSEC','MEDIO','activo sin sector'),
        ('ACTSINSIT','MEDIO','activo sin situacion revista'),
        ('CUILINV','MEDIO','CUIL inválido o inexistente'),
        ('EXCEDIDO','GRAVE','la cantidad de dias tomados por novedad excede la cantidad de días disponibles')
    ) as t_pautasok (pauta, gravedad, descripcion)
)
insert into siper.pautas
select po.pauta, po.gravedad, po.descripcion from pautasok as po
left join siper.pautas as p on po.pauta = p.pauta
where p.pauta is null
