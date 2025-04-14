"use strict"

import { idper } from "./table-personas";
import { TableDefinition, TableContext } from "./types-principal";

export function adjuntos_persona(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin' || context.user.rol==='rrhh';
    return {
        name: 'adjuntos_persona',
        elementName: 'adjunto_persona',
        title: 'adjuntos',
        editable: admin,
        fields: [
            idper,
            {name:'numero_adjunto', typeName:'bigint', title:'n°',sequence:{ firstValue:1, name:'numero_adjunto_seq' }, nullable:true, editable:false     },
            {name:'tipo_adjunto_persona', title: 'tipo adjunto', typeName:'text'                                                                          },
            {name:'detalle', typeName:'text'                                                                                                              },
            {name:'timestamp', typeName:'timestamp', defaultDbValue:'current_timestamp', editable:false, inTable:true, clientSide:'timestamp', title:'📅'},
            {name:'subir', editable:false, clientSide:'subirAdjunto', typeName:'text'                                                                     },
            {name:'archivo_nombre', title:'archivo', editable:false , typeName:'text'                                                                     },
            {name:'archivo_nombre_extendido', editable:false , typeName:'text'                                                                            },
            {name:'bajar', editable:false, clientSide:'bajarAdjunto', typeName:'text'                                                                     },
        ],
        primaryKey: [idper.name, 'numero_adjunto'],
        foreignKeys: [
            {references:'tipos_adjunto_persona', fields:['tipo_adjunto_persona'], displayFields:['adjunto']},
        ],
        constraints:[
        ],
        hiddenColumns: ['archivo_nombre_extendido'],
    }
}