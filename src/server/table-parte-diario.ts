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
                        f.idper, 
                        f.fecha, 
                        nv.cod_nov,
                        p.sector,
                        min(f.hora) || ' - ' || max(f.hora) as fichada,
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