const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Comunicação para Menus de Contexto e Clipboard
    showContextMenu: (taskText) => ipcRenderer.send('show-context-menu', taskText),
    
    // Comunicação para Badges (Timers)
    startTimer: () => ipcRenderer.send('timer-started'),
    stopTimer: () => ipcRenderer.send('timer-stopped'),

    // Comunicação bidirecional (Invocar e esperar resposta)
    exportTasks: (tasks) => ipcRenderer.invoke('export-tasks', tasks),
    
    // Escutando atalhos globais
    onFocusInput: (callback) => ipcRenderer.on('focus-input', callback)
});
