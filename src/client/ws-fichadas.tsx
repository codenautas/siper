import * as React from "react";
import * as ReactDOM from "react-dom";

import {
    FormEvent,
    useCallback,
    useEffect, useState,
} from "react";

import {
    Connector,
    FixedFields,
    ICON,
    renderConnectedApp,
} from "frontend-plus";

import {
    AppBar,
    Box, Button,
    CircularProgress,
    MenuItem,
    Paper,
    Toolbar, Typography, TextField,
    Alert,
    Modal,
} from "@mui/material";

import { logError, renderRol } from "./ws-componentes";
import { FichadaData, InfoUsuario, Tipos_fichada } from "../common/contracts";

declare const myOwn: any;

const GPS_ERROR = 'GPS_ERROR';
const GPS_NO_SUPPORT = 'GPS_NO_SUPPORT';

type ModalResponse = {
    severity: 'success' | 'error' | null;
    message: string;
    data?: FichadaData;
}

const logout = () => {
    var root = document.getElementById('total-layout');
    if (root != null ) ReactDOM.unmountComponentAtNode(root)
    const currentPath = location.pathname;
    const newPath = currentPath.substring(0, currentPath.lastIndexOf('/')) + '/logout';
    location.href = location.origin + newPath;
}

function FichadaForm(props: { infoUsuario: InfoUsuario, conn:Connector, tiposFichada:Tipos_fichada[] }) {
    const {infoUsuario, conn, tiposFichada} = props;
    const formatDateTime = () => {
        const now = new Date();
        const fechaFormateada = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const horaFormateada = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const fechaISO = now.toISOString().split('T')[0];
        return {
            fechaFormateada: fechaFormateada,
            horaFormateada: horaFormateada,
            fechaISO: fechaISO,
            horaISO: horaFormateada,
        };
    };
    const [currentDateTime, setCurrentDateTime] = useState(formatDateTime());
    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentDateTime(formatDateTime());
        }, 1000);

        return () => clearInterval(timerId);
    }, []);

    const initialFormData: FichadaData = {
        idper: infoUsuario.idper,
        nombres: infoUsuario.nombres,
        apellido: infoUsuario.apellido,
        tipo_fichada: null,
        fecha: currentDateTime.fechaISO,
        hora: currentDateTime.horaISO,
        observaciones: null,
        punto: null,
        tipo_dispositivo: 'WEB',
        id_original: null,
    };

    const [formData, setFormData] = useState<FichadaData>(initialFormData);

    const [validationErrors, setValidationErrors] = useState<{ tipo_fichada?: string }>({});
    const [isWaitingForBackendResponse, setIsWaitingForBackendResponse] = useState<boolean>(false);
    
    const [modalResponse, setModalResponse] = useState<ModalResponse>({ severity: null, message: '' });

    useEffect(() => {
        setFormData(prevData => ({
            ...prevData,
            fecha: currentDateTime.fechaISO,
            hora: currentDateTime.horaISO,
        }));
    }, [currentDateTime]);

    const [geolocationStatus, setGeolocationStatus] = useState<string>('GPS no capturado.');
    const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
    const [openResponseModal, setOpenResponseModal] = useState<boolean>(false);

    const errorEnPuntoGps = ()=> [GPS_ERROR, GPS_NO_SUPPORT].includes(formData.punto || '')

    const handleCloseModal = () => {
        setOpenResponseModal(false);
        setModalResponse({ severity: null, message: '' });
    }

    const getGeolocation = useCallback(() => {
        if (!navigator.geolocation) {
            setGeolocationStatus("Geolocalización no soportada por este navegador.");
            setFormData(prevData => ({ ...prevData, punto: GPS_NO_SUPPORT }));
            return;
        }

        setIsGpsLoading(true);
        setGeolocationStatus('Buscando ubicación...');

        const successCallback = (position: GeolocationPosition) => {
            setTimeout(()=>{
                const { latitude, longitude } = position.coords;
                const gpsPoint = `${latitude},${longitude}`;

                setFormData(prevData => ({
                    ...prevData,
                    punto: gpsPoint
                }));
                setGeolocationStatus(`Ubicación capturada!`);
                setIsGpsLoading(false);
            },1000)

        };

        const errorCallback = (error: GeolocationPositionError) => {
            let message: string;
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message = "Permiso de geolocalización denegado. Active el GPS y conceda permisos.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = "Información de ubicación no disponible. Intente de nuevo.";
                    break;
                case error.TIMEOUT:
                    message = "Tiempo de espera agotado para la ubicación.";
                    break;
                default:
                    message = `Error de geolocalización: ${error.message}`;
                    break;
            }
            setGeolocationStatus(message);
            setFormData(prevData => ({ ...prevData, punto: GPS_ERROR }));
            setIsGpsLoading(false);
        };

        navigator.geolocation.getCurrentPosition(
            successCallback,
            errorCallback,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
        const name = e.target.name as keyof FichadaData;
        let value = e.target.value || null;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));

        if (name === 'tipo_fichada' && value) {
            setValidationErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors.tipo_fichada;
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const errors: { tipo_fichada?: string } = {};
        let isValid = true;

        if (!formData.tipo_fichada) {
            errors.tipo_fichada = "Debe seleccionar un Tipo de Fichada.";
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        try {
            setIsWaitingForBackendResponse(true);
            const formDataEnviada = {...formData}
            const result = await conn.ajax.fichadas_registrar({
                fichadas: [formDataEnviada]
            })

            if (result.code != 200) {
                const errorMessage = result.message || `Error ${result.code}: Fallo en el servidor o SP.`;
                setModalResponse({
                    severity: 'error',
                    message: `Fallo en el registro. Estado: ${result.status} (Código: ${result.code}). Mensaje: ${errorMessage}`
                });
                if (logError) logError(new Error(errorMessage));
                setOpenResponseModal(true);
                return;
            }

            setFormData(prevData => ({
                ...initialFormData,
                fecha: prevData.fecha,
                hora: prevData.hora,
            }));

            getGeolocation(); // Volver a capturar GPS
            setValidationErrors({});
            
            setModalResponse({
                severity: 'success',
                message: `La fichada ha sido registrada.`,
                data: formDataEnviada
            });
            setOpenResponseModal(true);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Error desconocido al comunicarse con el servidor.";
            console.error('Error al enviar la fichada:', error);
            setModalResponse({
                severity: 'error',
                message: 'Se produjo un error al intentar almacenar la fichada. Detalle del error: ' + errorMessage
            });
            setOpenResponseModal(true);
            if (logError) logError(error as Error);
        } finally {
            setTimeout(()=>setIsWaitingForBackendResponse(false),1000)
        }
    };

    if(!infoUsuario.idper){
        return (
            <Alert
                severity={"error"}
                sx={{ mt: 1, mb: 1 }}
            >
                EL USUARIO NO TIENE IDPER: CONTACTESÉ CON PERSONAL
            </Alert>
        )
    }

    const getTipoFichadaNombre = (tipoFichadaId: string | number | null | undefined): string => {
        if (!tipoFichadaId) return 'N/A';
        return tiposFichada.find(tf => tf.tipo_fichada === tipoFichadaId)?.nombre || `ID: ${tipoFichadaId}`;
    };

    // Función auxiliar para formatear fecha de ISO (YYYY-MM-DD) a DD/MM/YYYY
    const formatDateToDDMMYYYY = (isoDate: string): string => {
        if (!isoDate) return 'N/A';
        const parts = isoDate.split('-');
        if (parts.length === 3) {
            // Asume que parts es [YYYY, MM, DD]
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return isoDate;
    };

    return (
        <Box
            sx={{
                maxWidth: '600px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 3,
                boxShadow: 3,
                borderRadius: 2,
                backgroundColor: 'white',
            }}
        >
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%'}}>
                <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 1 }}>
                    <TextField 
                        id="idper" 
                        label="ID Persona" 
                        name="idper" 
                        value={formData.idper} 
                        disabled={true} 
                        size="small" 
                        sx={{ flex: '0 0 15%' }}
                    />
                    <TextField
                        id="apellido"
                        label="apellido"
                        name="apellido"
                        value={formData.apellido}
                        disabled={true}
                        size="small"
                        sx={{ flex: 1 }}
                    />
                    <TextField id="nombres"
                        label="nombres"
                        name="nombres"
                        value={formData.nombres}
                        disabled={true}
                        size="small"
                        sx={{ flex: 1 }}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 1 }}>
                    <TextField
                        margin="none"
                        id="fecha"
                        label="Fecha"
                        value={currentDateTime.fechaFormateada}
                        disabled={true}
                        size="small"
                        sx={{ flex: 1 }}
                    />
                    <TextField
                        margin="none"
                        id="hora"
                        label="Hora"
                        value={currentDateTime.horaFormateada}
                        disabled={true}
                        size="small"
                        sx={{ flex: 1 }}
                    />
                </Box>

                <TextField
                    fullWidth
                    margin="dense"
                    size="small"
                    id="tipo_fichada"
                    label="Tipo de fichada"
                    select
                    name="tipo_fichada"
                    helperText={validationErrors.tipo_fichada}
                    onChange={handleChange}
                    error={!!validationErrors.tipo_fichada}
                    value={formData.tipo_fichada}
                >
                    {tiposFichada.map(tf=>
                        <MenuItem key={tf.tipo_fichada} value={tf.tipo_fichada}>{tf.nombre}</MenuItem>
                    )}
                </TextField>

                <TextField
                    margin="dense"
                    fullWidth
                    id="observaciones"
                    label="Observaciones (Opcional)"
                    name="observaciones"
                    multiline
                    rows={2}
                    value={formData.observaciones}
                    onChange={handleChange}
                    size="small"
                />

                <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1 }}>
                    <Button
                        variant="contained"
                        onClick={getGeolocation}
                        disabled={isGpsLoading}
                        startIcon={isGpsLoading ? <CircularProgress size={15} color="inherit" /> : <ICON.LocaltionOn />}
                        size="small"
                    >
                        {isGpsLoading ? 'Buscando...' : 'Obtener Punto GPS'}
                    </Button>
                </Box>

                <TextField
                    margin="dense"
                    fullWidth
                    id="punto"
                    label={formData.punto ? "Coordenadas GPS (Latitud, Longitud)" : "Sin punto GPS"}
                    name="punto"
                    value={formData.punto}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ readOnly: true }}
                    color={errorEnPuntoGps() ? 'warning' : undefined}
                    focused={errorEnPuntoGps()}
                    size="small"
                />

                {errorEnPuntoGps() && (
                    <Alert
                        severity="warning"
                        sx={{ mt: 1, mb: 1 }}
                    >
                        {geolocationStatus}
                    </Alert>
                )}

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    sx={{ mt: 1, mb: 1 }}
                    startIcon={<ICON.Save />}
                    size="small"
                    disabled={Object.keys(validationErrors).length !== 0 || isWaitingForBackendResponse}
                >
                    {isWaitingForBackendResponse ? <CircularProgress size={24} color="inherit" /> : 'Registrar Fichada'}
                </Button>
                
                <Modal
                    open={openResponseModal}
                    onClose={(_event, reason) => {            
                        // Solo permite cerrar con el botón interno
                        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                            handleCloseModal();
                        }
                    }}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        border: '2px solid #000',
                        boxShadow: 24,
                        p: 4,
                    }}>
                        {modalResponse.severity && (
                            <Alert severity={modalResponse.severity} sx={{ mb: 2 }}>
                                {modalResponse.message}
                            </Alert>
                        )}
                        {modalResponse.severity === 'success' && modalResponse.data && (
                            <Box sx={{ mt: 2, borderTop: '1px dashed #ccc', pt: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                                    Detalle de Fichada:
                                </Typography>
                                <Typography variant="body2">
                                    <span style={{ fontWeight: 'bold' }}>ID Persona:</span> {modalResponse.data.idper}
                                </Typography>
                                <Typography variant="body2">
                                    <span style={{ fontWeight: 'bold' }}>Apellido:</span> {modalResponse.data.apellido}
                                </Typography>
                                <Typography variant="body2">
                                    <span style={{ fontWeight: 'bold' }}>Nombre:</span> {modalResponse.data.nombres}
                                </Typography>
                                <Typography variant="body2">
                                    <span style={{ fontWeight: 'bold' }}>Fecha:</span> {formatDateToDDMMYYYY(modalResponse.data.fecha)}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <span style={{ fontWeight: 'bold' }}>Hora:</span> {modalResponse.data.hora}
                                </Typography>
                                <Typography variant="body2">
                                    <span style={{ fontWeight: 'bold' }}>Tipo de Fichada:</span> {getTipoFichadaNombre(modalResponse.data.tipo_fichada)}
                                </Typography>
                                <Typography variant="body2">
                                    <span style={{ fontWeight: 'bold' }}>Observaciones:</span> {modalResponse.data.observaciones || 'Sin observaciones'}
                                </Typography>
                                <Typography variant="body2">
                                    <span style={{ fontWeight: 'bold' }}>Punto GPS:</span> {modalResponse.data.punto || 'No capturado / Error'}
                                </Typography>
                            </Box>
                        )}
                        <Button
                            fullWidth
                            variant="contained"
                            color={modalResponse.severity === 'success' ? 'success' : 'error'}
                            onClick={handleCloseModal}
                            startIcon={<ICON.Close />}
                            sx={{ mt: 3 }}
                        >
                            Cerrar
                        </Button>
                    </Box>
                </Modal>
            </Box>
        </Box>
    );
};

function PantallaFichadas(props: { conn: Connector, fixedFields: FixedFields, infoUsuario: InfoUsuario, tiposFichada: Tipos_fichada[] }) {
    useEffect(() => {
        document.body.style.backgroundImage = `url('${myOwn.config.config["background-img"]}')`;
        if (props.infoUsuario.usuario) {
            renderRol( props.infoUsuario );
        }
    }, []);

    type ServerStatus = 'conectado' | 'desconectado';
    const [serverStatus, setServerStatus] = useState<ServerStatus>('conectado');
    
    useEffect(() => {
        const intervalId = setInterval(()=> {
            myOwn.ajaxPromise({
                parameters:[],
                method:'post',
                action:'keep-alive.json',
                encoding:'plain',
                progress:false
            },{},{visiblyLogErrors:false
            }).then(()=>setServerStatus('conectado')).catch(()=>{
                setServerStatus('desconectado')
            })
        },10000);
        return () => {
            clearInterval(intervalId);
        };
    }, []);

    return (
        <Paper
            className="paper-principal"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                maxHeight: '100vh',
                boxSizing: 'border-box'
            }}
        >
            <AppBar position="static" className="app-bar-bg" sx={{ backgroundImage: `url('${myOwn.config.config["background-img"]}')` }}>
                <Toolbar>
                    <Typography flexGrow={2}>
                        SiPer - Registro de fichada
                    </Typography>
                    <Button 
                        color="inherit" 
                        onClick={logout}
                        startIcon={<ICON.Logout />}
                        size="small"
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>

            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    padding: 2
                }}
            >
                <FichadaForm infoUsuario={props.infoUsuario} conn={props.conn} tiposFichada={props.tiposFichada}/>
            </Box>
            <Modal
                    open={serverStatus=="desconectado"}
                    onClose={(_event, _reason) => {            
                        //no se cierra
                    }}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: 'background.paper',
                        border: '2px solid #000',
                        boxShadow: 24,
                        p: 4,
                    }}>
                        
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Sin Sesion Activa. Por favor vuelva a loguearse
                        </Alert>
                        <Button
                            fullWidth
                            variant="contained"
                            color="info"
                            onClick={logout}
                            startIcon={<ICON.Login />}
                            sx={{ mt: 3 }}
                        >
                            Ir a Login
                        </Button>
                    </Box>
                </Modal>
        </Paper>

    )
}

myOwn.wScreens.fichar = async function principal(addrParams:any){
    try{
        const infoUsuario: InfoUsuario = await myOwn.ajax.info_usuario();
        const tiposFichadas:Tipos_fichada[]  = await myOwn.ajax.table_data({table:'tipos_fichada'});
        renderConnectedApp(
            myOwn as never as Connector,
            { ...addrParams },
            document.getElementById('total-layout')!,
            ({ conn, fixedFields }) => (<PantallaFichadas conn={conn} fixedFields={fixedFields} infoUsuario={infoUsuario} tiposFichada={tiposFichadas} />
            )
        );
    }catch(err){
        logError(err as Error);
    }
}