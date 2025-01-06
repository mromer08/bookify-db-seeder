const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');
const fs = require('fs');

function getRandomNumber(length) {
    return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1));
}

function generateRandomDate() {
    const startDate = new Date('2024-08-01T08:00:00');
    const endDate = new Date('2025-01-06T17:00:00');

    while (true) {
        const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
        const day = randomDate.getDay();
        if (day >= 1 && day <= 5) {
            randomDate.setHours(8 + Math.floor(Math.random() * 9));
            randomDate.setMinutes(0);
            randomDate.setSeconds(0);
            return randomDate;
        }
    }
}

async function seedDatabase() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '12345',
        database: 'bookify',
    });

    const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));

    try {
        console.log("Iniciando inserción de datos...");


        // Insertar Permisos y Acciones
        for (const permission of data.permissions) {
            const permissionId = randomUUID();

            // Insertar permiso en la tabla permission
            await connection.query(
                'INSERT INTO permission (id, name) VALUES (?, ?)',
                [permissionId, permission.name]
            );

            // Insertar acciones asociadas en la tabla permission_action
            for (const action of permission.actions) {
                await connection.query(
                    'INSERT INTO permission_action (permission_id, action) VALUES (?, ?)',
                    [permissionId, action]
                );
            }
        }

        // Insertar Roles
        const roles = [
            { id: randomUUID(), name: 'CLIENT' },
            { id: randomUUID(), name: 'ADMIN' },
            { id: randomUUID(), name: 'STAFF' },
        ];
        for (const role of roles) {
            await connection.query('INSERT INTO role (id, name) VALUES (?, ?)', [role.id, role.name]);
        }

        await connection.query(
            `INSERT INTO business_day (day_name, start_time, end_time, is_working_day)
            VALUES
                ('MONDAY', '08:00:00', '17:00:00', TRUE),
                ('TUESDAY', '08:00:00', '17:00:00', TRUE),
                ('WEDNESDAY', '08:00:00', '17:00:00', TRUE),
                ('THURSDAY', '08:00:00', '17:00:00', TRUE),
                ('FRIDAY', '08:00:00', '17:00:00', TRUE),
                ('SATURDAY', '08:00:00', '13:00:00', TRUE),
                ('SUNDAY', NULL, NULL, FALSE)`
        );

        // Insertar Configuración
        await connection.query(
            'INSERT INTO config (id, business_name, slogan, nit, phone_number, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [randomUUID(), 'Bookify', 'The best in the industry', '123456789', '12345678', 'https://bookify-ayd1.s3.us-east-2.amazonaws.com/logo.png']
        );

        // INSERTAR ADMIN
        await connection.query(
            `INSERT INTO user (id, email, password, is_verified, tfa_enabled, full_name, birthdate, nit, phone_number, cui, image_url, role_id)
            VALUES
                (UUID(), 'admin@example.com', '$2a$10$gWcWNhkUPBl1I72foujmguikqnbQxOTXD2.fBvgPGUloOQz4Plnv.', true, false, 'Admin User', '1980-01-01', '45678901', '45678901', '4567890123456', 'https://picsum.photos/seed/admin/500', ?)`,
            [roles.find(role => role.name === 'ADMIN').id]
        );

        // Insertar Usuarios STAFF y CLIENT
        const staffUsers = [];
        const clientUsers = [];
        for (let i = 0; i < data.users.length; i++) {
            const id = randomUUID();
            const isStaff = i < 5; // Los primeros 5 serán STAFF
            const role = roles.find(role => role.name === (isStaff ? 'STAFF' : 'CLIENT')).id;

            // Generar URL de imagen usando el número de iteración como seed
            const imageUrl = `https://picsum.photos/seed/user${i}/500`;

            await connection.query(
                'INSERT INTO user (id, email, password, is_verified, tfa_enabled, full_name, birthdate, nit, phone_number, cui, role_id, image_url) VALUES (?, ?, ?, true, false, ?, ?, ?, ?, ?, ?, ?)',
                [
                    id,
                    `${data.users[i].split(' ')[0].toLowerCase()}@example.com`,
                    '$2a$10$gWcWNhkUPBl1I72foujmguikqnbQxOTXD2.fBvgPGUloOQz4Plnv.',
                    data.users[i],
                    '1980-01-01',
                    getRandomNumber(8),
                    getRandomNumber(8),
                    getRandomNumber(13),
                    role,
                    imageUrl
                ]
            );

            if (isStaff) {
                staffUsers.push(id);
            } else {
                clientUsers.push(id);
            }
        }

        // Insertar Recursos STAFF y FACILITY
        for (let i = 0; i < data.staffResources.length; i++) {
            await connection.query(
                'INSERT INTO resource (id, name, description, type, staff_id) VALUES (?, ?, ?, ?, ?)',
                [
                    randomUUID(),
                    data.staffResources[i],
                    `Description for ${data.staffResources[i]}`,
                    'STAFF',
                    staffUsers[i] // Vincula a un usuario STAFF
                ]
            );
        }

        for (const name of data.facilityResources) {
            await connection.query(
                'INSERT INTO resource (id, name, description, type) VALUES (?, ?, ?, ?)',
                [randomUUID(), name, `Description for ${name}`, 'FACILITY']
            );
        }

        // Insertar Servicios
        for (const service of data.services) {
            await connection.query(
                'INSERT INTO service (id, name, duration, price, description) VALUES (?, ?, ?, ?, ?)',
                [randomUUID(), service.name, service.duration, service.price, service.description]
            );
        }


        // Crear 50 Reservaciones
        const [clientUsers_SQL] = await connection.query(
            "SELECT id FROM user WHERE role_id = (SELECT id FROM role WHERE name = 'CLIENT')"
        );
        const [resources] = await connection.query("SELECT id FROM resource");
        const [services] = await connection.query("SELECT id, duration, price FROM service");

        const statuses = ['RESERVED', 'CANCELLED', 'CONFIRMED', 'COMPLETED'];

        for (let i = 0; i < 400; i++) {
            const customer = clientUsers_SQL[Math.floor(Math.random() * clientUsers_SQL.length)];
            const resource = resources[Math.floor(Math.random() * resources.length)];
            const service = services[Math.floor(Math.random() * services.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const startDate = generateRandomDate();

            // Calcular end_date
            const durationParts = service.duration.split(':');
            const durationMinutes = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
            const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

            const reservationId = randomUUID();

            // Insertar la reservación
            await connection.query(
                `INSERT INTO reservation (id, customer_id, resource_id, start_date, end_date, status, total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [reservationId, customer.id, resource.id, startDate, endDate, status, service.price]
            );

            // Insertar detalle de la reservación
            await connection.query(
                `INSERT INTO reservation_detail (reservation_id, service_id) VALUES (?, ?)`,
                [reservationId, service.id]
            );
        }



        console.log("Datos insertados con éxito.");
    } catch (error) {
        console.error("Error durante la inserción de datos:", error);
    } finally {
        await connection.end();
    }
}

seedDatabase();
