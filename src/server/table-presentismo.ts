"use strict";

import { TableDefinition, TableContext } from "./types-principal";

import { idper, sqlPersonas } from "./table-personas";
import { sector } from "./table-sectores";
import { sqlExprHoras, sqlExprHorasConSigno } from "./table-parte_diario";

export const sqlCumplimientoHorasMensual = `
WITH base AS (
    SELECT
        n.idper,
        p.sector,
        date_trunc('month', n.fecha)::date AS mes_inicio,        
        n.cod_nov,
        coalesce(cn.injustificado, false) AS es_novedad_injustificada,
        n.horas
    FROM novedades_vigentes n
        JOIN (${sqlPersonas}) p ON p.idper = n.idper
        JOIN fechas f ON f.fecha = n.fecha
        LEFT JOIN cod_novedades cn ON cn.cod_nov = n.cod_nov
    WHERE f.laborable IS DISTINCT FROM false
      AND f.dds NOT IN (0, 6)
      AND n.trabajable IS TRUE
      AND (p.inicia_fichada IS NULL OR n.fecha >= p.inicia_fichada)
),
resumen_mensual AS (
    SELECT
        b.idper,
        min(b.sector) AS sector,
        b.mes_inicio,
        COUNT(*) AS dias_laborables_mes,
        COUNT(*) FILTER (WHERE b.es_novedad_injustificada) AS novedades_injustificadas,
        COUNT(b.horas) AS dias_con_fichada,
        SUM(b.horas) AS total_mes
    FROM base b
    GROUP BY b.idper, b.mes_inicio
),
resumen_presentismo AS (
    SELECT
        m.idper,
        m.sector,
        m.mes_inicio,
        m.dias_laborables_mes,
        m.novedades_injustificadas,
        coalesce(m.total_mes, interval '0') AS total_mes,
        CASE WHEN m.dias_con_fichada > 0
            THEN coalesce(m.total_mes, interval '0') / m.dias_con_fichada
        END AS promedio_diario,
        r.umbral_horas_personales * m.dias_laborables_mes::numeric * interval '1 hour' - coalesce(m.total_mes, interval '0') AS diferencia_horas_mes,
        r.umbral_horas_mensuales * interval '1 hour' AS horas_maximas_adeudadas_mes
    FROM resumen_mensual m
        JOIN reglas r ON r.annio = extract(year from m.mes_inicio)::integer
)
SELECT
    p.idper,
    p.sector,
    p.mes_inicio,
    p.dias_laborables_mes,
    ${sqlExprHoras('p.total_mes')} AS total_mes,
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
            { name: "dias_laborables_mes", typeName: "integer", title: "dias habiles" },
            { name: "total_mes", typeName: "text", title: "cantidad de horas" },
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
