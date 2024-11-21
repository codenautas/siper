"use strict";

import {TableDefinition, TableContext, idImportacion} from "./types-principal";

export function novedades_importadas(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'novedades_importadas',
        editable:admin,
        fields:[
            idImportacion,
            {name: 'ficha'    , typeName: 'text', nullable:false, defaultDbValue:"''", allowEmptyText:true, title:'Ficha'                    , },
            {name: 'cuil'     , typeName: 'text', nullable:false, defaultDbValue:"''", allowEmptyText:true, title:'Cuil'                     , },
            {name: 'idmeta4'  , typeName: 'text', nullable:false, defaultDbValue:"''", allowEmptyText:true, title:'id meta4'                 , },
            {name: 'fecha'    , typeName: 'date',                                                           title:'Fecha'                    , },
            {name: 'nomyape'  , typeName: 'text', nullable:false, defaultDbValue:"''", allowEmptyText:true, title:'Nombre y Apellido'        , },
            {name: 'sector'   , typeName: 'text', nullable:false, defaultDbValue:"''", allowEmptyText:true, title:'Sector'                   , },
            {name:'presentismo',typeName: 'text', nullable:false, defaultDbValue:"''", allowEmptyText:true, title:'Presentismo'              , },
            {name: 'novedad'  , typeName: 'text', nullable:false, defaultDbValue:"''", allowEmptyText:true, title:'Novedad'                  , },
            {name: 'ent_fich' , typeName: 'text', nullable:false, defaultDbValue:"''", allowEmptyText:true, title:'Entrada - Fichada'        , },
            {name: 'sal_fich' , typeName: 'text', nullable:false, defaultDbValue:"''", allowEmptyText:true, title:'Salida - Fichada'         , },
            {name: 'ent_hor'  , typeName: 'text', nullable:false, defaultDbValue:"''", allowEmptyText:true, title:'Entrada - Horario Asig.'  , },
            {name: 'sal_hor'  , typeName: 'text', nullable:false, defaultDbValue:"''", allowEmptyText:true, title:'Salida - Horario Asig.'   , },
        ],
        primaryKey: [idImportacion.name],
    };
}
