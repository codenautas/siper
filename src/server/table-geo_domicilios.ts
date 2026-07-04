"use strict";

import {TableDefinition, TableContext} from "./types-principal";
import {calle} from "./table-calles";
import {provincia} from "./table-provincias";
import {comuna_partido} from "./table-comunas_partidos";
import {barrio_localidad} from "./table-barrios_localidades";

export function geo_domicilios(context: TableContext): TableDefinition {
    var admin = context.es.admin;
    return {
        name: 'geo_domicilios',
        title: 'Geolocalización de domicilios',
        tableName: 'per_domicilios',
        editable: admin,
        fields: [
            {name: 'idgeo'          , typeName: 'bigint' , editable: false},
            {...provincia           ,                      editable: false},
            {...comuna_partido      ,                      editable: false},
            {...barrio_localidad    ,                      editable: false},
            {name: 'nombre_calle'   , typeName: 'text'   , editable: admin},
            {name: 'altura'         , typeName: 'text'   , editable: false},
            {...calle               ,                      editable: admin },
            {name: 'coordenada_x'   , typeName: 'decimal', dataLength:11, dataDecimals:7, editable: admin },
            {name: 'coordenada_y'   , typeName: 'decimal', dataLength:11, dataDecimals:7, editable: admin },
            {name: 'coordenada_x'   , typeName: 'text'   , editable: admin },
            {name: 'coordenada_y'   , typeName: 'text'   , editable: admin },
            {name: 'obs_geo'        , typeName: 'text'   , editable: admin },
            {name: 'fecha_codificacion', typeName: 'date', editable: false, title: 'fecha geo'},
        ],
        primaryKey: ['idgeo'],
        sql: {
            isTable: false,
            from: 'per_domicilios',
            where: 'idgeo IS NOT NULL',
        }
    }
}
