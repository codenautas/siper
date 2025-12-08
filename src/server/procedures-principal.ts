"use strict";

import {strict as likeAr, createIndex} from 'like-ar';
import { ProcedureDef, ProcedureContext, UploadedFileInfo, BackendError } from './types-principal';
import { NovedadRegistrada, calendario_persona, historico_persona, novedades_disponibles, FichadaData,
} from '../common/contracts';
import { sqlNovPer } from "./table-nov_per";

import { date, datetime, RealDate } from 'best-globals'
import { DefinedType} from 'guarantee-type';
import { FixedFields } from 'frontend-plus';
import { expected } from 'cast-error';
import { sqlPersonas } from "./table-personas";
import * as json4all from 'json4all';
import * as fs from 'fs/promises';
import * as ctts from "../common/contracts.js"

async function prevalidarCargaDeNovedades(context: ProcedureContext, params:Partial<NovedadRegistrada>){
    var diaActualPeroTarde = (await context.client.query(
        `select fecha_actual() = $1 and (fecha_hora_actual() - fecha_actual()) > carga_nov_hasta_hora
            from parametros`,
        [params.desde]
    ).fetchUniqueValue()).value as RealDate
    if (diaActualPeroTarde && !context.es.superior) {
        throw new BackendError("no se pueden cargar novedades el mismo día a esta hora", ctts.ERROR_HORA_PASADA);
    }
}


export const ProceduresPrincipal:ProcedureDef[] = [
    {
        action: 'option_lists',
        parameters: [
            {name:'table', typeName:'text'}
        ],
        coreFunction: async function(context: ProcedureContext){
            const {client} = context;
            var defs = {
                personas      : {key:'idper'   , sql:'select * from personas'},
                cod_novedades : {key:'cod_nov', sql:'select * from cod_novedades'},
                sectores      : {key:'sector' , sql:'select * from sectores'}
            };
            var data = await likeAr(defs)
                .map(def => client.query(`${def.sql} order by ${def.key}`).fetchAll())
                .map(async p => (await p).rows)
                .awaitAll();
            return {
                relations: {
                    idper    : data.personas.map(row => row.idper),
                    cod_nov : data.cod_novedades.map(row => row.cod_nov),
                    sector : data.sectores.map(row => row.sector),
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
            await prevalidarCargaDeNovedades(context, params);
            const info = await context.client.query(
                `select concat_ws(' ',
                            '¿confirmar el registro de',
                            case when corridos then dias_corridos else dias_habiles end,
                            case when corridos then 'días corridos' else 'días hábiles' end,
                            'novedad', cn.cod_nov, 
                            'a', p.apellido||',', p.nombres, 
                            '(persona', p.idper,
                            ')?' || case 
                                when (case when corridos then cantidad - total_corridos else cantidad - total_habiles end) < 0
                                    then ' ¡ATENCIÓN: NO LE QUEDAN DÍAS SUFICIENTES!'
                                    else '' end,
                                    case when ( cn.requiere_entrada and fich.fecha is null) then ' ¡ATENCIÓN: NO FICHO!'
                                    else '' end
                        ) as mensaje,
                        dias_corridos, dias_habiles, dias_coincidentes,
                        con_detalles,
                        cn.c_dds,
                        case when corridos then cantidad - total_corridos else cantidad - total_habiles end as saldo,
                        cn.requiere_entrada and fich.fecha is null as falta_entrada
                    from personas p 
                        inner join (select $1::date as desde, $2::date as hasta) params on true
                        left join cod_novedades cn on cn.cod_nov = $3
                        left join fichadas fich on fich.idper = p.idper and fich.fecha = $1,
                        lateral (select sum(cantidad) as cantidad from per_nov_cant pnc where pnc.idper = p.idper and pnc.cod_nov = cn.cod_nov) s,
                        lateral (
                            select count(*) filter (where f.fecha between params.desde and params.hasta) as dias_corridos,
                                    count(*) filter (
                                        where extract(dow from f.fecha) between 1 and 5
                                            and laborable is not false
                                            and f.fecha between params.desde and params.hasta
                                    ) as dias_habiles,
                                    count(*) filter (where (f.fecha between params.desde and params.hasta or v.cod_nov = cn.cod_nov)) as total_corridos,
                                    count(*) filter (
                                        where extract(dow from f.fecha) between 1 and 5
                                            and laborable is not false
                                            and (f.fecha between params.desde and params.hasta or v.cod_nov = cn.cod_nov)
                                    ) as total_habiles,
                                    count(*) filter (where cod_nov is not null and f.fecha between params.desde and params.hasta) as dias_coincidentes
                                from fechas f
                                    left join novedades_vigentes v on v.fecha = f.fecha and v.idper = p.idper -- es correcto no juntar con cn.cod_nov
                                where f.annio = extract(year from params.desde)
                        ) x
                    where p.idper = $4
`, 
                [desde, hasta, cod_nov, idper]
            ).fetchUniqueRow();
            return info.row
        }
    },
    {
        action: 'registrar_novedad',
        parameters: [
            {name: 'idper'    , typeName: 'text'   , references:'personas'},
            {name: 'cod_nov'  , typeName: 'text'   , defaultValue:null, references:'cod_novedades'},
            {name: 'desde'    , typeName: 'date'   },
            {name: 'hasta'    , typeName: 'date'   },
            {name: 'dds0'     , typeName: 'boolean', defaultValue:null, label:'domingo'    },
            {name: 'dds1'     , typeName: 'boolean', defaultValue:null, label:'lunes'      },
            {name: 'dds2'     , typeName: 'boolean', defaultValue:null, label:'martes'     },
            {name: 'dds3'     , typeName: 'boolean', defaultValue:null, label:'miércoles'  },
            {name: 'dds4'     , typeName: 'boolean', defaultValue:null, label:'jueves'     },
            {name: 'dds5'     , typeName: 'boolean', defaultValue:null, label:'viernes'    },
            {name: 'dds6'     , typeName: 'boolean', defaultValue:null, label:'sabado'     },
            {name: 'cancela'  , typeName: 'boolean', defaultValue:null, description:'cancelación de novedades'},
            {name: 'detalles' , typeName: 'text'   , defaultValue:null,                                       },
            {name: 'fecha'    , typeName: 'date'  , defaultValue:null, },
            {name: 'usuario' , typeName: 'text'   , defaultValue:null,                                       },
            {name: 'tipo_novedad', typeName: 'text', defaultValue:'V', references:'tipos_novedad' },
        ],
        coreFunction: async function(context: ProcedureContext, params:NovedadRegistrada){
            var result = await context.be.procedure.table_record_save.coreFunction(context, {
                table: 'novedades_registradas',
                primaryKeyValues: [],
                newRow: params,
                oldRow: {},
                status: 'new'
            });
            const {idper, annio} = result.row as NovedadRegistrada;
            if (annio == null) {
                throw new Error('FALTA result.annio');
            }
            var sqlInconsistencias = `
                SELECT cod_nov, saldo, error_saldo_negativo, error_falta_entrada, detalle_multiorigen
                    FROM (${sqlNovPer({idper, annio, annioAbierto:true})}) x
                    WHERE error_saldo_negativo OR error_falta_entrada OR (detalle_multiorigen ->> 'error' IS NOT NULL)
            `
            await fs.writeFile('local-guardar.sql', sqlInconsistencias, 'utf-8')
            var inconsistencias = await context.client.query(sqlInconsistencias, []).fetchAll();
            if (inconsistencias.rows.length > 0) {
                const erroresSaldoNegativo = inconsistencias.rows.filter(r => r.error_saldo_negativo);
                const erroresFaltaEntrada = inconsistencias.rows.filter(r => r.error_falta_entrada);
                const erroresMultiDetalle = inconsistencias.rows.filter(r => r.detalle_multiorigen?.error ?? []);
                var errores: string[] = []
                var code: string = 'INDETERMINADO';
                if (erroresMultiDetalle.length > 0){
                    errores.concat(erroresMultiDetalle.map(d => d.error as string));
                    code = ctts.ERROR_BRECHA_EN_CANTIDAD_DE_NOVEDADES;
                }
                if (erroresSaldoNegativo.length > 0){
                    errores.push(`La novedad registrada genera saldos negativos. ${inconsistencias.rows.map(r => `cod nov ${r.cod_nov}, saldo: ${r.saldo}`).join('; ')}`);
                    code = ctts.ERROR_EXCEDIDA_CANTIDAD_DE_NOVEDADES
                }
                if (erroresFaltaEntrada.length > 0){
                    errores.push(`La novedad registrada requiere fichada de entrada. ${inconsistencias.rows.map(r => `cod nov ${r.cod_nov}`).join('; ')}`);
                    code = ctts.ERROR_FALTA_FICHADA
                }
                const error = expected(new Error(errores.join('; ')));
                error.code = code;
                throw error;

            }
            return result.row;
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
                `select case when extract(year from f.fecha) = x.annio then f.fecha else null end as fecha,
                        extract(day from f.fecha) as dia,
                        extract(dow from f.fecha) as dds,
                        (f.fecha - '2001-01-01'::date - dds) / 7 as semana,
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
                        cn.novedad,
                        extract(month from f.fecha) = mes as mismo_mes
                    from (
                        select  fecha - 2 - extract(dow from fecha - 2)::integer      as desde,
                                fecha - 2 - extract(dow from fecha - 2)::integer + 41 as hasta,
                                -- (fecha + interval '1 month')::date - extract(dow from (fecha + interval '1 month'))::integer + 6 as hasta,
                                extract(month from fecha) as mes,
                                extract(year from fecha) as annio
                            from fechas f
                            where fecha = $2::date
                        ) x, 
                        lateral (select * from fechas where annio = x.annio) f
                        left join novedades_vigentes v on v.fecha = f.fecha and v.idper = $1
                        left join cod_novedades cn on cn.cod_nov = v.cod_nov
                    where f.fecha between desde and hasta
                    order by f.fecha`,
                [idper, desde]
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
                        v.cantidad,
                        v.usados,
                        v.pendientes, 
                        coalesce(v.cantidad, 0) + coalesce(v.usados, 0) + coalesce(v.pendientes, 0) + coalesce(v.saldo, 0) > 0 as con_info_nov, 
                        v.saldo, 
                        (coalesce(v.saldo, 0) > 0 or v.cantidad is null) as con_disponibilidad,
                        (v.registra and r.puede_cargar_dependientes or puede_cargar_todo) as puede_cargar,
                        c_dds,
                        prioritario
                    from usuarios u 
                        inner join roles r using (rol),
                        (${sqlNovPer({idper, annio:params.annio})}) v
                    where ((con_dato and (v.comun is null or v.comun)) or v.registra and r.puede_cargar_dependientes or puede_cargar_todo)
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
                `select pe.idper, pe.cuil, pe.ficha, pe.idmeta4, pe.apellido, pe.nombres, pe.sector, cod_nov, novedad, nombre_sector, pe.es_jefe, validar_cuit(pe.cuil) AS cuil_valido,
                        pe.fecha_ingreso, pe.fecha_egreso,
                        ((puede_cargar_propio or pe.idper is distinct from u.idper) and (pe.activo is true)) as cargable
                    from (${sqlPersonas}) pe
                        inner join situacion_revista sr using (situacion_revista)
                        inner join usuarios u on u.usuario = $2
                        inner join roles using (rol)
                        left join sectores se using(sector)
                        left join novedades_vigentes nv on nv.idper = pe.idper and nv.fecha = $1
                        left join cod_novedades cn using(cod_nov)
                        where pe.activo is true
                    ${context.es.registra ? `` : `and u.idper = pe.idper`}
                    order by es_jefe, apellido, nombres`
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
                        bh.descripcion as bh_descripcion,
                        coalesce(h.hora_desde, horario_habitual_desde) as hora_desde,
                        coalesce(h.hora_hasta, horario_habitual_hasta) as hora_hasta,
                        coalesce(h.trabaja, d.dds BETWEEN 1 AND 5) as trabaja,
                        coalesce(nv.cod_nov, case when d.dds BETWEEN 1 AND 5 then /* cod_nov_habitual */ null else null end) as cod_nov
                    FROM dias_semana d
                        INNER JOIN annios a USING (annio)
                        INNER JOIN (${sqlPersonas}) p ON p.idper = $1
                        LEFT JOIN bandas_horarias bh 
                            ON bh.banda_horaria = p.banda_horaria
                        LEFT JOIN horarios h 
                            ON h.dds = d.dds
                            AND d.fecha >= h.desde 
                            AND (h.hasta IS NULL OR d.fecha <= h.hasta)
                            AND h.idper = p.idper
                        LEFT JOIN novedades_vigentes nv
                            ON extract(dow from nv.fecha) = d.dds
                            AND d.fecha >= nv.fecha 
                            AND (nv.fecha IS NULL OR d.fecha <= nv.fecha)
                            AND nv.idper = p.idper
                    ORDER BY d.fecha
                    )
                    SELECT coalesce(max(desde), make_date(extract(year from $2)::integer,1,1)) as desde, 
                            coalesce(min(hasta), make_date(extract(year from $2)::integer,12,31)) as hasta, 
                            min(bh_descripcion) as bh_descripcion,
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
                `select idper, sector, fecha_actual() as fecha, usuario, 
                        coalesce(p.apellido, u.apellido) as apellido,
                        coalesce(p.nombres, u.nombre) as nombres,
                        p.cuil,
                        p.ficha,
                        validar_cuit(p.cuil) AS cuil_valido,
                        puede_cargar_todo,
                        roles.*,
                        (puede_cargar_propio and u.activo is true) as cargable,
                        fecha_actual() as fecha_actual,
                        s.nivel as sector_nivel
                    from usuarios u 
                        inner join parametros on true
                        inner join roles using(rol)
                        left join personas p using (idper)
                        left join sectores s using (sector)
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
                tableDef:{title:'Parte diario del '+params.fecha.toDmy()+' - Generado con información hasta '+datetime.now().toLocaleString()}
            };
        }
    },
    {
        action: 'informe_mensual',
        parameters: [
            {name:'desde', typeName:'date', specialDefaultValue: 'current_date'},
            {name:'hasta', typeName:'date', specialDefaultValue: 'current_date'}
        ],
        resultOk:'showGrid',
        coreFunction: async function(context: ProcedureContext, params:any){
            if (params.hasta < params.desde) {
                throw new Error("La fecha 'hasta' no puede ser anterior a la fecha 'desde'.");
            }
            await context.client.query(
                `call actualizar_novedades_vigentes($1, $2)`,
                [params.desde, params.hasta]
            ).execute();
            return {
                tableName:'parte_diario',
                fixedFields:[
                    {fieldName:'fecha', value:params.desde, until:params.hasta},
                ], 
                tableDef:{title:'Informe mensual del '+params.desde.toDmy()+' al '+params.hasta.toDmy()+' - Generado con información hasta '+datetime.now().toLocaleString(),
                }
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
                tableDef:{title:'descanso anual remunerado', hiddenColumns:['esquema'] as string[], firstDisplayCount:2000}
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
        action: 'exportar_descanso_anual_remunerado',
        parameters: [
            {name:'annio'  , typeName:'integer', label: 'año', references: 'annios', defaultValue:date.today().getFullYear()},
        ],
        forExport:{
            fileName:'descanso_anual_remunerado.xlsx',
            generarInmediato: true
        },
        coreFunction: async function(context: ProcedureContext, params:any){
            var fecha_actual = (await context.client.query('select fecha_actual()').fetchUniqueValue()).value as RealDate
            var title = 'Descanso anual remunerado del ' + params.annio + ' al '+ fecha_actual.toDmy();
            title = 'vacaciones ' + params.annio + ' al '+ fecha_actual.toDmy().replace(/\//g, '-');
            var {rows} = await context.client.query(`
                SELECT annio, origen, x.idper, apellido, nombres,
                	x.sector,
                    abierto_cantidad as cantidad,
                    coalesce(abierto_usados,0) as usados,
                    coalesce(abierto_pendientes,0) as pendientes,
                    coalesce(abierto_saldo,0) as saldo,
                    cantidad as suma_cantidad,
                    usados as suma_usados,
                    pendientes as suma_pendientes,
                    saldo as suma_saldo,
                    novedad
                    FROM (${sqlNovPer({annio: params.annio, abierto:true})}) x
                        LEFT JOIN personas p ON p.idper = x.idper  
                    WHERE cod_nov = '1'
                    ORDER BY 1,3,2,4`
            ).fetchAll();
            return {title, rows};
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
                `SELECT fecha_actual() as fecha_actual FROM parametros;`
            ).fetchUniqueRow();
            return info.row
        }
    },
    {
        action: 'fichadas_registrar',
        parameters: [
            {name:'fichadas', typeName:'jsonb'}
        ],
        policy:'fichadas',
        coreFunction: async function (context: ProcedureContext, params:{fichadas:Partial<FichadaData>[]}) {
            const {fichadas} = params;
            const fichadasString = json4all.stringify(fichadas);
            const result = await context.client.query(`SELECT registrar_fichadas($1) AS resultado;`, [fichadasString]).fetchUniqueRow();
            return result.row.resultado;
        }
    },
    {   
        action: 'archivo_subir',
        progress: true,
        parameters: [
            { name: 'idper', typeName: 'text' },
            { name: 'tipo_adjunto', typeName: 'text' },
            { name: 'numero_adjunto', typeName: 'integer' },
        ],
        files: { count: 1 },
        coreFunction: async function (context, parameters, files) {
            const { idper, tipo_adjunto, numero_adjunto } = parameters;
            const client = context.client;

            if (!idper || !tipo_adjunto) {
                throw new Error("Faltan parámetros necesarios: idper o tipo_adjunto.");
            }

            const file = files![0];
            if (!file) {
                throw new Error("No se recibió ningún archivo para subir.");
            }

            const MAX_SIZE = 2 * 1024 * 1024; // 2MB
            const tmpPath = (file as any).path as string;
            const size = (file as any).size ?? (await fs.stat(tmpPath)).size;
            if (size > MAX_SIZE) {
                // eslint-disable-next-line no-empty
                try { await fs.rm(tmpPath, { force: true }); } catch { }
                throw new Error("El archivo supera el tamaño máximo permitido de 1 MB.");
            }

            const originalFilename = file.originalFilename;
            const extendedFilename = `adjunto-siper-${numero_adjunto}-${originalFilename}`;

            const newPath = `local-attachments/adjuntos/${extendedFilename}`;

            const exists = async (p: string) => { try { await fs.access(p); return true; } catch { return false; } };

            // NO sobrescribir si ya existe
            if (await exists(newPath)) {
                // eslint-disable-next-line no-empty
                try { await fs.rm(tmpPath, { force: true }); } catch { }
                throw new Error(`Ya existe un archivo con el nombre ${extendedFilename}.`);
            }

            // Mueve el archivo al destino final
            const moveFile = async function (file: UploadedFileInfo, fileName: string) {
                await fs.rename(file.path, fileName);
            };
    
            await moveFile(file, newPath);

            const row = await client.query(
                `UPDATE adjuntos 
                    SET archivo_nombre = $1, archivo_nombre_fisico = $2
                    WHERE idper = $3 AND tipo_adjunto = $4 AND numero_adjunto = $5
                    RETURNING *`,
                [originalFilename, extendedFilename, idper, tipo_adjunto, numero_adjunto]
            ).fetchUniqueRow();


            return {
                message: `El archivo ${originalFilename} se subió correctamente.`,
                nombre: originalFilename,
                updatedRow: row.row,
            };
        },
    }
];

