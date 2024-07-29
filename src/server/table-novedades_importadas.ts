"use strict";

import {TableDefinition, TableContext} from "./types-principal";

export function novedades_importadas(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'novedades_importadas',
        editable:admin,
        fields:[
            {name: 'ficha'    , typeName: 'text', nullable:false, allowEmptyText:true, title:'Ficha'                    , },
            {name: 'cuil'     , typeName: 'text', nullable:false, allowEmptyText:true, title:'Cuil'                     , },
            {name: 'idmeta4'  , typeName: 'text', nullable:false, allowEmptyText:true, title:'id meta4'                 , },
            {name: 'fecha'    , typeName: 'date', nullable:false, allowEmptyText:true, title:'Fecha'                    , },
            {name: 'nomyape'  , typeName: 'text', nullable:false, allowEmptyText:true, title:'Nombre y Apellido'        , },
            {name: 'sector'   , typeName: 'text', nullable:false, allowEmptyText:true, title:'Sector'                   , },
            {name: 'novedad'  , typeName: 'text', nullable:false, allowEmptyText:true, title:'Novedad'                  , },
            {name: 'ent_fich' , typeName: 'text', nullable:false, allowEmptyText:true, title:'Entrada - Fichada'        , },
            {name: 'sal_fich' , typeName: 'text', nullable:false, allowEmptyText:true, title:'Salida - Fichada'         , },
            {name: 'ent_hor'  , typeName: 'text', nullable:false, allowEmptyText:true, title:'Entrada - Horario Asig.'  , },
            {name: 'sal_hor'  , typeName: 'text', nullable:false, allowEmptyText:true, title:'Salida - Horario Asig.'   , },
        ],
        primaryKey:['cuil', 'fecha', 'novedad', 'sector', 'ent_fich', 'sal_fich', 'ent_hor', 'sal_hor']
    };
}
