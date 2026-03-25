import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join, resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import multer from 'multer';

const browserDistFolder = join(import.meta.dirname, '../browser');

// Diretório raiz do projeto (onde ng serve é executado)
const projectRoot = process.cwd();
const exercisesFolder = join(projectRoot, 'public', 'exercises');
const workoutsFolder = join(projectRoot, 'public', 'workouts');

// Garantir que a pasta exercises existe
if (!existsSync(exercisesFolder)) {
  mkdirSync(exercisesFolder, { recursive: true });
}

// Garantir que a pasta workouts existe
if (!existsSync(workoutsFolder)) {
  mkdirSync(workoutsFolder, { recursive: true });
}

// Configurar multer para salvar no diretório correto
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, exercisesFolder);
  },
  filename: (_req, file, cb) => {
    // Manter o nome original do arquivo
    cb(null, file.originalname);
  },
});

// Configurar multer para salvar imagens de treino
const workoutStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, workoutsFolder);
  },
  filename: (_req, file, cb) => {
    // Manter o nome original do arquivo
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });
const uploadWorkout = multer({ storage: workoutStorage });

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * API endpoint para upload de imagem de exercício.
 * Salva o arquivo em public/exercises/ e retorna o caminho relativo.
 */
app.post('/api/upload-exercise-image', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
    return;
  }

  const caminhoRelativo = `exercises/${req.file.filename}`;
  console.log(`Imagem salva em: ${join(exercisesFolder, req.file.filename)}`);

  res.json({
    sucesso: true,
    filePath: caminhoRelativo,
    nomeArquivo: req.file.filename,
  });
});

/**
 * API endpoint para upload de imagem de capa de treino.
 * Salva o arquivo em public/workouts/ e retorna o caminho relativo.
 */
app.post('/api/upload-workout-image', uploadWorkout.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
    return;
  }

  const caminhoRelativo = `workouts/${req.file.filename}`;
  console.log(`Imagem de capa salva em: ${join(workoutsFolder, req.file.filename)}`);

  res.json({
    sucesso: true,
    filePath: caminhoRelativo,
    nomeArquivo: req.file.filename,
  });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
