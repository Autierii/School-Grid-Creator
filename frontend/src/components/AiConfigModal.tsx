import { useState } from 'react';
import { KeyRound, ShieldCheck, Sparkles } from 'lucide-react';
import { lerAiConfig, salvarAiConfig } from '../lib/aiConfig';
import { useDialogs } from '../lib/dialogs';
import { Button, Field, IconBadge, Input, Modal, Select } from './ui';

const PROVEDORES = [
  { value: 'gemini', label: 'Google Gemini', dica: 'Recomendado para fotos de tabelas.', url: 'https://aistudio.google.com/apikey' },
  { value: 'claude', label: 'Anthropic Claude', dica: 'Ótimo com texto e imagens.', url: 'https://console.anthropic.com/settings/keys' },
  { value: 'cohere', label: 'Cohere', dica: 'Somente texto.', url: 'https://dashboard.cohere.com/api-keys' },
];

export default function AiConfigModal({ onClose }: { onClose: () => void }) {
  const { toast } = useDialogs();
  const [provider, setProvider] = useState(() => lerAiConfig().provider);
  const [token, setToken] = useState(() => lerAiConfig().token);
  const atual = PROVEDORES.find(p => p.value === provider) ?? PROVEDORES[0];

  const handleSave = () => {
    try {
      salvarAiConfig(provider, token);
      toast('Configurações de IA salvas.');
    } catch {
      toast('Não foi possível salvar neste navegador (modo privado?).', 'error');
    }
    onClose();
  };

  return (
    <Modal
      size="sm"
      title="Configurações de IA"
      subtitle="Usadas na Importação Mágica (tela de Turmas)."
      icon={<IconBadge icon={Sparkles} tone="violet" />}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="magic" onClick={handleSave}>Salvar</Button>
        </>
      }
    >
      <div className="space-y-5 p-6">
        <Field label="Provedor de IA" hint={atual.dica}>
          {id => (
            <Select id={id} value={provider} onChange={e => setProvider(e.target.value)}>
              {PROVEDORES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
          )}
        </Field>
        <Field
          label="Sua API Key"
          hint={<>Não tem uma? <a href={atual.url} target="_blank" rel="noreferrer" className="font-medium text-violet-700 underline-offset-2 hover:underline">Gere sua chave do {atual.label}</a>.</>}
        >
          {id => (
            <div className="relative">
              <KeyRound size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
              <Input id={id} type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} placeholder="Cole sua chave aqui..." className="pl-10" />
            </div>
          )}
        </Field>
        <p className="flex gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          <ShieldCheck size={16} className="shrink-0 text-emerald-500" />
          A chave fica salva apenas neste navegador e só é enviada ao seu backend local no momento da importação.
        </p>
      </div>
    </Modal>
  );
}
