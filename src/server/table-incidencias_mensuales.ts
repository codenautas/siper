"use strict";

import { TableDefinition, TableContext } from "./types-principal";

import { idper } from "./table-personas";
import { sector } from "./table-sectores";

import { sqlParteDiarioAgrupado } from "./table-parte_diario";

const MESES_SEMESTRE = [1, 2, 3, 4, 5, 6];

// $1: annio, $2: mes
const sqlPosicionMesEnSemestre = `((($2::integer - 1) % 6) + 1)`;
const sqlInicioMesSemestre = (mes: number) => `(make_date($1::integer, (($2::integer - 1) / 6) * 6 + ${mes}, 1))`;

export function incidencias_mensuales(context: TableContext): TableDefinition {
    const sqlMeses = MESES_SEMESTRE.map(mes =>
        `SELECT ${mes} as mes, idper, sector, ${sqlParteDiarioAgrupado(context, sqlInicioMesSemestre(mes))} AND ${mes} <= ${sqlPosicionMesEnSemestre} GROUP BY idper, sector`
    ).join(`
        UNION ALL
        `);
    return {
        name: "incidencias_mensuales",
        title: "incidencias mensuales acumuladas en el semestre",
        editable: false,
        fields: [
            idper,
            sector,
            { name: "acumulado_anterior" , typeName: "integer", description: "incidencias por horas y días injustificados de los meses anteriores del mismo semestre" },
            { name: "incidencias_horas"  , typeName: "integer", description: "incidencias por horas del mes" },
            { name: "dias_injustificados", typeName: "integer", description: "días injustificados del mes" },
            { name: "acumulado_semestral", typeName: "integer", description: "acumulado anterior más incidencias por horas y días injustificados del mes" },
        ],
        primaryKey: [idper.name],
        softForeignKeys: [
            { references: "personas", fields: [idper.name], displayFields: ["cuil", "apellido", "nombres"] },
            { references: "sectores", fields: [sector.name] },
        ],
        sql: {
            isTable: false,
            from: `(SELECT idper, sector,
            coalesce(sum(incidencias_horas + dias_injustificados) FILTER (WHERE mes < ${sqlPosicionMesEnSemestre}), 0)::integer as acumulado_anterior,
            sum(incidencias_horas) FILTER (WHERE mes = ${sqlPosicionMesEnSemestre})::integer as incidencias_horas,
            sum(dias_injustificados) FILTER (WHERE mes = ${sqlPosicionMesEnSemestre})::integer as dias_injustificados,
            sum(incidencias_horas + dias_injustificados)::integer as acumulado_semestral
        FROM (
        ${sqlMeses}
        ) m
        GROUP BY idper, sector)`,
        },
        functionDef: {
            parameters: [
                {name: 'annio', typeName: 'integer'},
                {name: 'mes'  , typeName: 'integer'},
            ]
        },
        sortColumns: [
            { column: "idper" },
        ],
    };
}
