"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades";
import {sector} from "./table-sectores";

// vista para traer las fichadas en el dia. por ahora esta como min(hora) y max(hora) de la fecha. 
// el nombre no es el mejor. ver si hacer un origen comun para el visor de fichadas
export function parte_diario(_context: TableContext): TableDefinition{
    return {
        name: 'parte_diario',
        elementName: 'parte diario',
        fields:[
            idper,
            {name: 'fecha' , typeName: 'date'},
            sector,
            cod_nov,
            {name: 'fichada' , typeName: 'text'},
            {name: 'horario' , typeName: 'text'},
        ],
        primaryKey: [idper.name, 'fecha', cod_nov.name],
        softForeignKeys: [
            {references: 'personas', fields: [idper.name], displayFields:['ficha', 'apellido', 'nombres']},
            {references: 'cod_novedades', fields: [cod_nov.name], displayFields:['novedad']},
            {references: 'sectores', fields: [sector.name], displayFields:['nombre_sector']},
        ],
        constraints: [
        ],
        sql:{
            isTable: false,
            from:`(select 
                        p.idper, 
                        f.fecha, 
                        coalesce(nv.cod_nov, case when f.dds between 1 and 5 then cod_nov_habitual else null end) as cod_nov,
                        p.sector,
                        hora_texto(fi.entrada) || ' - ' || hora_texto(fi.salida) as fichada,
                        hora_texto(coalesce(h.hora_desde, horario_habitual_desde)) || ' - ' || hora_texto(coalesce(h.hora_hasta, horario_habitual_hasta)) as horario
                    from
                        personas p
                        inner join fechas f on f.fecha between p.registra_novedades_desde and coalesce(p.fecha_egreso, '3000-01-01'::date)
                        left join annios using (annio)
                        left join novedades_vigentes nv using(idper, fecha)
                        left join lateral (select min(hora) as entrada, max(hora) as salida from fichadas where fecha = f.fecha and idper = p.idper) fi on true
                        left join horarios h on h.idper = p.idper and f.dds = h.dds and f.fecha between h.desde and h.hasta 
            )`
        },
        sortColumns:[{column:'personas__apellido'}, {column:'personas__nombres'}]
    };
}
