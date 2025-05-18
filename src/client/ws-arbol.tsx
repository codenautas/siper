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
    jefe?: string;      
}

function NodoArbol(props:{
    sector: Sectores, 
    sectores: Sectores[], 
    esPrimero?: boolean,
    esUltimo?: boolean,
    abiertos: Record<string,boolean>, setAbiertos: React.Dispatch<React.SetStateAction<Record<string,boolean>>>
}){
    const { sector, sectores, abiertos, setAbiertos, esPrimero, esUltimo } = props;
    const abierto = abiertos[sector.sector];
    const hijos = sectores.filter((s) => s.pertenece_a === sector.sector);
    const esRaiz = !sector.pertenece_a;
    const techoIzquierdo = !esPrimero && !esRaiz ? "arbol-techo" : "";
    const techoDerecho = !esUltimo && !esRaiz ? "arbol-techo" : "";
    return <table className="nodo-arbol">
        <tbody>
            <tr className="arbol-margen-horizontal">
                <td className={techoIzquierdo}/>
                <td className={techoIzquierdo}/>
                <td className={techoDerecho + (!esRaiz ? " arbol-conector-superior" : "")}/>
                <td className={techoDerecho}/>
            </tr>
            <tr className="arbol-linea-nodo">
                <td className="arbol-margen-lateral"/>
                <td className={"arbol-contenido-nodo "+(abierto && hijos.length > 0 ? "arbol-contenido-nodo-abierto" : "" )} colSpan={2} onClick={() => {setAbiertos({...abiertos, [sector.sector]:!abierto})}}>
                    <div>
                        <div className="arbol-codigo">{sector.sector}</div>
                        <div className="arbol-sector">{sector.nombre_sector}</div>
                        <div className="arbol-jefe">{sector.jefe}</div>
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
                        sector: hijo, sectores, esPrimero: i == 0, esUltimo: i == hijos.length - 1, abiertos, setAbiertos
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
    const sectorRaiz = fixedFields.find((field) => field.fieldName === 'sector') ?? '1';
    useEffect(() => {
        conn.ajax.table_data<Sectores>({table:'sectores', fixedFields:[], paramfun: {}}).then((sectores) => {
            setSectores(sectores);
            conn.ajax.table_data<
                // @ts-expect-error confunde RealDate con Date
                ctts.Persona
            >({table:'personas', fixedFields:[], paramfun: {}}).then((persona) => {
                setSectores(sectores.map((sector) => {
                    const jefe = persona.find((p) => p.sector === sector.sector && p.es_jefe);
                    return {
                        ...sector,
                        jefe: jefe ? `${jefe.apellido}, ${jefe.nombres}` : '',
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
            {sectores.filter((sector) => sector.sector === sectorRaiz).map(sector => NodoArbol({sector, sectores, abiertos, setAbiertos}))}
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
