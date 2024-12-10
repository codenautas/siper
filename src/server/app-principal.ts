"use strict";

import { AppBackend, Context, Request, 
    ClientModuleDefinition, OptsClientPage, MenuDefinition, MenuInfoBase
} from "./types-principal";

import { date } from 'best-globals'

import { annios               } from './table-annios';
import { roles                } from './table-roles';
import { cod_novedades        } from './table-cod_novedades';
import { fechas               } from './table-fechas';
import { clases               } from './table-clases';
import { grupos               } from './table-grupos';
import { situacion_revista    } from './table-situacion_revista';
import { sectores             } from './table-sectores';
import { personas             } from './table-personas';
import { personas_importadas  } from './table-personas-importadas';
import { per_gru              } from './table-per_gru';
import { nov_gru              } from './table-nov_gru';
import { novedades_importadas } from './table-novedades_importadas';
import { nov_per_importado    } from './table-nov_per_importado';
import { novedades_registradas} from './table-novedades_registradas';
import { novedades_horarias   } from './table-novedades_horarias';
import { novedades_vigentes   } from './table-novedades_vigentes';
import { per_nov_cant         } from './table-per_nov_cant';
import { nov_per              } from './table-nov_per';
import { pautas               } from './table-pautas';
import { inconsistencias      } from './table-inconsistencias';
import { usuarios             } from './table-usuarios';
import { parametros           } from "./table-parametros";
import { horarios             } from "./table-horarios";
import { fichadas             } from "./table-fichadas";
import { historial_contrataciones} from "./table-historial_contrataciones";
import { capa_modalidades     } from "./table-capa_modalidades";
import { capacitaciones       } from "./table-capacitaciones";
import { per_capa       } from "./table-per_capa";
import { parte_diario         } from "./table-parte-diario";
import { fichadas_vigentes } from "./table-fichadas_vigentes";
import { tipos_documento } from "./table-tipos_documento";

import { ProceduresPrincipal } from './procedures-principal'

import {staticConfigYaml} from './def-config';

import { Persona } from "../common/contracts"

/* Dos líneas para incluir contracts: */
var persona: Persona | null = null;
console.log(persona)


export class AppSiper extends AppBackend{
    constructor(){
        super();
    }
    override configStaticConfig(){
        super.configStaticConfig();
        this.setStaticConfig(staticConfigYaml);
    }
    override async getProcedures(){
        var be = this;
        return [
            ...await super.getProcedures(),
            ...ProceduresPrincipal
        ].map(be.procedureDefCompleter, be);
    }
    completeContext(context:Context){
        var es = context.es ?? {} as Context["es"]
        es.admin = context.user && context.user.rol=="admin" 
        es.rrhh = es.admin || context.user && context.user.rol=="rrhh" 
        es.registra = es.admin || context.user && context.user.rol=="registra" 
        context.es = es;
    }
    override getContextForDump():Context{
        var context = super.getContextForDump();
        this.completeContext(context);
        return context;
    }
    override getContext(req:Request):Context{
        var context = super.getContext(req);
        this.completeContext(context);
        return context;
    }
    override getMenu(context:Context):MenuDefinition{
        var {es} = context
        var menuContent:MenuInfoBase[]=[];
        menuContent.push(
            {menuType:'principal', name:'principal'     },
            ...(es.registra ? [
                {menuType:'menu', name:'listados', menuContent:[
                    {menuType:'proc', name:'parte_diario'},
                    {menuType:'proc', name:'descanso_anual_remunerado'},
                    {menuType:'proc', name:'visor_de_fichadas'},
                    {menuType:'table', name:'novedades_totales', table:'nov_per', ff:[{fieldName:'annio', value:date.today().getFullYear()}]},
                ]}
            ] : []),
            {menuType:'table', name:'personas'          },
            {menuType:'menu', name:'capacitaciones', menuContent:[
                {menuType:'table', name:'capacitaciones'},
                ...(es.registra ? [{menuType:'table', name:'modadidades', table:'capa_modalidades'}] : []),
            ]}
        );
        if(es.registra){
            menuContent.push(
                {menuType:'menu', name:'en_desarrollo', menuContent:[
                    {menuType:'menu', name:'novedades', menuContent:[
                        {menuType:'registroNovedades', name:'registro'},
                        {menuType:'statusPersona', name:'status'},
                        {menuType:'menu', name:'tablas', menuContent:[
                            {menuType:'table', name:'novedades_vigentes'   },
                            {menuType:'table', name:'novedades_registradas'},
                        ]},
                    ]},
                    {menuType:'menu', name:'importaciones', menuContent:[
                        {menuType:'table', name:'novedades_importadas'},
                        {menuType:'table', name:'nov_per_importado'},
                    ]},
                    {menuType:'menu', name:'devel', menuContent:[
                        {menuType:'componentesSiper', name:'componentes'},
                    ]},
                    {menuType:'menu', name:'config', label:'configurar', menuContent:[
                        {menuType:'table', name:'fechas'        },
                        {menuType:'menu', name:'ref personas'   , description:'tablas referenciales de personas', menuContent:[
                            {menuType:'table', name:'sectores'         },
                            {menuType:'table', name:'situacion_revista', label: 'sit. revista' },
                            {menuType:'table', name:'clases'           },
                        ]},
                        {menuType:'table', name:'cod_novedades' },
                        {menuType:'table', name:'usuarios'      },
                        {menuType:'table', name:'horarios'      },
                    ]}
                ]}
            );
        }
        return {menu:menuContent};
    }
    override clientIncludes(req:Request|null, opts:OptsClientPage):ClientModuleDefinition[]{
        var UsandoREact = true;
        var menuedResources:ClientModuleDefinition[]=req && opts && !opts.skipMenu ? [
            { type:'js' , src:'client.js' },
        ]:[
        ];
        var list: ClientModuleDefinition[] = [
            ...(UsandoREact?[
                { type: 'js', module: 'react', modPath: 'umd', fileDevelopment:'react.development.js', file:'react.production.min.js' },
                { type: 'js', module: 'react-dom', modPath: 'umd', fileDevelopment:'react-dom.development.js', file:'react-dom.production.min.js' },
                { type: 'js', module: '@mui/material', modPath: '../umd', fileDevelopment:'material-ui.development.js', file:'material-ui.production.min.js' },
                { type: 'js', module: 'clsx', file:'clsx.min.js' },
                // { type: 'js', module: 'redux', modPath:'../dist', fileDevelopment:'redux.js', file:'redux.min.js' },
                // { type: 'js', module: 'react-redux', modPath:'../dist', fileDevelopment:'react-redux.js', file:'react-redux.min.js' },
            ]:[]) satisfies ClientModuleDefinition[],
            ...super.clientIncludes(req, opts),
            ...(UsandoREact?[
                // { type: 'js', module: 'redux-typed-reducer', modPath:'../dist', file:'redux-typed-reducer.js' },
                { type: 'js', src: 'adapt.js' },
            ]:[])  satisfies ClientModuleDefinition[],
            { type: 'js', src: 'lib/my-icons.js' },
            { type: 'js', module: 'guarantee-type', file:'guarantee-type.js'},
            { type: 'js', module: 'frontend-plus', file:'frontend-plus.js'},
            { type: 'css', file: 'menu.css' },
            { type: 'js', file: 'common/contracts.js' },
            { type: 'js', file: 'client/ws-componentes.js' },
            { type: 'js', file: 'client/ws-status_persona.js' },
            { type: 'js', file: 'client/ws-novedades_registradas.js' },
            ... menuedResources
        ] satisfies ClientModuleDefinition[];
        return list;
    }
    override prepareGetTables(){
        super.prepareGetTables();
        this.getTableDefinition={
            ... this.getTableDefinition,
            annios               ,
            roles                ,
            cod_novedades        ,
            fechas               ,
            sectores             ,
            clases               ,
            grupos               ,
            situacion_revista    ,
            personas             ,
            per_gru              ,
            nov_gru              ,
            personas_importadas  ,
            novedades_importadas ,
            nov_per_importado    ,
            novedades_registradas,
            novedades_horarias   ,
            novedades_vigentes   ,
            per_nov_cant         ,
            nov_per              ,
            pautas               ,
            inconsistencias      ,  
            usuarios             ,
            parametros           ,
            horarios             ,
            fichadas             ,
            historial_contrataciones,
            capa_modalidades       ,
            capacitaciones       ,
            per_capa             ,
            parte_diario         ,
            fichadas_vigentes    ,
            tipos_documento
        }
    }       
}
