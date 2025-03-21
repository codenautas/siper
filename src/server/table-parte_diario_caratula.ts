"use strict";
import * as sqlTools from 'sql-tools';

import {TableDefinition, TableContext} from "./types-principal";

export const sqlParteDiarioCaratula= (params:{registra:boolean, usuario:string})=> `
       SELECT fecha, grupo_padre, descripcion, count(*) cantidad
          --total ausentes sin justificar
          --total fuera de horario
         FROM (
         WITH RECURSIVE hierarchy AS (
           SELECT pp.idper, pp.apellido, pp.nombres, pp.sector
           FROM personas p
           JOIN personas pp ON p.sector = pp.sector
           WHERE p.activo 
           ${params.registra? ` and p.idper = (SELECT idper FROM usuarios WHERE usuario = ${sqlTools.quoteLiteral(params.usuario)}) `:''}
           UNION ALL
           SELECT p.idper, p.apellido, p.nombres, s.sector
           FROM personas p
           JOIN sectores s ON p.sector = s.sector
           JOIN hierarchy h ON s.pertenece_a = h.sector
           WHERE p.activo
         )
         SELECT DISTINCT * FROM hierarchy j
           LEFT JOIN novedades_vigentes v ON j.idper = v.idper
           /*WHERE fecha = current_date*/
       ) q JOIN (
           WITH RECURSIVE novedades_de(grupo_padre, descripcion, cod_nov, orden) AS (
             SELECT grupo_padre, descripcion, grupo_parte_diario, orden
             FROM grupos_parte_diario
             WHERE es_cod_nov
             UNION ALL
             SELECT g.grupo_padre, g.descripcion, p.cod_nov, g.orden
             FROM novedades_de p
             JOIN grupos_parte_diario g ON g.grupo_parte_diario = p.grupo_padre 
             WHERE g.grupo_padre IS NOT NULL
           )
           SELECT grupo_padre, descripcion, cod_nov, orden
           FROM novedades_de 
           ) w  ON q.cod_nov = w.cod_nov
       GROUP BY fecha, grupo_padre, descripcion, orden
       ORDER BY fecha, orden`;

export function parte_diario_caratula(_context: TableContext): TableDefinition {
    
    const registra = _context.user.rol=="registra";
    const usuario = _context.user.usuario;  
    return {
        name:'parte_diario_caratula',
        title: 'parte diario caratula',
        editable: false,
        fields:[
            {name: 'fecha'       , typeName: 'date'},
            {name: 'grupo_padre' , typeName: 'text'},
            {name: 'descripcion' , typeName: 'text'},
            {name: 'cantidad'    , typeName: 'integer', description: 'cantidad de agentes'}, 
        ],
        primaryKey: ['grupo_padre'],
        sql: {
            isTable:false,
            from:`(select *
                   from (${sqlParteDiarioCaratula({registra:registra, usuario:usuario})}) x
            )`
        },
    };
}
