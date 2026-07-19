"use strict";

import {TableDefinition, TableContext} from "./types-principal";
import {calle} from "./table-calles";
import {provincia} from "./table-provincias";
import {comuna_partido} from "./table-comunas_partidos";
import {barrio_localidad} from "./table-barrios_localidades";

export function geo_domicilios(context: TableContext): TableDefinition {
    var esGeo = context.es.admin;
    return {
        name: 'geo_domicilios',
        title: 'Geolocalización de domicilios',
        tableName: 'geo_domicilios',
        editable: esGeo,
        fields: [
            {name: 'idgeo'          , typeName: 'bigint' , editable: false},
            {...provincia           ,                      editable: false},
            {...comuna_partido      ,                      editable: false},
            {...barrio_localidad    ,                      editable: false},
            {...calle               ,                      editable: false },
            {name: 'nombre_calle'   , typeName: 'text'   , editable: false},
            {name: 'altura'         , typeName: 'text'   , editable: false},
            // {name: 'punto'          , typeName: 'point'  , editable: esGeo },
            {name: 'coordenada_x'   , typeName: 'decimal', editable: esGeo },
            {name: 'coordenada_y'   , typeName: 'decimal', editable: esGeo },
            {name: 'altura'         , typeName: 'text'   , editable: false},
            {name: 'obs_geo'        , typeName: 'text'   , editable: esGeo },
            {name: 'fecha_codificacion', typeName: 'date', editable: false, title: 'fecha geo'},
        ],
        primaryKey: ['idgeo'],
        sql: {
            isTable: false,
            from: 'geo_domicilios',
            where: 'idgeo IS NOT NULL',
        }
    }
}
