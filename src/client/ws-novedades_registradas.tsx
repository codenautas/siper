import { renderCardEditor, Connector } from "frontend-plus";


// @ts-ignore 
var my=myOwn;


// @ts-ignore
myOwn.wScreens.registroNovedades = function registroNovedades(addrParams:any){
    renderCardEditor(
        myOwn as never as Connector,
        { ...addrParams, table: 'novedades_registradas' },
        document.getElementById('total-layout')!
    )
}

