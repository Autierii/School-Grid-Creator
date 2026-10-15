// Lê backend/.env se existir (opcional — ver .env.example).
// Precisa ser o primeiro import do index.ts para os outros módulos já verem as variáveis.
try {
  process.loadEnvFile();
} catch { /* sem .env: usa os padrões */ }
