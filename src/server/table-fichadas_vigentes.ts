"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades";
import {sector} from "./table-sectores";

// visor de fichadas
export function fichadas_vigentes(_context: TableContext): TableDefinition{
    return {
        name: 'fichadas_vigentes',
        elementName: 'fichadas_vigentes',
        title:'Visor de fichadas',
        fields:[
            idper,
            {name: 'fecha' , typeName: 'date'},
            sector,
            cod_nov,
            {name: 'entrada' , typeName: 'time'},
            {name: 'salida'  , typeName: 'time'},
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
        detailTables: [
            {table:'fichadas'             , fields:[idper.name, 'fecha'], abr:'F'},
        ],
        sql:{
            isTable: false,
            from:`(select 
                        f.idper, 
                        f.fecha, 
                        nv.cod_nov,
                        p.sector,
                        min(f.hora) as entrada, 
                        case 
                            when count(*) over (partition by f.idper, f.fecha) = 1 then '00:00'
                            else max(f.hora)
                        end as salida,
                        h.hora_desde  || ' - ' || h.hora_hasta as horario
                    from 
                        fichadas f
                    inner join 
                        horarios h 
                        on h.idper = f.idper 
                        and f.fecha >= h.desde 
                        and (h.hasta IS NULL OR f.fecha <= h.hasta)
                    left join 
                        novedades_vigentes nv 
                        on nv.idper = f.idper 
                        and nv.fecha = f.fecha
                    inner join 
                        personas p 
                        on p.idper = f.idper
                    group by 
                        f.idper, 
                        f.fecha, 
                        nv.cod_nov, 
                        p.sector,
                        h.hora_desde, 
                        h.hora_hasta
            )`
        }
    };
}
