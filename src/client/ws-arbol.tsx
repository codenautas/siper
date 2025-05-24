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

import {
    Box,
    Slider, 
} from "@mui/material";

export function logError(error:Error){
    console.error(error);
    my.log(error);
}

type Sectores = ctts.Sectores & {
    jefes?: ctts.Persona[]
}


function SliderNivel(props:{verNivelSectorHasta:number, onChangeLevel:(level:number)=>void}){
    const marks = [
        { value: 0, label: 'DE'},
        { value: 1, label: 'DG'},
        { value: 2, label: 'SDG'},
        { value: 3, label: 'DIR'},
        { value: 4, label: 'DEP'},
        { value: 5, label: 'DIV'},
    ];
    function valuetext(value: number) {
        return marks.find(v=>v.value==value)?.label ?? '?';
    }
    return (
        <Box sx={{ width: 150, paddingRight: 6 }}>
            <Slider
               defaultValue={2}
               getAriaValueText={valuetext}
               step={1}
               max={5}
               valueLabelDisplay="on"
               marks={marks}
               onChange={(_,v) => {
                    props.onChangeLevel(typeof v == "number" ? v : v[0])
               }}
            />
        </Box>
    );
}

function NodoArbol(props:{
    sector: Sectores, 
    salto?: number
    sectores: Sectores[], 
    esPrimero?: boolean,
    esUltimo?: boolean,
    nivelSectorHasta: number,
    abiertos: Record<string,boolean>, setAbiertos: React.Dispatch<React.SetStateAction<Record<string,boolean>>>
}){
    const { sector, sectores, nivelSectorHasta, abiertos, setAbiertos, esPrimero, esUltimo } = props;
    const abierto = abiertos[sector.sector] || sector.nivel <= (nivelSectorHasta ?? 0);
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
                    colSpan={2} onClick={event => {
                        if(!event.ctrlKey && event.button!=1){
                            setAbiertos({...abiertos, [sector.sector]:!abierto})
                            event.preventDefault();
                        }
                    }}
                    arbol-nodo-estado={abierto ? "abierto" : (hijos.length ? "abrible" : "final")}
                >
                    <a href={`./menu#w=sectores&ff=,sector:${sector.sector}`} className="arbol-nodo">
                        <div className="arbol-nodo-encabezado">
                            <span className="arbol-codigo">{sector.sector}</span>
                            {hijos.length ? <span className="arbol-hijos">{hijos.length}</span> : null}
                        </div>
                        <div className="arbol-sector">{sector.nombre_sector}</div>
                        {sector.jefes?.map(jefe=> <>
                            <div arbol-jefe="apellido">{jefe.apellido}</div>
                            <div arbol-jefe="nombre"  >{jefe.nombres}</div>
                        </>)}
                    </a>
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
                        sector: hijo, salto: hijo.nivel - sector.nivel - 1, sectores, esPrimero: i == 0, esUltimo: i == hijos.length - 1, nivelSectorHasta, abiertos, setAbiertos
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
    const [nivelSectorHasta, setNivelSectorHasta] = useState(0);
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
    setInterval(prepareGrab, 2000);
    prepareGrab();
    return <div className="marco-arbol">
        <h1 className="arbol-barra-titulo"><span>Estructura</span> <SliderNivel verNivelSectorHasta={nivelSectorHasta} onChangeLevel={setNivelSectorHasta}/></h1>
        <div>
            {sectores.filter((sector) => sector.sector == sectorRaiz).map(sector => NodoArbol({sector, sectores, nivelSectorHasta, abiertos, setAbiertos}))}
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

var prepareGrab = () => {
    const container = document.getElementsByClassName("nodo-arbol")[0]; // o usa document.body si tu contenido está ahí

    if (!container) return; 

    // @ts-ignore
    if (prepareGrab.initialized) return;
    // @ts-ignore
    prepareGrab.initialized = true;

    container.classList.add('grab');
    let isDown:boolean
    let startX:number
    let scrollLeft:number

    window.addEventListener('mousedown', (e) => {
        isDown = true;
        container.classList.remove('grab');
        container.classList.add('grabbing');
        startX = e.pageX;
        scrollLeft = container.scrollLeft;
    });

    window.addEventListener('mouseleave', () => {
        isDown = false;
        container.classList.remove('grabbing');
        container.classList.add('grab');
    });

    window.addEventListener('mouseup', () => {
        isDown = false;
        container.classList.remove('grabbing');
        container.classList.add('grab');
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX;
        const walk = (x - startX) * 1; // velocidad del arrastre
        container.scrollLeft = scrollLeft - walk;
    });
};