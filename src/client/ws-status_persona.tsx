import * as React from "react";

import {
    useEffect, useState, useMemo
} from "react";
//@ts-ignore
import { CardEditorConnected, Connector, FixedFields, GenericField, GenericFieldProperties, MenuH, OptionsInfo, renderConnectedApp, RowType } from "frontend-plus";

import { 
    Card, 
    Typography,
    Box,
    Select,
    MenuItem,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    Drawer,
    Button,
    CardContent,
    Divider
 } from "@mui/material"

import { date } from "best-globals";
//@ts-ignore
import { strict as likear, createIndex } from "like-ar";
//@ts-ignore
import { CalendarioResult, Annio, meses, HistoricoResult, Persona, NovedadRegistrada, NovPer } from "../common/contracts"

// @ts-ignore 
var my=myOwn;

function Historico(props:{idper:string}){
    const {idper} = props;
    const [annios, setAnnios] = useState<Annio[]>([]);
    const [periodo, setPeriodo] = useState({mes:date.today().getMonth()+1, annio:date.today().getFullYear()});
    const [historico, setHistorico] = useState<HistoricoResult[]>([]);
    useEffect(function(){
        setHistorico([]);
        my.ajax.table_data({table: 'annios', fixedFields: [],paramfun:{} }).then(_annios => {
            setAnnios(_annios);
        });
        if (idper != null) my.ajax.historico_persona({idper, ...periodo}).then(_historico => {
            setHistorico(_historico)
            console.log(_historico)
        })
    },[idper, periodo.mes, periodo.annio])
    return <Card>
        <Box style={{ flex:1}}>
            <Box>
                <Select 
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
            </Box>
            <Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Novedad</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                            {historico.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.fecha.toString()}</TableCell>
                                    <TableCell>{item.cod_nov} - {item.novedad}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>
            </Box>
        </Box>
    </Card>
}

function Calendario(props: { idper: string }) {
  const { idper } = props;
  const [annios, setAnnios] = useState<Annio[]>([]);
  const [periodo, setPeriodo] = useState({
    mes: new Date().getMonth() + 1,
    annio: new Date().getFullYear(),
  });
  const [calendario, setCalendario] = useState<CalendarioResult[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<{
    dia: number | null;
    mes: number | null;
    annio: number | null;
    cod_nov?: string;
  }>({ dia: null, mes: null, annio: null });

  const getPrimerDia = (mes: number, annio: number) => {
    const diaSemana = new Date(annio, mes - 1, 1).getDay();
    return diaSemana === 0 ? 6 : diaSemana - 1;
  };

  const DiaContainer = ({ dia, cod_nov }: { dia: number | null; cod_nov?: string }) => {
    return useMemo(
      () => (
        <>
          <span className="calendario-extendido-dia-numero">{dia ?? ""}</span>
          <span className="calendario-extendido-dia-contenido">{cod_nov ?? ""}</span>
        </>
      ),
      [dia, cod_nov]
    );
  };

  const Dia = ({
    dia,
    tipo_dia,
    cod_nov,
    isSelected,
    onClick,
  }: {
    dia: number | null;
    tipo_dia: string;
    cod_nov?: string;
    isSelected: boolean;
    onClick: () => void;
  }) => {
    return useMemo(
      () => (
        <div
          className={`calendario-extendido-dia tipo-dia-${tipo_dia || ""} ${
            isSelected ? "calendario-extendido-dia-seleccionado" : ""
          }`}
          onClick={onClick}
        >
          <DiaContainer dia={dia} cod_nov={cod_nov} />
        </div>
      ),
      [dia, tipo_dia, cod_nov, isSelected]
    );
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (periodo.mes === 1) {
        setPeriodo({ mes: 12, annio: periodo.annio - 1 });
      } else {
        setPeriodo({ mes: periodo.mes - 1, annio: periodo.annio });
      }
    } else if (direction === 'next') {
      if (periodo.mes === 12) {
        setPeriodo({ mes: 1, annio: periodo.annio + 1 });
      } else {
        setPeriodo({ mes: periodo.mes + 1, annio: periodo.annio });
      }
    }
  };

  useEffect(() => {
    my.ajax.table_data({ table: "annios", fixedFields: [], paramfun: {} }).then((data: Annio[]) => {
      setAnnios(data);
    });

    if (idper) {
      const primerDia = getPrimerDia(periodo.mes, periodo.annio);
      const totalDias = 42;

      const actualizarCalendario = new Array(totalDias).fill({
        dia: null,
        tipo_dia: "",
        cod_nov: "",
      });

      my.ajax.calendario_persona({ idper, ...periodo }).then((dias: CalendarioResult[]) => {
        dias.forEach((dia, index) => {
          actualizarCalendario[primerDia + index] = dia;
        });

        setCalendario(actualizarCalendario);
      });
    }
  }, [idper, periodo.mes, periodo.annio]);

  return (
    <Card className="calendario-extendido-mes">
      <Box style={{ flex: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <Select
              value={periodo.mes}
              onChange={(event) =>
                setPeriodo({ mes: Number(event.target.value), annio: periodo.annio })
              }
              style={{ marginRight: '1rem' }}
            >
              {meses.map((mes) => (
                <MenuItem key={mes.value} value={mes.value}>
                  {mes.name}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={periodo.annio}
              onChange={(event) =>
                setPeriodo({ mes: periodo.mes, annio: Number(event.target.value) })
              }
            >
              {// @ts-ignore
              annios.map((annio) => (
                <MenuItem key={annio.annio} value={annio.annio}>
                  {annio.annio.toString()}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box display="flex">
            <Button variant="outlined" onClick={() => handleNavigation('prev')} style={{ marginRight: '0.5rem' }}>
              Atras
            </Button>
            <Button variant="outlined" onClick={() => handleNavigation('next')}>
              Adelante
            </Button>
          </Box>
        </Box>

        <Box className="calendario-extendido-header">
          <div>Lun</div>
          <div>Mar</div>
          <div>Mié</div>
          <div>Jue</div>
          <div>Vie</div>
          <div>Sáb</div>
          <div>Dom</div>
        </Box>

        <Box className="calendario-extendido-grid">
          {Array.from({ length: 6 }).map((_, s) => (
            <Box key={s} className="calendario-extendido-semana">
              {Array.from({ length: 7 }).map((_, d) => {
                const index = s * 7 + d;
                const dia = calendario[index];

                return (
                  <Dia
                    key={index}
                    dia={dia?.dia}
                    tipo_dia={dia?.tipo_dia || ""}
                    cod_nov={dia?.cod_nov}
                    isSelected={
                      diaSeleccionado.dia === dia?.dia &&
                      diaSeleccionado.mes === periodo.mes &&
                      diaSeleccionado.annio === periodo.annio
                    }
                    onClick={() =>
                      dia?.dia &&
                      setDiaSeleccionado({
                        dia: dia.dia,
                        mes: periodo.mes,
                        annio: periodo.annio,
                        cod_nov: dia.cod_nov,
                      })
                    }
                  />
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      <Box>
        {diaSeleccionado.cod_nov && (
          <div>
            <p>
              <strong>Codigo:</strong> {diaSeleccionado.cod_nov}
            </p>
          </div>
        )}
      </Box>
    </Card>
  );
}

// function Calendario(props: { idper: string }) {
//     const { idper } = props;
//     const [annios, setAnnios] = useState<Annio[]>([]);
//     const [periodo, setPeriodo] = useState({
//       mes: new Date().getMonth() + 1,
//       annio: new Date().getFullYear(),
//     });
//     const [calendario, setCalendario] = useState<CalendarioResult[][]>([]);
//     const [diaSeleccionado, setDiaSeleccionado] = useState<{
//       dia: number | null;
//       mes: number | null;
//       annio: number | null;
//       cod_nov?: string;
//     }>({ dia: null, mes: null, annio: null });
  
//     useEffect(function () {
//       setCalendario([]);
//       my.ajax.table_data({ table: "annios", fixedFields: [], paramfun: {} }).then((_annios) => {
//         setAnnios(_annios);
//       });
//       if (idper != null)
//         my.ajax.calendario_persona({ idper, ...periodo }).then((dias) => {
//           let semanas: any[] = [];
//           let semana: any[] = [];
  
//           const primer = dias[0].dds === 0 ? 7 : dias[0].dds;
  
//           for (let i = 1; i < primer; i++) {
//             semana.push({});
//           }
  
//           for (let dia of dias) {
//             semana.push(dia);
//             if (dia.dds === 0) {
//               semanas.push(semana);
//               semana = [];
//             }
//           }
  
//           if (semana.length > 0 && semana.length < 7) {
//             for (let i = semana.length; i < 7; i++) {
//               semana.push({});
//             }
//             semanas.push(semana);
//           }
  
//           setCalendario(semanas);
//         });
//     }, [idper, periodo.mes, periodo.annio]);
  
//     return (
//       <Card className="calendario-extendido-mes">
//         <Box style={{ flex: 1 }}>
//           <Box display="flex" justifyContent="space-between" mb={2}>
//             <Select
//               value={periodo.mes}
//               onChange={(event) =>
//                 setPeriodo({ mes: Number(event.target.value), annio: periodo.annio })
//               }
//             >
//               {meses.map((mes) => (
//                 <MenuItem key={mes.value} value={mes.value}>
//                   {mes.name}
//                 </MenuItem>
//               ))}
//             </Select>
//             <Select
//               value={periodo.annio}
//               onChange={(event) =>
//                 setPeriodo({ mes: periodo.mes, annio: Number(event.target.value) })
//               }
//             >
//               {// @ts-ignore
//               annios.map((annio) => (
//                 <MenuItem key={annio.annio} value={annio.annio}>
//                   {annio.annio.toString()}
//                 </MenuItem>
//               ))}
//             </Select>
//           </Box>
  
//           <Box className="calendario-extendido-header">
//             <div>Lun</div>
//             <div>Mar</div>
//             <div>Mié</div>
//             <div>Jue</div>
//             <div>Vie</div>
//             <div>Sáb</div>
//             <div>Dom</div>
//           </Box>
  
//           <Box className="calendario-extendido-grid">
//             {calendario.map((semana, weekIndex) => (
//               <Box key={weekIndex} className="calendario-extendido-semana">
//                 {semana.map((dia, dayIndex) => (
//                   <div
//                     key={dayIndex}
//                     className={`calendario-extendido-dia tipo-dia-${dia.tipo_dia || ""} ${
//                       diaSeleccionado.dia === dia.dia &&
//                       diaSeleccionado.mes === periodo.mes &&
//                       diaSeleccionado.annio === periodo.annio
//                         ? "calendario-extendido-dia-seleccionado"
//                         : ""
//                     }`}
//                     onClick={() =>
//                       dia.dia &&
//                       setDiaSeleccionado({
//                         dia: dia.dia,
//                         mes: periodo.mes,
//                         annio: periodo.annio,
//                         cod_nov: dia.cod_nov,
//                       })
//                     }
//                   >
//                     <span className="calendario-extendido-dia-numero">{dia.dia ?? ""}</span>
//                     <span className="calendario-extendido-dia-contenido">{dia.cod_nov ?? ""}</span>
//                   </div>
//                 ))}
//               </Box>
//             ))}
//           </Box>
//         </Box>
  
//         <Box>
//           {diaSeleccionado.cod_nov && (
//             <div>
//               <p>
//                 <strong>Codigo:</strong> {diaSeleccionado.cod_nov}
//               </p>
//             </div>
//           )}
//         </Box>
//       </Card>
//     );
// }
  
export default Calendario;
  

function LicenciaResumenPersona(props:{idper:string}){
    const {idper} = props;
    //@ts-ignore
    const [resumen, setResumen] = useState<NovPer[]>([]);
    useEffect(function(){
        setResumen([]);
    },[idper])

    const mockresumen = [{año: '2024', cod_nov:'1', idper: '10330010016', cantidad: 20, limite: 30, saldo: 10}
                        ,{año: '2023', cod_nov:'1', idper: '10330010016', cantidad: 29, limite: 30, saldo: 1}]

    // ver como traer data de una tabla calculada (nov_per)
    return <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
    {mockresumen.map((item, index) => (
      <Card key={index} sx={{ display: 'flex', alignItems: 'center', padding: 2, width: 'auto', maxWidth: '300px', boxShadow: 3 }}>
        <Box sx={{ backgroundColor: '#003b79', color: 'white', padding: 2, borderRadius: 2, textAlign: 'center', minWidth: '80px' }}>
          <Typography variant="h4">{item.saldo}</Typography>
          <Typography variant="body2">saldo</Typography>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ margin: '0 16px' }} />
        <CardContent sx={{ padding: 0 }}>
          <Typography variant="h6" component="div">
            Licencias {item.año}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Período: 01/01/{item.año} - 31/12/{item.año === '2024' ? '2025' : item.año}
          </Typography>
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="body1" color="primary">
              {item.cantidad.toString().padStart(2, '0')} tomados
            </Typography>
            <Typography variant="body1" color="primary">
              {item.limite} totales
            </Typography>
          </Box>
        </CardContent>
      </Card>
    ))}
  </Box>
}

function NovedadesPendientes(props:{idper:string}){
    const {idper} = props;
    //@ts-ignore
    const [pendientes, setPendientes] = useState<NovedadRegistrada[]>([]);
    useEffect(function(){
        setPendientes([]);
        if (idper != null) my.ajax.novedades_pendientes({idper}).then(_pendientes => {
            setPendientes(_pendientes)
        })
    },[idper])
    return <Card>
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Desde</TableCell>
                        <TableCell>Hasta</TableCell>
                        <TableCell>Codigo</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                        {pendientes.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.desde.toString()}</TableCell>
                                <TableCell>{item.hasta.toString()}</TableCell>
                                <TableCell>{item.cod_nov}</TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Card>
}

export function StatusPersonalDisplay(props: { table: string, fixedFields: FixedFields, conn: Connector }) {
    //@ts-ignore
    const {table, fixedFields, conn} = props;
    const idper = Array.isArray(fixedFields) ? fixedFields.find(f => f.fieldName === 'idper') ?? null : null;
    if (idper == null) return <Card> <Typography>Cargando...</Typography> </Card>

    const [mobile, setMobile] = useState(window.navigator.maxTouchPoints > 2);
    const [isCalendarioOpen, setIsCalendarioOpen] = useState(false);
    const toggleCalendario = (open: boolean) => {
        setIsCalendarioOpen(open);
    };

    const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
    const toggleHistorico = (open: boolean) => {
        setIsHistoricoOpen(open);
    };


    return <> 
        <MenuH title="Renglón" rightTitle={(0 || '').toString()} mobile={mobile} onMobile={setMobile}/>
        <Card style={{ width: 'auto' }}>
        <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
      }}
    >
        <Box             
            sx={{
                width: '20%',
                height: '200px',
            }}>
            <Box
            sx={{
                width: '100%',
                height: '200px',
            }}
            >
            detalle general persona
            <LicenciaResumenPersona idper={idper.value}/>
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
                    flexDirection: 'row',

                }}
                >
                    solicitar novedad
                    {/* generar un componente form asociado a una tabla?  */}
                    {/* <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                        <GenericField {...f.cod_nov} />
                        <GenericField {...f.cod_novedades__novedad} />
                    </Box>
            
                    <Box>
                        <GenericField {...f.desde} />
                        <GenericField {...f.hasta} />
                        {c_dds ? (
                        <>
                            <GenericField {...f.dds1} />
                            <GenericField {...f.dds2} />
                            <GenericField {...f.dds3} />
                            <GenericField {...f.dds4} />
                            <GenericField {...f.dds5} />
                        </>
                        ) : null}
                    </Box> */}
            
                    {/* <Box>
                        <DiasHabiles novedad={novedad} />
                    </Box> */}
            
                    <Button variant="contained" onClick={() => toggleCalendario(true)}>
                        Calendario
                    </Button>
                    <Button variant="contained" onClick={() => toggleHistorico(true)}>
                        Historico
                    </Button>
                </Box>

            </Box>
        </Box>
        <Box
                sx={{
                width: '80%',
                height: '200px',
            }}>
            <Calendario idper={idper.value} />
        </Box>
    </Box>
  
    <Drawer anchor="right" open={isCalendarioOpen} onClose={() => toggleCalendario(false)}>
      <Calendario idper={idper.value} />
      <NovedadesPendientes idper={idper.value} />
    </Drawer>
    <Drawer anchor="right" open={isHistoricoOpen} onClose={() => toggleHistorico(false)}>
      <Historico idper={idper.value} />
    </Drawer>
    </Card>
    </>
}

// @ts-ignore
myOwn.wScreens.statusPersona = function statusPersona(addrParams: any){
    //uso el cardeditor para probar, veo de crear un contenedor generico en frontendplus despues?
    //http://localhost:3000/siper/menu#i=novedades,status&ff=,idper:10330010016
    renderConnectedApp(
        myOwn as never as Connector,
        { ...addrParams, table: 'personas' },
        document.getElementById('total-layout')!,
        ({ table, fixedFields, conn }) => <StatusPersonalDisplay table={table} fixedFields={fixedFields} conn={conn} />

    )
}