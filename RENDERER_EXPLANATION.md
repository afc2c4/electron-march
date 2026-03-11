# Explicação do Código do Arquivo `renderer.js`

Este documento explica o código do arquivo `renderer.js` no contexto do projeto To-Do Timer, desenvolvido com o framework Electron. O arquivo `renderer.js` é responsável por gerenciar a lógica do frontend, incluindo a interação do usuário com a interface e a comunicação com o processo principal.

---

## **Contexto do Arquivo**
No Electron, o processo renderer é responsável por renderizar a interface do usuário e gerenciar as interações com ela. O arquivo `renderer.js` implementa a lógica necessária para:
- Adicionar tarefas à lista.
- Iniciar e ajustar timers para cada tarefa.
- Exportar a lista de tarefas.
- Comunicar-se com o processo principal usando as APIs expostas pelo `preload.js`.

---

## **Explicação do Código**

### **1. Seleção de Elementos do DOM**
```javascript
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
```
- **`taskInput`**: Campo de entrada de texto para adicionar novas tarefas.
- **`addTaskBtn`**: Botão para adicionar tarefas à lista.
- **`taskList`**: Elemento `<ul>` onde as tarefas são exibidas.

---

### **2. Gerenciamento de Tarefas**
#### **2.1. Adicionar Tarefa**
```javascript
addTaskBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (!text) return;

    tasks.push(text);
    renderTask(text);
    taskInput.value = '';
});
```
- **Descrição**: Adiciona uma nova tarefa à lista de tarefas e a renderiza na interface.
- **`tasks.push(text)`**: Armazena a tarefa em um array local.
- **`renderTask(text)`**: Renderiza a tarefa na interface.

#### **2.2. Renderizar Tarefa**
```javascript
function renderTask(text) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = text;

    li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        window.electronAPI.showContextMenu(text);
    });

    const timerBtn = document.createElement('button');
    timerBtn.className = 'timer-btn';
    timerBtn.textContent = 'Iniciar Timer 25m';

    // ... restante do código omitido para brevidade ...
}
```
- **Descrição**: Cria um item de lista (`<li>`) com o texto da tarefa e um botão para iniciar o timer.
- **`contextmenu`**: Dispara um menu de contexto ao clicar com o botão direito na tarefa.
- **`window.electronAPI.showContextMenu`**: Envia um evento para o processo principal para exibir o menu de contexto.

---

### **3. Lógica do Timer**
#### **3.1. Iniciar o Timer**
```javascript
timerBtn.addEventListener('click', () => {
    if (!isTiming) {
        isTiming = true;
        const durationInput = document.getElementById('timerDuration');
        let remainingTime = parseInt(durationInput.value, 10) || 0.10 * 60; // Usar valor ajustado ou padrão de 25 minutos
        timerBtn.textContent = formatTime(remainingTime);
        timerBtn.style.backgroundColor = '#ff5630'; // Vermelho

        window.electronAPI.startTimer();

        timerId = setInterval(() => {
            remainingTime--;
            timerBtn.textContent = formatTime(remainingTime);

            if (remainingTime <= 0) {
                clearInterval(timerId);
                stopTimer();
                new Notification('Timer Concluído!', { body: text });
            }
        }, 1000);
    } else {
        stopTimer();
    }
});
```
- **Descrição**: Inicia o timer para a tarefa e atualiza o botão com o tempo restante.
- **`window.electronAPI.startTimer`**: Envia um evento para o processo principal para indicar que o timer foi iniciado.
- **`setInterval`**: Atualiza o tempo restante a cada segundo.
- **`Notification`**: Exibe uma notificação ao término do timer.

#### **3.2. Parar o Timer**
```javascript
function stopTimer() {
    isTiming = false;
    clearInterval(timerId);
    timerBtn.textContent = 'Iniciar Timer';
    timerBtn.style.backgroundColor = '#36b37e'; // Verde

    window.electronAPI.stopTimer();

    timerBtn.classList.add('timer-completed');
}
```
- **Descrição**: Para o timer e aplica uma animação ao botão para indicar que o timer foi concluído.
- **`window.electronAPI.stopTimer`**: Envia um evento para o processo principal para indicar que o timer foi parado.
- **`timerBtn.classList.add('timer-completed')`**: Adiciona uma classe CSS para aplicar uma animação ao botão.

---

### **4. Exportação de Tarefas**
```javascript
const exportBtn = document.createElement('button');
exportBtn.textContent = "Exportar Lista (Txt)";
exportBtn.addEventListener('click', async () => {
    if(tasks.length === 0) return alert('Nenhuma tarefa para exportar.');

    const content = tasks.map((t, i) => `${i+1}. ${t}`).join('\n');
    const success = await window.electronAPI.exportTasks(content);

    if(success) {
        console.log('Arquivo salvo e exibido no sistema com sucesso!');
    }
});
```
- **Descrição**: Exporta a lista de tarefas para um arquivo de texto.
- **`window.electronAPI.exportTasks`**: Envia uma solicitação ao processo principal para salvar o arquivo.

---

### **5. Ajuste do Timer**
```javascript
document.getElementById('adjustTimerBtn').addEventListener('click', async () => {
    const durationInput = document.getElementById('timerDuration');
    const duration = parseInt(durationInput.value, 10);

    if (isNaN(duration) || duration <= 0) {
        alert('Por favor, insira um valor válido para o timer.');
        return;
    }

    const success = await window.electronAPI.adjustTimer(duration);
    if (success) {
        alert(`Timer ajustado para ${duration} segundos.`);
    } else {
        alert('Falha ao ajustar o timer. Verifique os logs para mais detalhes.');
    }
});
```
- **Descrição**: Ajusta a duração do timer com base no valor inserido pelo usuário.
- **`window.electronAPI.adjustTimer`**: Envia uma solicitação ao processo principal para ajustar o timer.

---

### **6. Formatação do Tempo**
```javascript
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
```
- **Descrição**: Converte o tempo em segundos para o formato `mm:ss`.
- **`padStart`**: Garante que os minutos e segundos tenham dois dígitos.

---

## **Resumo**
O arquivo `renderer.js` gerencia a lógica do frontend do projeto, incluindo:
- Adição e renderização de tarefas.
- Gerenciamento de timers com notificações e animações.
- Exportação da lista de tarefas.
- Comunicação com o processo principal via `preload.js`.

Se precisar de mais explicações ou ajustes, é só avisar!