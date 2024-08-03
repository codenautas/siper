"use strict";

import {TableDefinition, TableContext} from "./types-principal";

export function fechas(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'fechas',
        elementName:'fecha',
        editable:admin,
        fields:[
            {name: 'fecha'     , typeName: 'date'   ,           },
            {name: 'laborable' , typeName: 'boolean', isName:true},
            {name: 'dds'       , typeName: 'text'   , inTable:false, serverSide:true, editable:false},
            {name: 'leyenda'   , typeName: 'text'   , description: 'lo que se verá en el calendario cuando haya suficiente espacio'},
            {name: 'abr'       , typeName: 'text'   , description: 'lo que se verá en el calendario cuando haya poco espacio'},
            {name: 'repite'    , typeName: 'boolean', description: 'si es un feriado todos los años (poner no a feriados turísticos y a asuetos puntuales'},
            {name: 'inamovible', typeName: 'boolean', description: 'si es un feriado que no se mueve, que se festeja siempre en la misma fecha'},
        ],
        primaryKey:['fecha'],
        constraints:[
            {constraintType:'check', consName:'solo asuetos y feriados', expr:'laborable is false or repite is null and inamovible is null'},
            {constraintType:'check', consName:'obligatorio para asuetos y feriados', expr:'laborable is null or repite is not null and inamovible is not null'},
            {constraintType:'check', consName:'laborable no o en blanco', expr:'laborable is not true'},
        ],
        detailTables:[
            {table:'novedades'         , fields:['fecha'], abr:'N'},
            // {table:'registro_novedades', fields:['fecha'], abr:'R'}
        ],
        sql:{
            fields:{
                dds:{ expr:`case extract(dow from fecha) when 0 then 'domingo' when 1 then 'lunes' when 2 then 'martes' when 3 then 'miércoles' when 4 then 'jueves'when 5 then 'viernes' when 6 then 'sábado' end`}
            }
        }
    };
}
