import * as React from "react";
import * as ReactDOM from "react-dom";

import {
    ReactNode,
    useEffect, useState, 
} from "react";

import { 
    Connector,
    FixedFields,
    ICON,
    renderConnectedApp,
    RowType
} from "frontend-plus";

import {
    Accordion, AccordionSummary, AccordionDetails, AppBar,
    Box, Button, 
    Card, CircularProgress,
    Dialog, 
    IconButton, InputBase,
    List, ListItemButton,
    MenuItem, 
    Paper,
    Select, Slider,
    Toolbar, Typography, TextField,
    Checkbox,
    Tooltip
} from "@mui/material";

import { date, RealDate, compareForOrder, sameValue } from "best-globals";

import { CalendarioResult, Annio, meses, NovedadesDisponiblesResult, PersonasNovedadActualResult, NovedadRegistrada, ParametrosResult,
    InfoUsuario,
    FichadaData,
    RegistroFichadasResponse
} from "../common/contracts"
import * as ctts from "../common/contracts"
import { strict as likeAr, createIndex } from "like-ar";
import { DefinedType } from "guarantee-type";
import { AppConfigClientSetup } from "../server/types-principal";

const EFIMERO = Symbol("EFIMERO");
function setEfimero<T extends object|null>(tictac:T){
    if (tictac != null) {
        // @ts-expect-error Situación especial para marcar objetos que ya no están disponibles porque se pidió un dato nuevo
        tictac[EFIMERO] = true;
    }
    return tictac
}

export function logError(error:Error){
    console.error(error);
    my.log(error);
}

export function Componente(props:{children:ReactNode[]|ReactNode, componentType:string, scrollable?: boolean, 
    esEfimero?: any
}){
    return <Card className={"componente-" + props.componentType} 
        siper-es-efimero={props.esEfimero === true || props.esEfimero?.[EFIMERO] ? "si" : "no"}
        siper-es-scrollable={props.scrollable === true ? "si" : "no"}
        sx={{ backgroundImage: `url('${myOwn.config.config["background-img"]}')` }}
    >
        {props.children}
    </Card>
}

export function ValueDB(props:{value:any}){
    var {value} = props
    switch(typeof value){
        case "object": if (value == null) return <span/>;
            else if (value instanceof Date) {
                if (
                    // @ts-ignore
                    value.isRealDate
                ) {
                    return <span>{(value as RealDate).toDmy()}</span>
                } else {
                    return <span className="error-valor">{value.toString()}</span>
                }
            } else {
                return <span className="error-valor">{JSON.stringify(value)}</span> 
            }
        case "string": return <span>{value}</span>
        case "number": return <span>{value}</span>
        default: return <span className="error-valor">{value}</span> 
    }
}
type DDSKeys = `dds${0 | 1 | 2 | 3 | 4 | 5 | 6}`;

export const DDS = {
    0: {abr:'dom', habil:false , nombre:'domingo'  },
    1: {abr:'lun', habil:true , nombre:'lunes'    },
    2: {abr:'mar', habil:true , nombre:'martes'   },
    3: {abr:'mié', habil:true , nombre:'miércoles'},
    4: {abr:'jue', habil:true , nombre:'jueves'   },
    5: {abr:'vie', habil:true , nombre:'viernes'  },
    6: {abr:'sáb', habil:false , nombre:'sábado'   },
}

type ULTIMA_NOVEDAD = number;

function puedeCargarNovedades(infoUsuario: InfoUsuario) {
    return !!(
        infoUsuario.puede_cargar_propio ||
        infoUsuario.puede_cargar_todo ||
        infoUsuario.puede_cargar_dependientes ||
        infoUsuario.puede_corregir_el_pasado
    );
}

function Calendario(props:{conn:Connector, idper:string, fecha: RealDate, fechaHasta?: RealDate, fechaActual: RealDate, 
    annio:number, infoUsuario:InfoUsuario
    onFecha?: (fecha: RealDate) => void, onFechaHasta?: (fechaHasta: RealDate) => void, ultimaNovedad?: ULTIMA_NOVEDAD
    onAnnio?: (annio:number) => void
}){
    const {conn, fecha, fechaHasta, idper, ultimaNovedad, fechaActual, annio, infoUsuario} = props;
    const [annios, setAnnios] = useState<Annio[]>([]);
    type Periodo = {mes:number, annio:number}
    const [mes, setMes] = useState(fecha.getMonth()+1);
    const [periodo, setPeriodo] = [{mes, annio}, (x:Periodo) => {setMes(x.mes); props.onAnnio?.(x.annio);}]
    const retrocederUnMes = ({mes: (mes == 1 ? 12 : mes - 1), annio: (annio - (mes == 1  ? 1 : 0 ))})
    const avanzarUnMes    = ({mes: (mes == 12 ? 1 : mes + 1), annio: (annio + (mes == 12 ? 1 : 0 ))})
    const [calendario, setCalendario] = useState<CalendarioResult[][]>([]);
    const [botonRetrocederHabilitado, setBotonRetrocederHabilitado] = useState<boolean>(true); 
    const [botonAvanzarHabilitado, setBotonAvanzarHabilitado] = useState<boolean>(true); 
    const puede_cargar_novedades = puedeCargarNovedades(infoUsuario);

    useEffect(function(){
        // ver async
        // @ts-ignore infinito
        conn.ajax.table_data<Annio>({table: 'annios', fixedFields: [],paramfun:{} }).then(annios => {
            //Establezco en que mes y año está posicionado, verifica si hay año anterior/posterior y habilita/deshabilita boton retrocerder/avanzar
            const currentYear = periodo.annio;
            const currentMonth = periodo.mes;
            const tieneAñoAnterior = annios.some(annio => annio.annio === currentYear - 1);
            const tieneAñoSiguiente = annios.some(annio => annio.annio === currentYear + 1);
    
            setBotonRetrocederHabilitado(currentMonth !== 1 || tieneAñoAnterior);
            setBotonAvanzarHabilitado(currentMonth !== 12 || tieneAñoSiguiente);
            
            setAnnios(annios);
        }).catch(logError);
        {
            setCalendario(setEfimero)
            conn.ajax.calendario_persona({idper, ...periodo}).then(dias => {
                var primerSemana: number = Number.MAX_SAFE_INTEGER;
                type Dia = (typeof dias)[number]
                var semanas: Dia[][] = [];
                for (var dia of dias) {
                if (dia.semana != null && primerSemana > dia.semana) primerSemana = dia.semana;
                    var semana = semanas[dia.semana];
                    if (!semana) {
                        semana = [
                            {dds: 0} as Dia,
                            {dds: 1} as Dia,
                            {dds: 2} as Dia,
                            {dds: 3} as Dia,
                            {dds: 4} as Dia,
                            {dds: 5} as Dia,
                            {dds: 6} as Dia,
                        ]
                        semanas[dia.semana] = semana
                    }
                    semana[dia.dds] = dia
                }
                setCalendario(semanas.slice(primerSemana ?? 0))
            }).catch(logError)
        }
    },[idper, periodo.mes, periodo.annio, ultimaNovedad])

    const isPastMonth = periodo.mes < fechaActual.getMonth() + 1 && periodo.annio === fechaActual.getFullYear() || periodo.annio < fechaActual.getFullYear();
    const isFutureMonth = periodo.mes > fechaActual.getMonth() + 1 && periodo.annio === fechaActual.getFullYear() || periodo.annio > fechaActual.getFullYear();

    return <Componente componentType="calendario-mes" esEfimero={calendario}>
        <Box className="box-flex">
            <Box>
                <Button onClick={_ => setPeriodo(retrocederUnMes)} disabled={!botonRetrocederHabilitado} className="siper-button" boton-negro="si" ><ICON.ChevronLeft/></Button>
                <Button onClick={_ => setPeriodo(avanzarUnMes)} disabled={!botonAvanzarHabilitado} className="siper-button" boton-negro="si"><ICON.ChevronRight/></Button>
                <Select 
                    className="selector-mes"
                    value={periodo.mes}
                    onChange={(event) => { // buscar el tipo correcto
                        setPeriodo({mes:Number(event.target.value), annio:periodo.annio});
                    }}
                >
                    {meses.map((mes) => (
                        <MenuItem key={mes.value} value={mes.value}>
                            {mes.name}
                        </MenuItem>
                    ))}
                </Select>
                <Select 
                    className="selector-annio"
                    value={periodo.annio ?? new Date().getFullYear()}
                    onChange={(event) => { // buscar el tipo correcto
                        setPeriodo({mes:periodo.mes, annio:Number(event.target.value)});
                    }}
                >
                    {(!annios?.length ? [{annio:new Date().getFullYear(), cerrado:false}] : annios).map((annio:Annio) => (
                            <MenuItem key={annio.annio} value={annio.annio}>
                                {annio.annio.toString()}
                            </MenuItem>
                    ))}
                </Select>
                <Button
                    variant="outlined"
                    es-este-mes={isFutureMonth?"no-futuro":isPastMonth?"no-pasado":"si"}
                    onClick={()=>{ 
                        setPeriodo({mes: fechaActual.getMonth()+1, annio: fechaActual.getFullYear()});
                        props.onFecha?.(fechaActual);
                        props.onFechaHasta?.(fechaActual);
                    }}
                >
                    <span hoy-signo-de="futuro">{"<"}</span>
                    Hoy
                    <span hoy-signo-de="pasado">{">"}</span>
                </Button>
            </Box>
            <Box className="calendario-semana">
                {likeAr(DDS).map(dds =>
                    <div key={dds.abr} className={"calendario-nombre-dia " + (dds.habil ? "" : "tipo-dia-no-laborable")}>{dds.abr}</div>
                ).array()}
            </Box>
            {calendario.map(semana => <Box key={semana[0].semana} className="calendario-semana">
                {semana.map((dia, i) => 
                <Tooltip key={dia.dia || "V" + i} title={dia.novedad || "Sin novedad"} arrow>
                <div
                    className={`calendario-dia tipo-dia-${dia.tipo_dia} 
                        ${fecha && sameValue(dia.fecha, fecha) ? 'calendario-dia-seleccionado' : ''}
                        ${fechaHasta != null && fecha <= dia.fecha && dia.fecha <= fechaHasta ? 'calendario-dia-seleccionado' : ''}`}
                    es-otro-mes={dia.mismo_mes ? "no" : "si"}
                    onClick={() => {
                        if (!dia.fecha || !props.onFecha || !props.onFechaHasta || !puede_cargar_novedades || (dia.fecha < fechaActual && !infoUsuario.puede_corregir_el_pasado)) return;
                        const selectedDate = dia.fecha as RealDate;
                        if (!fechaHasta || selectedDate <= fechaHasta || fechaHasta.getFullYear() != selectedDate.getFullYear()) {
                            props.onFecha(selectedDate);
                            props.onFechaHasta(selectedDate);
                        } 
                        else {
                            props.onFechaHasta(selectedDate);
                        }
                        if (dia.fecha.getMonth() + 1 !== periodo.mes) {
                            setPeriodo({mes: dia.fecha.getMonth() + 1, annio: dia.fecha.getFullYear()});
                        }
                    }}
                >
                    <span className="calendario-dia-numero">{dia.dia ?? ''}</span>
                    <span className={`calendario-dia-contenido ${dia ? 'con_novedad_si' : 'con_novedad_no' }`}>{dia.cod_nov ?? ''}</span>
                </div>
                </Tooltip>)}
            </Box>)}
            <Box>
                {fecha && fechaHasta && (fecha.valueOf() !== fechaHasta.valueOf() ?
                    <Typography>
                        Fechas seleccionadas: 
                        {` ${fecha.toLocaleDateString()} - ${fechaHasta.toLocaleDateString()}`}
                    </Typography> :
                    <Typography>
                        Fecha seleccionada: {fecha.toLocaleDateString()}
                    </Typography>
                )}
            </Box>
        </Box>
    </Componente>
}

// @ts-ignore
type ProvisorioPersonas = {sector?:string, idper:string, apellido:string, nombres:string, cuil:string, ficha?:string, idmeta4?:string, cargable?:boolean, cuil_valido?:boolean, 
    fecha_ingreso?:RealDate, fecha_egreso?:RealDate /*, activo?:boolean, fecha_nacimiento?:RealDate, nombre_sector?:string, jerarquia?:string, jerarquias__descripcion?:string, cargo_atgc?:string, agrupamiento?:string, tramo?:string, grado?:string, domicilio?:string, nacionalidad?:string, sectores__nombre_sector?:string*/};
type ProvisorioPersonaLegajo = ProvisorioPersonas & {tipo_doc:string, documento:string, sector:string, es_jefe:boolean, categoria:string, situacion_revista:string, registra_novedades_desde:RealDate, para_antiguedad_relativa:RealDate, activo:boolean, fecha_ingreso:RealDate, fecha_egreso:RealDate, nacionalidad:string, jerarquia:string, jerarquias__descripcion:string, cargo_atgc:string, agrupamiento:string, tramo:string, grado:string, domicilio:string, fecha_nacimiento:RealDate, sectores__nombre_sector:string, perfil_sgc:number, perfiles_sgc__nombre:string, banda_horaria:string, bandas_horarias__descripcion:string, sexo:string, sexos__descripcion:string, motivo_egreso?:string, motivos_egreso__descripcion?:string, cuil_valido?:boolean};
type ProvisorioPersonaDomicilio = {idper:string, barrios__nombre_barrio:string,calles__nombre_calle:string, nombre_calle:string, altura:string, piso:string, depto:string, tipos_domicilio__descripcion:string, tipo_domicilio:string, provincias__nombre_provincia:string, provincia:string, barrio:string, codigo_postal:string, localidad:string, nro_item:string, orden:number}
type ProvisorioPersonaTelefono = {idper: string, tipo_telefono: string, tipos_telefono__descripcion?: string, telefono: string, observaciones?: string, nro_item?: number, orden?: number}
type ProvisorioSectores = {pactivas: number, activo: boolean,sector:string, nombre_sector:string, pertenece_a:string, nivel:number};
type ProvisorioSectoresAumentados = ProvisorioSectores & {perteneceA: Record<string, boolean>, hijos:ProvisorioSectoresAumentados[], profundidad:number}

type ProvisorioNovedadesRegistradas = {idper:string, cod_nov:string, desde:RealDate, hasta:RealDate, cod_novedades__novedad:string, dds0: boolean, dds1: boolean, dds2: boolean, dds3: boolean, dds4: boolean, dds5: boolean, dds6: boolean, detalles:string, idr:number, dias_hoc:string, usuario:string, fecha:RealDate, tipo_novedad:string, tipos_novedad__orden:number, tipos_novedad__borrado_rapido:boolean}

interface DetalleAnioNovPer {
    origen: string;
    cantidad: number;
    usados: number;
    pendientes: number;
    saldo: number;
}

type ProvisorioDetalleNovPer = {detalle:DetalleAnioNovPer[], error?:string[]}

const DETALLE_VACIO:ProvisorioDetalleNovPer = {detalle:[]};


type IdperFuncionCambio = (persona:ProvisorioPersonas)=>void

function SearchBox(props: {
    children?: ReactNode,    
    onChange:(newValue:string)=>void, 
    todas?:boolean|null, onTodasChange?:(newValue:boolean)=>void, 
    ordenPorNovedad?:boolean|null, onOrdenPorNovedadChange?:(newValue:boolean)=>void,
    permisos?:boolean|null
}){
    var [textToSearch, setTextToSearch] = useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    return <Paper className="search-box">
        <IconButton
            onClick={() => {
                inputRef.current?.focus();
            }}
            className="siper-button"
            boton-negro="si"
        >
            <ICON.Search/>
        </IconButton>
        <InputBase
            inputRef={inputRef}
            value = {textToSearch} 
            onChange = {(event)=>{ var newValue = event.target.value; props.onChange(newValue); setTextToSearch(newValue)}}
        />
        <Button onClick={_=>{props.onChange(""); setTextToSearch("")}} className="siper-button" boton-negro="si" es-visible={textToSearch? "si" : "no"}><ICON.BackspaceOutlined/></Button>
        {props.todas != null ? <>
            {props.permisos && 
            <label>
                <Checkbox
                    checked={props.todas}
                    disabled={!props.onTodasChange}
                    onChange={(_event, checked) => props.onTodasChange?.(checked)}
                    className="check-box"
                    sin-padding="si"
                /> todas
            </label>
            }
            <Button 
                className="siper-button" boton-negro="si"
                onClick={_ => {
                // @ts-ignore
                props.onOrdenPorNovedadChange(!props.ordenPorNovedad)
                }} 
            >
                {props.ordenPorNovedad
                    ? <ICON.SortByNum />
                    : <ICON.SortByAlpha />
                }
            </Button>
        </> : null }
        {props.children}        
    </Paper>;
}

function GetRecordFilter<T extends RowType>(filter:string, attributteList:(keyof T)[], todas?:boolean, principalesKey?:(keyof T)[]){
    // Normaliza texto
    const normalize = (text: string) =>
        text
            .toUpperCase()
            .normalize("NFD") // separa letras de los acentos
            .replace(/[\u0300-\u036f]/g, '') // elimina los acentos
            .replace(/[^A-Z0-9Ñ ]+/g, '');

    var principales:(row:T) => boolean = todas || !principalesKey ? ()=>true :(row) => principalesKey.some((a) => row[a])
    if (!filter.trim()) return principales;
    var normalizedFilter = normalize(filter).trim().replace(/\s+/g, ' ');
    var palabras = normalizedFilter.split(' ').filter(Boolean);
    var regExp = new RegExp(palabras.map(p=>`(${p})`).join('.*'), 'i');
    return function(row: T){
        return principales(row) && attributteList.some((a) => regExp.test(normalize(String(row[a] ?? ''))))
    }
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
        <Box sx={{ width: 150 }}>
            <Slider
               defaultValue={props.verNivelSectorHasta}
               getAriaValueText={valuetext}
               step={1}
               max={5}
               valueLabelDisplay="on"
               marks={marks}
               onChange={(_,v) => props.onChangeLevel(typeof v == "number" ? v : v[0])}
            />
        </Box>
    );
}

function ListaPersonasEditables(props: {conn: Connector, sector:string, idper:string, fecha:RealDate, onIdper?:IdperFuncionCambio, infoUsuario:InfoUsuario}){
    const {conn, idper, fecha, onIdper, infoUsuario} = props;
    const [sector, _setSector] = useState(props.sector);
    const [sectores, setSectores] = useState<ProvisorioSectoresAumentados[]>([]);
    const [listaPersonas, setListaPersonas] = useState<PersonasNovedadActualResult[]>([]);
    const [abanicoPersonas, setAbanicoPersonas] = useState<Partial<Record<string, PersonasNovedadActualResult[]>>>({});
    const [filtro, setFiltro] = useState("");
    const [expandido, setExpandido] = useState<Record<string, boolean>>({})
    const [verNivelSectorHasta, setVerNivelSectorHasta] = useState(Math.max(2,Math.min(5,infoUsuario.sector_nivel + 1 || 2)));
    const APELLIDOYNOMBRES = 'apellidoynombres' as keyof PersonasNovedadActualResult
    const attributosBuscables:(keyof PersonasNovedadActualResult)[] = ['apellido', 'nombres', 'cuil', 'ficha', 'idmeta4', 'idper', 'nombre_sector', APELLIDOYNOMBRES]
    useEffect(function(){
        const recordFilter = GetRecordFilter<PersonasNovedadActualResult>(filtro, attributosBuscables);
        const personasFiltradas = listaPersonas.filter(recordFilter)
        var abanico = Object.groupBy(personasFiltradas, p => p.sector);
        var abrir:Record<string, boolean> = {[sector]: true}
        setAbanicoPersonas(abanico);
        if (filtro) {
            personasFiltradas.forEach(p=>{
                abrir[p.sector] = true;
            })
            setExpandido(e=>({...e, ...abrir}));
        } else {
            setExpandido( {} );
        }
    }, [listaPersonas, filtro])
    useEffect(function(){
        setListaPersonas(setEfimero)
        conn.ajax.personas_novedad_actual({fecha}).then(personas => {
            setListaPersonas(personas);
        }).catch(logError);
        conn.ajax.table_data<ProvisorioSectores>({
            table: 'sectores',
            fixedFields: [{fieldName: 'activo', value: true}],
            paramfun: {}
        }).then(async (sectores) => {
            const sectoresAumentados = sectores.map(s => ({...s, profundidad:0, hijos:[] as ProvisorioSectoresAumentados[], perteneceA:{[s.sector]: true} as Record<string, boolean>}));            
            const idxSectores = createIndex(sectores, 'sector');
            sectoresAumentados.forEach(s => {
                var {pertenece_a} = s;
                var profundidad = 0
                while (pertenece_a != null && ++profundidad < 100) {
                    s.perteneceA[pertenece_a] = true;
                    pertenece_a = idxSectores[pertenece_a].pertenece_a
                }
                s.profundidad = profundidad;
            })
            setSectores(sectoresAumentados);
        }).catch(logError)
    }, [fecha.getMilliseconds()]);

    // @ts-expect-error
    var es:{registra:boolean} = conn.config?.config?.es||{}
    if (!es.registra) return <LegajoPer conn={props.conn} idper={idper}/>
    return <Componente componentType="lista-personas" scrollable={true} esEfimero={listaPersonas}>
        <SearchBox onChange={setFiltro}> 
            <SliderNivel verNivelSectorHasta={verNivelSectorHasta} onChangeLevel={setVerNivelSectorHasta}/>
        </SearchBox>
        {sectores.filter(s => s.perteneceA[sector] || infoUsuario.puede_cargar_todo).map(s =>
            filtro && !abanicoPersonas[s.sector]?.length ? null :
            <Accordion key = {s.sector?.toString()} expanded = {!!expandido[s.sector]}
                onChange={(_, b: boolean) => { setExpandido(e => ({...e, [s.sector]:b })) }}
                className="accordion-bg"
                sx={{ backgroundImage: `url('${myOwn.config.config["background-img"]}')` }}
                hidden = {s.nivel > verNivelSectorHasta && !expandido[s.pertenece_a] && !expandido[s.sector]}
            >
                <AccordionSummary className="accordion-summary" id = {s.sector} expandIcon={<ICON.NavigationDown />} > 
                    <span className="box-id" style={{paddingLeft: (s.nivel-1)+"em", paddingRight:"1em"}}> {s.sector} </span>
                    {s.nombre_sector}
                </AccordionSummary>
                <AccordionDetails>
                    <List>
                        {abanicoPersonas[s.sector]?.map(p=>
                            <ListItemButton key = {p.idper} onClick={() => {if (onIdper != null) onIdper(p as ProvisorioPersonas)}} 
                                    className={`${p.idper == idper ? ' seleccionado' : ''} ${p.cargable ? ' seleccionable' : 'no-seleccionable'}`}>
                                <span className="box-id persona-id">{p.idper}</span>
                                <span className="box-names" bold-name={p.es_jefe ? 'si' : 'no'}>
                                    {p.apellido}, {p.nombres}
                                </span>
                                <span className="box-info"> {p.cod_nov ? p.cod_nov : 'S/N' } </span>
                            </ListItemButton>
                        )}
                    </List>
                </AccordionDetails>
            </Accordion>
        )}
    </Componente>
}

function NovedadesRegistradas(props:{conn: Connector, idper:string, annio:number, ultimaNovedad?:number, persona:ProvisorioPersonas
    fechaActual:RealDate,
    onBorrado:()=>void}
){
    const {idper, conn, ultimaNovedad, fechaActual, annio, persona} = props;
    const [novedades, setNovedades] = useState<ProvisorioNovedadesRegistradas[]>([]);
    const [quiereBorrar, setQuiereBorrar] = useState<ProvisorioNovedadesRegistradas|null>(null);
    const [eliminando, setEliminando] = useState(false);
    const diasSemana: { [key: string]: string } = {
        dds0: "Dom",
        dds1: "Lun",
        dds2: "Mar",
        dds3: "Mie",
        dds4: "Jue",
        dds5: "Vie",
        dds6: "Sab",
      };
    const [verInfo, setVerInfo] = useState(false);

    useEffect(function(){
        setNovedades(setEfimero)
        conn.ajax.table_data<ProvisorioNovedadesRegistradas>({
            table: 'novedades_registradas',
            fixedFields: [{fieldName:'idper', value:idper}, {fieldName:'annio', value:annio}],
            paramfun: {}
        }).then(function(novedadesRegistradas){
            novedadesRegistradas.sort(compareForOrder([{column:'idr', order:-1}]))
            setNovedades(novedadesRegistradas);
        }).catch(logError)
    },[idper, ultimaNovedad, annio])
    // @ts-expect-error
    var es:{rrhh:boolean} = conn.config?.config?.es||{}
    return <Componente componentType="novedades-registradas" esEfimero={novedades}>
        <Box>
        <Button size="small" variant="outlined" onClick={() => setVerInfo(!verInfo)}>+ info</Button>
        </Box>
        {novedades.map(n => {
            const diasSeleccionados = Object.entries(n)
                .filter(([key, value]) => key.startsWith("dds") && value === true)
                .map(([key]) => diasSemana[key]);
            const problemas = [
                persona.fecha_ingreso && n.desde < persona.fecha_ingreso ? "Fecha desde anterior a la fecha de ingreso" : null,
                persona.fecha_egreso && n.hasta > persona.fecha_egreso ? "Fecha hasta posterior a la fecha de egreso" : null,
            ].filter(Boolean);
            return (
            <Box key={JSON.stringify(n)} >
            <Box className={`novedades-renglon ${ultimaNovedad == n.idr ? 'ultima-novedad' : ''}${quiereBorrar && quiereBorrar.idr === n.idr?' por-borrar':''}`} 
                tiene-problemas={problemas.length ? 'si' : 'no'} title={problemas.join('. ')}
            >
                <span className="fechas">
                    <span>{n.desde.toDmy().replace(/\/\d\d\d\d$/,'')}</span>
                    {sameValue(n.desde, n.hasta) ? null : <span> - </span>}
                    {sameValue(n.desde, n.hasta) ? null : <span>{n.hasta.toDmy().replace(/\/\d\d\d\d$/,'')}</span>}
                </span>
                <span className="cant">{n.dias_hoc.substring(0,n.dias_hoc.length-1)}<sub>{n.dias_hoc.substring(n.dias_hoc.length-1)}</sub></span>
                <span className="box-id cod_nov">{n.cod_nov}</span>
                <span className="razones">{n.cod_novedades__novedad} {n.detalles ? ' / ' + n.detalles : '' } 
                    {diasSeleccionados.length > 0 ? ' / ' + diasSeleccionados.join(', ') : ''}
                </span>
                <span className="borrar">{n.desde > fechaActual && es.rrhh && n.tipos_novedad__borrado_rapido? <Button color="error" onClick={()=>setQuiereBorrar(n)}><ICON.DeleteOutline/></Button> : null }</span>
            </Box>
            {verInfo &&
                <Box>
                <span style={{ display: 'block'}}> {n.fecha?.toDmy()} - {n.usuario} </span>
                </Box>
            }
            </Box>
            )
        })}
        <Dialog open={quiereBorrar != null}>
            {quiereBorrar == null ? null : (
                eliminando ? <div>
                    <div>Eliminando</div>
                    <CircularProgress/>
                </div> : <div className="modal-borrar-novedad">
                    ¿Confirma el borrado de la novedad registrada <strong>{quiereBorrar!.cod_novedades__novedad}</strong>
                    {
                        sameValue(quiereBorrar!.desde, quiereBorrar!.hasta)
                            ? `en ${quiereBorrar!.desde.toDmy()}`
                            : `entre ${quiereBorrar!.desde.toDmy()} y ${quiereBorrar!.hasta.toDmy()}`
                    }?
                    <div>
                    <Button variant="outlined" onClick={()=>setQuiereBorrar(null)}>Conservar</Button>
                    <Button variant="outlined" color="error" onClick={()=>{
                        setEliminando(true);
                        conn.ajax.table_record_delete({
                            table: 'novedades_registradas',
                            primaryKeyValues: [quiereBorrar!.idper, quiereBorrar!.desde, quiereBorrar!.idr]
                        }).then(()=>{
                            setQuiereBorrar(null);
                            setEliminando(false);
                            props.onBorrado();
                        }).catch(logError);
                    }}>Eliminar</Button>
                    </div>
                </div>
            )}
        </Dialog>
    </Componente>
}

function Horario(props:{conn: Connector, idper:string, fecha:RealDate}){
    const {fecha, idper, conn} = props
    const horarioVacio:HorarioSemanaVigenteResult = {desde: date.today(), hasta: date.today(), dias:{}, bh_descripcion:''} // corresponde today, es un default provisorio
    const [horario, setHorario] = useState(horarioVacio);
    useEffect(function(){
        setHorario(setEfimero)
        if (idper != null) {
            conn.ajax.horario_semana_vigente({ idper, fecha }).then(result => {
                setHorario(result);
            }).catch(logError);
        }
    },[idper, fecha])

    const desdeFecha = horario.desde;
    const hastaFecha = horario.hasta;

    function HorarioRenglon(props:{box:(data:HorarioSemanaVigenteDia) => ReactNode[]|ReactNode}){
        return <div className="horario-renglon">
            {horario?.dias && (
                Object.keys(horario.dias).map(dds => props.box(horario.dias[dds]))
            )}
        </div>
    }
    
    return <Componente componentType="horario" esEfimero={horario}>
        <div className="banda-horaria">
            Banda horaria: {horario.bh_descripcion ?? 'no definida'}
        </div>
        <div className="horario-vigente">
            Horario vigente desde {desdeFecha.toDmy()} hasta {hastaFecha.toDmy()}.
        </div>
        <div className="horario-contenedor">
            <HorarioRenglon box={info => <div key={DDS[info.dds].abr} className="horario-dia calendario-nombre-dia"> {DDS[info.dds].abr}</div> } />
            <HorarioRenglon box={info => <div key={DDS[info.dds].abr} className={`horario-dia ${info.trabaja ? '' : 'tipo-dia-no-laborable'}`}> 
                {info.trabaja ? (
                    <>
                        <div>{info.hora_desde?.replace(/(?<=\d?\d:\d\d):00$/,'')}</div>
                        <div>{info.hora_hasta?.replace(/(?<=\d?\d:\d\d):00$/,'')}</div>
                    </>
                ) : (
                    <div>-</div>
                )}                
            </div> } />
        </div>
    </Componente>
}

function NovedadesPer(props:{conn: Connector, idper:string, cod_nov:string, annio:number, paraCargar:boolean, onCodNov?:(codNov:string, conDetalles: boolean, c_dds: boolean)=>void, ultimaNovedad?: ULTIMA_NOVEDAD, infoUsuario:InfoUsuario}){
    // @ts-ignore
    const {idper, cod_nov, annio, onCodNov, conn, ultimaNovedad, infoUsuario} = props;
    const [codNovedades, setCodNovedades] = useState<NovedadesDisponiblesResult[]>([]);
    const [codNovedadesFiltradas, setCodNovedadesFiltradas] = useState<NovedadesDisponiblesResult[]>([]);
    const [filtro, setFiltro] = useState("");
    const [todas, setTodas] = useState(false);
    const [ordenPorNovedad, setOrdenPorNovedad] = useState(false);
    const puede_cargar_novedades = puedeCargarNovedades(infoUsuario);
    
    useEffect(function(){
        setCodNovedades(setEfimero)
        if (idper != null) {
            conn.ajax.novedades_disponibles({ idper, annio }).then(novedades => {
                setCodNovedades(novedades);
            }).catch(logError);
        }
    },[idper, ultimaNovedad, annio])
    useEffect(function(){
        const recordFilter = GetRecordFilter<NovedadesDisponiblesResult>(filtro,['cod_nov', 'novedad'],todas,['prioritario','con_info_nov']);
        const novedadesOrdenadas = [...codNovedades].sort(compareForOrder([{ column: ordenPorNovedad ? 'novedad' : 'cod_nov' }]));
        setCodNovedadesFiltradas(novedadesOrdenadas.filter(recordFilter));
    },[codNovedades, filtro, todas, ordenPorNovedad])

    return <Componente componentType="codigo-novedades" scrollable={true} esEfimero={codNovedades}>
        <SearchBox onChange={setFiltro} todas={todas} onTodasChange={setTodas} ordenPorNovedad={ordenPorNovedad} onOrdenPorNovedadChange={setOrdenPorNovedad} permisos={puede_cargar_novedades}/>
        <List>
            {codNovedadesFiltradas.map(c=>
                <ListItemButton key = {c.cod_nov} 
                    onClick={() => {if (onCodNov != null && c.con_disponibilidad) onCodNov(c.cod_nov, !!c.con_detalles, !!c.c_dds)}} 
                    className={`${c.cod_nov == cod_nov ? 'seleccionado' : ''} ${!c.con_disponibilidad ? 'deshabilitado' : ''}`}
                    disabled={!c.con_disponibilidad}>
                    <span className="box-id"> {c.cod_nov} </span>   
                    <span className="box-names"> {c.novedad} </span>
                    <span className="box-info" con-info-nov={c.con_info_nov?"si":"no"}>
                        {c.con_info_nov?
                            ctts.info_nov_numeros.map(info =>
                                <span con-info-nov={info.name} key={info.name} title={info.title}>{c[info.name]}</span>
                            )
                        :null}
                    </span>
                </ListItemButton>
            )}
        </List>
    </Componente>
}

type Hora = string;

type HorarioSemanaVigenteDia = {hora_desde:Hora, hora_hasta:Hora, cod_nov:string, trabaja:boolean, dds:0 | 1 | 2 | 3 | 4 | 5 | 6}
type HorarioSemanaVigenteResult = {desde:RealDate, hasta:RealDate, bh_descripcion:string, dias:Record<string, HorarioSemanaVigenteDia>}
type SiCargaraNovedades = {mensaje:string, con_detalle:boolean, c_dds: boolean, dias_habiles: number, saldo: number, falta_entrada: boolean}
declare module "frontend-plus" {
    interface BEAPI {
        info_usuario: () => Promise<DefinedType<typeof ctts.info_usuario.result>>;
        calendario_persona: (params:DefinedType<typeof ctts.calendario_persona.parameters>) => Promise<CalendarioResult[]>;
        novedades_disponibles: (params:{
            idper:string
            annio:number
        }) => Promise<NovedadesDisponiblesResult[]>;
        personas_novedad_actual: (params:{
            fecha: Date
        }) => Promise<PersonasNovedadActualResult[]>;
        horario_semana_vigente: (params:{
            idper:string
            fecha:Date
        }) => Promise<HorarioSemanaVigenteResult>;
        si_cargara_novedad: (params:{
            idper:string,
            cod_nov:string,
            desde:Date,
            hasta:Date
        }) => Promise<SiCargaraNovedades>;
        table_record_delete: (params:{
            table: string;
            primaryKeyValues: any[];    
        }) => Promise<void>;
        parametros: (params:object) => Promise<ParametrosResult>;
        registrar_novedad: (params:NovedadRegistrada) => Promise<NovedadRegistrada & { idr: number }>;
        fichadas_registrar:(params:{fichadas:FichadaData[]}) => Promise<RegistroFichadasResponse>
        per_cant_multiorigen: (params: {annio: number,idper: string}) => Promise<ProvisorioDetalleNovPer>
    }
    interface Connector {
        config: AppConfigClientSetup
    }
}

function DetalleAniosNovPer(props:{detalleVacacionesPersona : ProvisorioDetalleNovPer}){
    const { detalleVacacionesPersona } = props
    const registros = detalleVacacionesPersona ?? []
    return <Componente componentType="detalle-anios-novper">
        <div className="vacaciones-contenedor">
            <div className="vacaciones-renglon">
                vacaciones
            </div>
            <div className="vacaciones-renglon">
                <div className="vacaciones-titulo">
                    año
                </div>
                {ctts.info_nov_numeros.map(info => 
                    <div className="vacaciones-titulo" key={info.abr} title={info.title}>{info.abr}</div>
                )}
            </div>
            {registros.detalle.map(registro => (
                <div key={registro.origen} className="vacaciones-renglon">
                    <div className="vacaciones-celda">
                        {registro.origen}
                    </div>
                    {ctts.info_nov_numeros.map(info => 
                        <div className="vacaciones-celda" key={info.abr} title={info.title}>{registro[info.name]}</div>
                    )}
                </div>
            ))}
            {(registros.error ?? []).map(error => (
                    <div key={error} className="vacaciones-error">
                        {error}
                    </div>
            ))}
            {!registros.detalle.length && !registros.error ? (
                <div className="vacaciones-renglon">
                    sin información
                </div>
            ) : null}
        </div>
    </Componente>
}

function LegajoPer(props: {conn: Connector, idper:string}) {
    const {idper, conn} = props;
    const [persona, setPersona] = useState<ProvisorioPersonaLegajo>({} as ProvisorioPersonaLegajo);
    const [domicilios, setDomicilios] = useState<ProvisorioPersonaDomicilio[]>([]);
    const [telefonos, setTelefonos] = useState<ProvisorioPersonaTelefono[]>([]);
    const [cargandoLegajo, setCargandoLegajo] = useState(true);

    useEffect(function() {
        setPersona(setEfimero)
        if (idper != null) {
            conn.ajax.table_data<ProvisorioPersonaLegajo>({
                table: 'personas',
                fixedFields: [{fieldName:'idper', value:idper}],
                paramfun: {}
            }).then(personas => {
                setPersona(personas[0]);
                setCargandoLegajo(false);
            }).catch(logError);
            conn.ajax.table_data<ProvisorioPersonaDomicilio>({
                table: 'per_domicilios',
                fixedFields: [{fieldName:'idper', value:idper}],
                paramfun: {}
            }).then(function(domicilios){
                domicilios.sort(compareForOrder([{column:'idper'},{column:'orden'},{column:'nro_item'}]));
                setDomicilios(domicilios);
            }).catch(logError);
            conn.ajax.table_data<ProvisorioPersonaTelefono>({
                table: 'per_telefonos',
                fixedFields: [{ fieldName: 'idper', value: idper }],
                paramfun: {}
            }).then(function (telefonos) {
                telefonos.sort(compareForOrder([{ column: 'idper' }, { column: 'orden' }, { column: 'nro_item' }]));
                setTelefonos(telefonos);
            }).catch(logError);
        }
    }, [idper])

    // @ts-expect-error
    var es:{registra:boolean} = conn.config?.config?.es||{}

    return cargandoLegajo ? <CircularProgress /> : <Componente componentType="legajo-per" esEfimero={persona}>
        <div className="legajo-contenedor">
            <div className="legajo-seccion">
                <div className="legajo-grupo">
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">Sector:</div>
                        <div className="legajo-valor">{persona.sectores__nombre_sector}</div>
                    </div>
                </div>
                {!es.registra && <div className="legajo-grupo">
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">Ficha:</div>
                        <div className="legajo-valor">{persona.ficha || '-'}</div>
                    </div>
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">CUIL:</div>
                        <div className="legajo-valor" red-color={!persona?.cuil_valido ? "si" : "no"}>{persona.cuil || 'sin CUIL'}</div>
                    </div>
                </div>}
                <div className="legajo-grupo">
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">IDMeta4:</div>
                        <div className="legajo-valor">{persona.idmeta4 || '-'}</div>
                    </div>
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">Nacionalidad:</div>
                        <div className="legajo-valor">{persona.nacionalidad || '-'}</div>
                    </div>
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">Fecha Nacimiento:</div>
                        <div className="legajo-valor">{persona.fecha_nacimiento?.toDmy() || '-'}</div>
                    </div>
                </div>
            </div>
            <div className="legajo-seccion">
                <div className="legajo-grupo">
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">Categoría:</div>
                        <div className="legajo-valor">{persona.categoria || '-'}</div>
                    </div>
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">Sit. Revista:</div>
                        <div className="legajo-valor">{persona.situacion_revista || '-'}</div>
                    </div>
                </div>
                <div className="legajo-grupo">
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">Cargo:</div>
                        <div className="legajo-valor">{persona.cargo_atgc || '-'}</div>
                    </div>
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">Jerarquia:</div>
                        <div className="legajo-valor">{persona.jerarquias__descripcion || '-'}</div>
                    </div>
                </div>
                <div className="legajo-grupo">
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">Agrup.:</div>
                        <div className="legajo-valor">{persona.agrupamiento || '-'}</div>
                    </div>
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">Tramo:</div>
                        <div className="legajo-valor">{persona.tramo || '-'}</div>
                    </div>
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">Grado:</div>
                        <div className="legajo-valor">{persona.grado || '-'}</div>
                    </div>
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">Perfil SGC:</div>
                        <div className="legajo-valor">{persona.perfil_sgc || '-'} {persona.perfiles_sgc__nombre}</div>
                    </div>
                </div>
            </div>
            <div className="legajo-seccion">
                <div className="legajo-grupo">
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">Fecha Ingreso:</div>
                        <div className="legajo-valor">{persona.fecha_ingreso?.toDmy() || '-'}</div>
                    </div>
                    <div className="legajo-campo">
                        <div className="legajo-etiqueta">Fecha Egreso:</div>
                        <div className="legajo-valor">{persona.fecha_egreso?.toDmy() || '-'}</div>
                    </div>
                </div>
            </div>
            <div className="legajo-seccion">
                <div className="legajo-grupo">
                    <div className="legajo-campo legajo-campo-largo">
                        <div className="legajo-etiqueta">Domicilios:</div>
                    </div>
                </div>
            </div>
            <div className="legajo-seccion">
                <div className="legajo-grupo legajo-grupo-domicilios">
                    {domicilios.map(domicilio => (
                        <div key={domicilio.nro_item} className="legajo-campo legajo-campo-largo">
                            <div className="legajo-valor">{'  '} - 
                                {domicilio.calles__nombre_calle ? ` ${domicilio.calles__nombre_calle}` : ` ${domicilio.nombre_calle}`} 
                                {domicilio.altura && ` ${domicilio.altura}`}
                                {domicilio.piso && ` piso ${domicilio.piso}`}
                                {domicilio.depto && ` depto ${domicilio.depto}`}
                                {domicilio.codigo_postal && ` (${domicilio.codigo_postal})`}
                                {domicilio.barrios__nombre_barrio && `, ${domicilio.barrios__nombre_barrio}`} 
                                {domicilio.provincias__nombre_provincia && ` \u2014 ${domicilio.provincias__nombre_provincia}`} 
                                {domicilio.tipos_domicilio__descripcion && domicilio.tipos_domicilio__descripcion !== "PRINCIPAL" && ` (${domicilio.tipos_domicilio__descripcion})`}
                            </div>
                        </div>
                    ))}
                    {domicilios.length === 0 && 
                        <div className="legajo-campo legajo-campo-largo">Sin domicilios registrados</div>
                    }
                </div>
            </div>
            <div className="legajo-seccion">
                <div className="legajo-grupo">
                    <div className="legajo-campo legajo-campo-largo">
                        <div className="legajo-etiqueta">Teléfonos:</div>
                    </div>
                </div>
                <div className="legajo-grupo legajo-grupo-telefonos">
                    {telefonos.map(telefono => (
                        <div key={telefono.nro_item} className="legajo-campo legajo-campo-largo">
                            <div className="legajo-valor">
                                {'  '} - {telefono.tipos_telefono__descripcion || telefono.tipo_telefono}: {telefono.telefono}
                                {telefono.observaciones && ` (${telefono.observaciones})`}
                            </div>
                        </div>
                    ))}
                    {telefonos.length === 0 &&
                        <div className="legajo-campo legajo-campo-largo">Sin teléfonos registrados</div>
                    }
                </div>
            </div>
        </div>
    </Componente>
}

function Pantalla1(props:{conn: Connector, fixedFields:FixedFields}){
    var ffObject: Record<string, any> = {
    };
    props.fixedFields.forEach(({fieldName, value}) => {
        ffObject[fieldName] = value;
    });
    var defaults = {
        fecha: typeof ffObject.fecha == "string" ? date.iso(ffObject.fecha) : null,
        persona: typeof ffObject.idper == "string" ? {idper: ffObject.idper} : {},
        cod_nov: ffObject.cod_nov ?? ""
    };
    const {conn} = props;
    const [infoUsuario, setInfoUsuario] = useState({} as InfoUsuario);
    const [persona, setPersona] = useState(defaults.persona as ProvisorioPersonas);
    const [cod_nov, setCodNov] = useState(defaults.cod_nov);
    const [detalles, setDetalles] = useState("");
    const [novedadRegistrada, setNovedadRegistrada] = useState({} as NovedadRegistrada);
    const [fecha, setFecha] = useState<RealDate>(defaults.fecha ?? date.today()); // corresponde today, es un default provisorio
    const [hasta, setHasta] = useState<RealDate>(defaults.fecha ?? date.today()); // corresponde today, es un default provisorio
    const [registrandoNovedad, setRegistrandoNovedad] = useState(false);
    const [siCargaraNovedad, setSiCargaraNovedad] = useState<SiCargaraNovedades|null>(null);
    const [guardandoRegistroNovedad, setGuardandoRegistroNovedad] = useState(false);
    const [error, setError] = useState<Error|null>(null);
    const {idper} = persona
    const [ultimaNovedad, setUltimaNovedad] = useState(0);
    const [annio, setAnnio] = useState((defaults.fecha ?? date.today()).getFullYear());
    const [fechaActual, setFechaActual] =  useState<RealDate>(date.today()); // corresponde today, es un default provisorio
    const [detalleVacacionesPersona, setDetalleVacacionesPersona] = useState<ProvisorioDetalleNovPer>(DETALLE_VACIO)
    const [mostrandoLegajo, setMostrandoLegajo] = useState(false);
    const puede_cargar_novedades = puedeCargarNovedades(infoUsuario);
   
    function resetDias() {
        setNovedadRegistrada((prev) => ({
          ...prev,
          dds0: null,
          dds1: null,
          dds2: null,
          dds3: null,
          dds4: null,
          dds5: null,
          dds6: null,
        }));
      }

    useEffect(function(){
        // @ts-ignore
        conn.ajax.info_usuario().then(function(infoUsuario){
            var idperDefault = idper;
            setPersona(infoUsuario as ProvisorioPersonas);
            setInfoUsuario(infoUsuario);
            setFechaActual(infoUsuario.fecha_actual as RealDate);
            conn.ajax.personas_novedad_actual({fecha}).then(personas => {
                setPersona((personas.find(p => p.idper == idperDefault) ?? infoUsuario) as ProvisorioPersonas);
            }).catch(logError);
        }).catch(logError)
    },[])
    useEffect(function(){
        setRegistrandoNovedad(false);
        setSiCargaraNovedad(null);
        setError(null);
        resetDias();
    },[idper,cod_nov,fecha.getMilliseconds(),hasta.getMilliseconds()])
    useEffect(() => {
        if (idper) {
            setDetalleVacacionesPersona(setEfimero)
            conn.ajax.per_cant_multiorigen({annio, idper}).then(function(detalle){
                if (detalle){
                    setDetalleVacacionesPersona(detalle);
                }else{
                    setDetalleVacacionesPersona(DETALLE_VACIO);
                }
            }).catch(logError)
        }
    }, [idper, annio, ultimaNovedad]);
    function registrarNovedad(){
        setGuardandoRegistroNovedad(true);
        conn.ajax.registrar_novedad({
            idper, 
            desde:fecha, 
            hasta, 
            cod_nov, 
            annio: undefined,
            detalles: detalles == "" ? null : detalles,
            dds0:(siCargaraNovedad?.c_dds || null) && novedadRegistrada.dds0,
            dds1:(siCargaraNovedad?.c_dds || null) && novedadRegistrada.dds1,
            dds2:(siCargaraNovedad?.c_dds || null) && novedadRegistrada.dds2,
            dds3:(siCargaraNovedad?.c_dds || null) && novedadRegistrada.dds3,
            dds4:(siCargaraNovedad?.c_dds || null) && novedadRegistrada.dds4,
            dds5:(siCargaraNovedad?.c_dds || null) && novedadRegistrada.dds5,
            dds6:(siCargaraNovedad?.c_dds || null) && novedadRegistrada.dds6,
            fecha: infoUsuario.fecha_actual,
            usuario: infoUsuario.usuario,
            cancela: cod_nov == null,
            tipo_novedad: 'V'
        }).then(function(result){
            setUltimaNovedad(result.idr as number);
            // setFecha(fechaActual);
            // setHasta(fechaActual);
            // setCodNov("");
            setSiCargaraNovedad(null);
            setRegistrandoNovedad(false);
            setDetalles("");
        }).catch(setError).finally(()=>setGuardandoRegistroNovedad(false));
    }

    function handleCodNovChange(codNov: string) {
        setCodNov(codNov);
    }

    function handleDiaCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, checked } = e.target;
        setNovedadRegistrada((prev) => ({
            ...prev,
            [name]: checked,
        }));
    }

    function diasEnRangoSeleccionado(fecha: RealDate, hasta: RealDate): Set<number> {
        const diasIncluidos = new Set<number>();
        let current = fecha.add({days: 0});
    
        while(current.valueOf() <= hasta.valueOf()){
            diasIncluidos.add(current.getDay());
            current = current.add({days: 1});
        }
        return diasIncluidos;
    }

    const diasIncluidos = diasEnRangoSeleccionado(fecha, hasta);

    var noPuedeConfirmarPorque = !siCargaraNovedad?.dias_habiles ? "debe haber al menos un día hábil y no hay" :
        siCargaraNovedad?.c_dds && !(novedadRegistrada.dds1 || novedadRegistrada.dds2 || novedadRegistrada.dds3 || novedadRegistrada.dds4 || novedadRegistrada.dds5)
            ? "debe marcar alguno de los días de la semana" : null;

    // @ts-expect-error
    var es:{rrhh:boolean, registra:boolean} = conn.config?.config?.es||{}
    var inconsistente = (siCargaraNovedad?.saldo != null && siCargaraNovedad.saldo < 0) ||
                        (siCargaraNovedad?.falta_entrada != null && siCargaraNovedad.falta_entrada == true);
    return infoUsuario.usuario == null ?  
            <CircularProgress />
        : <Paper className="componente-pantalla-1">
            <ListaPersonasEditables conn={conn} sector={infoUsuario.sector} idper={idper} fecha={fecha} onIdper={p=>setPersona(p)} infoUsuario={infoUsuario}/>
            <Componente componentType="del-medio" scrollable={true}>
                <div className="container-del-medio">
                {idper == null ? null : 
                <Box className="box-flex-gap">
                    <Paper className="paper-flex" 
                        onClick={() => setMostrandoLegajo(!mostrandoLegajo && es.registra)}
                        sx={{ cursor: 'pointer' }}>
                        <div className="box-line">
                            <span className="box-id">
                                {idper}
                            </span>
                            <span className="box-names">
                                {persona.apellido}, {persona.nombres}
                            </span>
                            {es.registra && <span className="box-info">
                                {mostrandoLegajo ? <ICON.ExpandLess /> : <ICON.ExpandMore />}
                            </span>}
                        </div>
                        <div className="box-line">
                            <span>
                                CUIL:&nbsp;
                            </span>
                            <span className="box-names" red-color={!persona?.cuil_valido ? "si" : "no"}>
                                {persona.cuil || 'sin CUIL'}
                            </span>
                        </div>
                        <div className="box-line">
                            <span className="box-names">
                                FICHA: {persona.ficha}
                            </span>
                        </div>
                    </Paper>
                    <Box className="box-flex">
                        <DetalleAniosNovPer detalleVacacionesPersona={detalleVacacionesPersona}/>
                    </Box>
                </Box> }
                {mostrandoLegajo && (<LegajoPer conn={props.conn} idper={persona.idper}/>)}
                <Calendario conn={conn} idper={idper} fecha={fecha} fechaHasta={hasta} onFecha={setFecha} onFechaHasta={setHasta} ultimaNovedad={ultimaNovedad}
                    fechaActual={fechaActual!} annio={annio} onAnnio={setAnnio} infoUsuario={infoUsuario}
                />
                {/* <Calendario conn={conn} idper={idper} fecha={hasta} onFecha={setHasta}/> */}
                {cod_nov && idper && fecha && hasta && !guardandoRegistroNovedad && !registrandoNovedad && persona.cargable && puede_cargar_novedades && (fecha >= fechaActual || infoUsuario.puede_corregir_el_pasado) ? <Box key="setSiCargaraNovedad">
                    <Button key="button" variant="outlined" onClick={() => {
                        setRegistrandoNovedad(true);
                        conn.ajax.si_cargara_novedad({idper, cod_nov, desde:fecha, hasta}).then(setSiCargaraNovedad).catch(logError)
                    }}>Registrar Novedad</Button>
                </Box>: null}
                {registrandoNovedad && !siCargaraNovedad ? <Box key="setMensajeRegistroNovedad">
                    <CircularProgress />
                </Box>: null}
                {siCargaraNovedad ? <Box>
                    {siCargaraNovedad.c_dds ? <Box className="dia-programado-checkbox-container">
                        {Object.entries(DDS).map(([key, { abr, habil }]) => (
                            <label key={key} className="dia-programado-checkbox-label">
                            <Checkbox
                                name={`dds${key}`}
                                checked={novedadRegistrada[`dds${key}` as DDSKeys] || false}
                                onChange={handleDiaCheckboxChange}
                                disabled={!habil || !diasIncluidos.has(parseInt(key))}
                                className="check-box"
                                sin-padding="si"
                            />
                            {abr}
                            </label>
                        ))}
                    </Box> : null }
                    <TextField
                        className="novedades-detalles"
                        label="Detalles"
                        placeholder={siCargaraNovedad.con_detalle ? "Obligatorio" : ""}
                        value={detalles}
                        onChange={(e) => setDetalles(e.target.value)}
                        required={siCargaraNovedad.con_detalle}
                        error={siCargaraNovedad.con_detalle && !detalles}
                        helperText={siCargaraNovedad.con_detalle && !detalles ? "El campo es obligatorio." : ""}
                    />
                    <Button className="boton-confirmar-registro-novedades" key="button" variant={inconsistente ? "contained" : "outlined"}
                        color={inconsistente ? "error" : "primary"}
                        disabled={!!noPuedeConfirmarPorque}
                        onClick={() => registrarNovedad()}
                    >
                        {noPuedeConfirmarPorque ?? siCargaraNovedad.mensaje}<ICON.Save/>
                    </Button>
                </Box>: null}
                <Box>{guardandoRegistroNovedad || error ?
                    <Typography>{error?.message ?? (guardandoRegistroNovedad && "registrando..." || "error")}</Typography>
                : null}</Box>
                { es.rrhh && <NovedadesRegistradas conn={conn} idper={idper} annio={annio} ultimaNovedad={ultimaNovedad} persona={persona} fechaActual={fechaActual} onBorrado={()=>setUltimaNovedad(ultimaNovedad-1)}/>}
                <Horario conn={conn} idper={idper} fecha={fecha}/>
                </div>
            </Componente>
            <NovedadesPer conn={conn} idper={idper} annio={annio} paraCargar={false} cod_nov={cod_nov} onCodNov={(codNov) => handleCodNovChange(codNov)} ultimaNovedad={ultimaNovedad} infoUsuario={infoUsuario}/>
        </Paper>;
}

export function renderRol( _infoUsuario: InfoUsuario ) {
    /*
    const observer = new MutationObserver(() => {
        const activeUserElement = document.getElementById('active-user');
        if (activeUserElement) {
            //@ts-ignore
            const userType = infoUsuario.rol;

            if (!activeUserElement.textContent?.includes(userType)) {
                activeUserElement.textContent = `${activeUserElement.textContent} (${userType})`;
            }
        }
    });

    // Observar cambios en el body
    observer.observe(document.body, { childList: true, subtree: true });

    // Desconectar el observador cuando ya no sea necesario
    return () => observer.disconnect();
    */
}

function PantallaPrincipal(props: { conn: Connector, fixedFields: FixedFields, infoUsuario: InfoUsuario }) {
    
    const getManualHref = (rol: string) => {
        const userRol = rol.trim();
        if (userRol === "basico") return "./docs/manual-basico.pdf";
        if (userRol === "registra") return "./docs/manual-registra.pdf";
        return "./docs/manual-rrhh.pdf";
    }
    useEffect(() => {
        document.body.style.backgroundImage = `url('${myOwn.config.config["background-img"]}')`;
        if (props.infoUsuario.usuario) {
            renderRol( props.infoUsuario );
        }
    }, []);

    return <Paper className="paper-principal">
        <AppBar position="static" className="app-bar-bg" sx={{ backgroundImage: `url('${myOwn.config.config["background-img"]}')` }}>
            <Toolbar>
                <IconButton color="inherit" onClick={()=>{
                    var root = document.getElementById('total-layout');
                    if (root != null ) ReactDOM.unmountComponentAtNode(root)
                    location.hash="";
                }}><ICON.Menu/></IconButton>
                <Typography flexGrow={2}>
                    SiPer - Principal
                </Typography>
                <div>
                <IconButton color="inherit">
                    <a
                        href={getManualHref(props.infoUsuario.rol)}
                        download="Manual para el usuario SIPER.pdf"
                        className="link-manual"
                    >
                        <ICON.Info />
                    </a>
                </IconButton>
                <Typography id="active-user">
                    {props.infoUsuario.usuario}
                </Typography>
                </div>
            </Toolbar>
        </AppBar>
        <Pantalla1 conn={props.conn} fixedFields={props.fixedFields}/>
    </Paper>

}

// @ts-ignore
myOwn.wScreens.principal = function principal(addrParams:any){
    myOwn.ajax.info_usuario().then((infoUsuario: InfoUsuario) => {
        renderConnectedApp(
            myOwn as never as Connector,
            { ...addrParams },
            document.getElementById('total-layout')!,
            ({ conn, fixedFields }) => (<PantallaPrincipal conn={conn} fixedFields={fixedFields} infoUsuario={infoUsuario} />
            )
        );
    }).catch(logError);
}
