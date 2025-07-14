"use strict";

import { AppBackend, Context, Request, ClientSetup,
    ClientModuleDefinition, OptsClientPage, MenuDefinition, MenuInfoBase
} from "./types-principal";

import { date } from 'best-globals'

import { annios                  } from './table-annios';
import { roles                   } from './table-roles';
import { cod_novedades           } from './table-cod_novedades';
import { fechas                  } from './table-fechas';
import { clases                  } from './table-clases';
import { grupos                  } from './table-grupos';
import { situacion_revista       } from './table-situacion_revista';
import { tipos_sec               } from "./table-tipos_sec";
import { sectores, sectores_edit } from './table-sectores';
import { personas                } from './table-personas';
import { personas_importadas     } from './table-personas-importadas';
import { per_gru                 } from './table-per_gru';
import { nov_gru                 } from './table-nov_gru';
import { novedades_importadas    } from './table-novedades_importadas';
import { nov_per_importado       } from './table-nov_per_importado';
import { novedades_registradas   } from './table-novedades_registradas';
import { novedades_horarias      } from './table-novedades_horarias';
import { novedades_vigentes      } from './table-novedades_vigentes';
import { per_nov_cant            } from './table-per_nov_cant';
import { nov_per                 } from './table-nov_per';
import { pautas                  } from './table-pautas';
import { inconsistencias         } from './table-inconsistencias';
import { usuarios                } from './table-usuarios';
import { parametros              } from "./table-parametros";
import { horarios                } from "./table-horarios";
import { fichadas                } from "./table-fichadas";
import { historial_contrataciones} from "./table-historial_contrataciones";
import { capa_modalidades        } from "./table-capa_modalidades";
import { capacitaciones          } from "./table-capacitaciones";
import { per_capa                } from "./table-per_capa";
import { parte_diario            } from "./table-parte_diario";
import { fichadas_vigentes       } from "./table-fichadas_vigentes";
import { tipos_doc               } from "./table-tipos_doc";
import { paises                  } from "./table-paises";
import { provincias              } from "./table-provincias";
import { barrios                 } from "./table-barrios";
import { localidades             } from "./table-localidades";
import { calles                  } from "./table-calles";
import { tipos_domicilio         } from "./table-tipos_domicilio";
import { per_domicilios          } from "./table-per_domicilios";
import { tipos_telefono          } from "./table-tipos_telefono";
import { per_telefonos           } from "./table-per_telefonos";
import { sexos                   } from "./table-sexos";
import { estados_civiles         } from "./table-estados_civiles";
import { agrupamientos           } from "./table-agrupamientos";
import { tramos                  } from "./table-tramos";
import { grados                  } from "./table-grados";
import { categorias              } from "./table-categorias";
import { motivos_egreso          } from "./table-motivos_egreso";
import { jerarquias              } from "./table-jerarquias";
import { expedientes             } from "./table-expedientes";
import { funciones               } from "./table-funciones";
import { nivel_grado             } from "./table-nivel_grado";
import { tareas                  } from "./table-tareas";
import { puestos                 } from "./table-puestos";

import { ProceduresPrincipal } from './procedures-principal'

import {staticConfigYaml} from './def-config';

import { Persona } from "../common/contracts"

import { unexpected } from "cast-error";

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
    async inCron(actionOrSqlProcedure:()=>Promise<void>, opts:{vecesPorDia: number, name:string}):Promise<void>
    async inCron(actionOrSqlProcedure:string, opts:{vecesPorDia: number, name?:string}):Promise<void>
    async inCron(actionOrSqlProcedure:string|(()=>Promise<void>), opts:{vecesPorDia: number, name:string}){
        const be = this;
        const action = typeof actionOrSqlProcedure == "string" ? 
            async ()=>{
                await be.inDbClient(null, async client => {
                    client.query(`call ${actionOrSqlProcedure}()`).execute()
                });
            }
            : actionOrSqlProcedure;
        const errorSeen: Record<string, boolean> = {}
        const actionWithErrorLog = async () => {
            try {
                await action();
            } catch (err) {
                const name = opts.name ?? (typeof actionOrSqlProcedure == "string" ? actionOrSqlProcedure : 'action without name')
                if (!(errorSeen[name])) {
                    console.error('error inCron:', name);
                    unexpected(err);
                    errorSeen[name] = true;
                }
            }
        }
        await actionWithErrorLog();
        setInterval(actionWithErrorLog, 24*60*60*1000 / opts.vecesPorDia);
    }
    override async postConfig(){
        const be = this;
        super.postConfig();
        be.inCron('avance_de_dia_proc', {vecesPorDia:24*6})
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
        es.mantenimiento = context.user && context.user.rol=="mantenimiento" 
        es.admin = es.mantenimiento || context.user && context.user.rol=="admin"
        es.rrhh_admin = es.admin || context.user && context.user.rol=="rrhh_admin" 
        es.rrhh = es.rrhh_admin || context.user && context.user.rol=="rrhh" 
        es.registra = es.rrhh || context.user && context.user.rol=="registra"
        context.es = es;
    }
    override isAdmin(reqOrContext:Request|Context){
        return super.isAdmin(reqOrContext) || reqOrContext.user?.rol == 'mantenimiento';
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
                    {menuType:'proc', name:'informe_mensual'},
                    {menuType:'proc', name:'descanso_anual_remunerado'},
                    // {menuType:'proc', name:'visor_de_fichadas'},
                    {menuType:'table', name:'novedades_totales', table:'nov_per', ff:[{fieldName:'annio', value:date.today().getFullYear()}]},
                ]}
            ] : []),
               ...es.rrhh ? [{menuType:'table', name:'personas'          },
                {menuType:'menu', name:'config', label:'configurar', menuContent:[
                {menuType:'table', name:'sectores', table:'sectores_edit' },
                {menuType:'table', name:'usuarios'      },
                ]}
               ] : [],
               ...es.admin ? [{menuType:'menu', name:'capacitaciones', menuContent:[
                {menuType:'table', name:'capacitaciones'},
                ...(es.registra ? [{menuType:'table', name:'modadidades', table:'capa_modalidades'}] : []),
            ]}] : []
        );
        if(es.admin){
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
                            {menuType:'table', name:'sectores'         , table:'sectores_edit' },
                            {menuType:'table', name:'situacion_revista', label: 'sit. revista' },
                            {menuType:'table', name:'clases'           },
                            {menuType:'table', name:'paises'           },
                            {menuType:'table', name:'provincias'       },
                            {menuType:'table', name:'barrios'          },
                            {menuType:'table', name:'localidades'      },
                            {menuType:'table', name:'calles'           },
                            {menuType:'table', name:'tipos_domicilio'  },
                            {menuType:'table', name:'tipos_telefono'   },
                            {menuType:'table', name:'tipos_doc'        },
                            {menuType:'table', name:'tipos_sec'        },
                            {menuType:'table', name:'sexos'            },
                            {menuType:'table', name:'estados_civiles'  },
                            {menuType:'table', name:'agrupamientos'    },
                            {menuType:'table', name:'grados'           },
                            {menuType:'table', name:'tramos'           },
                            {menuType:'table', name:'categorias'       },
                            {menuType:'table', name:'motivos_egreso'   },
                            {menuType:'table', name:'jerarquias'       },
                            {menuType:'table', name:'expedientes'      },
                            {menuType:'table', name:'funciones'        },
                            {menuType:'table', name:'nivel_grado'      },
                            {menuType:'table', name:'tareas'           },
                            {menuType:'table', name:'puestos'          },
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
    override async getClientSetupForSendToFrontEnd(req: Request): Promise<ClientSetup>{
        var result = await super.getClientSetupForSendToFrontEnd(req);
        var context = this.getContext(req);
        result.config.es = context.es;
        return result;
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
            { type: 'js', file: 'client/shared-functions.js' },
            { type: 'js', src: 'lib/my-icons.js' },
            { type: 'js', module: 'guarantee-type', file:'guarantee-type.js'},
            { type: 'js', module: 'frontend-plus', file:'frontend-plus.js'},
            { type: 'css', file: 'menu.css' },
            { type: 'css', file: 'arbol.css' },
            { type: 'js', file: 'common/contracts.js' },
            { type: 'js', file: 'client/ws-componentes.js' },
            { type: 'js', file: 'client/ws-arbol.js' },
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
            tipos_sec            ,
            sectores, sectores_edit,
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
            capa_modalidades     ,
            capacitaciones       ,
            per_capa             ,
            parte_diario         ,
            fichadas_vigentes    ,
            tipos_doc            ,
            paises               ,
            provincias           ,
            barrios              ,
            localidades          ,
            calles               ,
            tipos_domicilio      ,
            per_domicilios       ,
            tipos_telefono       ,
            per_telefonos        ,
            sexos                ,
            estados_civiles      ,
            agrupamientos        ,
            tramos               ,
            grados               ,
            categorias           ,
            motivos_egreso       ,
            jerarquias           ,
            expedientes          ,
            funciones            ,
            nivel_grado          ,
            tareas               ,
            puestos              ,
            historial_contrataciones,
        }
    }       
}
