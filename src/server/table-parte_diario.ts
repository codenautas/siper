"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades";
import {sector} from "./table-sectores";

import { sqlNovedadesVigentesConDesdeHastaHabiles } from "./table-novedades_vigentes";

export const sqlParteDiario= `
select 
        p.idper, 
        f.fecha, 
        nv.cod_nov,
        p.sector,
        p.ficha as persona_ficha,
        p.cuil,
        p.apellido,
        p.nombres,
        s.nombre_sector as sector_nombre,
        fi.entrada as fichada_entrada,
        fi.salida as fichada_salida,
        coalesce(h.hora_desde, horario_habitual_desde) horario_entrada, 
        coalesce(h.hora_hasta, horario_habitual_hasta) as horario_salida,
        cn.novedad,
        nv.ficha,
        nv.annio,
        nv.trabajable,
        nv.detalles,
        nv.desde,
        nv.hasta,
        nv.habiles,
        nv.corridos,
        p.banda_horaria,
        bh.descripcion as bh_descripcion
    from
        personas p
        inner join fechas f on f.fecha between p.registra_novedades_desde and coalesce(p.fecha_egreso, '3000-01-01'::date)
        left join annios using (annio)
        left join sectores s on p.sector = s.sector
        left join (${sqlNovedadesVigentesConDesdeHastaHabiles}) nv using(idper, fecha)
        left join cod_novedades cn on nv.cod_nov = cn.cod_nov
        left join lateral (select min(hora) as entrada, max(hora) as salida from fichadas where fecha = f.fecha and idper = p.idper) fi on true
        left join horarios h on h.idper = p.idper and f.dds = h.dds and f.fecha between h.desde and h.hasta 
        left join bandas_horarias bh on p.banda_horaria = bh.banda_horaria
`;

// Función genérica para la configuración base de las tablas
export function parte_diario(_context: TableContext): TableDefinition {
    return {
        name: "parte_diario",
        elementName: "parte_diario",
        fields: [
            idper,
            { name: 'persona_ficha'   , typeName: 'text' , title: 'ficha'},
            { name: 'cuil'    , typeName: 'text' },
            { name: 'apellido', typeName: 'text'},
            { name: 'nombres' , typeName: 'text'},
            { name: 'fecha'  , typeName: 'date' },
            sector,
            { name: 'sector_nombre', typeName: 'text', title: 'sector departamento área' },        // <-- AGREGADO
            cod_nov,
            { name: 'novedad', typeName: 'text'},
            { name: 'fichada', typeName: 'text' },
            { name: 'horario', typeName: 'text' },
            { name: 'desde', typeName: 'date' },
            { name: 'hasta', typeName: 'date' },
            { name: 'habiles', typeName: 'integer' },
            { name: 'corridos', typeName: 'integer' },
            { name: 'banda_horaria', typeName: 'text'},
            { name: 'bh_descripcion', typeName: 'text', title: 'descripcion' },
        ],
        primaryKey: [idper.name, 'fecha', cod_nov.name],
        hiddenColumns: ['fichada'],
        constraints: [
        ],
        sql:{
            isTable: false,
            from:`(select x.*,
                    hora_texto(fichada_entrada) || ' - ' || hora_texto(fichada_salida) as fichada,
                    hora_texto(horario_entrada) || ' - ' || hora_texto(horario_Salida) as horario
                from (${sqlParteDiario}) x
            )`,
        },
        sortColumns:[{column:'apellido'}, {column:'nombres'}],
    };
}