"use strict";

import { TableDefinition, TableContext, FieldDefinition } from "./types-principal";

import { idper } from "./table-personas";
import { sector } from "./table-sectores";

import { sqlParteDiarioAgrupado } from "./table-parte_diario";

const MESES_SEMESTRE = [1, 2, 3, 4, 5, 6];

// $1: annio, $2: semestre (1 o 2)
const sqlInicioMesSemestre = (mes: number) => `(make_date($1::integer, ($2::integer - 1) * 6 + ${mes}, 1))`;

export function semestral(context: TableContext): TableDefinition {
    const camposMeses: FieldDefinition[] = MESES_SEMESTRE.flatMap(mes => [
        { name: `pro_mes_${mes}`, typeName: "integer", title: `prom. mes ${mes}`, description: `días considerados para el promedio de horas en el mes ${mes} del semestre` },
        { name: `inc_mes_${mes}`, typeName: "integer", title: `inc. mes ${mes}` , description: `incidencias en el mes ${mes} del semestre` },
    ] satisfies FieldDefinition[]);
    const sqlMeses = MESES_SEMESTRE.map(mes =>
        `SELECT ${mes} as mes, idper, sector, ${sqlParteDiarioAgrupado(context, sqlInicioMesSemestre(mes))} GROUP BY idper, sector`
    ).join(`
        UNION ALL
        `);
    const sqlColumnasMeses = MESES_SEMESTRE.map(mes =>
        `sum(dias_promediados) FILTER (WHERE mes = ${mes})::integer as pro_mes_${mes},
            sum(incidencias) FILTER (WHERE mes = ${mes})::integer as inc_mes_${mes},`
    ).join(`
            `);
    return {
        name: "semestral",
        title: "control semestral de presentismo",
        editable: false,
        fields: [
            idper,
            sector,
            ...camposMeses,
            { name: "pro_totales", typeName: "integer", title: "prom. total", description: "días considerados para el promedio de horas en el semestre" },
            { name: "inc_totales", typeName: "integer", title: "inc. total" , description: "incidencias en el semestre" },
        ],
        primaryKey: [idper.name],
        softForeignKeys: [
            { references: "personas", fields: [idper.name], displayFields: ["cuil", "apellido", "nombres"] },
            { references: "sectores", fields: [sector.name] },
        ],
        sql: {
            isTable: false,
            from: `(SELECT idper, sector,
            ${sqlColumnasMeses}
            sum(coalesce(dias_promediados, 0))::integer as pro_totales,
            sum(coalesce(incidencias, 0))::integer as inc_totales
        FROM (
        ${sqlMeses}
        ) m
        GROUP BY idper, sector)`,
        },
        functionDef: {
            parameters: [
                {name: 'annio'   , typeName: 'integer'},
                {name: 'semestre', typeName: 'integer'},
            ]
        },
        sortColumns: [
            { column: "idper" },
        ],
    };
}
