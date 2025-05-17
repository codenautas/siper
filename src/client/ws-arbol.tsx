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

function NodoArbol(props:{sector: ctts.Sectores}){
    const { sector } = props;
    return <table className="nodo-arbol">
        <tbody>
            <tr className="arbol-margen-superior">
                <td/>
                <td/>
                <td className="arbol-conector-superior"/>
                <td/>
            </tr>
            <tr className="arbol-linea-nodo">
                <td/>
                <td className="arbol-contenido-nodo" colSpan={2}>
                    <h2>{sector.sector}</h2>
                    <p>{sector.nombre_sector}</p>
                </td>
                <td/>
            </tr>
            <tr className="arbol-linea-subnodos">
            </tr>
        </tbody>
    </table>;
}

function MarcoArbol(props:{conn:Connector, fixedFields: FixedFields}){
    const { conn, fixedFields } = props;
    const [sectores, setSectores] = useState<ctts.Sectores[]>([]);
    const sectorRaiz = fixedFields.find((field) => field.fieldName === 'sector') ?? '1';
    useEffect(() => {
        conn.ajax.table_data<ctts.Sectores>({table:'sectores', fixedFields:[], paramfun: {}}).then((sectores) => {
            setSectores(sectores);
        }).catch((error) => {
            logError(error);
        });
    }, [fixedFields]);
    return <div>
        <h1>Marco de Árbol</h1>
        <div>
            {sectores.filter((sector) => sector.sector === sectorRaiz).map(sector => NodoArbol({sector}))}
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
