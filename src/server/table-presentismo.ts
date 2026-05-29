"use strict";

import { TableDefinition, TableContext } from "./types-principal";

import { idper, sqlPersonas } from "./table-personas";
import { sector } from "./table-sectores";
import { sqlExprHoras, sqlExprHorasConSigno } from "./table-parte_diario";

export const sqlCumplimientoHorasMensual = `
WITH resumen_mensual AS (
    SELECT
        n.idper,
        min(p.sector) AS sector,
        date_trunc('month', n.fecha)::date AS mes_inicio,
        COUNT(*) FILTER (WHERE f.laborable IS DISTINCT FROM false AND f.dds NOT IN (0, 6)) AS dias_considerados,
        COUNT(*) FILTER (WHERE f.laborable IS DISTINCT FROM false AND f.dds NOT IN (0, 6) AND COALESCE(cn.injustificado, false)) AS novedades_injustificadas,
        COUNT(n.horas) AS dias_con_fichada,
        SUM(n.horas) AS total_mes
    FROM novedades_vigentes n
        JOIN (${sqlPersonas}) p ON p.idper = n.idper
        JOIN fechas f ON f.fecha = n.fecha
        LEFT JOIN cod_novedades cn ON cn.cod_nov = n.cod_nov
    WHERE (p.inicia_fichada IS NULL OR n.fecha >= p.inicia_fichada)
      AND p.activo IS TRUE
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
        JOIN reglas r ON r.annio = extract(year from m.mes_inicio)::integer
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
