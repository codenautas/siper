"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

export const sector: FieldDefinition = {name: 'sector', typeName: 'text', title:'sector'}

export function sectores(context: TableContext): TableDefinition {
    var editable = context.es.rrhh
    return {
        name: 'sectores',
        elementName: 'sector',
        editable,
        fields: [
            sector,
            {name: 'nombre_sector', typeName: 'text', isName:true, title:'sector departamento área'},
            {name: 'tipo_ofi'     , typeName: 'text', nullable:false },
            {name: 'pertenece_a'  , typeName: sector.typeName},
            {name: 'cod_2024'     , typeName: 'text'   },
            {name: 'personas'     , typeName: 'integer', editable: false},
        ],
        primaryKey: [sector.name],
        foreignKeys: [
            {references: 'sectores', fields:[{source:'pertenece_a', target:'sector'}], alias: 'pertenece_a'}
        ], 
        detailTables: [
            {table:'personas', fields:[sector.name], abr:'P'},
            {table:'sectores', fields:[{source:'sector', target:'pertenece_a'}], abr:'S'}
        ],
        sql: {
            isTable: true,
            ...(context.es.rrhh ? {from:`(
                select s.*, count(*) as personas
                    from sectores s left join personas using (${sector.name})
            )`} : {}),
        }
    };
}
