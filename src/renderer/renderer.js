const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

// Arrays para guardar os dados (apenas em memória para este exemplo)
let tasks = [];

// Adicionar Tarefa
addTaskBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (!text) return;

    tasks.push(text);
    renderTask(text);
    taskInput.value = '';
});

// Foco automático pelo Atalho Global
window.electronAPI.onFocusInput(() => {
    taskInput.focus();
});

// Renderizar Item
function renderTask(text) {
    const li = document.createElement('li');
    
    const span = document.createElement('span');
    span.textContent = text;
    
    // Disparar Menu de Contexto (Clique Direito)
    li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        window.electronAPI.showContextMenu(text);
    });

    const timerBtn = document.createElement('button');
    timerBtn.className = 'timer-btn';
    timerBtn.textContent = 'Iniciar Timer 25m';
    
    let isTiming = false;
    let timerId = null;

    // Função para adicionar alerta visual ao botão do timer
    function addTimerAlert(button) {
        button.classList.add('timer-alert');
        const intervalId = setInterval(() => {
            button.classList.toggle('alert-active');
        }, 500);

        // Remover o alerta ao clicar no botão
        button.addEventListener('click', () => {
            clearInterval(intervalId);
            button.classList.remove('timer-alert', 'alert-active');
            button.textContent = 'Iniciar Timer';
            button.style.backgroundColor = '#36b37e'; // Verde
        }, { once: true });
    }

    // Atualizar lógica do Timer para usar o tempo ajustado pelo usuário
    timerBtn.addEventListener('click', () => {
        if (!isTiming) {
            isTiming = true;
            const durationInput = document.getElementById('timerDuration');
            let remainingTime = parseInt(durationInput.value, 10) || 0.10 * 60; // Usar valor ajustado ou padrão de 25 minutos
            timerBtn.textContent = formatTime(remainingTime);
            timerBtn.style.backgroundColor = '#ff5630'; // Vermelho

            // Avisa o SO que temos uma tarefa rodando (adiciona Badge)
            window.electronAPI.startTimer();

            // Atualizar o texto do botão a cada segundo
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

    // Atualizar lógica para aplicar animação ao concluir o timer
    function stopTimer() {
        isTiming = false;
        clearInterval(timerId);
        timerBtn.textContent = 'Iniciar Timer';
        timerBtn.style.backgroundColor = '#36b37e'; // Verde

        // Avisa o SO para remover a Badge
        window.electronAPI.stopTimer();

        // Adicionar animação de pulsação com gradiente
        timerBtn.classList.add('timer-completed');
    }

    li.appendChild(span);
    li.appendChild(timerBtn);
    taskList.appendChild(li);
}

// Botão Extra de Exportar (Pode ser adicionado ao HTML dinamicamente)
const exportBtn = document.createElement('button');
exportBtn.textContent = "Exportar Lista (Txt)";
exportBtn.style.marginTop = "20px";
exportBtn.style.width = "100%";
exportBtn.addEventListener('click', async () => {
    if(tasks.length === 0) return alert('Nenhuma tarefa para exportar.');
    
    const content = tasks.map((t, i) => `${i+1}. ${t}`).join('\n');
    const success = await window.electronAPI.exportTasks(content);
    
    if(success) {
        console.log('Arquivo salvo e exibido no sistema com sucesso!');
    }
});
document.querySelector('.container').appendChild(exportBtn);

// Adicionar funcionalidade para ajustar o timer
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

// Função para formatar o tempo em mm:ss
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}