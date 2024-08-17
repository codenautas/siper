import { renderCardEditor, Connector } from "frontend-plus";

import { Persona } from "../common/contracts"

// @ts-ignore 
var my=myOwn;

/* Dos líneas para incluir contracts: */
var persona: Persona | null = null;
console.log(persona)

// @ts-ignore
myOwn.wScreens.registroNovedades = function registroNovedades(addrParams:any){
    renderCardEditor(
        myOwn as never as Connector,
        { ...addrParams, table: 'novedades_registradas' },
        document.getElementById('total-layout')!
    )
}

