"use strict";

import { TableDefinition, TableContext } from "./types-principal";

import { idper, sqlPersonas } from "./table-personas";
import { sector } from "./table-sectores";

export const sqlCumplimientoHorasMensual = `
WITH base AS (
    SELECT
        n.idper,
        p.sector,
        date_trunc('month', n.fecha)::date AS mes_inicio,
        n.fecha,
        date_trunc('week', n.fecha)::date AS semana_inicio,
        n.cod_nov,
        n.trabajable,
        n.cod_nov = r.codnov_sin_fichadas AS es_ausente_injustificado,
        n.cod_nov = r.codnov_unica_fichada AS es_abandono_servicio,
        n.cod_nov IS DISTINCT FROM r.codnov_unica_fichada AS dia_computable,
        CASE
            WHEN n.fichadas IS NULL
              OR isempty(n.fichadas)
              OR lower_inf(n.fichadas)
              OR upper_inf(n.fichadas)
              OR n.cod_nov = r.codnov_unica_fichada
            THEN interval '0'
            ELSE upper(n.fichadas) - lower(n.fichadas)
        END AS duracion
    FROM novedades_vigentes n
        JOIN (${sqlPersonas}) p ON p.idper = n.idper
        JOIN fechas f ON f.fecha = n.fecha
        JOIN reglas r ON r.annio = extract(year from n.fecha)::integer
    WHERE f.laborable IS DISTINCT FROM false
      AND f.dds NOT IN (0, 6)
      AND n.trabajable IS TRUE
),
meses AS (
    SELECT DISTINCT mes_inicio
    FROM base
),
dias_lab_semana AS (
    SELECT
        m.mes_inicio,
        date_trunc('week', f.fecha)::date AS semana_inicio,
        COUNT(*) AS total_lab_semana
    FROM meses m
        JOIN fechas f
            ON f.fecha >= date_trunc('week', m.mes_inicio)::date
           AND f.fecha < date_trunc('week', (m.mes_inicio + interval '1 month' - interval '1 day'))::date + 7
    WHERE f.laborable IS DISTINCT FROM false
      AND f.dds NOT IN (0, 6)
    GROUP BY m.mes_inicio, date_trunc('week', f.fecha)::date
),
semanas AS (
    SELECT
        b.idper,
        min(b.sector) AS sector,
        b.mes_inicio,
        b.semana_inicio,
        SUM(b.duracion) AS total_semana,
        COUNT(*) AS dias_en_mes,
        d.total_lab_semana,
        r.umbral_horas_personales * COUNT(*)::numeric * interval '1 hour' AS umbral
    FROM base b
        JOIN dias_lab_semana d USING (mes_inicio, semana_inicio)
        JOIN reglas r ON r.annio = extract(year from b.mes_inicio)::integer
    WHERE b.dia_computable
    GROUP BY b.idper, b.mes_inicio, b.semana_inicio, d.total_lab_semana, r.umbral_horas_personales
),
resumen_semanal AS (
    SELECT
        s.idper,
        s.mes_inicio,
        COUNT(*) AS semanas_evaluadas,
        COUNT(*) FILTER (WHERE total_semana >= umbral) AS semanas_cumplidas,
        BOOL_AND(total_semana >= umbral) AS cumple_semanas,
        STRING_AGG(
            to_char(semana_inicio, 'DD/MM/YYYY')
                || ' (' || dias_en_mes || '/' || total_lab_semana || '): '
                || floor(extract(epoch from total_semana) / 3600)::text
                || ':' ||
                lpad(floor(mod(extract(epoch from total_semana) / 60, 60))::text, 2, '0')
                || ' < '
                || floor(extract(epoch from umbral) / 3600)::text
                || ':' ||
                lpad(floor(mod(extract(epoch from umbral) / 60, 60))::text, 2, '0'),
            ' | '
            ORDER BY semana_inicio
        ) FILTER (WHERE total_semana < umbral) AS detalle_semanas_incumplidas,
        jsonb_agg(
            jsonb_build_object(
                'semana_inicio', semana_inicio,
                'dias_en_mes', dias_en_mes,
                'total_lab_semana', total_lab_semana,
                'total_semana', total_semana,
                'umbral', umbral
            )
            ORDER BY semana_inicio
        ) FILTER (WHERE total_semana < umbral) AS semanas_incumplidas
    FROM semanas s
    GROUP BY s.idper, s.mes_inicio
),
resumen_mensual AS (
    SELECT
        b.idper,
        min(b.sector) AS sector,
        b.mes_inicio,
        COUNT(*) AS dias_laborables_mes,
        COUNT(*) FILTER (WHERE b.dia_computable) AS dias_computables_mes,
        COUNT(*) FILTER (WHERE b.es_ausente_injustificado) AS ausentes_injustificados,
        SUM(b.duracion) FILTER (WHERE b.dia_computable) AS total_mes
    FROM base b
    GROUP BY b.idper, b.mes_inicio
),
resumen_presentismo AS (
    SELECT
        m.idper,
        m.sector,
        m.mes_inicio,
        coalesce(s.semanas_evaluadas, 0) AS semanas_evaluadas,
        coalesce(s.semanas_cumplidas, 0) AS semanas_cumplidas,
        coalesce(s.cumple_semanas, true) AS cumple_semanas,
        m.dias_laborables_mes,
        m.dias_computables_mes,
        m.ausentes_injustificados,
        coalesce(m.total_mes, interval '0') AS total_mes,
        r.umbral_horas_personales * m.dias_laborables_mes::numeric * interval '1 hour' AS horas_objetivo_mes,
        greatest(
            r.umbral_horas_personales * m.dias_laborables_mes::numeric * interval '1 hour' - coalesce(m.total_mes, interval '0'),
            interval '0'
        ) AS horas_adeudadas_mes,
        r.umbral_horas_mensuales * interval '1 hour' AS horas_maximas_adeudadas_mes,
        s.detalle_semanas_incumplidas,
        s.semanas_incumplidas
    FROM resumen_mensual m
        JOIN reglas r ON r.annio = extract(year from m.mes_inicio)::integer
        LEFT JOIN resumen_semanal s USING (idper, mes_inicio)
)
SELECT
    p.idper,
    p.sector,
    p.mes_inicio,
    p.semanas_evaluadas,
    p.semanas_cumplidas,
    p.cumple_semanas,
    p.dias_laborables_mes,
    p.dias_computables_mes,
    p.ausentes_injustificados,
    floor(extract(epoch from p.total_mes) / 3600)::text
        || ':' ||
        lpad(floor(mod(extract(epoch from p.total_mes) / 60, 60))::text, 2, '0') AS total_mes,
    floor(extract(epoch from p.horas_objetivo_mes) / 3600)::text
        || ':' ||
        lpad(floor(mod(extract(epoch from p.horas_objetivo_mes) / 60, 60))::text, 2, '0') AS horas_objetivo_mes,
    floor(extract(epoch from p.horas_adeudadas_mes) / 3600)::text
        || ':' ||
        lpad(floor(mod(extract(epoch from p.horas_adeudadas_mes) / 60, 60))::text, 2, '0') AS horas_adeudadas_mes,
    floor(extract(epoch from p.horas_maximas_adeudadas_mes) / 3600)::text
        || ':' ||
        lpad(floor(mod(extract(epoch from p.horas_maximas_adeudadas_mes) / 60, 60))::text, 2, '0') AS horas_maximas_adeudadas_mes,
    p.ausentes_injustificados >= 1 AS pierde_por_ausente_injustificado,
    p.horas_adeudadas_mes > p.horas_maximas_adeudadas_mes AS pierde_por_horas,
    (
        p.ausentes_injustificados >= 1
        OR p.horas_adeudadas_mes > p.horas_maximas_adeudadas_mes
    ) AS pierde_presentismo,
    nullif(
        concat_ws(
            ' | ',
            CASE WHEN p.ausentes_injustificados >= 1
                THEN 'ausente injustificado en el mes'
            END,
            CASE WHEN p.horas_adeudadas_mes > p.horas_maximas_adeudadas_mes
                THEN 'adeuda mas de lo permitido en el mes'
            END
        ),
        ''
    ) AS motivo_perdida,
    p.detalle_semanas_incumplidas,
    p.semanas_incumplidas
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
            { name: "semanas_evaluadas", typeName: "integer" },
            { name: "semanas_cumplidas", typeName: "integer" },
            { name: "cumple_semanas", typeName: "boolean", title: "cumple semanas" },
            { name: "dias_laborables_mes", typeName: "integer", title: "dias laborables" },
            { name: "dias_computables_mes", typeName: "integer", title: "dias computables" },
            { name: "ausentes_injustificados", typeName: "integer", title: "aus. injust." },
            { name: "total_mes", typeName: "text", title: "total mes" },
            { name: "horas_objetivo_mes", typeName: "text", title: "objetivo mes" },
            { name: "horas_adeudadas_mes", typeName: "text", title: "adeuda mes" },
            { name: "horas_maximas_adeudadas_mes", typeName: "text", title: "tolerancia mes" },
            { name: "pierde_por_ausente_injustificado", typeName: "boolean", title: "pierde por AI" },
            { name: "pierde_por_horas", typeName: "boolean", title: "pierde por horas" },
            { name: "pierde_presentismo", typeName: "boolean", title: "pierde presentismo" },
            { name: "motivo_perdida", typeName: "text", title: "motivo perdida" },
            { name: "detalle_semanas_incumplidas", typeName: "text", title: "semanas < 35h" },
            { name: "semanas_incumplidas", typeName: "jsonb", inTable: false },
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
        hiddenColumns: ["semanas_incumplidas"],
        sortColumns: [
            { column: "mes_inicio", order: -1 },
            { column: "pierde_presentismo", order: -1 }
        ],
    };
}
