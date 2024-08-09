"use strict";

import { ProcedureDef, ProcedureContext } from './types-principal';

export const ProceduresPrincipal:ProcedureDef[] = [
    {
        action: 'option_lists',
        parameters: [
            {name:'table', typeName:'text'}
        ],
        coreFunction: async function(context: ProcedureContext, params:{table:string}){
            const {client} = context;
            if (params.table != 'novedades_registradas') throw new Error('tabla invalida');
            return {
                relations: {
                    cuil    : (await client.query('select cuil from personal order by cuil', []).fetchAll()).rows.map(row => row.cuil),
                    cod_nov : (await client.query('select cod_nov from cod_novedades order by cod_nov', []).fetchAll()).rows.map(row => row.cod_nov),
                }
            };
        }
    },
];
