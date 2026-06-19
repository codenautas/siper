"use strict";

import { TableDefinition, TableContext } from "./types-principal";

import { idper } from "./table-personas";
import { sector } from "./table-sectores";

import { sqlParteDiario } from "./table-parte_diario";

import { annio } from "./table-annios"

export function presentismo(_context: TableContext): TableDefinition {
    return {
        name: "presentismo",
        title: "control mensual de presentismo",
        editable: false,
        fields: [
            annio,
            { name: "mes"                   , typeName: "integer" },
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
            from: `(${sqlParteDiario})`,
        },
        sortColumns: [
            { column: "mes_inicio", order: -1 },
            { column: "pierde_presentismo", order: -1 }
        ],
    };
}
