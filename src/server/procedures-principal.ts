"use strict";

import {strict as likeAr, createIndex} from 'like-ar';
import { ProcedureDef, ProcedureContext } from './types-principal';
import { NovedadRegistrada, calendario_persona, historico_persona, novedades_disponibles } from '../common/contracts';
import { sqlNovPer } from "./table-nov_per";

import { date, datetime } from 'best-globals'
import { DefinedType } from 'guarantee-type';
import { FixedFields } from 'frontend-plus';

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
            {name:'idper'     , typeName:'text'   },
            {name:'cod_nov'   , typeName:'text'   , defaultValue:null},
            {name:'desde'     , typeName:'date'   },
            {name:'hasta'     , typeName:'date'   },
            {name:'cancela'   , typeName:'boolean', defaultValue:null},
        ],
        coreFunction: async function(context: ProcedureContext, params:Partial<NovedadRegistrada>){
            const {desde, hasta, cod_nov, idper, cancela} = params;
            if (cancela == null && cod_nov == null) {
                throw Error("debe especificar cod_nov or cancela");
            }
            const info = await context.client.query(
                `select concat_ws(' ',
                            '¿confirmar el registro de',
                            case when corridos then dias_corridos else dias_habiles end,
                            case when corridos then 'días corridos' else 'días hábiles' end,
                            'novedad', cn.cod_nov, 
                            'a', p.apellido||',', p.nombres, 
                            '(persona', p.idper,
                            ')?'
                        ) as mensaje,
                        dias_corridos, dias_habiles, dias_coincidentes,
                        con_detalles,
                        cn.c_dds
                    from personas p
                        left join cod_novedades cn on cn.cod_nov = $3,
                        lateral (
                            select count(*) as dias_corridos,
                                    count(*) filter (
                                        where extract(dow from f.fecha) between 1 and 5
                                            and laborable is not false
                                    ) as dias_habiles,
                                    count(*) filter (where cod_nov is not null) as dias_coincidentes
                                from fechas f
                                    left join novedades_vigentes v on v.fecha = f.fecha and v.idper = p.idper -- es correcto no juntar con cn.cod_nov
                                where f.fecha between $1 and $2
                        ) x
                    where p.idper = $4
`, 
                [desde, hasta, cod_nov, idper]
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
                        v.cod_nov,
                        case extract(dow from f.fecha) 
                            when 0 then 'no-laborable' 
                            when 6 then 'no-laborable' 
                            else 
                                case 
                                    when laborable is false then 'no-laborable' 
                                    else 'normal' 
                                end 
                        end as tipo_dia,
                        cn.novedad
                    from fechas f
                        left join novedades_vigentes v on v.fecha = f.fecha and v.idper = $1
                        left join cod_novedades cn on cn.cod_nov = v.cod_nov
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
        action: 'novedades_disponibles',
        parameters: [
            {name:'idper'     , typeName:'text'   },
            {name:'annio'     , typeName:'integer'},
        ],
        coreFunction: async function(context: ProcedureContext, params:DefinedType<typeof novedades_disponibles.parameters>){
            const {idper} = params;
            const info = await context.client.query(
                `select v.cod_nov, v.novedad, coalesce(v.con_detalles, FALSE) as con_detalles, 
                        coalesce(v.cantidad, 0) as cantidad,
                        coalesce(v.usados, 0) as usados,
                        coalesce(v.pendientes, 0) as pendientes, 
                        coalesce(v.cantidad, 0) + coalesce(v.usados, 0) + coalesce(v.pendientes, 0) + coalesce(v.saldo, 0) > 0 as con_info_nov, 
                        coalesce(v.saldo, 0) as saldo, 
                        (coalesce(v.saldo, 0) > 0 or v.cantidad is null) as con_disponibilidad,
                        (v.registra and r.puede_cargar_dependientes or puede_cargar_todo) as puede_cargar,
                        c_dds,
                        prioritario
                    from usuarios u 
                        inner join roles r using (rol),
                        (${sqlNovPer({idper, annio:params.annio})}) v
                    where (con_dato or v.registra and r.puede_cargar_dependientes or puede_cargar_todo)
                        and u.usuario = $1
                    order by v.cod_nov`,
                [context.username]
            ).fetchAll();
            return info.rows
        }
    },
    {
        action: 'personas_novedad_actual',
        parameters: [
            {name:'fecha',    typeName:'date'}
        ],
        coreFunction: async function(context: ProcedureContext, params:any){
            const info = await context.client.query(
                `select pe.idper, pe.cuil, pe.ficha, pe.idmeta4, pe.apellido, pe.nombres, pe.sector, cod_nov, novedad, nombre_sector,
                        ((puede_cargar_propio or pe.idper is distinct from u.idper) and (pe.activo is true)) as cargable
                    from personas pe
                        inner join situacion_revista sr using (situacion_revista)
                        inner join usuarios u on u.usuario = $2
                        inner join roles using (rol)
                        left join sectores se using(sector)
                        left join novedades_vigentes nv on nv.idper = pe.idper and nv.fecha = $1
                        left join cod_novedades cn using(cod_nov)
                    ${context.es.registra ? `` : `where u.idper = pe.idper`}
                    order by apellido, nombres`
                , [params.fecha, context.username]
            ).fetchAll();
            return info.rows
        }
    },
    {
        action: 'horario_semana_vigente',
        parameters: [
            {name:'idper',  typeName:'text'},
            {name:'fecha',  typeName:'date'}
        ],
        coreFunction: async function(context: ProcedureContext, params:any){
            const info = await context.client.query(
                    `WITH dias_semana AS (
                        SELECT 
                            f.fecha,
                            f.dds,
                            f.annio
                        FROM fechas f
                        WHERE f.fecha BETWEEN ($2::DATE - (EXTRACT(DOW FROM $2::DATE)::INTEGER))
                                        AND ($2::DATE + (6 - EXTRACT(DOW FROM $2::DATE)::INTEGER))
                    )
                    ,horarios_semana AS (                    
                    SELECT 
                        d.dds,
                        h.desde,
                        h.hasta,
                        coalesce(h.hora_desde, horario_habitual_desde) as hora_desde,
                        coalesce(h.hora_hasta, horario_habitual_hasta) as hora_hasta,
                        coalesce(h.trabaja, d.dds BETWEEN 1 AND 5) as trabaja,
                        coalesce(nv.cod_nov, case when d.dds BETWEEN 1 AND 5 then /* cod_nov_habitual */ null else null end) as cod_nov
                    FROM dias_semana d
                        INNER JOIN annios a USING (annio)
                        LEFT JOIN horarios h 
                            ON h.dds = d.dds
                            AND d.fecha >= h.desde 
                            AND (h.hasta IS NULL OR d.fecha <= h.hasta)
                            AND h.idper = $1
                        LEFT JOIN novedades_vigentes nv
                            ON extract(dow from nv.fecha) = d.dds
                            AND d.fecha >= nv.fecha 
                            AND (nv.fecha IS NULL OR d.fecha <= nv.fecha)
                            AND nv.idper = $1
                    ORDER BY d.fecha
                    )
                    SELECT coalesce(max(desde), make_date(extract(year from $2)::integer,1,1)) as desde, 
                            coalesce(min(hasta), make_date(extract(year from $2)::integer,12,31)) as hasta, 
                            json_object_agg(dds, to_jsonb(hs.*) - 'desde' - 'hasta' order by dds) as dias
                        FROM horarios_semana hs;`
                , [params.idper, params.fecha]
            ).fetchUniqueRow();
            return info.row
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
        parameters: [],
        coreFunction: async function(context: ProcedureContext, _params:any){
            const info = await context.client.query(
                `select idper, sector, current_date as fecha, usuario, 
                        coalesce(p.apellido, u.apellido) as apellido,
                        coalesce(p.nombres, u.nombre) as nombres,
                        p.cuil,
                        p.ficha,
                        puede_cargar_todo,
                        roles.*,
                        (puede_cargar_propio and u.activo is true) as cargable,
                        fecha_actual
                    from usuarios u 
                        inner join parametros on true
                        inner join roles using(rol)
                        left join personas p using (idper)
                    where usuario = $1`,
                [context.username]
            ).fetchUniqueRow();
            return info.row;
        }
    },
    {
        action: 'parte_diario',
        parameters: [
            {name:'fecha', typeName:'date', specialDefaultValue: 'current_date'}
        ],
        resultOk:'showGrid',
        coreFunction: async function(context: ProcedureContext, params:any){
            await context.client.query(
                `call actualizar_novedades_vigentes($1, $1)`,
                [params.fecha]
            ).execute();
            return {
                tableName:'parte_diario', 
                fixedFields:[{fieldName:'fecha', value:params.fecha}], 
                tableDef:{title:'parte diario del '+params.fecha.toDmy()+' - Generado con información hasta '+datetime.now().toLocaleString()}
            };
        }
    },
    {
        action: 'visor_de_fichadas',
        parameters: [
            {name:'fecha'  , typeName:'date', specialDefaultValue: 'current_date'},
            {name:'idper'  , typeName:'text', label:'persona', references: 'personas', defaultValue:null}
        ],
        resultOk:'showGrid',
        coreFunction: async function(context: ProcedureContext, params:any){
            var grilla = {
                tableName:'fichadas_vigentes', 
                fixedFields: [] as FixedFields, 
                tableDef:{title:'visor de fichadas', hiddenColumns:[] as string[]}
            }
            if (params.fecha != null) {
                grilla.fixedFields.push({fieldName:'fecha', value:params.fecha});
                grilla.tableDef.title += ' del '+params.fecha.toDmy();
            }
            if (params.idper != null) {
                var apeynom = await context.client.query(`select concat_ws(', ', apellido, nombres) from personas where idper = $1 `,[params.idper]).fetchUniqueValue();
                grilla.fixedFields.push({fieldName:'idper', value:params.idper});
                grilla.tableDef.title += ' de '+apeynom.value;
                grilla.tableDef.hiddenColumns.push('sector', 'sectores__nombre_sector')
            }
            if (grilla.fixedFields.length == 0) {
                throw new Error("debe especificar nombre o fecha")
            }
            return grilla;
        }
    },
    {
        action: 'descanso_anual_remunerado',
        parameters: [
            {name:'annio'  , typeName:'integer', label: 'año', references: 'annios', defaultValue:date.today().getFullYear()},
            {name:'idper'  , typeName:'text', label:'persona', references: 'personas', defaultValue:null},
            {name:'sector'  , typeName:'text', label:'sector', references: 'sectores', defaultValue:null}
        ],
        resultOk:'showGrid',
        coreFunction: async function(context: ProcedureContext, params:any){
            var grilla = {
                tableName:'nov_per', 
                fixedFields: [{fieldName:'cod_nov', value:1}] as FixedFields, 
                tableDef:{title:'descanso anual remunerado', hiddenColumns:['esquema'] as string[]}
            }
            if (params.annio != null) {
                grilla.fixedFields.push({fieldName:'annio', value:params.annio});
                grilla.tableDef.title += ' del '+params.annio;
            }
            if (params.idper != null) {
                var apeynom = await context.client.query(`select concat_ws(', ', apellido, nombres) from personas where idper = $1 `,[params.idper]).fetchUniqueValue();
                grilla.fixedFields.push({fieldName:'idper', value:params.idper});
                grilla.tableDef.title += ' de '+apeynom.value;
                grilla.tableDef.hiddenColumns.push('sector', 'sectores__nombre_sector')
            }
            if (params.sector != null) {
                grilla.fixedFields.push({fieldName:'sector', value:params.sector});
            }
            return grilla;
        }
    },
    {
        action: 'parte_diario_caratula',
        parameters: [
            {name:'idper',  typeName:'text'},
            {name:'fecha',  typeName:'date'}
        ],
        coreFunction: async function(context: ProcedureContext, params:any){
            const info = await context.client.query(
                    `SELECT SUM (CASE WHEN cod_nov = '101' THEN 1 ELSE 0 END) teletrabajo_diagramado,
                       SUM (CASE WHEN cod_nov = '1' THEN 1 ELSE 0 END) descanso_anual_remunerado,
                       SUM (CASE WHEN cod_nov = '140' THEN 1 ELSE 0 END) autoridades_superiores,
                       SUM (CASE WHEN cod_nov = '999' THEN 1 ELSE 0 END) presente_horario_flexible,
                       SUM (CASE WHEN cod_nov = '140' THEN 1 ELSE 0 END) + SUM (CASE WHEN cod_nov = '999' THEN 1 ELSE 0 END) subtotal_presentes,
                       SUM (CASE WHEN cod_nov = '140' THEN 1 ELSE 0 END) + SUM (CASE WHEN cod_nov = '999' THEN 1 ELSE 0 END) total_presentes,
                       SUM (CASE WHEN cod_nov = '1' THEN 1 ELSE 0 END) subtotal_licencias,
                       SUM (CASE WHEN cod_nov = '101' THEN 1 ELSE 0 END) subtotal_otros_ausentes_justificados,
                       SUM (CASE WHEN cod_nov = '101' THEN 1 ELSE 0 END) + SUM (CASE WHEN cod_nov = '1' THEN 1 ELSE 0 END) total_ausentes_justificados,
                       --total ausentes sin justificar
                       --total fuera de horario
                       count(*) total_agentes
                      FROM (
                      WITH RECURSIVE hierarchy AS (
                        SELECT p.idper, p.nombres, p.apellido, s.sector
                        FROM personas p
                        JOIN sectores s ON p.sector = s.sector
                        WHERE p.idper = $1
                        UNION ALL
                        SELECT p.idper, p.apellido, p.nombres, s.sector
                        FROM personas p
                        JOIN sectores s ON p.sector = s.sector
                        JOIN hierarchy h ON s.pertenece_a = h.sector
                      )
                    SELECT * FROM hierarchy j
                      LEFT JOIN novedades_vigentes v ON j.idper = v.idper
                      WHERE fecha = $2
                    ) q;`
                , [params.idper, params.fecha]
            ).fetchUniqueRow();
            return info.row
        }
    },
    {
        action: 'parametros',
        parameters: [],
        coreFunction: async function (context: ProcedureContext) {
            const info = await context.client.query(
                `SELECT fecha_actual FROM parametros;`
            ).fetchUniqueRow();
            return info.row
        }
    },
];
