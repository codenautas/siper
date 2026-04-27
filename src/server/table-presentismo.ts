"use strict";

import { TableDefinition, TableContext } from "./types-principal";

import { idper, sqlPersonas } from "./table-personas";
import { sector } from "./table-sectores";
import { sqlExprHoras } from "./table-parte_diario";

export const sqlCumplimientoHorasMensual = `
WITH base AS (
    SELECT
        n.idper,
        p.sector,
        date_trunc('month', n.fecha)::date AS mes_inicio,        
        n.cod_nov,
        coalesce(cn.pierde_presentismo, false) AS es_ausente_injustificado,
        NOT (
            n.fichadas IS NULL
            OR isempty(n.fichadas)
            OR lower_inf(n.fichadas)
            OR upper_inf(n.fichadas)
        ) AS dia_computable,
        CASE
            WHEN n.fichadas IS NULL
              OR isempty(n.fichadas)
              OR lower_inf(n.fichadas)
              OR upper_inf(n.fichadas)
            THEN interval '0'
            ELSE upper(n.fichadas) - lower(n.fichadas)
        END AS duracion
    FROM novedades_vigentes n
        JOIN (${sqlPersonas}) p ON p.idper = n.idper
        JOIN fechas f ON f.fecha = n.fecha
        LEFT JOIN cod_novedades cn ON cn.cod_nov = n.cod_nov
    WHERE f.laborable IS DISTINCT FROM false
      AND f.dds NOT IN (0, 6)
      AND n.trabajable IS TRUE
),
resumen_mensual AS (
    SELECT
        b.idper,
        min(b.sector) AS sector,
        b.mes_inicio,
        COUNT(*) AS dias_laborables_mes,
        COUNT(*) FILTER (WHERE b.es_ausente_injustificado) AS ausentes_injustificados,
        COUNT(*) FILTER (WHERE b.dia_computable) AS dias_con_fichada,
        SUM(b.duracion) FILTER (WHERE b.dia_computable) AS total_mes
    FROM base b
    GROUP BY b.idper, b.mes_inicio
),
resumen_presentismo AS (
    SELECT
        m.idper,
        m.sector,
        m.mes_inicio,
        m.ausentes_injustificados,
        coalesce(m.total_mes, interval '0') AS total_mes,
        CASE WHEN m.dias_con_fichada > 0
            THEN coalesce(m.total_mes, interval '0') / m.dias_con_fichada
        END AS promedio_diario,
        r.umbral_horas_personales * m.dias_laborables_mes::numeric * interval '1 hour' AS horas_objetivo_mes,
        greatest(
            r.umbral_horas_personales * m.dias_laborables_mes::numeric * interval '1 hour' - coalesce(m.total_mes, interval '0'),
            interval '0'
        ) AS horas_adeudadas_mes,
        r.umbral_horas_mensuales * interval '1 hour' AS horas_maximas_adeudadas_mes
    FROM resumen_mensual m
        JOIN reglas r ON r.annio = extract(year from m.mes_inicio)::integer
)
SELECT
    p.idper,
    p.sector,
    p.mes_inicio,
    p.ausentes_injustificados,
    ${sqlExprHoras('p.total_mes')} AS total_mes,
    CASE WHEN p.promedio_diario IS NOT NULL THEN ${sqlExprHoras('p.promedio_diario')} END AS promedio_diario,
    ${sqlExprHoras('p.horas_objetivo_mes')} AS horas_objetivo_mes,
    ${sqlExprHoras('p.horas_adeudadas_mes')} AS horas_adeudadas_mes,
    ${sqlExprHoras('p.horas_maximas_adeudadas_mes')} AS horas_maximas_adeudadas_mes,
    p.ausentes_injustificados >= 1 AS pierde_por_ausente_injustificado,
    p.horas_adeudadas_mes > p.horas_maximas_adeudadas_mes AS pierde_por_horas,
    (
        p.ausentes_injustificados >= 1
        OR p.horas_adeudadas_mes > p.horas_maximas_adeudadas_mes
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
            { name: "ausentes_injustificados", typeName: "integer", title: "aus. injust." },
            { name: "total_mes", typeName: "text", title: "total mes" },
            { name: "promedio_diario", typeName: "text", title: "promedio diario" },
            { name: "horas_objetivo_mes", typeName: "text", title: "objetivo mes" },
            { name: "horas_adeudadas_mes", typeName: "text", title: "adeuda mes" },
            { name: "horas_maximas_adeudadas_mes", typeName: "text", title: "tolerancia mes" },
            { name: "pierde_por_ausente_injustificado", typeName: "boolean", title: "pierde por AI" },
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
