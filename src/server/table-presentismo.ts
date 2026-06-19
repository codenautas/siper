"use strict";

import { TableDefinition, TableContext } from "./types-principal";

import { idper } from "./table-personas";
import { sector } from "./table-sectores";

import { sqlParteDiarioAgrupado } from "./table-parte_diario";

// import { annio } from "./table-annios"

export function presentismo(_context: TableContext): TableDefinition {
    return {
        name: "presentismo",
        title: "control mensual de presentismo",
        editable: false,
        fields: [
            /*
            annio,
            { name: "mes"                   , typeName: "integer" },
             */
            idper,
            sector,
            { name: "dias_promediados"          , typeName: "integer"   , title: "días considerados", description: "días que se consideran para el cálculo del promedio de horas" },
            { name: "suma_horas"                , typeName: "interval"  , description: "suma de horas de los días considerados para el cálculo de promedio"},
            { name: "horas_esperadas"           , typeName: "interval"  , description: "cantidad de horas que correspondía trabajar en los días considerados" },
            { name: "promedio_horas"            , typeName: "interval"  , description: "promedio de horas trabajados por día (en los días considerados)"},
            { name: "promedio_esperado"         , typeName: "interval"  , description: "promedio de horas que correspondía trabajar en los días considerados" },
            { name: "saldo_horas"               , typeName: "interval"  , description: "saldo entre las horas sumadas y las esperadas" },
            { name: "dias_injustificados"       , typeName: "integer"   },
            { name: "tiene_injustificados"      , typeName: "boolean"   },
            { name: "bajo_umbral_horas"         , typeName: "boolean"   },
            { name: "con_problemas"             , typeName: "boolean"   },
            { name: "tiene_interes"             , typeName: "boolean"   },
        ],
        primaryKey: [idper.name],
        softForeignKeys: [
            { references: "personas", fields: [idper.name], displayFields: ["apellido", "nombres"] },
            { references: "sectores", fields: [sector.name] },
        ],
        sql: {
            isTable: false,
            from: `(SELECT idper, sector, ${sqlParteDiarioAgrupado} GROUP BY idper, sector)`,
        },
        // @ts-expect-error esperando nueva versión de bp
        functionDef: {
            parameters: [
                {name: 'inicio_mes', typeName: 'date'}
            ]
        },
        sortColumns: [
            { column: "idper" },
        ],
        hiddenColumns: ["tiene_interes"]
    };
}
