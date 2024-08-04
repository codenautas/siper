import { renderCardEditor, Connector } from "frontend-plus";


// @ts-ignore 
var my=myOwn;


// @ts-ignore
myOwn.wScreens.registroNovedades = function registroNovedades(addrParams:any){
    renderCardEditor(
        myOwn as never as Connector,
        { ...addrParams, table: 'registro_novedades' },
        document.getElementById('total-layout')!
    )
}

