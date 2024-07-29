"use strict";

import { AppBackend, Context, Request, 
    ClientModuleDefinition, OptsClientPage, MenuDefinition, MenuInfoBase
} from "./types-principal";

import { motivos              } from './table-motivos';
import { fechas               } from './table-fechas';
import { dimensiones          } from './table-dimensiones';
import { grupos               } from './table-grupos';
import { sectores             } from './table-sectores';
import { personal             } from './table-personal';
import { per_gru              } from './table-per_gru';
import { novedades_importadas } from './table-novedades_importadas';
import { nov_per_importado    } from './table-nov_per_importado';
import { registro_novedades   } from './table-registro_novedades';
import { novedades            } from './table-novedades';
import { nov_per              } from './table-nov_per';
import { usuarios             } from './table-usuarios';

import {staticConfigYaml} from './def-config';

export class AppSiper extends AppBackend{
    constructor(){
        super();
    }
    override configStaticConfig(){
        super.configStaticConfig();
        this.setStaticConfig(staticConfigYaml);
    }
    override getMenu(context:Context):MenuDefinition{
        var menuContent:MenuInfoBase[]=[];
        if(context.user && context.user.rol=="admin"){
            menuContent.push(
                {menuType:'table', name:'personal'          },
                {menuType:'table', name:'novedades'         },
                {menuType:'table', name:'registro_novedades'},
                {menuType:'menu', name:'importaciones', menuContent:[
                    {menuType:'table', name:'novedades_importadas'},
                ]},
                {menuType:'menu', name:'config', label:'configurar', menuContent:[
                    {menuType:'table', name:'fechas'        },
                    {menuType:'table', name:'motivos' },
                    {menuType:'table', name:'sectores'      },
                    {menuType:'table', name:'usuarios'      },
                ]}
            )
        };
        return {menu:menuContent};
    }
    override clientIncludes(req:Request|null, opts:OptsClientPage):ClientModuleDefinition[]{
        var UsandoREact = false;
        var menuedResources:ClientModuleDefinition[]=req && opts && !opts.skipMenu ? [
            { type:'js' , src:'client.js' },
        ]:[
        ];
        var list: ClientModuleDefinition[] = [
            ...(UsandoREact?[
                { type: 'js', module: 'react', modPath: 'umd', fileDevelopment:'react.development.js', file:'react.production.min.js' },
                { type: 'js', module: 'react-dom', modPath: 'umd', fileDevelopment:'react-dom.development.js', file:'react-dom.production.min.js' },
                { type: 'js', module: '@mui/material', modPath: 'umd', fileDevelopment:'material-ui.development.js', file:'material-ui.production.min.js' },
                { type: 'js', module: 'clsx', file:'clsx.min.js' },
                { type: 'js', module: 'redux', modPath:'../dist', fileDevelopment:'redux.js', file:'redux.min.js' },
                { type: 'js', module: 'react-redux', modPath:'../dist', fileDevelopment:'react-redux.js', file:'react-redux.min.js' },
            ]:[]) satisfies ClientModuleDefinition[],
            ...super.clientIncludes(req, opts),
            ...(UsandoREact?[
                { type: 'js', module: 'redux-typed-reducer', modPath:'../dist', file:'redux-typed-reducer.js' },
                { type: 'js', src: 'adapt.js' },
            ]:[])  satisfies ClientModuleDefinition[],
            { type: 'css', file: 'menu.css' },
            ... menuedResources
        ] satisfies ClientModuleDefinition[];
        return list;
    }
    override prepareGetTables(){
        super.prepareGetTables();
        this.getTableDefinition={
            ... this.getTableDefinition,
            motivos        ,
            fechas               ,
            sectores             ,
            dimensiones          ,
            grupos               ,
            personal             ,
            per_gru              ,
            novedades_importadas ,
            nov_per_importado    ,
            registro_novedades   ,
            novedades            ,
            nov_per              ,
            usuarios             ,
        }
    }       
}
