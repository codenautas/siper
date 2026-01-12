import * as sql from 'mssql';

export interface IEmpleadoInput {
    nombre: string;
    apellido: string;
    documento: string;
    legajo: string;
    estado?: 0 | 1; // 0: Activo, 1: No Activo
    fechaEstado?: Date;
    contrasenia?: string | null;
}

export type UpsertResponse = { 
    ResultCode: 1; 
    ResultMessage: 'OK'; 
    PerCodigo: number; 
    EmpCodigo: number; 
    EstCodigo: number; 
} | { 
    ResultCode: 0; 
    ResultMessage: 'NOCHANGE'; 
    PerCodigo: number; 
    EmpCodigo: number; 
    EstCodigo: number; 
} | { 
    ResultCode: -1; 
    ResultMessage: string;
    PerCodigo: null; 
    EmpCodigo: null; 
    EstCodigo: null; 
    };

async function upsertEmpleado(datos: IEmpleadoInput, config: sql.config): Promise<UpsertResponse | undefined> {
    let pool: sql.ConnectionPool | null = null;
    try {
        pool = await sql.connect(config);
        const request = pool.request();

        // Mapeo de parámetros con tipos específicos de SQL
        request.input('Nombre', sql.VarChar(255), datos.nombre);
        request.input('Apellido', sql.VarChar(255), datos.apellido);
        request.input('Documento', sql.VarChar(20), datos.documento);
        request.input('Legajo', sql.VarChar(50), datos.legajo);
        request.input('Estado', sql.Int, datos.estado ?? 0);
        request.input('FechaEstado', sql.DateTime, datos.fechaEstado || new Date());
        request.input('Contrasenia', sql.VarChar(sql.MAX), datos.contrasenia || null);

        console.log(`Iniciando Upsert: ${datos.nombre} ${datos.apellido}`);

        // Ejecución del SP especificando el tipo de retorno esperado
        const result = await request.execute<UpsertResponse>('spUpsertEmpleado');
        
        // Obtenemos la primera fila de resultados
        const respuesta = result.recordset[0];

        if (!respuesta) {
            throw new Error('El procedimiento no devolvió ningún resultado.');
        }

        // --- Lógica de Negocio basada en el Tipado Avanzado ---
        switch (respuesta.ResultCode) {
            case 1:
                console.log(`Éxito: ${respuesta.ResultMessage}. ID Persona: ${respuesta.PerCodigo}`);
                // Aquí TypeScript sabe que PerCodigo ES un número y NO es null
                break;
            case 0:
                console.log(`ℹSin cambios: El registro ya existía con los mismos datos.`);
                break;
            case -1:
                console.error(`Error en Base de Datos: ${respuesta.ResultMessage}`);
                break;
        }

        return respuesta;

    } catch (err) {
        console.error("Error crítico en la operación:", err);
        throw err;
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

// --- EJEMPLO DE USO ---
const payload: IEmpleadoInput = {
    nombre: 'Prueba',
    apellido: 'Prueba',
    documento: '99999999',
    legajo: 'PR1',
    estado: 0,
    fechaEstado: new Date('2026-01-08'),
    contrasenia: 'SCRAM-SHA-256$4096:PUmnW6OoUCRIERGKZhbntQ==$wytgTM7mOcQLMnZrZdDRZrpHX2zl7a+UWWvojTxvoeg=:yIPntDSC31vVLXodsvBlcpP/Og3/qSXjlvR7nm1dvbs='
};

const configFichadasDb: sql.config = {
    user: 'IDECBA',
    password: 'S1p3r_test',
    server: '10.35.200.50',
    database: 'inweb_IDECBA_TEST_DOS',
    port: 1433,
    options: {
        encrypt: false, // Cambiar a true si conectas a Azure
        trustServerCertificate: true 
    }
};

upsertEmpleado(payload, configFichadasDb).catch(err => {
    // Manejo global de errores de conexión/red
    console.error(`La aplicación no pudo completar la tarea. ${err.message}`);
});