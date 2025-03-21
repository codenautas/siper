"use strict";

import {TableDefinition, TableContext, FieldDefinition} from "./types-principal";

import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades";
import {sector} from "./table-sectores";
import {changing} from "best-globals";

export const sqlReporte= `
select 
        p.idper, 
        f.fecha, 
        nv.cod_nov,
        p.sector,
        fi.entrada as fichada_entrada,
        fi.salida as fichada_salida,
        coalesce(h.hora_desde, horario_habitual_desde) horario_entrada, 
        coalesce(h.hora_hasta, horario_habitual_hasta) as horario_salida
    from
        personas p
        inner join fechas f on f.fecha between p.registra_novedades_desde and coalesce(p.fecha_egreso, '3000-01-01'::date)
        left join annios using (annio)
        left join novedades_vigentes nv using(idper, fecha)
        left join lateral (select min(hora) as entrada, max(hora) as salida from fichadas where fecha = f.fecha and idper = p.idper) fi on true
        left join horarios h on h.idper = p.idper and f.dds = h.dds and f.fecha between h.desde and h.hasta 
`;

// Función genérica para la configuración base de las tablas
function baseReporte(context: TableContext): TableDefinition {
    const rrhh = context.es.rrhh;
    return {
        name: "reporte",
        fields: [
            idper,
            { name: 'fecha'  , typeName: 'date' },
            sector,
            cod_nov,
            { name: 'fichada', typeName: 'text' },
            { name: 'horario', typeName: 'text' },
        ],
        primaryKey: [idper.name, 'fecha', cod_nov.name],
        softForeignKeys: [
            {references: 'personas', fields: [idper.name], displayFields:['ficha', 'cuil', 'apellido', 'nombres']},
            {references: 'cod_novedades', fields: [cod_nov.name], displayFields:['novedad']},
            {references: 'sectores', fields: [sector.name], displayFields:['nombre_sector']},
        ],
        hiddenColumns: ['fichada'],
        constraints: [
        ],
        sql:{
            isTable: false,
            from:`(select x.idper, x.fecha, x.sector, x.cod_nov,
                    hora_texto(fichada_entrada) || ' - ' || hora_texto(fichada_salida) as fichada,
                    hora_texto(horario_entrada) || ' - ' || hora_texto(horario_Salida) as horario
                from (${sqlReporte}) x
                    inner join usuarios u on u.usuario = get_app_user()
                    inner join roles using (rol)
                    ${rrhh ? `` : `WHERE sector_pertenece(
                        x.sector,
                        (SELECT sector 
                        FROM personas 
                        INNER JOIN usuarios USING (idper) 
                        WHERE usuario = get_app_user())
                    )`}
                    
            )`,
        },
        sortColumns:[{column:'personas__apellido'}, {column:'personas__nombres'}],
    };
}

// Función para parte_diario
export function parte_diario(context: TableContext): TableDefinition {
    return changing (baseReporte(context), {
        name: "parte_diario",
        elementName: "parte_diario",
    });
}

// Función para parte_mensual
export function parte_mensual(context: TableContext): TableDefinition {
    var tableDef = changing (baseReporte(context), {
        name: "parte_mensual",
        elementName: "parte_mensual",
    });
    tableDef.fields.find((field:FieldDefinition)=>field.name=='fecha')!.alwaysShow = true;
    return tableDef;
}