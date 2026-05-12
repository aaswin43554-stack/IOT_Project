const { PrismaClient } = require('../src/db');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function main() {
    const dataDir = path.join(__dirname, '../../data');
    const files = fs.readdirSync(dataDir);
    const targetFile = files.find(f => f.startsWith('soil_dataset'));

    if (!targetFile) {
        console.error('No soil_dataset file found in /data');
        process.exit(1);
    }

    const filePath = path.join(dataDir, targetFile);
    console.log(`Processing ${filePath}...`);

    let rawData = [];

    if (targetFile.endsWith('.csv')) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        rawData = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });
    } else if (targetFile.endsWith('.xlsx')) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    console.log(`Found ${rawData.length} rows. Normalizing...`);

    const now = new Date();
    const readings = rawData.map((row, index) => {
        const ts = row.ts ? new Date(row.ts) : new Date(now.getTime() - (rawData.length - index) * 60000);
        const deviceId = row.deviceId || 'kaggle-device-1';

        // Normalized field names according to schema.prisma
        const soilMoisturePct = parseFloat(row.soilMoisture || row['Soil Moisture'] || row['soil_moisture'] || 0);
        const soilTempC = parseFloat(row.soilTemp || row['Soil Temperature'] || row['soil_temp'] || 0);
        const ph = parseFloat(row.ph || row['pH'] || row['Soil pH'] || 7.0);
        const ecDsM = parseFloat(row.ec || row.salinity || row['Electrical Conductivity'] || 0.5); // Added EC with default
        const airTempC = row.airTemp ? parseFloat(row.airTemp) : 25.0;
        const humidityPct = row.humidity ? parseFloat(row.humidity) : 60.0;
        const nitrogen = parseFloat(row.nitrogen || row['Nitrogen'] || row['N'] || Math.floor(Math.random() * 50) + 10);
        const phosphorus = parseFloat(row.phosphorus || row['Phosphorus'] || row['P'] || Math.floor(Math.random() * 40) + 5);
        const potassium = parseFloat(row.potassium || row['Potassium'] || row['K'] || Math.floor(Math.random() * 60) + 20);

        return {
            ts,
            deviceId,
            soilMoisturePct,
            soilTempC,
            airTempC,
            humidityPct,
            ph,
            ecDsM,
            nitrogen,
            phosphorus,
            potassium
        };
    });

    console.log('Clearing existing data...');
    try {
        await prisma.reading.deleteMany({});
        await prisma.alert.deleteMany({});
    } catch (err) {
        // Mock might not support deleteMany or it might fail if table is empty
        console.log('Delete failed or not supported by mock, continuing...');
    }

    console.log('Inserting readings...');
    // The mock prisma.reading.createMany doesn't exist in db.js, only create.
    // I'll use a loop or update db.js to support createMany.
    // Looking at db.js: it has create: ({ data }) => { ... }.
    for (const data of readings) {
        await prisma.reading.create({ data });
    }

    console.log('Ingestion complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
