import './env';
import { createApp } from './app';

const PORT = Number(process.env.PORT) || 3001;

createApp().listen(PORT, () => {
  console.log(`🏫 School Grid Creator API rodando em http://localhost:${PORT}/api`);
});
