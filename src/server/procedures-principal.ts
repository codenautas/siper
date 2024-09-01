"use strict";

import {strict as likeAr, createIndex} from 'like-ar';
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
            var defs = {
                personal      : {key:'cuil'   , sql:'select * from personal'},
                cod_novedades : {key:'cod_nov', sql:'select * from cod_novedades'},
            };
            var data = await likeAr(defs)
                .map(def => client.query(`${def.sql} order by ${def.key}`).fetchAll())
                .map(async p => (await p).rows)
                .awaitAll();
            return {
                relations: {
                    cuil    : data.personal.map(row => row.cuil),
                    cod_nov : data.cod_novedades.map(row => row.cod_nov),
                },
                tables: likeAr(data).map((rows, table) => createIndex(rows, defs[table].key)).plain()
            };
        }
    },
];
