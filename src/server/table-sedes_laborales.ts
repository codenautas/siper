"use strict";

import {TableDefinition, TableContext, FieldDefinition, soloCodigo} from "./types-principal";

export const id_punto:FieldDefinition = {
    name: 'id_punto', 
    typeName: 'text', 
}

export const cod_sede:FieldDefinition = {
    name: 'cod_sede', 
    typeName: 'text',
    title: 'cod_sede',
    isName: false
}

export function sedes_laborales(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'sedes_laborales',
        elementName: 'sede_laboral',
        editable: admin,
        fields: [
            id_punto,
            cod_sede,
            {name: 'punto_alternativo',typeName:'boolean'},
            {name: 'descripcion'      ,typeName:'text'   , isName:true},
            {name: 'para_presencial'  ,typeName:'boolean'},
            {name: 'punto'            ,typeName:'point'  },
        ],
        primaryKey: [cod_sede.name],
        constraints: [
            {constraintType:'unique', fields:[cod_sede.name]},
            soloCodigo(id_punto.name)
        ],
        detailTables: [
        ],
        sql:{
                isTable:false,
                from:`(select sd.id_punto, sd.cod_sede, sd.descripcion, sd.punto_alternativo, sd.para_presencial, sd.punto
                from sedes sd 
                    where sd.cod_sede is not null)
            `
        }
    }
};
