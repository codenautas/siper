import * as React from "react";
import * as ReactDOM from "react-dom";

import {
    ReactNode,
    useEffect, useState, 
} from "react";

import { 
    CardEditorConnected, Connector,
    GenericField, GenericFieldProperties,
    ICON,
    OptionsInfo,
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
    Toolbar, Typography, TextField
} from "@mui/material";

import { date, RealDate } from "best-globals";

import { CalendarioResult, Annio, meses, NovedadesDisponiblesResult, PersonasNovedadActualResult } from "../common/contracts"
import { strict as likeAr, createIndex } from "like-ar";

export function logError(error:Error){
    console.error(error);
    my.log(error);
}

export function Componente(props:{children:ReactNode[]|ReactNode, componentType:string}){
    return <Card className={"componente-" + props.componentType}>
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

export const DDS = {
    0: {abr:'dom', habil:true , nombre:'domingo'  },
    1: {abr:'lun', habil:true , nombre:'lunes'    },
    2: {abr:'mar', habil:true , nombre:'martes'   },
    3: {abr:'mié', habil:true , nombre:'miércoles'},
    4: {abr:'jue', habil:true , nombre:'jueves'   },
    5: {abr:'vie', habil:true , nombre:'viernes'  },
    6: {abr:'sáb', habil:true , nombre:'sábado'   },
}

type ULTIMA_NOVEDAD = number;

function Calendario(props:{conn:Connector, idper:string, fecha: RealDate, fechaHasta?: RealDate, onFecha?: (fecha: RealDate) => void, onFechaHasta?: (fechaHasta: RealDate) => void, ultimaNovedad?: ULTIMA_NOVEDAD}){
    const {conn, fecha, fechaHasta, idper, ultimaNovedad} = props;
    const [annios, setAnnios] = useState<Annio[]>([]);
    type Periodo = {mes:number, annio:number} 
    const [periodo, setPeriodo] = useState<Periodo>({mes:date.today().getMonth()+1, annio:date.today().getFullYear()});
    const retrocederUnMes = (s:Periodo)=>({mes: (s.mes == 1 ? 12 : s.mes - 1), annio: (s.annio - (s.mes == 1  ? 1 : 0 ))})
    const avanzarUnMes    = (s:Periodo)=>({mes: (s.mes == 12 ? 1 : s.mes + 1), annio: (s.annio + (s.mes == 12 ? 1 : 0 ))})
    // var retrocederUnMes = (s:Periodo)=>({mes: (s.mes == 1 ? 12 : 5), annio: (s.annio - (s.mes == 1  ? 1 : 0 ))})
    // var avanzarUnMes    = (s:Periodo)=>({mes: (s.mes == 12 ? 1 : 5), annio: (s.annio + (s.mes == 12 ? 1 : 0 ))})
    const [calendario, setCalendario] = useState<CalendarioResult[][]>([]);
    useEffect(function(){
        setCalendario([]);
        // ver async
        // @ts-ignore infinito
        conn.ajax.table_data<Annio>({table: 'annios', fixedFields: [],paramfun:{} }).then(annios => {
            setAnnios(annios);
        }).catch(logError);
        if (idper != null) {
            conn.ajax.calendario_persona({idper, ...periodo}).then(dias => {
                var semanas = [];
                var semana = [];
                for(var i = 0; i < dias[0].dds; i++) {
                    semana.push({});
                }
                for(var dia of dias){
                    if (dia.dds == 0 && dia.dia !=1) {
                        semanas.push(semana);   
                        semana = []
                    }
                    semana.push(dia);
                }
                for(var j = dia.dds + 1; j <= 6; j++) {
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

    return <Componente componentType="calendario-mes">
        <Box style={{ flex:1}}>
            <Box>
                <Button onClick={_ => setPeriodo(retrocederUnMes)}><ICON.ChevronLeft/></Button>
                <Button onClick={_ => setPeriodo(avanzarUnMes)}><ICON.ChevronRight/></Button>
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
                    className={date.today().sameValue(fecha) ? "es-hoy-si" : "es-hoy-no"} 
                    onClick={()=>{ 
                        const hoy = date.today(); 
                        setPeriodo({mes: hoy.getMonth()+1, annio: hoy.getFullYear()});
                        props.onFecha && props.onFecha(hoy);
                        props.onFechaHasta && props.onFechaHasta(hoy);
                    }}
                >Hoy</Button>
            </Box>
            <Box className="calendario-semana">
                {likeAr(DDS).map(dds =>
                    <div className={"calendario-nombre-dia " + (dds.habil ? "" : "tipo-dia-no-laborable")}>{dds.abr}</div>
                ).array()}
            </Box>
            {calendario.map(semana => <Box className="calendario-semana">
                {semana.map(dia => 
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
                    <span className={`calendario-dia-contenido ${dia.con_novedad ? 'con_novedad_si' : 'con_novedad_no' }`}>{dia.cod_nov ?? ''}</span>
                </div>)}
            </Box>)}
        </Box>
    </Componente>
}

// @ts-ignore
type ProvisorioPersonas = {sector?:string, idper:string, apellido:string, nombres:string, cuil:string, ficha?:string, idmeta4?:string, cargable?:boolean};
type ProvisorioSectores = {sector:string, nombre_sector:string, pertenece_a:string};
type ProvisorioSectoresAumentados = ProvisorioSectores & {perteneceA: Record<string, boolean>, nivel:number}
// @ts-ignore
type ProvisorioCodNovedades = {cod_nov:string, novedad:string}

type ProvisorioNovedadesRegistradas = {idper:string, cod_nov:string, desde:RealDate, hasta:RealDate, cod_novedades__novedad:string, detalles:string, idr:number}

type IdperFuncionCambio = (persona:ProvisorioPersonas)=>void

function SearchBox(props: {onChange:(newValue:string)=>void}){
    var [textToSearch, setTextToSearch] = useState("");
    return <Paper sx={{ display: 'flex', alignItems: 'center', width: '100%' }} className="search-box">
        <ICON.Search/>
        <InputBase
            value = {textToSearch} 
            onChange = {(event)=>{ var newValue = event.target.value; props.onChange(newValue); setTextToSearch(newValue)}}
        />
        <Button onClick={_=>{props.onChange(""); setTextToSearch("")}}><ICON.BackspaceOutlined/></Button>
    </Paper>;
}

function GetRecordFilter<T extends RowType>(filter:string, attributteList:(keyof T)[]){
    if (filter == "") return function(){ return true }
    var f = filter.replace(/[^A-Z0-9 ]+/gi,'');
    var regExp = new RegExp(f.replace(/\s+/, '(\\w* \\w*)+'), 'i');
    return function(row: T){
        return attributteList.some(a => regExp.test(row[a]+''))
    }
}

function ListaPersonasEditables(props: {conn: Connector, sector:string, idper:string, fecha:RealDate, onIdper?:IdperFuncionCambio, infoUsuario:ProvisorioInfoUsuario}){
    const {conn, idper, fecha, onIdper, infoUsuario} = props;
    const [sector, _setSector] = useState(props.sector);
    const [sectores, setSectores] = useState<ProvisorioSectoresAumentados[]>([]);
    const [listaPersonas, setListaPersonas] = useState<PersonasNovedadActualResult[]>([]);
    const [abanicoPersonas, setAbanicoPersonas] = useState<Partial<Record<string, PersonasNovedadActualResult[]>>>({});
    const [filtro, setFiltro] = useState("");
    const APELLIDOYNOMBRES = 'apellidoynombres' as keyof PersonasNovedadActualResult
    const attributosBuscables:(keyof PersonasNovedadActualResult)[] = ['apellido', 'nombres', 'cuil', 'ficha', 'idmeta4', 'idper', APELLIDOYNOMBRES]
    useEffect(function(){
        console.log(listaPersonas)
        const recordFilter = GetRecordFilter<PersonasNovedadActualResult>(filtro, attributosBuscables);
        const personasFiltradas = listaPersonas.filter(recordFilter)
        var abanico = Object.groupBy(personasFiltradas, p => p.sector);
        setAbanicoPersonas(abanico);
    }, [listaPersonas, filtro])
    useEffect(function(){
        setListaPersonas([])
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
    return <Componente componentType="lista-personas">
        <SearchBox onChange={setFiltro}/>
        {sectores.filter(s => s.perteneceA[sector] || infoUsuario.puede_cargar_todo).map(s =>
            filtro && !abanicoPersonas[s.sector]?.length ? null :
            <Accordion key = {s.sector?.toString()} defaultExpanded = {sector == s.sector || !!filtro && !!(abanicoPersonas[s.sector]?.length)} >
                <AccordionSummary id = {s.sector} expandIcon={<ICON.NavigationDown />} > 
                    <span className="box-id" style={{paddingLeft: s.nivel+"em", paddingRight:"1em"}}> {s.sector} </span>  
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

function NovedadesRegistradas(props:{conn: Connector, idper:string, annio:number, ultimaNovedad?:number, onBorrado:()=>void}){
    const {idper, conn, ultimaNovedad} = props;
    const [novedades, setNovedades] = useState<ProvisorioNovedadesRegistradas[]>([]);
    const [quiereBorrar, setQuiereBorrar] = useState<ProvisorioNovedadesRegistradas|null>(null);
    const [eliminando, setEliminando] = useState(false);
    useEffect(function(){
        conn.ajax.table_data<ProvisorioNovedadesRegistradas>({
            table: 'novedades_registradas',
            fixedFields: [{fieldName:'idper', value:idper}],
            paramfun: {}
        }).then(function(novedadesRegistradas){
            novedadesRegistradas.reverse()
            setNovedades(novedadesRegistradas);
        }).catch(logError)
    },[idper, ultimaNovedad])
    return <Componente componentType="novedades-registradas">
        {novedades.map(n => 
            <Box key={JSON.stringify(n)} className={`novedades-renglon ${ultimaNovedad == n.idr ? 'ultima-novedad' : ''}${quiereBorrar?' por-borrar':''}`}>
                <div className="fechas">{n.desde.toDmy().replace(/\/\d\d\d\d$/,'') + (n.desde == n.hasta ? '' : ` - ${n.hasta.toDmy().replace(/\/\d\d\d\d$/,'')}`)}</div>
                <div className="cod_nov">{n.cod_nov}</div>
                <div className="razones">{n.cod_novedades__novedad} {n.detalles ? ' / ' + n.detalles : '' }</div>
                <div className="borrar">{n.desde > date.today() ? <Button color="error" onClick={()=>setQuiereBorrar(n)}><ICON.DeleteOutline/></Button> : null }</div>
            </Box>
        )}
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
    const horarioVacio:HorarioSemanaVigenteResult = {desde: date.today(), hasta: date.today(), dias:{}}
    const [horario, setHorario] = useState(horarioVacio);
    useEffect(function(){
        setHorario(horarioVacio)
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
            {Object.keys(horario.dias).map(dds => props.box(horario.dias[dds]))}
        </div>
    }
    
    return <Componente componentType="horario">
        <div className="horario-vigente">
            Horario vigente desde {desdeFecha.toDmy()} hasta {hastaFecha.toDmy()}.
        </div>
        <div className="horario-contenedor">
            <HorarioRenglon box={info => <div className="horario-dia calendario-nombre-dia"> {DDS[info.dds].abr}</div> } />
            <HorarioRenglon box={info => <div className={`horario-dia ${info.trabaja ? '' : 'tipo-dia-no-laborable'}`}> 
                {info.trabaja ? (
                    <>
                        <div>{info.hora_desde?.replace(/(?<=\d?\d:\d\d):00$/,'')}</div>
                        <div>{info.hora_hasta?.replace(/(?<=\d?\d:\d\d):00$/,'')}</div>
                    </>
                ) : (
                    <div>-</div>
                )}                
            </div> } />
            <HorarioRenglon box={info => <div className={`horario-dia calendario-nombre-dia ${info.trabaja ? '' : 'tipo-dia-no-laborable'}`}> {info.cod_nov}</div> } />
        </div>
    </Componente>
}

function DatosPersonales(props:{conn: Connector, idper:string}){
    const {idper, conn} = props;
    const [persona, setPersona] = useState<RowType>({});
    useEffect(function(){
        conn.ajax.table_data({
            table: 'personas',
            fixedFields: [{fieldName:'idper', value:idper}],
            paramfun: {}
        }).then(function(personas){
            setPersona(personas[0] ?? {});
        }).catch(logError)
    },[idper])
    return <Componente componentType="datos-personales">
        <table>
        {["ficha", "cuil", "apellido", "nombres"].map(n => 
            <tr key={n}>
                <td>{n}</td>
                <td><ValueDB value={persona[n]}/></td>
            </tr>
        )}
        </table>
    </Componente>
}

function NovedadesPer(props:{conn: Connector, idper:string, cod_nov:string, paraCargar:boolean, onCodNov?:(codNov:string, conDetalles: boolean)=>void, ultimaNovedad?: ULTIMA_NOVEDAD}){
    // @ts-ignore
    const {idper, cod_nov, onCodNov, conn, ultimaNovedad} = props;
    const [codNovedades, setCodNovedades] = useState<NovedadesDisponiblesResult[]>([]);
    const [codNovedadesFiltradas, setCodNovedadesFiltradas] = useState<NovedadesDisponiblesResult[]>([]);
    const [filtro, setFiltro] = useState("");

    useEffect(function(){
        setCodNovedades([])
        if (idper != null) {
            conn.ajax.novedades_disponibles({ idper }).then(novedades => {
                setCodNovedades(novedades);
            }).catch(logError);
        }
    },[idper, ultimaNovedad])
    useEffect(function(){
        const recordFilter = GetRecordFilter<NovedadesDisponiblesResult>(filtro,['cod_nov', 'novedad']);
        setCodNovedadesFiltradas(codNovedades.filter(recordFilter))
    },[codNovedades, filtro])
    return <Componente componentType="codigo-novedades">
        <SearchBox onChange={setFiltro}/>
        <List>
            {codNovedadesFiltradas.map(c=>
                <ListItemButton key = {c.cod_nov} 
                    onClick={() => {if (onCodNov != null && c.con_disponibilidad) onCodNov(c.cod_nov, !!c.con_detalles)}} 
                    className={`${c.cod_nov == cod_nov ? 'seleccionado' : ''} ${!c.con_disponibilidad ? 'deshabilitado' : ''}`}
                    disabled={!c.con_disponibilidad}>
                    <span className="box-id"> {c.cod_nov} </span>   
                    <span className="box-names"> {c.novedad} </span>
                    <span className="box-info">{c.cantidad! > 0 ? (c.limite! > 0 ?`${c.limite} - ${c.cantidad} = ${c.saldo}` : c.cantidad ): ''}</span>
                </ListItemButton>
            )}
        </List>
    </Componente>
}

type ProvisorioInfoUsuario = {idper:string, sector:string, fecha:RealDate, usuario:string, apellido:string, nombres:string, cuil:string, ficha:string, puede_cargar_todo:boolean};

type Hora = string;

type HorarioSemanaVigenteDia = {hora_desde:Hora, hora_hasta:Hora, cod_nov:string, trabaja:boolean, dds:0 | 1 | 2 | 3 | 4 | 5 | 6}
type HorarioSemanaVigenteResult = {desde:RealDate, hasta:RealDate, dias:Record<string, HorarioSemanaVigenteDia>}
type SiCargaraNovedades = {mensaje:string, con_detalle:boolean}
declare module "frontend-plus" {
    interface BEAPI {
        info_usuario: (params: {
            table: string;
        }) => Promise<ProvisorioInfoUsuario>;
        calendario_persona: (params:{

        }) => Promise<any>;
        novedades_disponibles: (params:{

        }) => Promise<any>;
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
        }) => Promise<void>
    }
}

function Persona(props:{conn: Connector, idper:string, fecha:RealDate}){
    return <Paper className="componente-persona">
        <DatosPersonales {...props}/>
        <Horario {...props}/>
        <Calendario {...props}/>
    </Paper>
}

function Pantalla1(props:{conn: Connector}){
    const {conn} = props;
    const [infoUsuario, setInfoUsuario] = useState({} as ProvisorioInfoUsuario);
    const [persona, setPersona] = useState({} as ProvisorioPersonas);
    const [cod_nov, setCodNov] = useState("");
    const [detalles, setDetalles] = useState("");
    const [fecha, setFecha] = useState<RealDate>(date.today());
    const [hasta, setHasta] = useState<RealDate>(date.today());
    const [registrandoNovedad, setRegistrandoNovedad] = useState(false);
    const [siCargaraNovedad, setSiCargaraNovedad] = useState<SiCargaraNovedades|null>(null);
    const [guarndadoRegistroNovedad, setGuardandoRegistroNovedad] = useState(false);
    const [error, setError] = useState<Error|null>(null);
    const {idper} = persona
    const [ultimaNovedad, setUltimaNovedad] = useState(0);
    const annio = fecha.getFullYear();
    useEffect(function(){
        // @ts-ignore
        conn.ajax.info_usuario().then(function(infoUsuario:ProvisorioInfoUsuario){
            setPersona(infoUsuario as ProvisorioPersonas);
            setInfoUsuario(infoUsuario);
        }).catch(logError)
    },[])
    useEffect(function(){
        setRegistrandoNovedad(false);
        setSiCargaraNovedad(null);
        setError(null);
    },[idper,cod_nov,fecha,hasta])
    function registrarNovedad(){
        setGuardandoRegistroNovedad(true);
        conn.ajax.table_record_save({
            table:'novedades_registradas',
            primaryKeyValues:[],
            newRow:{idper, desde:fecha, hasta, cod_nov, detalles: detalles == "" ? null : detalles},
            oldRow:{},
            status:'new'
        }).then(function(result){
            console.log(result)
            setUltimaNovedad(result.row.idr as number);
            setFecha(date.today());
            setHasta(date.today());
            setCodNov("");
        }).catch(setError).finally(()=>setGuardandoRegistroNovedad(false));
    }
    function handleCodNovChange(codNov: string) {
        setCodNov(codNov);
    }

    return infoUsuario.usuario == null ?  
            <CircularProgress />
        : infoUsuario.idper == null ?
            <Typography>El usuario <b>{infoUsuario.usuario}</b> no tiene una persona asociada</Typography>
        : <Paper className="componente-pantalla-1">
            <ListaPersonasEditables conn={conn} sector={infoUsuario.sector} idper={idper} fecha={fecha} onIdper={p=>setPersona(p)} infoUsuario={infoUsuario}/>
            <Componente componentType="del-medio">
                <Box>
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
                        <span className="box-names">
                            FICHA: {persona.ficha}
                        </span>
                    </div>
                </Box>
                <Calendario conn={conn} idper={idper} fecha={fecha} fechaHasta={hasta} onFecha={setFecha} onFechaHasta={setHasta} ultimaNovedad={ultimaNovedad}/>
                {/* <Calendario conn={conn} idper={idper} fecha={hasta} onFecha={setHasta}/> */}
                {cod_nov && idper && fecha && hasta && !guarndadoRegistroNovedad && !registrandoNovedad && persona.cargable ? <Box key="setSiCargaraNovedad">
                    <Button key="button" variant="outlined" onClick={() => {
                        setRegistrandoNovedad(true);
                        conn.ajax.si_cargara_novedad({idper, cod_nov, desde:fecha, hasta}).then(setSiCargaraNovedad).catch(logError)
                    }}>Registrar Novedad</Button>
                </Box>: null}
                {registrandoNovedad && !siCargaraNovedad ? <Box key="setMensajeRegistroNovedad">
                    <CircularProgress />
                </Box>: null}
                {siCargaraNovedad ? <Box>
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
                    <Button className="boton-confirmar-registro-novedades" key="button" variant="outlined" onClick={() => registrarNovedad()}>
                        {siCargaraNovedad.mensaje}<ICON.Save/>
                    </Button>
                </Box>: null}
                <Box>{guarndadoRegistroNovedad || error ?
                    <Typography>{error?.message ?? (guarndadoRegistroNovedad && "registrando..." || "error")}</Typography>
                : null}</Box>
                <NovedadesRegistradas conn={conn} idper={idper} annio={annio} ultimaNovedad={ultimaNovedad} onBorrado={()=>setUltimaNovedad(ultimaNovedad-1)}/>
                <Horario conn={conn} idper={idper} fecha={fecha}/>
            </Componente>
            <NovedadesPer conn={conn} idper={idper} paraCargar={false} cod_nov={cod_nov} onCodNov={(codNov) => handleCodNovChange(codNov)} ultimaNovedad={ultimaNovedad}/>
        </Paper>;
}


function RegistrarNovedadesDisplay(props:{fieldsProps:GenericFieldProperties[], optionsInfo:OptionsInfo}){
    const {fieldsProps /*, optionsInfo*/} = props;
    const f = createIndex(fieldsProps, f => f.fd.name)
    const [forEdit, setForEdit] = useState(true)
    // const rowsCodNov = optionsInfo.tables!.cod_novedades;
    if (f.idper == null) return <Card> <Typography>Cargando...</Typography> </Card>
    // const novedad = likeAr(f).filter((_, name) => !(/__/.test(name as string))).map(f => f.value).plain() as Partial<any>
    console.log(setForEdit)
    return <Card style={{ width: 'auto' }}>
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '20em',
            }}
        >
            <Box
                sx={{
                    width: '100%',
                }}
            >
                <Box>
                    <GenericField {...f.idper } forEdit={false} />
                    <GenericField {...f.personas__ficha} />
                    <GenericField {...f.personas__apellido} />
                    <GenericField {...f.personas__nombres} />
                </Box>
            </Box>
        
            <Box
                sx={{
                    display: 'flex',
                    flexGrow: 1,
                }}
            >
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',

                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                        <GenericField {...f.cod_nov} forEdit={forEdit}/>
                        <GenericField {...f.cod_novedades__novedad} />
                    </Box>
            
                    <Box>
                        <GenericField {...f.desde} forEdit={forEdit}/>
                        <GenericField {...f.hasta} forEdit={forEdit}/>
                    </Box>
            
                </Box>
            </Box>
        </Box>
    </Card>
}

function RegistrarNovedades(props:{conn: Connector, idper:string}){
    const {idper, conn} = props;
    return CardEditorConnected({
        table:'novedades_registradas', 
        fixedFields:[{fieldName:'idper', value:idper}/*, {fieldName:'desde', value:null}*/], 
        conn, 
        CardDisplay: RegistrarNovedadesDisplay
    });
}

const IDPER_DEMO = "AR8"

function PantallaPrincipal(props: {conn: Connector}){
    return <Paper>
        <AppBar position="static">
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
        <Pantalla1 conn={props.conn}/>
    </Paper>

}

function DemoDeComponentes(props: {conn: Connector}){
    const {conn} = props;
    type QUE = ""|"calendario"|"personas"|"novedades-registradas"|"horario"|"persona"|"datos-personales"|"pantalla-1"|"registrar-novedades"|"novedades-per"
    const [que, setQue] = useState<QUE>("");
    const UnComponente = (props:{titulo:string, que:QUE}) =>
        <Box><Typography><Button onClick={_=>setQue(props.que)}>Ver:</Button> {props.titulo}</Typography></Box>
    return <Paper>
        <AppBar position="static">
            <Toolbar>
                {que == "" ?
                    null
                : 
                    <IconButton color="inherit" onClick={()=>setQue("")}><ICON.ChevronLeft/></IconButton>
                }
                <Typography flexGrow={2}>
                    Demo de componentes
                </Typography>
                <Typography>
                    {que}
                </Typography>
                {que == "" ?
                    <IconButton color="inherit" onClick={()=>location.hash="i=devel"}><ICON.ExitToApp/></IconButton>
                : 
                    null
                }
            </Toolbar>
        </AppBar>
        {({
            "": () => <Card>
                    <Typography>♪ Componentes invididuales</Typography>
                    <UnComponente titulo="Lista de personas" que="personas"/>
                    <UnComponente titulo="Calendario" que="calendario"/>
                    <UnComponente titulo="Novedades registradas" que="novedades-registradas"/>
                    <UnComponente titulo="Horario" que="horario"/>
                    <UnComponente titulo="Datos personales" que="datos-personales"/>
                    <UnComponente titulo="Novedades de Personas" que="novedades-per"/>
                    <hr/>
                    <Typography>🎼 Composición de componentes</Typography>
                    <UnComponente titulo="Info de una persona" que="persona"/>
                    <UnComponente titulo="Pantalla 1 (primera total)" que="pantalla-1"/>
                </Card>,
            "calendario": () => <Calendario conn={conn} idper={IDPER_DEMO} fecha={date.today()}/>,
            "personas": () => <ListaPersonasEditables conn={conn} sector="MS" fecha={date.today()} idper={IDPER_DEMO} infoUsuario={{} as ProvisorioInfoUsuario}/>,
            "novedades-registradas": () => <NovedadesRegistradas conn={conn} idper={IDPER_DEMO} annio={2024} onBorrado={()=>{}}/>,
            "horario": () => <Horario conn={conn} idper={IDPER_DEMO} fecha={date.today()}/>,
            "datos-personales": () => <DatosPersonales conn={conn} idper={IDPER_DEMO}/>,
            "registrar-novedades": () => <RegistrarNovedades conn={conn} idper={IDPER_DEMO}/>,
            "novedades-per": () => <NovedadesPer conn={conn} idper={IDPER_DEMO} cod_nov="101" paraCargar={false}/>,
            "persona": () => <Persona conn={conn} idper={IDPER_DEMO} fecha={date.today()}/>,
            "pantalla-1": () => <Pantalla1 conn={conn}/>
        })[que]()}
    </Paper>
}

// @ts-ignore
myOwn.wScreens.componentesSiper = function componentesSiper(addrParams:any){
    renderConnectedApp(
        myOwn as never as Connector,
        { ...addrParams, table: 'personas' },
        document.getElementById('total-layout')!,
        ({ conn }) => <DemoDeComponentes conn={conn} />
    )
}

// @ts-ignore
myOwn.wScreens.principal = function principal(addrParams:any){
    renderConnectedApp(
        myOwn as never as Connector,
        { ...addrParams},
        document.getElementById('total-layout')!,
        ({ conn }) => <PantallaPrincipal conn={conn} />
    )
}
