
const { sendCredentialsEmail } = require('../server/utils/emailService');

async function testEmail() {
    console.log('📧 Iniciando prueba de envío de correos...');

    // Mock usuario - USANDO EL CORREO DEL USUARIO QUE PROVEYO EN .ENV PARA EVITAR BLOQUEOS
    // Si SENDGRID_FROM_EMAIL es el mismo que el destino, a veces cae en spam, pero llega.
    // Usaremos un correo dummy pero válido formato.
    const mockUser = {
        nombre: 'Estudiante de Prueba',
        email: 'fer.redgrave@gmail.com', // Usando un correo que probablemente sea del desarrollador o similar
        // O mejor, enviamos al mismo from para probar
    };

    // Sobreescribir con un argumento si se pasa
    if (process.argv[2]) {
        mockUser.email = process.argv[2];
    }

    const rawPassword = 'PasswordSeguro123!';

    console.log(`📤 Enviando a: ${mockUser.email}`);

    // Prueba Alumno
    console.log('--- Test Alumno ---');
    await sendCredentialsEmail(mockUser, rawPassword, 'Alumno');

    // Prueba Profesor
    console.log('--- Test Profesor ---');
    await sendCredentialsEmail({ ...mockUser, nombre: 'Profe Test' }, rawPassword, 'Profesor');
    
    console.log('✅ Prueba finalizada.');
}

testEmail();
