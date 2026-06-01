"use strict";

import { TableDefinition, TableContext } from "./types-principal";

import { idper } from "./table-personas";
import { sector } from "./table-sectores";
import { sqlExprHoras, sqlExprHorasConSigno, sqlParteDiario } from "./table-parte_diario";

export const sqlCumplimientoHorasMensual = `
WITH resumen_mensual AS (
    SELECT 
        pd.idper,
        min(pd.sector) AS sector,
        date_trunc('month', pd.fecha)::date AS mes_inicio,
        COUNT(*) FILTER (WHERE pd.injustificado) AS novedades_injustificadas,
        COUNT(pd.horas) AS dias_con_fichada,
        SUM(pd.horas) AS total_mes
    FROM (${sqlParteDiario}) pd
      AND pd.activo
    GROUP BY n.idper, date_trunc('month', n.fecha)::date
),
resumen_presentismo AS (
    SELECT
        m.idper,
        m.sector,
        m.mes_inicio,
        m.dias_considerados,
        m.novedades_injustificadas,
        coalesce(m.total_mes, interval '0') AS total_mes,
        CASE WHEN m.dias_con_fichada > 0
            THEN coalesce(m.total_mes, interval '0') / m.dias_con_fichada
        END AS promedio_diario,
        r.umbral_horas_personales * m.dias_con_fichada::numeric * interval '1 hour' AS horas_esperadas_mes,
        r.umbral_horas_personales * m.dias_con_fichada::numeric * interval '1 hour' - coalesce(m.total_mes, interval '0') AS diferencia_horas_mes,
        coalesce(r.umbral_horas_mensuales, 0) * interval '1 hour' AS horas_maximas_adeudadas_mes
    FROM resumen_mensual m
        JOIN ${}
)
SELECT
    p.idper,
    p.sector,
    p.mes_inicio,
    p.dias_considerados,
    ${sqlExprHoras('p.total_mes')} AS total_mes,
    ${sqlExprHoras('p.horas_esperadas_mes')} AS horas_esperadas_mes,
    CASE WHEN p.promedio_diario IS NOT NULL THEN ${sqlExprHoras('p.promedio_diario')} END AS promedio_diario,
    ${sqlExprHorasConSigno('p.diferencia_horas_mes')} AS diferencia_horas_mes,
    p.novedades_injustificadas,
    p.novedades_injustificadas >= 1 AS pierde_por_novedad_injustificada,
    p.diferencia_horas_mes > p.horas_maximas_adeudadas_mes AS pierde_por_horas,
    (
        p.novedades_injustificadas >= 1
        OR p.diferencia_horas_mes > p.horas_maximas_adeudadas_mes
    ) AS pierde_presentismo
FROM resumen_presentismo p
ORDER BY p.mes_inicio, p.idper
`;

export function presentismo(_context: TableContext): TableDefinition {
    return {
        name: "presentismo",
        title: "control mensual de presentismo",
        editable: false,
        fields: [
            { name: "mes_inicio", typeName: "date", title: "mes" },
            idper,
            sector,
            { name: "dias_considerados", typeName: "integer", title: "dias considerados" },
            { name: "total_mes", typeName: "text", title: "cantidad de horas" },
            { name: "horas_esperadas_mes", typeName: "text", title: "horas esperadas" },
            { name: "promedio_diario", typeName: "text", title: "promedio horas trabajadas" },
            { name: "diferencia_horas_mes", typeName: "text", title: "diferencia horas" },
            { name: "novedades_injustificadas", typeName: "integer", title: "novedades injustificadas" },
            { name: "pierde_por_novedad_injustificada", typeName: "boolean", title: "pierde por NI" },
            { name: "pierde_por_horas", typeName: "boolean", title: "pierde por horas" },
            { name: "pierde_presentismo", typeName: "boolean", title: "pierde presentismo" },
        ],
        primaryKey: ["mes_inicio", idper.name],
        softForeignKeys: [
            { references: "personas", fields: [idper.name], displayFields: ["apellido", "nombres"] },
            { references: "sectores", fields: [sector.name] },
        ],
        sql: {
            isTable: false,
            from: `(${sqlCumplimientoHorasMensual})`,
        },
        sortColumns: [
            { column: "mes_inicio", order: -1 },
            { column: "pierde_presentismo", order: -1 }
        ],
    };
}
