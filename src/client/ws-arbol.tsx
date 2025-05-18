import * as React from "react";

import {
    useEffect, useState, 
} from "react";

import * as ctts from "../common/contracts"

import { 
    Connector,
    FixedFields,
    renderConnectedApp,
} from "frontend-plus";

export function logError(error:Error){
    console.error(error);
    my.log(error);
}

type Sectores = ctts.Sectores & {
    jefes?: ctts.Persona[]
}

function NodoArbol(props:{
    sector: Sectores, 
    salto?: number
    sectores: Sectores[], 
    esPrimero?: boolean,
    esUltimo?: boolean,
    abiertos: Record<string,boolean>, setAbiertos: React.Dispatch<React.SetStateAction<Record<string,boolean>>>
}){
    const { sector, sectores, abiertos, setAbiertos, esPrimero, esUltimo } = props;
    const abierto = abiertos[sector.sector];
    const hijos = sectores.filter((s) => s.pertenece_a == sector.sector);
    const esRaiz = !sector.pertenece_a;
    const techoIzquierdo = !esPrimero && !esRaiz ? "arbol-techo" : "";
    const techoDerecho = !esUltimo && !esRaiz ? "arbol-techo" : "";
    return <table className="nodo-arbol">
        <tbody>
            <tr className="arbol-margen-horizontal">
                <td className={techoIzquierdo}/>
                <td className={techoIzquierdo}/>
                <td className={techoDerecho + (!esRaiz ? " arbol-conector-superior" : "")}>
                    {props.salto != null && props.salto > 0 ? <div className="arbol-salto" style={{height: `${props.salto * 10}em`}}/> : null}
                </td>
                <td className={techoDerecho}/>
            </tr>
            <tr className="arbol-linea-nodo">
                <td className="arbol-margen-lateral"/>
                <td className={"arbol-contenido-nodo "+(abierto && hijos.length > 0 ? "arbol-contenido-nodo-abierto" : "" )} 
                    colSpan={2} onClick={() => {setAbiertos({...abiertos, [sector.sector]:!abierto})}}
                    arbol-nodo-estado={abierto ? "abierto" : (hijos.length ? "abrible" : "final")}
                >
                    <div>
                        <div className="arbol-nodo-encabezado">
                            <span className="arbol-codigo">{sector.sector}</span>
                            {hijos.length ? <span className="arbol-hijos">{hijos.length}</span> : null}
                        </div>
                        <div className="arbol-sector">{sector.nombre_sector}</div>
                        {sector.jefes?.map(jefe=> <>
                            <div arbol-jefe="apellido">{jefe.apellido}</div>
                            <div arbol-jefe="nombre"  >{jefe.nombres}</div>
                        </>)}
                    </div>
                </td>
                <td className="arbol-margen-lateral"/>
            </tr>
            {abierto && hijos.length > 0 ?
                <tr className="arbol-margen-horizontal">
                    <td/>
                    <td/>
                    <td className="arbol-conector-superior"/>
                    <td/>
                </tr>
            :null}
            {abierto && hijos.length > 0 ?
                <tr className="arbol-linea-subnodos">
                    <td colSpan={4} className="arbol-td-subnodo">
                    {hijos.map((hijo, i) => <span className="arbol-subnodo" key={hijo.sector}>{NodoArbol({
                        sector: hijo, salto: hijo.nivel - sector.nivel - 1, sectores, esPrimero: i == 0, esUltimo: i == hijos.length - 1, abiertos, setAbiertos
                    })}</span>)}
                    </td>
                </tr>
            :null}
        </tbody>
    </table>;
}

function MarcoArbol(props:{conn:Connector, fixedFields: FixedFields}){
    const { conn, fixedFields } = props;
    const [sectores, setSectores] = useState<Sectores[]>([]);
    const [abiertos, setAbiertos] = useState<Record<string,boolean>>({});
    const sectorRaiz = fixedFields.find((field) => field.fieldName == 'sector')?.value ?? '1';
    useEffect(() => {
        conn.ajax.table_data<ctts.Sectores>({table:'sectores', fixedFields:[], paramfun: {}}).then((s) => {
            const sectores:Sectores[] = s.filter(s => s.activo);
            setSectores(sectores);
            conn.ajax.table_data<
                // @ts-expect-error confunde RealDate con Date
                ctts.Persona
            >({table:'personas', fixedFields:[], paramfun: {}}).then((persona) => {
                setSectores(sectores.map((sector) => {
                    const jefes = persona.filter((p) => p.sector == sector.sector && p.es_jefe);
                    return {
                        ...sector,
                        jefes
                    };
                }))
            }).catch((error) => {
                logError(error);
            });
        }).catch((error) => {
            logError(error);
        });
    }, [fixedFields]);
    return <div className="marco-arbol">
        <h1>Estructura</h1>
        <div>
            {sectores.filter((sector) => sector.sector == sectorRaiz).map(sector => NodoArbol({sector, sectores, abiertos, setAbiertos}))}
        </div>
    </div>
}

// @ts-ignore
myOwn.wScreens.sectores = function sectores(addrParams:any){
    renderConnectedApp(
        myOwn as never as Connector,
        { ...addrParams },
        document.getElementById('main_layout')!,
        ({ conn, fixedFields }) => (<MarcoArbol conn={conn} fixedFields={fixedFields}/>
        )
    );
}
