const express = require('express')
const router = express.Router()
const multer = require('multer');
const mongodb = require('mongodb');
const { MongoClient,GridFSBucket } = mongodb;
const ObjectId = require('mongodb').ObjectId;
const ffmpeg = require('ffmpeg');
const os = require('os');
const path = require('path');
const fs = require('fs');
const getStream = require('get-stream');
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
// const mongoose = require('mongoose');
// const Grid = require('gridfs-stream');
const SMB2 = require('smb2');


module.exports = router

const uri = 'mongodb://10.148.224.21:27017';
const client = new MongoClient(uri);

// router.post('/agregarusuario', upload.single('video'), async (req, res) => {
//   const videoPath = req.file.path;
//   const videoName = req.file.originalname;
//   const compressedPath = `compressed/${videoName}`;
//   reducirTamanoVideo(videoPath, compressedPath)
//     .then(() =>{
//       return guardarVideoEnMongoDB(compressedPath,videoName);
//     })
//     .then(() => {
//       res.send('OK');
//     })
//     .catch((err)=>{
//       console.error('Error', err);
//       res.status(500).send('Error al comprimir o guardar el video.');
//     })

// });


// function reducirTamanoVideo(inputPath, outputPath) {
//   return new Promise((resolve, reject) => {
//     ffmpeg(inputPath)
//       .outputOptions('-c:v libx264 -crf 23 -preset medium') // Opciones de compresión
//       .on('error', (err) => {
//         reject(err);
//       })
//       .on('end', () => {
//         resolve();
//       })
//       .save(outputPath);
//   });
// }

// function guardarVideoEnMongoDB(videoPath, videoName) {
//   return new Promise((resolve, reject) => {
//     MongoClient.connect(url, (err, client) => {
//       if (err) {
//         reject(err);
//         return;
//       }

//       const db = client.db(dbName);
//       const bucket = new GridFSBucket(db);

//       const videoReadStream = fs.createReadStream(videoPath);
//       const uploadStream = bucket.openUploadStream(videoName);

//       videoReadStream.pipe(uploadStream)
//         .on('error', (err) => {
//           reject(err);
//         })
//         .on('finish', () => {
//           resolve();
//         });
//     });
//   });
// }

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// router.post('/agregarusuario', upload.single('video'), async (req, res) => {
//   const { nombre } = req.body;
//   const tempFolder = os.tmpdir(); // Carpeta temporal del sistema
//   const inputFile = path.join(tempFolder, 'input.mp4');
//   const outputFile = 'C:\\Users\\mestebat\\Videos\\output.mp4'; // Ruta del archivo de salida

//   try {
//     // Guardar el contenido del buffer en el archivo temporal
//     fs.writeFileSync(inputFile, req.file.buffer);

//     const command = `ffmpeg -i "${inputFile}" -crf 35 "${outputFile}"`;
//     console.log("ya empezo")
//     await exec(command);
//     console.log("aca va")
//     await client.connect();
//     const database = client.db('tablaPrueba');
//     const bucket = new mongodb.GridFSBucket(database);

//     // Leer el contenido del video desde la ruta del archivo
//     const videoBuffer = fs.readFileSync(outputFile);

//     // Guardar el video en MongoDB
//     const uploadStream = bucket.openUploadStream(`${nombre}`);
//     uploadStream.end(videoBuffer);

//     await new Promise((resolve, reject) => {
//       uploadStream.on('finish', resolve);
//       uploadStream.on('error', reject);
//     });

//     console.log('Video guardado en MongoDB exitosamente.');
//     res.send('OK');

//   } catch (error) {
//     console.error('Error al ejecutar FFmpeg:', error);
//     console.error('FFmpeg stderr:', error.stderr);
//     res.status(500).send('Error al reducir el tamaño del video.');
//   } finally {
//     // Eliminar el archivo temporal después de usarlo
//     fs.unlinkSync(inputFile);
//     fs.unlink(outputFile,(err) =>{
//       if (err) {
//         console.error('Error al eliminar el archivo:', err);
//         return;
//       }  
//       console.log('El archivo se eliminó correctamente.');
//     });
//   }
// });

router.post('/agregarusuario', upload.single('video'), async (req, res) => {
  const { nombre } = req.body;
  const tempFolder = os.tmpdir(); // Carpeta temporal del sistema
  const inputFile = path.join(tempFolder, 'input.mp4');
  const outputFile = 'C:\\Users\\mestebat\\Videos\\output.mp4'; // Ruta del archivo de salida

  try {
    // Guardar el contenido del buffer en el archivo temporal
    fs.writeFileSync(inputFile, req.file.buffer);

    const command = `ffmpeg -i "${inputFile}" -s 804x420 -r 24 -c:v libx265 -b:v 1000k -maxrate 1500k -bufsize 2000k -crf 27 "${outputFile}"`; // Ajusta los valores según tus necesidades
    console.log("Iniciando la reducción del video...");
    await exec(command);
    console.log("Reducción del video finalizada");


    await client.connect();
    const database = client.db('tablaPrueba');
    const bucket = new mongodb.GridFSBucket(database);

    // Leer el contenido del video desde la ruta del archivo
    const videoBuffer = fs.readFileSync(outputFile);

    // Guardar el video en MongoDB
    const uploadStream = bucket.openUploadStream(`${nombre}`);
    uploadStream.end(videoBuffer);

    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });

    console.log('Video guardado en MongoDB exitosamente.');

    res.send('OK');

  } catch (error) {
    console.error('Error al ejecutar FFmpeg:', error);
    console.error('FFmpeg stderr:', error.stderr);
    res.status(500).send('Error al reducir el tamaño del video.');
  } finally {
    // Eliminar el archivo temporal después de usarlo
    fs.unlinkSync(inputFile);
    fs.unlinkSync(outputFile, (err) => {
      if (err) {
        console.error('Error al eliminar el archivo:', err);
        return;
      }
      console.log('El archivo se eliminó correctamente.');
    });
  }
});


router.post('/Listar', async (req,res) =>{
    try {
        const uri = 'mongodb://10.148.224.21:27017';
        const client = new MongoClient(uri);
        await client.connect();
    
        const database = client.db('tablaPrueba');
        const collection = database.collection('fs.files');
        const data = await collection.find({}).toArray();
    
        const datos = [];
    
        for (const item of data) {
          const id = item.length;
          const file = await collection.findOne({ length: id });
    
          const bucket = new mongodb.GridFSBucket (database);
          const downloadStream = bucket.openDownloadStream(new ObjectId(file._id));
          const chunks = [];
    
          downloadStream.on('data', (chunk) => {
            chunks.push(chunk);
          });
    
          await new Promise((resolve, reject) => {
            downloadStream.on('error', reject);
            downloadStream.on('end', resolve);
          });
    
          const fileData = Buffer.concat(chunks);
          const base64Content = fileData.toString('base64');
          datos.push(base64Content);
        }
    
        res.json(datos);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error' });
      } finally {
        client.close();
      }
});

const usuario = 'FTPICE'
const  contrasena = 'Bogota2022*'

router.post('/MoverFTP2', upload.single('video'), async (req, res) => {
  //const ruta = "C:\\Aplicaciones\\Documentos\\semanal_videos";
  const ruta = "\\\\iceberg.co.jazztel.com\\c$\\aplicaciones\\Documentos\\semanal_videos"
  const nombreVideo = req.body.nombre;
  const destino = path.join(ruta, nombreVideo);
  
  try {
    await fs.promises.writeFile(destino, req.file.buffer);
    console.log('Archivo movido correctamente');
    res.send("OK")
  } catch (err) {
    console.log('Error moviendo el archivo:', err);
    res.send("error",err)
  }

  // try{
  //   const smb2Client = new SMB2({
  //     share :ruta,
  //     domain : '',
  //     username :usuario,
  //     password : contrasena
  //   })
    
  //   const writeStream = smb2Client.createWriteStream(destino);
    
  //   writeStream.on('finish', () => {
  //     smb2Client.close();
  //     console.log('Archivo movido correctamente a la carpeta compartida');
  //     res.send("OK");
  //   });

  //   req.file.buffer.pipe(writeStream);
  // }catch (err){
  //   console.log('Error moviendo el archivo:', err);
  //   res.send("error",err)
  // }
});