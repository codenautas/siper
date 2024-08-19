"use strict";

import { AppBackend, Context, Request, 
    ClientModuleDefinition, OptsClientPage, MenuDefinition, MenuInfoBase
} from "./types-principal";

import { annios               } from './table-annios';
import { roles                } from './table-roles';
import { cod_novedades        } from './table-cod_novedades';
import { fechas               } from './table-fechas';
import { clases               } from './table-clases';
import { grupos               } from './table-grupos';
import { sectores             } from './table-sectores';
import { personal             } from './table-personal';
import { per_gru              } from './table-per_gru';
import { nov_gru              } from './table-nov_gru';
import { novedades_importadas } from './table-novedades_importadas';
import { nov_per_importado    } from './table-nov_per_importado';
import { novedades_registradas} from './table-novedades_registradas';
import { novedades_vigentes   } from './table-novedades_vigentes';
import { nov_per              } from './table-nov_per';
import { usuarios             } from './table-usuarios';
import { parametros           } from "./table-parametros";

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
    override getMenu(context:Context):MenuDefinition{
        var menuContent:MenuInfoBase[]=[];
        if(context.user && context.user.rol=="admin"){
            menuContent.push(
                {menuType:'table', name:'personal'          },
                {menuType:'menu', name:'novedades', menuContent:[
                    {menuType:'registroNovedades', name:'registro'},
                    {menuType:'menu', name:'tablas', menuContent:[
                        {menuType:'table', name:'novedades_vigentes'   },
                        {menuType:'table', name:'novedades_registradas'},
                    ]},
                ]},
                {menuType:'menu', name:'importaciones', menuContent:[
                    {menuType:'table', name:'novedades_importadas'},
                    {menuType:'table', name:'nov_per_importado'},
                ]},
                {menuType:'menu', name:'config', label:'configurar', menuContent:[
                    {menuType:'table', name:'fechas'        },
                    {menuType:'table', name:'cod_novedades' },
                    {menuType:'table', name:'sectores'      },
                    {menuType:'table', name:'clases'        },
                    {menuType:'table', name:'usuarios'      },
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
            { type: 'js', module: 'frontend-plus', file:'frontend-plus.js'},
            { type: 'css', file: 'menu.css' },
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
            personal             ,
            per_gru              ,
            nov_gru              ,
            novedades_importadas ,
            nov_per_importado    ,
            novedades_registradas,
            novedades_vigentes   ,
            nov_per              ,
            usuarios             ,
            parametros           ,
        }
    }       
}
