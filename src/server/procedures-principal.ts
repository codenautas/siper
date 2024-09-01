"use strict";

import {strict as likeAr, createIndex} from 'like-ar';
import { ProcedureDef, ProcedureContext } from './types-principal';
import { NovedadRegistrada } from '../common/contracts';

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
    {
        action: 'si_cargara_novedad',
        parameters: [
            {name:'cuil'      , typeName:'text'   },
            {name:'cod_nov'   , typeName:'text'   },
            {name:'desde'     , typeName:'date'   },
            {name:'hasta'     , typeName:'date'   },
            {name:'dds1'      , typeName:'boolean'},
            {name:'dds2'      , typeName:'boolean'},
            {name:'dds3'      , typeName:'boolean'},
            {name:'dds4'      , typeName:'boolean'},
            {name:'dds5'      , typeName:'boolean'},
        ],
        coreFunction: async function(context: ProcedureContext, params:Partial<NovedadRegistrada>){
            const {desde, hasta, cod_nov, cuil, ...resto} = params;
            console.log("***********", params)
            const info = await context.client.query(
                `select count(*) as dias_corridos,
                        count(*) filter (
                            where extract(dow from f.fecha) between 1 and 5
                                and laborable is not false
                                and (c_dds is not true or cast(($5::jsonb) -> ('dds' || extract(dow from f.fecha)) as boolean))
                        ) as dias_habiles,
                        count(*) filter (where v.fecha is not null) as dias_coincidentes
                    from fechas f
                        left join novedades_vigentes v on v.fecha = f.fecha and v.cuil = $4
                        left join (select * from cod_novedades where cod_nov = $3) c on true
                    where f.fecha between $1 and $2`, 
                [desde, hasta, cod_nov, cuil, JSON.stringify(resto)]
            ).fetchUniqueRow();
            console.log("xxxxxxxxxx", info)
            return info.row
        }
    }
];
