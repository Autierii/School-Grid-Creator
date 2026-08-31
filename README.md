# 🧮 Gerador de Grade Curricular

![License](https://img.shields.io/badge/license-MIT-lightgrey?style=for-the-badge)
![Web](https://img.shields.io/badge/Web-Frontend-purple?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 📘 Descrição

Este projeto é um **gerador automático de grade curricular** voltado para facilitar a vida de coordenadores pedagógicos na hora de distribuir turmas, professores e horários.

Através de uma interface web moderna (Dark Purple Theme), o sistema calcula matematicamente (usando um algoritmo profissional de _Constraint Satisfaction Problem - Backtracking_) a melhor forma de distribuir as aulas na semana.

Ele garante que:
- Um professor **não seja escalado** para duas turmas no mesmo horário (zero choques).
- **Horários de indisponibilidade** de cada professor sejam estritamente respeitados.
- As matérias não se concentrem num único dia (limite automático de no máximo 2 aulas da mesma matéria por dia).
- Impressão otimizada do quadro de horários final.

---

## 🚀 Como Usar

O projeto foi totalmente refeito para não exigir **nenhuma instalação de software, servidor ou linha de comando**. Tudo funciona diretamente no seu navegador!

### Passo a Passo:

1. **Abra o arquivo:**
   - Navegue até a pasta do projeto no seu computador.
   - Dê um **duplo clique** no arquivo `index.html`.

2. **No Navegador:**
   - O sistema abrirá em qualquer navegador moderno (Chrome, Edge, Safari, Firefox).
   - Siga os passos intuitivos na tela para configurar seus horários, adicionar professores e turmas.

3. **Gerar e Imprimir:**
   - Clique em **"Gerar Grade Mágica"**. O algoritmo fará os cálculos.
   - Você pode clicar no botão de **Imprimir** para salvar a grade em PDF ou mandar para a impressora.

---

## 🧠 Lógica e Algoritmo

O coração do gerador funciona através de **Backtracking**. 
Ao contrário de algoritmos gulosos simples, este gerador "pensa no futuro". Se ele alocar um professor na segunda-feira e perceber que isso fará a grade de sexta-feira quebrar, ele automaticamente volta atrás e testa novas combinações até encontrar o encaixe perfeito para toda a escola. 

Caso você insira configurações impossíveis (ex: mais aulas do que horários disponíveis), o sistema emitirá um alerta inteligente apontando o conflito.

---

## 🧱 Estrutura do Projeto

```
index.html    # Arquivo único contendo Interface (React/Tailwind) e Lógica (Algoritmo)
README.md     # Esta documentação
```

---

## 📝 Licença

Este projeto está licenciado sob a licença MIT — sinta-se livre para usar e modificar.
