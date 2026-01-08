"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloMayusculas, sinMinusculasNiAcentos} from "./types-principal";

export const s_revista: FieldDefinition = {
    name: 'situacion_revista', 
    typeName: 'text', 
    title: 'situación de revista', 
    postInput: sinMinusculasNiAcentos
};

export function situacion_revista(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name:'situacion_revista',
        elementName: 'situación de revista',
        title:'situación de revista',
        editable:admin,
        fields:[
            s_revista,
            {name: 'con_novedad', typeName: 'boolean', description: 'si permite registrar una novedad' }, /* NO SE USA PARA NADA, QUITAR */
            {name: 'cod_2024'   , typeName: 'integer'},
            {name: 'ini_per_nov_cant', typeName: 'boolean', description: 'si inicializa las cantidades de novedades a princpio de año'}
        ],
        primaryKey:[s_revista.name],
        constraints:[
            soloMayusculas(s_revista.name),
        ],
        detailTables:[
            {table:'personas'       , fields:[s_revista.name], abr:'P'},
            {table:'trayectoria_laboral' , fields:[s_revista.name], abr:'H'},
        ],
        hiddenColumns: [
            'con_novedad' /* NO SE USA PARA NADA, QUITAR DE LA LISTA DE CAMPOS */
        ]
    };
}
