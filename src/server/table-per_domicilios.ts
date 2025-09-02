"use strict";
/*
--domicilios
create table exportar.per_domicilios(
  idper nvarchar(max),
  tipo_domicilio varchar(4),
  provincia nvarchar(max),
  localidad nvarchar(max),
  barrio nvarchar(max),
  codigo_postal nvarchar(max),
  calle nvarchar(max),
  nombre_calle nvarchar(max),
  --en_callejero integer,
  altura nvarchar(max), 
  piso nvarchar(max), 
  depto nvarchar(max),
  escalera nvarchar(max), 
  torre nvarchar(max), 
  Nudo nvarchar(max), 
  ala nvarchar(max),
  confirmado integer,
  Fecha_Confirmado date,
  observaciones nvarchar(max)
  --primary key ("tipo_domicilio","tdoc_codigo","pers_numero")
);
*/

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {tipo_domicilio} from "./table-tipos_domicilio";
import {provincia} from "./table-provincias";
import {localidad} from "./table-localidades";
import {barrio} from "./table-barrios";
import {calle} from "./table-calles";

export const nro_item: FieldDefinition = {name: 'nro_item', typeName: 'bigint', description: 'identificador del domicilio para una persona'}

export function per_domicilios(context: TableContext): TableDefinition{
    var admin = context.es.rrhh;
    return {
        name: 'per_domicilios',
        title: 'Domicilios',
        editable: admin,
        fields: [
            {...idper, editable:admin},
            //gestik
            {name:'nro_item'        , typeName:'bigint', /*siempre:true ,*/ nullable:true, editable:false},
            //{...domicilio, sequence:{name:'domicilio_seq', firstValue:1}, nullable:true, editable:false },
            tipo_domicilio,
            provincia,
            localidad,
            barrio,
            {name: 'codigo_postal'    ,typeName:'text'   },
            calle,
            {name: 'nombre_calle'     ,typeName:'text'   },
            {name: 'altura'           ,typeName:'text'   },
            {name: 'piso'             ,typeName:'text'   },
            {name: 'depto'            ,typeName:'text'   },
            {name: 'escalera'         ,typeName:'text'   },
            {name: 'torre'            ,typeName:'text'   },
            {name: 'nudo'             ,typeName:'text'   },
            {name: 'ala'              ,typeName:'text'   },
            {name: 'confirmado'       ,typeName:'integer'},
            {name: 'fecha_confirmado' ,typeName:'date'   },
            {name: 'observaciones'    ,typeName:'text'   },
            {name: 'orden'            ,typeName:'integer', inTable:false, serverSide:true, editable:false },
        ],
        primaryKey: [idper.name, 'nro_item'],
        foreignKeys: [
            {references: 'personas'   , fields: [idper.name]},
            {references: 'provincias' , fields: [provincia.name]},
            {references: 'localidades', fields: [provincia.name, localidad.name]},
            {references: 'barrios'    , fields: [provincia.name, barrio.name]},
            {references: 'calles'     , fields: [provincia.name, calle.name]},
            {references: 'tipos_domicilio', fields: [tipo_domicilio.name]},
        ],
        constraints: [
        ],
        sql:{
            fields: {
                orden:{ expr:`(SELECT orden 
                                 FROM tipos_domicilio t 
                                 WHERE per_domicilios.tipo_domicilio = t.tipo_domicilio
                )`}
           },
        }
    }
}
