"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

export const sector: FieldDefinition = {name: 'sector', typeName: 'text', title:'sector'}

import {tipo_sec} from "./table-tipos_sec"

function sectores_def(name:string, usuarioPuedeEditar: boolean, extendido: boolean): TableDefinition{
    return {
        name,
        elementName: 'sector',
        title: 'sectores',
        tableName: 'sectores',
        editable: usuarioPuedeEditar,
        fields: [
            {...sector, generatedAs:`coalesce(case when nivel<2 or substr(subsector,1,1) = 'X' then subsector else rpad(pertenece_a,nivel-1,'0')||subsector end, anterior)`},
            {...sector, name:'anterior'},
            {name: 'nombre_sector', typeName: 'text', isName:true, title:'sector departamento área'},
            {...tipo_sec, nullable:false},
            {name: 'nivel', typeName:'integer'},
            ...(extendido?[
                {name: 'directas'  ,typeName: 'integer', editable: false},
                {name: 'indirectas',typeName: 'integer', editable: false},
                {name: 'jefe'      ,typeName: 'text'   , editable: false},
                {name: 'pactivas'  ,typeName: 'integer', editable: false},
            ] satisfies FieldDefinition[]:[]),
            {name: 'pertenece_a'  , typeName: sector.typeName},
            {name: 'subsector'    , typeName: 'text'   },
            {name: 'activo'       , typeName: 'boolean', nullable: false, defaultValue: true},
            {name: 'cod_2024'     , typeName: 'text'   },
        ],
        primaryKey: [sector.name],
        foreignKeys: [
            {references: 'sectores', fields:[{source:'pertenece_a', target:'sector'}], alias: 'pertenece_a'},
            {references: 'tipos_sec', fields:[tipo_sec.name]},
            {references: 'tipos_sec', fields:[tipo_sec.name, 'nivel'], alias:'nivel'},
        ], 
        detailTables: extendido ? [
            {table:'personas', fields:[sector.name], abr:'P', refreshParent: true},
            {table:'sectores_edit', fields:[{source:'sector', target:'pertenece_a'}], abr:'S'}
        ] : [],
        sql: {
            isTable: name == 'sectores',
            ...(extendido ? {from:`(
                select *
                    from sectores s left join lateral (
                        select count(*) filter (where p.sector = s.sector) as directas,
                                count(*) as indirectas,
                                count(*) filter (where p.activo = true) as pactivas, 
                                string_agg (p.apellido||', '||p.nombres, '/') filter (where p.sector = s.sector AND p.es_jefe) as jefe
                            from sectores d inner join personas p using (sector)
                            where d.sector = s.sector or sector_pertenece(d.sector, s.sector)                    ) on true
            )`} : {}),
        },
        hiddenColumns:['anterior']
    };
}

export function sectores(context: TableContext): TableDefinition {
    return sectores_def('sectores', context.es.admin, false);
}


export function sectores_edit(context: TableContext): TableDefinition {
    return sectores_def('sectores_edit', context.es.rrhh, true);
}
