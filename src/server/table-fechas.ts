"use strict";

import {Constraint, FieldDefinition, TableDefinition, TableContext} from "./types-principal";

import {año} from "./table-annios"
import {cod_nov} from "./table-cod_novedades";


export const fecha: FieldDefinition = {name: 'fecha', typeName: 'date'};
export const añoEnBaseAFecha = {...año, editable:false, generatedAs:`extract(year from ${fecha.name})`}

export const constraintsFechasDesdeHasta = (opts:{desde?:'desde'|'fecha'}={}): Constraint[] => {
    const desde = opts?.desde || 'desde';
    return [
        {constraintType:'check', consName:`${desde} y hasta deben ser del mismo annio`, expr:`extract(year from ${desde}) = extract(year from hasta)`},
        {constraintType:'check', consName:`${desde} tiene que ser anterior a hasta`, expr:`${desde} <= hasta`},
    ]
}

export function fechas(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'fechas',
        elementName: 'fecha',
        editable: admin,
        fields: [
            fecha,
            {name: 'laborable' , typeName: 'boolean', isName:true},
            {name: 'dia'       , typeName: 'text'   , title:'día', inTable:false, serverSide:true, editable:false},
            {name: 'leyenda'   , typeName: 'text'   , description: 'lo que se verá en el calendario cuando haya suficiente espacio'},
            {name: 'abr'       , typeName: 'text'   , description: 'lo que se verá en el calendario cuando haya poco espacio'},
            {name: 'repite'    , typeName: 'boolean', description: 'si es un feriado todos los años (poner no a feriados turísticos y a asuetos puntuales'},
            {name: 'inamovible', typeName: 'boolean', description: 'si es un feriado que no se mueve, que se festeja siempre en la misma fecha'},
            {name: 'dds'       , typeName: 'integer', generatedAs: 'extract(dow from fecha)' /*, inTable:false, serverSide:true, editable:false*/},
            {...cod_nov, name: 'cod_nov_pred_fecha', editable:false, title:'cod nov'},
            añoEnBaseAFecha,
        ],
        primaryKey: [fecha.name],
        foreignKeys: [
            {references: 'annios'  , fields: [año.name], onUpdate: 'no action'},
            {references: 'cod_novedades', fields: [{source: 'cod_nov_pred_fecha', target:cod_nov.name}]}
        ],
        constraints: [
            {constraintType:'check', consName:'repite e inamovible solo asuetos y feriados', expr:'laborable is false or repite is null and inamovible is null'},
            {constraintType:'check', consName:'repite e inamovible obligatorio para asuetos y feriados', expr:'laborable is null or repite is not null and inamovible is not null'},
            {constraintType:'check', consName:'laborable no o en blanco', expr:'laborable is not true'},
        ],
        detailTables: [
            {table:'novedades_vigentes'         , fields:[fecha.name], abr:'N'},
            // {table:'novedades_registradas', fields:['fecha'], abr:'R'}
        ],
        sql:{
            fields:{
                dia:{ expr:`case dds when 0 then 'domingo' when 1 then 'lunes' when 2 then 'martes' when 3 then 'miércoles' when 4 then 'jueves'when 5 then 'viernes' when 6 then 'sábado' end`}
            }
        }
    };
}
