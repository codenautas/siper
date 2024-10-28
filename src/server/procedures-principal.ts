"use strict";

import {strict as likeAr, createIndex} from 'like-ar';
import { ProcedureDef, ProcedureContext } from './types-principal';
import { NovedadRegistrada, calendario_persona, historico_persona } from '../common/contracts';

import { date } from 'best-globals'
import { DefinedType } from 'guarantee-type';

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
                personas      : {key:'idper'   , sql:'select * from personas'},
                cod_novedades : {key:'cod_nov', sql:'select * from cod_novedades'},
            };
            var data = await likeAr(defs)
                .map(def => client.query(`${def.sql} order by ${def.key}`).fetchAll())
                .map(async p => (await p).rows)
                .awaitAll();
            return {
                relations: {
                    idper    : data.personas.map(row => row.idper),
                    cod_nov : data.cod_novedades.map(row => row.cod_nov),
                },
                tables: likeAr(data).map((rows, table) => createIndex(rows, defs[table].key)).plain()
            };
        }
    },
    {
        action: 'si_cargara_novedad',
        parameters: [
            {name:'idper'      , typeName:'text'   },
            {name:'cod_nov'   , typeName:'text'   },
            {name:'desde'     , typeName:'date'   },
            {name:'hasta'     , typeName:'date'   },
            {name:'dds0'      , typeName:'boolean'},
            {name:'dds1'      , typeName:'boolean'},
            {name:'dds2'      , typeName:'boolean'},
            {name:'dds3'      , typeName:'boolean'},
            {name:'dds4'      , typeName:'boolean'},
            {name:'dds5'      , typeName:'boolean'},
            {name:'dds6'      , typeName:'boolean'},
        ],
        coreFunction: async function(context: ProcedureContext, params:Partial<NovedadRegistrada>){
            const {desde, hasta, cod_nov, idper, ...resto} = params;
            const info = await context.client.query(
                `select count(*) as dias_corridos,
                        count(*) filter (
                            where extract(dow from f.fecha) between 1 and 5
                                and laborable is not false
                                and (c_dds is not true or cast(($5::jsonb) -> ('dds' || extract(dow from f.fecha)) as boolean))
                        ) as dias_habiles,
                        count(*) filter (where v.fecha is not null) as dias_coincidentes
                    from fechas f
                        left join novedades_vigentes v on v.fecha = f.fecha and v.idper = $4
                        left join (select * from cod_novedades where cod_nov = $3) c on true
                    where f.fecha between $1 and $2`, 
                [desde, hasta, cod_nov, idper, JSON.stringify(resto)]
            ).fetchUniqueRow();
            return info.row
        }
    },
    {
        action: 'calendario_persona',
        parameters: [
            {name:'idper'      , typeName:'text'   },
            {name:'annio'     , typeName:'integer'},
            {name:'mes'       , typeName:'integer'},
        ],
        coreFunction: async function(context: ProcedureContext, params:DefinedType<typeof calendario_persona.parameters>){
            const {idper, annio, mes} = params;
            const desde = date.ymd(annio, mes as 1|2|3|4|5|6|7|8|9|10|11|12, 1);
            const info = await context.client.query(
                `select extract(day from f.fecha) as dia,
                        extract(dow from f.fecha) as dds,
                        extract(day from f.fecha) - extract(dow from f.fecha) as semana,
                        cod_nov,
                        case extract(dow from f.fecha) when 0 then 'no-laborable' when 6 then 'no-laborable' else 
                            case when laborable is false then 'no-laborable' when cod_nov is not null then 'no-trabaja' else 'normal' end end as tipo_dia
                    from fechas f
                        left join novedades_vigentes v on v.fecha = f.fecha and v.idper = $1
                    where f.fecha between $2 and ($3::date + interval '1 month'  - interval '1 day')
                    order by f.fecha`,
                [idper, desde, desde]
            ).fetchAll();
            return info.rows
        }
    },
    {
        action: 'historico_persona',
        parameters: [
            {name:'idper'      , typeName:'text'   },
            {name:'annio'     , typeName:'integer'},
            {name:'mes'       , typeName:'integer'},
        ],
        coreFunction: async function(context: ProcedureContext, params:DefinedType<typeof historico_persona.parameters>){
            const {idper, annio, mes} = params;
            const desde = date.ymd(annio, mes as 1|2|3|4|5|6|7|8|9|10|11|12, 1);
            const info = await context.client.query(
                `select fecha,
                        v.cod_nov,
                        novedad    
                    from novedades_vigentes v
                        left join cod_novedades n on v.cod_nov = n.cod_nov
                    where v.fecha between $2 and ($2 + interval '1 month' - interval '1 day') and v.idper = $1
                    order by v.fecha`,
                [idper, desde]
            ).fetchAll();
            return info.rows
        }
    },
    {
        action: 'novedades_pendientes',
        parameters: [
            {name:'idper'      , typeName:'text'   }
        ],
        coreFunction: async function(context: ProcedureContext, params:Partial<NovedadRegistrada>){
            const {idper} = params;
            const info = await context.client.query(
                `select idper,
                        desde,
                        hasta,
                        cod_nov
                    from novedades_registradas
                    where idper = $1
                    order by desde`,
                [idper]
            ).fetchAll();
            return info.rows
        }
    },
    {
        action: 'info_usuario',
        parameters: [
        ],
        coreFunction: async function(context: ProcedureContext, _params:any){
            const info = await context.client.query(
                `select idper, sector, current_date as fecha
                    from usuarios left join personas using (idper)
                    where usuario = $1`,
                [context.username]
            ).fetchUniqueRow();
            return info.row;
        }
    }
];
