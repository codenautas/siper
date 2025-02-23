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
    Select, 
    Toolbar, Typography, TextField,
    Checkbox,
    Tooltip
} from "@mui/material";

import { date, RealDate, compareForOrder } from "best-globals";

import { CalendarioResult, Annio, meses, NovedadesDisponiblesResult, PersonasNovedadActualResult, NovedadRegistrada, ParametrosResult,
    InfoUsuario
} from "../common/contracts"
import * as ctts from "../common/contracts"
import { strict as likeAr, createIndex } from "like-ar";
import { DefinedType } from "guarantee-type";
import { AppConfigClientSetup } from "../server/types-principal";
import { obtenerDetalleVacaciones } from "./shared-functions";

const EFIMERO = Symbol("EFIMERO");
function setEfimero<T extends {}|null>(tictac:T){
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

export function Componente(props:{children:ReactNode[]|ReactNode, componentType:string, scrollable?: boolean  
    esEfimero?: any
}){
    return <Card className={"componente-" + props.componentType} 
        siper-esEfimero={props.esEfimero === true || props.esEfimero?.[EFIMERO] ? "si" : "no"}
        sx={{ overflowY: props.scrollable ? 'auto' : 'hidden', backgroundImage: `url('${myOwn.config.config["background-img"]}')`}}
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

function Calendario(props:{conn:Connector, idper:string, fecha: RealDate, fechaHasta?: RealDate, fechaActual: RealDate, 
    annio:number,
    onFecha?: (fecha: RealDate) => void, onFechaHasta?: (fechaHasta: RealDate) => void, ultimaNovedad?: ULTIMA_NOVEDAD
    onAnnio?: (annio:number) => void
}){
    const {conn, fecha, fechaHasta, idper, ultimaNovedad, fechaActual, annio} = props;
    const [annios, setAnnios] = useState<Annio[]>([]);
    type Periodo = {mes:number, annio:number}
    const [mes, setMes] = useState(fecha.getMonth()+1);
    const [periodo, setPeriodo] = [{mes, annio}, (x:Periodo) => {setMes(x.mes); props.onAnnio?.(x.annio);}]
    const retrocederUnMes = ({mes: (mes == 1 ? 12 : mes - 1), annio: (annio - (mes == 1  ? 1 : 0 ))})
    const avanzarUnMes    = ({mes: (mes == 12 ? 1 : mes + 1), annio: (annio + (mes == 12 ? 1 : 0 ))})
    const [calendario, setCalendario] = useState<CalendarioResult[][]>([]);
    const [botonRetrocederHabilitado, setBotonRetrocederHabilitado] = useState<boolean>(true); 
    const [botonAvanzarHabilitado, setBotonAvanzarHabilitado] = useState<boolean>(true); 
    
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
        if (idper != null) {
            setCalendario(setEfimero)
            conn.ajax.calendario_persona({idper, ...periodo}).then(dias => {
                var semanas = [];
                var semana = [];
                for(var i = 0; i < dias[0]?.dds; i++) {
                    semana.push({});
                }
                for(var dia of dias){
                    if (dia?.dds == 0 && dia.dia !=1) {
                        semanas.push(semana);   
                        semana = []
                    }
                    semana.push(dia);
                }
                for(var j = dia?.dds + 1; j <= 6; j++) {
                    semana.push({});
                }
                semanas.push(semana);
                setCalendario(semanas)
            }).catch(logError)
        }
    },[idper, periodo.mes, periodo.annio, ultimaNovedad])

    const isInRange = (dia: number, mes: number, annio: number) => {
        if (!fecha || !fechaHasta || !Number.isInteger(dia) || dia <= 0) return false;
        try {
            const current = date.ymd(annio, mes as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12, dia);
            return current >= fecha && current <= fechaHasta;
        } catch (error) {
            return false;
        }
    };

    const isPastMonth = periodo.mes < fechaActual.getMonth() + 1 && periodo.annio === fechaActual.getFullYear() || periodo.annio < fechaActual.getFullYear();
    const isFutureMonth = periodo.mes > fechaActual.getMonth() + 1 && periodo.annio === fechaActual.getFullYear() || periodo.annio > fechaActual.getFullYear();

    return <Componente componentType="calendario-mes" esEfimero={calendario}>
        <Box style={{ flex:1}}>
            <Box>
                <Button onClick={_ => setPeriodo(retrocederUnMes)} disabled={!botonRetrocederHabilitado} sx={{ color: "#000" }}><ICON.ChevronLeft/></Button>
                <Button onClick={_ => setPeriodo(avanzarUnMes)} disabled={!botonAvanzarHabilitado} sx={{ color: "#000" }}><ICON.ChevronRight/></Button>
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
                    value={periodo.annio}
                    onChange={(event) => { // buscar el tipo correcto
                        setPeriodo({mes:periodo.mes, annio:Number(event.target.value)});
                    }}
                >
                    {
                        // @ts-ignore
                        annios.map((annio:Annio) => (
                        <MenuItem key={annio.annio} value={annio.annio}>
                            {annio.annio.toString()}
                        </MenuItem>
                    ))
                        }
                </Select>
                <Button
                    variant="outlined"
                    es-este-mes={isFutureMonth?"no-futuro":isPastMonth?"no-pasado":"si"}
                    onClick={()=>{ 
                        setPeriodo({mes: fechaActual.getMonth()+1, annio: fechaActual.getFullYear()});
                        props.onFecha && props.onFecha(fechaActual);
                        props.onFechaHasta && props.onFechaHasta(fechaActual);
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
            {calendario.map(semana => <Box key={semana[0].dia} className="calendario-semana">
                {semana.map(dia => 
                <Tooltip key={dia.dia} title={dia.novedad || "Sin novedad"} arrow>
                <div
                    className={`calendario-dia tipo-dia-${dia.tipo_dia} 
                        ${fecha && dia.dia === fecha.getDate() && periodo.mes === fecha.getMonth() + 1 && periodo.annio === fecha.getFullYear() ? 'calendario-dia-seleccionado' : ''}
                        ${fechaHasta && dia.dia === fechaHasta.getDate() && periodo.mes === fechaHasta.getMonth() + 1 && periodo.annio === fechaHasta.getFullYear() ? 'calendario-dia-seleccionado' : ''}
                        ${isInRange(dia.dia, periodo.mes, periodo.annio) ? 'calendario-dia-seleccionado' : ''}`}
                        
                        onClick={() => {
                            if (!dia.dia || !props.onFecha || !props.onFechaHasta) return;
                            const selectedDate = date.ymd(periodo.annio, periodo.mes as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12, dia.dia);
                            if (!fechaHasta || selectedDate <= fechaHasta) {
                                props.onFecha(selectedDate);
                                props.onFechaHasta(selectedDate);
                            } 
                            else {
                                props.onFechaHasta(selectedDate);
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
type ProvisorioPersonas = {sector?:string, idper:string, apellido:string, nombres:string, cuil:string, ficha?:string, idmeta4?:string, cargable?:boolean};
type ProvisorioSectores = {sector:string, nombre_sector:string, pertenece_a:string, tipos_sec__nivel:number};
type ProvisorioSectoresAumentados = ProvisorioSectores & {perteneceA: Record<string, boolean>}
// @ts-ignore
type ProvisorioCodNovedades = {cod_nov:string, novedad:string}

type ProvisorioNovedadesRegistradas = {idper:string, cod_nov:string, desde:RealDate, hasta:RealDate, cod_novedades__novedad:string, dds0: boolean, dds1: boolean, dds2: boolean, dds3: boolean, dds4: boolean, dds5: boolean, dds6: boolean, detalles:string, idr:number}

interface DetalleAnioNovPer {
    cantidad: number;
    usados: number;
    pendientes: number;
    saldo: number;
}

type ProvisorioDetalleNovPer = { detalle: Record<string, DetalleAnioNovPer> }

type IdperFuncionCambio = (persona:ProvisorioPersonas)=>void

function SearchBox(props: {onChange:(newValue:string)=>void, todas?:boolean|null, onTodasChange?:(newValue:boolean)=>void, ordenPorNovedad?:boolean|null, onOrdenPorNovedadChange?:(newValue:boolean)=>void}){
    var [textToSearch, setTextToSearch] = useState("");
    return <Paper sx={{ display: 'flex', alignItems: 'center', width: '100%' }} className="search-box">
        <ICON.Search/>
        <InputBase
            value = {textToSearch} 
            onChange = {(event)=>{ var newValue = event.target.value; props.onChange(newValue); setTextToSearch(newValue)}}
        />
        <Button onClick={_=>{props.onChange(""); setTextToSearch("")}} sx={{ color: "#000" }}><ICON.BackspaceOutlined/></Button>
        {props.todas != null ?
        <>
        <label>
            <Checkbox
                checked={props.todas}
                disabled={!props.onTodasChange}
                onChange={(_event, checked) => props.onTodasChange?.(checked)}
                sx={{ padding: 0 }}
            /> todas
        </label>
            <Button 
                sx={{ color: "#000" }}
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
        </>
        : null }
    </Paper>;
}

function GetRecordFilter<T extends RowType>(filter:string, attributteList:(keyof T)[], todas?:boolean, principalesKey?:keyof T){
    var principales:(row:T) => boolean = todas || !principalesKey ? function(){ return true } : row => !!row[principalesKey]
    if (filter == "") return principales
    var f = filter.replace(/[^A-Z0-9 ]+/gi,'');
    var regExp = new RegExp(f.replace(/\s+/, '(\\w* \\w*)+'), 'i');
    return function(row: T){
        return principales(row) && attributteList.some(a => regExp.test(row[a]+''))
    }
}

function ListaPersonasEditables(props: {conn: Connector, sector:string, idper:string, fecha:RealDate, onIdper?:IdperFuncionCambio, infoUsuario:InfoUsuario}){
    const {conn, idper, fecha, onIdper, infoUsuario} = props;
    const [sector, _setSector] = useState(props.sector);
    const [sectores, setSectores] = useState<ProvisorioSectoresAumentados[]>([]);
    const [listaPersonas, setListaPersonas] = useState<PersonasNovedadActualResult[]>([]);
    const [abanicoPersonas, setAbanicoPersonas] = useState<Partial<Record<string, PersonasNovedadActualResult[]>>>({});
    const [filtro, setFiltro] = useState("");
    const [expandido, setExpandido] = useState<Record<string, boolean>>({})
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
            fixedFields: [],
            paramfun: {}
        }).then(async (sectores) => {
            const idxSectores = createIndex(sectores, 'sector');
            const sectoresAumentados = sectores.map(s => ({...s, nivel:0, perteneceA:{[s.sector]: true} as Record<string, boolean>}));
            sectoresAumentados.forEach(s => {
                var {pertenece_a} = s;
                var nivel = 0
                while (pertenece_a != null && ++nivel < 100) {
                    s.perteneceA[pertenece_a] = true;
                    pertenece_a = idxSectores[pertenece_a].pertenece_a
                }
                s.nivel = nivel;
            })
            setSectores(sectoresAumentados);
        }).catch(logError)
    }, [fecha]);
    return <Componente componentType="lista-personas" scrollable={true} esEfimero={listaPersonas}>
        <SearchBox onChange={setFiltro}/>
        {sectores.filter(s => s.perteneceA[sector] || infoUsuario.puede_cargar_todo).map(s =>
            filtro && !abanicoPersonas[s.sector]?.length ? null :
            <Accordion key = {s.sector?.toString()} expanded = {!!expandido[s.sector]}
                onChange={(_, b: boolean) => { setExpandido(e => ({...e, [s.sector]:b })) }}
                sx={{ backgroundImage: `url('${myOwn.config.config["background-img"]}')`, backgroundSize: 'auto 100%'}}
            >
                <AccordionSummary id = {s.sector} expandIcon={<ICON.NavigationDown />} 
                    sx={{flexDirection: 'row-reverse', '& .MuiAccordionSummary-content': { marginLeft: '16px' },}}
                > 
                    <span className="box-id" style={{paddingLeft: (s.tipos_sec__nivel-1)+"em", paddingRight:"1em"}}> {s.sector} </span>  
                    {s.nombre_sector} 
                </AccordionSummary>
                <AccordionDetails>
                    <List>
                        {abanicoPersonas[s.sector]?.map(p=>
                            <ListItemButton key = {p.idper} onClick={() => {if (onIdper != null) onIdper(p as ProvisorioPersonas)}} 
                                    className={`${p.idper == idper ? ' seleccionado' : ''} ${p.cargable ? ' seleccionable' : 'no-seleccionable'}`}>
                                <span className="box-id persona-id">{p.idper}</span>
                                <span className="box-names">
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

function NovedadesRegistradas(props:{conn: Connector, idper:string, annio:number, ultimaNovedad?:number, infoUsuario:InfoUsuario, 
    fechaActual:RealDate,
    onBorrado:()=>void}
){
    const {idper, conn, ultimaNovedad, infoUsuario, fechaActual, annio} = props;
    console.log(infoUsuario)
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
        {novedades.map(n => {
            const diasSeleccionados = Object.entries(n)
                .filter(([key, value]) => key.startsWith("dds") && value === true)
                .map(([key]) => diasSemana[key]); 
            return (
            <Box key={JSON.stringify(n)} className={`novedades-renglon ${ultimaNovedad == n.idr ? 'ultima-novedad' : ''}${quiereBorrar?' por-borrar':''}`}>
                <div className="fechas">{n.desde.toDmy().replace(/\/\d\d\d\d$/,'') + (n.desde == n.hasta ? '' : ` - ${n.hasta.toDmy().replace(/\/\d\d\d\d$/,'')}`)}</div>
                <div className="cod_nov">{n.cod_nov}</div>
                <div className="razones">{n.cod_novedades__novedad} {n.detalles ? ' / ' + n.detalles : '' } 
                    {diasSeleccionados.length > 0 ? ' / ' + diasSeleccionados.join(', ') : ''}
                </div>
                <div className="borrar">{n.desde > fechaActual && es.rrhh ? <Button color="error" onClick={()=>setQuiereBorrar(n)}><ICON.DeleteOutline/></Button> : null }</div>
            </Box>)
        })}
        <Dialog open={quiereBorrar != null}>
            {quiereBorrar == null ? null : (
                eliminando ? <div>
                    <div>Eliminando</div>
                    <CircularProgress/>
                </div> : <div>
                    ¿Confirma el borrado de las novedades registradas entre {quiereBorrar!.desde.toDmy()} y {quiereBorrar!.hasta.toDmy()}?
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
            )}
        </Dialog>
    </Componente>
}

function Horario(props:{conn: Connector, idper:string, fecha:RealDate}){
    const {fecha, idper, conn} = props
    const horarioVacio:HorarioSemanaVigenteResult = {desde: date.today(), hasta: date.today(), dias:{}} // corresponde today, es un default provisorio
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

function NovedadesPer(props:{conn: Connector, idper:string, cod_nov:string, annio:number, paraCargar:boolean, onCodNov?:(codNov:string, conDetalles: boolean, c_dds: boolean)=>void, ultimaNovedad?: ULTIMA_NOVEDAD}){
    // @ts-ignore
    const {idper, cod_nov, annio, onCodNov, conn, ultimaNovedad} = props;
    const [codNovedades, setCodNovedades] = useState<NovedadesDisponiblesResult[]>([]);
    const [codNovedadesFiltradas, setCodNovedadesFiltradas] = useState<NovedadesDisponiblesResult[]>([]);
    const [filtro, setFiltro] = useState("");
    const [todas, setTodas] = useState(false);
    const [ordenPorNovedad, setOrdenPorNovedad] = useState(false);

    useEffect(function(){
        setCodNovedades(setEfimero)
        if (idper != null) {
            conn.ajax.novedades_disponibles({ idper, annio }).then(novedades => {
                setCodNovedades(novedades);
            }).catch(logError);
        }
    },[idper, ultimaNovedad, annio])
    useEffect(function(){
        const recordFilter = GetRecordFilter<NovedadesDisponiblesResult>(filtro,['cod_nov', 'novedad'],todas,'prioritario');
        const novedadesOrdenadas = [...codNovedades].sort(compareForOrder([{ column: ordenPorNovedad ? 'novedad' : 'cod_nov' }]));
        setCodNovedadesFiltradas(novedadesOrdenadas.filter(recordFilter));
    },[codNovedades, filtro, todas, ordenPorNovedad])

    return <Componente componentType="codigo-novedades" scrollable={true} esEfimero={codNovedades}>
        <SearchBox onChange={setFiltro} todas={todas} onTodasChange={setTodas} ordenPorNovedad={ordenPorNovedad} onOrdenPorNovedadChange={setOrdenPorNovedad}/>
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
                                <span con-info-nov={info.name} key={info.name} title={info.title}> {c[info.name]} </span>
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
type HorarioSemanaVigenteResult = {desde:RealDate, hasta:RealDate, dias:Record<string, HorarioSemanaVigenteDia>}
type SiCargaraNovedades = {mensaje:string, con_detalle:boolean, c_dds: boolean, dias_habiles: number}
declare module "frontend-plus" {
    interface BEAPI {
        info_usuario: () => Promise<DefinedType<typeof ctts.info_usuario.result>>;
        calendario_persona: (params:{

        }) => Promise<any>;
        novedades_disponibles: (params:{

        }) => Promise<NovedadesDisponiblesResult[]>;
        personas_novedad_actual: (params:{
            fecha: Date
        }) => Promise<PersonasNovedadActualResult[]>;
        horario_semana_vigente: (params:{
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
        parametros: (params:{}) => Promise<ParametrosResult>;
    }
    interface Connector {
        config: AppConfigClientSetup
    }
}

function DetalleAniosNovPer(props:{detalleVacacionesPersona : any}){
    const { detalleVacacionesPersona } = props
    const detalle = (detalleVacacionesPersona || {}) as Record<string, DetalleAnioNovPer>;
    const registros = Object.entries(detalle);
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
            {registros.length > 0 ? (
                registros.map(([anio, registro]) => (
                    <div key={anio} className="vacaciones-renglon">
                        <div className="vacaciones-celda">
                            {anio}
                        </div>
                        {ctts.info_nov_numeros.map(info => 
                            <div className="vacaciones-celda" key={info.abr} title={info.title}>{registro[info.name]}</div>
                        )}
                    </div>
                ))
            ) : (
                <div className="vacaciones-renglon">
                    sin información
                </div>
            )}
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
    const [detalleVacacionesPersona, setDetalleVacacionesPersona] = useState<ProvisorioDetalleNovPer|null>({} as ProvisorioDetalleNovPer)

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
    },[idper,cod_nov,fecha,hasta])
    useEffect(() => {
        if (idper) {
            setDetalleVacacionesPersona(setEfimero)
            conn.ajax.table_data({
                table: 'nov_per',
                fixedFields: [
                    {fieldName:'annio', value:annio}, 
                    {fieldName:'idper', value:idper}, 
                    {fieldName:'cod_nov', value:1}
                ],
                paramfun: {}
            }).then(function(data:any){
                if (data[0]){
                    data[0].detalle = obtenerDetalleVacaciones(data[0])
                    setDetalleVacacionesPersona(data[0].detalle);
                }else{
                    setDetalleVacacionesPersona(null);
                }
            }).catch(logError)
        }
    }, [idper, annio, ultimaNovedad]);
    function registrarNovedad(){
        setGuardandoRegistroNovedad(true);
        conn.ajax.table_record_save({
            table:'novedades_registradas',
            primaryKeyValues:[],
            newRow:{
                idper, 
                desde:fecha, 
                hasta, 
                cod_nov, 
                detalles: detalles == "" ? null : detalles,
                dds0:(siCargaraNovedad?.c_dds || null) && novedadRegistrada.dds0,
                dds1:(siCargaraNovedad?.c_dds || null) && novedadRegistrada.dds1,
                dds2:(siCargaraNovedad?.c_dds || null) && novedadRegistrada.dds2,
                dds3:(siCargaraNovedad?.c_dds || null) && novedadRegistrada.dds3,
                dds4:(siCargaraNovedad?.c_dds || null) && novedadRegistrada.dds4,
                dds5:(siCargaraNovedad?.c_dds || null) && novedadRegistrada.dds5,
                dds6:(siCargaraNovedad?.c_dds || null) && novedadRegistrada.dds6
            },
            oldRow:{},
            status:'new'
        }).then(function(result){
            setUltimaNovedad(result.row.idr as number);
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

    return infoUsuario.usuario == null ?  
            <CircularProgress />
        : infoUsuario.idper == null ?
            <Typography>El usuario <b>{infoUsuario.usuario}</b> no tiene una persona asociada</Typography>
        : <Paper className="componente-pantalla-1">
            <ListaPersonasEditables conn={conn} sector={infoUsuario.sector} idper={idper} fecha={fecha} onIdper={p=>setPersona(p)} infoUsuario={infoUsuario}/>
            <Componente componentType="del-medio" scrollable={true}>
                <div className="container-del-medio">
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Paper sx={{ flex: 2 }}>
                        <div className="box-line">
                            <span className="box-id">
                                {idper}
                            </span>
                            <span className="box-names">
                                {persona.apellido}, {persona.nombres}
                            </span>
                        </div>
                        <div className="box-line">
                            <span className="box-names">
                                CUIL: {persona.cuil}
                            </span>
                        </div>
                        <div className="box-line">
                            <span className="box-names">
                                FICHA: {persona.ficha}
                            </span>
                        </div>
                    </Paper>
                    <Box sx={{ flex: 1 }}>
                        <DetalleAniosNovPer detalleVacacionesPersona={detalleVacacionesPersona}/>
                    </Box>
                </Box>
                <Calendario conn={conn} idper={idper} fecha={fecha} fechaHasta={hasta} onFecha={setFecha} onFechaHasta={setHasta} ultimaNovedad={ultimaNovedad}
                    fechaActual={fechaActual!} annio={annio} onAnnio={setAnnio}
                />
                {/* <Calendario conn={conn} idper={idper} fecha={hasta} onFecha={setHasta}/> */}
                {cod_nov && idper && fecha && hasta && !guardandoRegistroNovedad && !registrandoNovedad && persona.cargable ? <Box key="setSiCargaraNovedad">
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
                                sx={{ padding: 0 }}
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
                    <Button className="boton-confirmar-registro-novedades" key="button" variant="outlined" 
                        disabled={!!noPuedeConfirmarPorque}
                        onClick={() => registrarNovedad()}
                    >
                        {noPuedeConfirmarPorque ?? siCargaraNovedad.mensaje}<ICON.Save/>
                    </Button>
                </Box>: null}
                <Box>{guardandoRegistroNovedad || error ?
                    <Typography>{error?.message ?? (guardandoRegistroNovedad && "registrando..." || "error")}</Typography>
                : null}</Box>
                <NovedadesRegistradas conn={conn} idper={idper} annio={annio} ultimaNovedad={ultimaNovedad} infoUsuario={infoUsuario} fechaActual={fechaActual} onBorrado={()=>setUltimaNovedad(ultimaNovedad-1)}/>
                <Horario conn={conn} idper={idper} fecha={fecha}/>
                </div>
            </Componente>
            <NovedadesPer conn={conn} idper={idper} annio={annio} paraCargar={false} cod_nov={cod_nov} onCodNov={(codNov) => handleCodNovChange(codNov)} ultimaNovedad={ultimaNovedad}/>
        </Paper>;
}

function PantallaPrincipal(props: {conn: Connector, fixedFields:FixedFields}){
    useEffect(() => {
            document.body.style.backgroundImage = `url('${myOwn.config.config["background-img"]}')`;
    }, []);

    return <Paper className="paper-principal">
        <AppBar position="static" sx={{ backgroundImage: `url('${myOwn.config.config["background-img"]}')`, backgroundSize: 'auto 100%'}}>
            <Toolbar>
                <IconButton color="inherit" onClick={()=>{
                    var root = document.getElementById('total-layout');
                    if (root != null ) ReactDOM.unmountComponentAtNode(root)
                    location.hash="";
                }}><ICON.Menu/></IconButton>
                <Typography flexGrow={2}>
                    SiPer - Principal - <small>(DEMO)</small>
                </Typography>
            </Toolbar>
        </AppBar>
        <Pantalla1 conn={props.conn} fixedFields={props.fixedFields}/>
    </Paper>

}

// @ts-ignore
myOwn.wScreens.principal = function principal(addrParams:any){
    renderConnectedApp(
        myOwn as never as Connector,
        { ...addrParams},
        document.getElementById('total-layout')!,
        ({ conn, fixedFields }) => <PantallaPrincipal conn={conn} fixedFields={fixedFields} />
    )
}
