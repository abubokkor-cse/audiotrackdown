import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import readline from 'node:readline';
import crypto from 'node:crypto';
import path from 'node:path';

const execAsync = promisify(exec);

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function getPostgresURL(): Promise<string> {
  console.log('Step 1: Setting up Postgres');
  const dbChoice = await question(
    'Do you want to use a local Postgres instance with Docker (L) or a remote Postgres instance (R)? (L/R): '
  );

  if (dbChoice.toLowerCase() === 'l') {
    console.log('Setting up local Postgres instance with Docker...');
    await setupLocalPostgres();
    return 'postgres://postgres:postgres@localhost:54322/postgres';
  } else {
    console.log(
      'You can find Postgres databases at: https://vercel.com/marketplace?category=databases'
    );
    return await question('Enter your POSTGRES_URL: ');
  }
}

async function setupLocalPostgres() {
  console.log('Checking if Docker is installed...');
  try {
    await execAsync('docker --version');
    console.log('Docker is installed.');
  } catch (error) {
    console.error(
      'Docker is not installed. Please install Docker and try again.'
    );
    console.log(
      'To install Docker, visit: https://docs.docker.com/get-docker/'
    );
    process.exit(1);
  }

  console.log('Creating docker-compose.yml file...');
  const dockerComposeContent = `
services:
  postgres:
    image: postgres:16.4-alpine
    container_name: audiotrackdown_postgres
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "54322:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`;

  await fs.writeFile(
    path.join(process.cwd(), 'docker-compose.yml'),
    dockerComposeContent
  );
  console.log('docker-compose.yml file created.');

  console.log('Starting Docker container with `docker compose up -d`...');
  try {
    await execAsync('docker compose up -d');
    console.log('Docker container started successfully.');
  } catch (error) {
    console.error(
      'Failed to start Docker container. Please check your Docker installation and try again.'
    );
    process.exit(1);
  }
}

async function getPaddleCredentials(): Promise<{
  clientToken: string;
  env: string;
  apiKey: string;
  webhookSecret: string;
  priceMonthly: string;
  priceAnnual: string;
}> {
  console.log('Step 2: Setting up Paddle billing');
  console.log(
    'This project uses Paddle (not Stripe). Create an account and find your'
  );
  console.log('credentials at: https://developer.paddle.com/');

  const env = await question(
    'Paddle environment — sandbox (S) or production (P)? (S/P): '
  );
  const paddleEnv = env.toLowerCase() === 'p' ? 'production' : 'sandbox';

  const clientToken = await question('Enter your NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: ');
  const apiKey = await question('Enter your PADDLE_API_KEY: ');

  console.log(
    '\nTo receive the webhook notification secret, create a webhook at ' +
    (paddleEnv === 'sandbox'
      ? 'https://sandbox-vendors.paddle.com/notifications'
      : 'https://vendors.paddle.com/notifications') +
    ' pointing to https://<your-domain>/api/paddle/webhook'
  );
  const webhookSecret = await question('Enter your PADDLE_NOTIFICATION_WEBHOOK_SECRET: ');

  console.log(
    '\nCreate a Pro product with two prices (monthly + annual) in the Paddle dashboard.'
  );
  const priceMonthly = await question('Enter NEXT_PUBLIC_PADDLE_PRICE_MONTHLY (pri_...): ');
  const priceAnnual = await question('Enter NEXT_PUBLIC_PADDLE_PRICE_ANNUAL (pri_...): ');

  return {
    clientToken,
    env: paddleEnv,
    apiKey,
    webhookSecret,
    priceMonthly,
    priceAnnual,
  };
}

/**
 * Step 3: Collect backend connection details.
 */
async function getBackendConfig(): Promise<{
  backendUrl: string;
  backendSecret: string;
}> {
  console.log('Step 3: Backend connection');
  const backendUrl =
    (await question(
      'Enter BACKEND_URL (default: http://localhost:4000): '
    )) || 'http://localhost:4000';

  const generatedSecret = crypto.randomBytes(32).toString('hex');
  console.log(
    `\nGenerated a strong BACKEND_SECRET. Set the SAME value in backend/.env:`
  );
  console.log(`  ${generatedSecret}\n`);
  const useGenerated = await question('Use this generated secret? (Y/n): ');
  const backendSecret =
    useGenerated.toLowerCase() === 'n'
      ? await question('Enter your own BACKEND_SECRET: ')
      : generatedSecret;

  return { backendUrl, backendSecret };
}

function generateAuthSecret(): string {
  console.log('Step 4: Generating AUTH_SECRET...');
  return crypto.randomBytes(32).toString('hex');
}

async function writeEnvFile(envVars: Record<string, string>) {
  console.log('Step 5: Writing environment variables to .env');
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  await fs.writeFile(path.join(process.cwd(), '.env'), envContent);
  console.log('.env file created with the necessary variables.');
}

async function main() {
  console.log(
    '\n🎵 AudioTrackDown — Frontend Environment Setup\n' +
    '=============================================\n'
  );

  const POSTGRES_URL = await getPostgresURL();
  const paddle = await getPaddleCredentials();
  const backend = await getBackendConfig();
  const BASE_URL = 'http://localhost:3000';
  const AUTH_SECRET = generateAuthSecret();

  await writeEnvFile({
    POSTGRES_URL,
    BASE_URL,
    AUTH_SECRET,
    // Paddle (frontend)
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: paddle.clientToken,
    NEXT_PUBLIC_PADDLE_ENV: paddle.env,
    NEXT_PUBLIC_PADDLE_PRICE_MONTHLY: paddle.priceMonthly,
    NEXT_PUBLIC_PADDLE_PRICE_ANNUAL: paddle.priceAnnual,
    // Paddle (backend / webhook)
    PADDLE_API_KEY: paddle.apiKey,
    PADDLE_NOTIFICATION_WEBHOOK_SECRET: paddle.webhookSecret,
    // Backend connection
    BACKEND_URL: backend.backendUrl,
    NEXT_PUBLIC_API_URL: backend.backendUrl,
    BACKEND_SECRET: backend.backendSecret,
  });

  console.log('\n🎉 Setup completed successfully!');
  console.log('\nNext steps:');
  console.log('  1. pnpm db:migrate   # run database migrations');
  console.log('  2. pnpm db:seed      # seed a demo user');
  console.log('  3. pnpm dev          # start the dev server');
  console.log(
    '\n⚠️  Remember to set the SAME BACKEND_SECRET in backend/.env so the'
  );
  console.log('    frontend and backend can authenticate with each other.');
}

main().catch(console.error);
